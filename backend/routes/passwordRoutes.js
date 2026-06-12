/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * File 14: backend/routes/passwordRoutes.js
 * Password Vault Credentials API Routing.
 * Governs lifecycle management of individual user credentials records.
 * Integrates AES-256-GCM symmetric decryption pipelines with security audits.
 */

const express = require('express');
const router = express.Router();

const Password = require('../models/Password');
const { protect } = require('../middleware/authMiddleware');
const { encrypt, decrypt } = require('../config/encryption');
const logSecurityEvent = require('../utils/logSecurityEvent');
const { generatePassword } = require('../utils/passwordGenerator');

/**
 * Calculates a standard strength score classification from a clear text password
 * @param {string} pwd - Clear text password representation
 * @returns {'Weak'|'Medium'|'Strong'|'Excellent'} Strength categorization label
 */
function evaluatePasswordStrength(pwd) {
  if (!pwd || typeof pwd !== 'string') return 'Weak';
  const len = pwd.length;

  if (len < 8) return 'Weak';

  let varietyCount = 0;
  if (/[A-Z]/.test(pwd)) varietyCount++;
  if (/[a-z]/.test(pwd)) varietyCount++;
  if (/[0-9]/.test(pwd)) varietyCount++;
  if (/[^A-Za-z0-9]/.test(pwd)) varietyCount++;

  if (len >= 16 && varietyCount >= 4) return 'Excellent';
  if (len >= 12 && varietyCount >= 3) return 'Strong';
  if (len >= 8 && varietyCount >= 2) return 'Medium';
  return 'Weak';
}

/**
 * @route   POST /api/passwords/generate
 * @desc    Helper utility route to generate secure random password sequences on the fly
 * @access  Public
 */
router.post('/generate', (req, res) => {
  try {
    const { length, uppercase, lowercase, numbers, symbols } = req.body;
    
    const password = generatePassword({
      length,
      uppercase,
      lowercase,
      numbers,
      symbols
    });

    return res.status(200).json({ password });
  } catch (err) {
    console.error('Password Generator API route exception:', err.message);
    return res.status(500).json({ error: 'Failed to generate secure randomized credentials.' });
  }
});

/**
 * @route   GET /api/passwords
 * @desc    Lists all vault password credentials metadata details belonging to current user
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { q, category } = req.query;

    const query = { userId };

    // Search query matches title, url, or user login names
    if (q) {
      query.$or = [
        { siteName: { $regex: q, $options: 'i' } },
        { siteUrl: { $regex: q, $options: 'i' } },
        { username: { $regex: q, $options: 'i' } }
      ];
    }

    if (category) {
      query.category = { $regex: category, $options: 'i' };
    }

    // Retrieve full passwords excluding encrypted raw field value by default for visual security
    const passwordRecords = await Password.find(query).sort({ siteName: 1 });

    return res.status(200).json({
      success: true,
      count: passwordRecords.length,
      data: passwordRecords
    });

  } catch (err) {
    console.error('Fetch passwords list crash:', err.message);
    return res.status(500).json({ error: 'System error listing secure vault accounts.' });
  }
});

/**
 * @route   GET /api/passwords/search
 * @desc    Alternative dedicated query routing path to locate specific credentials records
 * @access  Private
 */
router.get('/search', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { query: keyword } = req.query;

    if (!keyword) {
      return res.status(400).json({ error: 'A search term query string must be specified.' });
    }

    const matchedRecords = await Password.find({
      userId,
      $or: [
        { siteName: { $regex: keyword, $options: 'i' } },
        { siteUrl: { $regex: keyword, $options: 'i' } },
        { username: { $regex: keyword, $options: 'i' } },
        { category: { $regex: keyword, $options: 'i' } }
      ]
    }).sort({ siteName: 1 });

    return res.status(200).json({
      success: true,
      count: matchedRecords.length,
      data: matchedRecords
    });

  } catch (err) {
    console.error('Credentials database search failure:', err.message);
    return res.status(500).json({ error: 'System error executing query requirements.' });
  }
});

/**
 * @route   POST /api/passwords
 * @desc    Registers a new clear-text credentials instance, encrypts password, and commits to user's database
 * @access  Private
 */
router.post('/', protect, async (req, res) => {
  try {
    const { siteName, siteUrl, username, password, notes, category, expiryDate } = req.body;
    const userId = req.user._id;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';

    // 1. Inputs validation check
    if (!siteName || !username || !password) {
      return res.status(400).json({ error: 'Site/Service label, username, and password fields are required.' });
    }

    // 2. Encrypt candidate password securely via GCM
    const encryptedPassword = encrypt(password);
    const strengthOfPassword = evaluatePasswordStrength(password);

    // 3. Compose new document mapping
    const newRecord = await Password.create({
      userId,
      siteName: siteName.trim(),
      siteUrl: (siteUrl || '').trim(),
      username: username.trim(),
      encryptedPassword,
      notes: (notes || '').trim(),
      category: (category || 'General').trim(),
      passwordStrength: strengthOfPassword,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      breached: false // Defaults to fresh clean reputation until audited
    });

    await logSecurityEvent({
      userId,
      eventType: 'PASSWORD_CREATED',
      description: `Wrote new secure vaults credential for ${siteName.trim()} (${username.trim()})`,
      severity: 'Low',
      ipAddress
    });

    // Strip actual encrypted sequence when returning to avoid exposure on initial rendering response
    const payload = newRecord.toObject();
    delete payload.encryptedPassword;

    return res.status(201).json({
      success: true,
      message: 'Password credential written safely to vault.',
      data: payload
    });

  } catch (err) {
    console.error('Password registration error:', err.message);
    return res.status(500).json({ error: 'Failed to record secure credential entries.' });
  }
});

/**
 * @route   POST /api/passwords/:id/decrypt
 * @desc    Special security access decrypt proxy. Deciphers ciphertext and records structural auditing details
 * @access  Private
 */
router.post('/:id/decrypt', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const recordId = req.params.id;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';

    const credential = await Password.findOne({ _id: recordId, userId });

    if (!credential) {
      return res.status(404).json({ error: 'Requested password credential record could not be found.' });
    }

    // Decapsulate the encrypted database ciphertext stream
    const clearTextPassword = decrypt(credential.encryptedPassword);

    // Trigger timestamp accession updates silently
    credential.lastAccessed = new Date();
    await credential.save();

    // High fidelity tamper & view security check logging
    await logSecurityEvent({
      userId,
      eventType: 'PASSWORD_DECRYPTED',
      description: `Decrypted and viewed credentials passwords for ${credential.siteName} (${credential.username})`,
      severity: 'Medium',
      ipAddress
    });

    return res.status(200).json({
      success: true,
      password: clearTextPassword
    });

  } catch (err) {
    console.error('Vault credentials decryption exception:', err.message);
    return res.status(500).json({ error: 'Internal failure during cryptographic password decipher process.' });
  }
});

/**
 * @route   GET /api/passwords/:id
 * @desc    Retrieves standard metadata of a single specified credentials record
 * @access  Private
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const recordId = req.params.id;

    const credential = await Password.findOne({ _id: recordId, userId });

    if (!credential) {
      return res.status(404).json({ error: 'Vault password credential record could not be found.' });
    }

    const outcome = credential.toObject();
    delete outcome.encryptedPassword; // Hide symmetric code from pure descriptive lookups

    return res.status(200).json({
      success: true,
      data: outcome
    });

  } catch (err) {
    console.error('Credentials view routing request failure:', err.message);
    return res.status(500).json({ error: 'System error looking up vault file metadata.' });
  }
});

/**
 * @route   PUT /api/passwords/:id
 * @desc    Updates credentials parameters, re-encrypts if password is altered, and rewrites status properties
 * @access  Private
 */
router.put('/:id', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const recordId = req.params.id;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';

    const { siteName, siteUrl, username, password, notes, category, expiryDate, breached } = req.body;

    const credential = await Password.findOne({ _id: recordId, userId });

    if (!credential) {
      return res.status(404).json({ error: 'Credentials record does not exist or access has been restricted.' });
    }

    // Capture initial values mapping to trace updates
    const updatesTriggered = [];

    if (siteName) {
      credential.siteName = siteName.trim();
      updatesTriggered.push('siteName');
    }
    if (siteUrl !== undefined) {
      credential.siteUrl = siteUrl.trim();
      updatesTriggered.push('siteUrl');
    }
    if (username) {
      credential.username = username.trim();
      updatesTriggered.push('username');
    }
    if (notes !== undefined) {
      credential.notes = notes.trim();
      updatesTriggered.push('notes');
    }
    if (category) {
      credential.category = category.trim();
      updatesTriggered.push('category');
    }
    if (expiryDate !== undefined) {
      credential.expiryDate = expiryDate ? new Date(expiryDate) : null;
      updatesTriggered.push('expiryDate');
    }
    if (breached !== undefined) {
      credential.breached = !!breached;
      updatesTriggered.push('breachedStatus');
    }

    // Special logic if user updates clear-text password property
    if (password) {
      credential.encryptedPassword = encrypt(password);
      credential.passwordStrength = evaluatePasswordStrength(password);
      updatesTriggered.push('passwordCredentials');
    }

    await credential.save();

    await logSecurityEvent({
      userId,
      eventType: 'PASSWORD_UPDATED',
      description: `Modified credentials params for ${credential.siteName} (${credential.username}) Properties updated: [${updatesTriggered.join(', ')}]`,
      severity: 'Medium',
      ipAddress
    });

    const payload = credential.toObject();
    delete payload.encryptedPassword;

    return res.status(200).json({
      success: true,
      message: 'Credentials updated successfully.',
      data: payload
    });

  } catch (err) {
    console.error('Credential record modifications failed:', err.message);
    return res.status(500).json({ error: 'System error parsing update directives.' });
  }
});

/**
 * @route   DELETE /api/passwords/:id
 * @desc    Permanently purges a target credentials record from the database
 * @access  Private
 */
router.delete('/:id', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const recordId = req.params.id;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';

    const credential = await Password.findOne({ _id: recordId, userId });

    if (!credential) {
      return res.status(404).json({ error: 'Target password registration record could not be found.' });
    }

    await Password.deleteOne({ _id: recordId, userId });

    await logSecurityEvent({
      userId,
      eventType: 'PASSWORD_DELETED',
      description: `Permanently removed credential record for ${credential.siteName} (${credential.username})`,
      severity: 'High',
      ipAddress
    });

    return res.status(200).json({
      success: true,
      message: `Credentials records corresponding with ${credential.siteName} got eradicated successfully.`
    });

  } catch (err) {
    console.error('Emergency credentials eradication failure:', err.message);
    return res.status(500).json({ error: 'Internal failure processing document purging requests.' });
  }
});

module.exports = router;
