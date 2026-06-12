/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * File 15: backend/routes/securityRoutes.js
 * Security Center and Administrative Dashboard API routes.
 * Implements:
 * - Security logs query interface
 * - Login histories history logs
 * - Dynamic security statistics and health auditing (Dashboard Stats)
 * - Password expiry, weak, or breached configuration warnings
 * - Secure decrypted vault content exporter with complete logging controls
 */

const express = require('express');
const router = express.Router();

const SecurityLog = require('../models/SecurityLog');
const LoginHistory = require('../models/LoginHistory');
const Password = require('../models/Password');
const { protect } = require('../middleware/authMiddleware');
const { decrypt } = require('../config/encryption');
const logSecurityEvent = require('../utils/logSecurityEvent');

/**
 * @route   GET /api/security/logs
 * @desc    Retrieves chronological security trace events recorded for the current user
 * @access  Private
 */
router.get('/logs', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit, 10) || 50;
    const severity = req.query.severity;

    const query = { userId };
    if (severity) {
      query.severity = severity;
    }

    const logs = await SecurityLog.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);

    return res.status(200).json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (err) {
    console.error('Fetch security logs failure:', err.message);
    return res.status(500).json({ error: 'System error retrieving audit logs.' });
  }
});

/**
 * @route   GET /api/security/login-history
 * @desc    Retrieves chronological session access history logs for the current user
 * @access  Private
 */
router.get('/login-history', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit, 10) || 30;

    const history = await LoginHistory.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit);

    return res.status(200).json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (err) {
    console.error('Fetch login history failure:', err.message);
    return res.status(500).json({ error: 'System error retrieving login histories.' });
  }
});

/**
 * @route   GET /api/security/stats
 * @desc    Compiles key metrics regarding vault configuration, strengths distributions, categories, and safety index
 * @access  Private
 */
router.get('/stats', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // Retrieve all user credentials
    const credentials = await Password.find({ userId });

    let weakCount = 0;
    let mediumCount = 0;
    let strongCount = 0;
    let excellentCount = 0;
    let breachedCount = 0;
    const categoryDistribution = {};
    const expiringSoonCount = 0;

    const now = new Date();
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    let expiredOrExpiringCount = 0;

    credentials.forEach(record => {
      // 1. Password Strength Aggregations
      const strength = record.passwordStrength || 'Weak';
      if (strength === 'Excellent') excellentCount++;
      else if (strength === 'Strong') strongCount++;
      else if (strength === 'Medium') mediumCount++;
      else weakCount++;

      // 2. Breached Status tracking
      if (record.breached) {
        breachedCount++;
      }

      // 3. Category distribution tracking
      const cat = record.category || 'General';
      categoryDistribution[cat] = (categoryDistribution[cat] || 0) + 1;

      // 4. Expiry monitoring calculation
      if (record.expiryDate) {
        const expiry = new Date(record.expiryDate);
        if (expiry <= thirtyDaysFromNow) {
          expiredOrExpiringCount++;
        }
      }
    });

    const totalCount = credentials.length;

    // Calculate a secure Vault Health Score (0 to 100)
    // Formula weighs strong passwords positively, weak passwords and breached flags negatively
    let healthScore = 100;
    if (totalCount > 0) {
      const penaltyWeak = (weakCount / totalCount) * 40;
      const penaltyMedium = (mediumCount / totalCount) * 15;
      const penaltyBreached = (breachedCount / totalCount) * 50;
      const penaltyUnsecuredMfa = req.user.isTwoFactorEnabled ? 0 : 15;

      healthScore = Math.max(0, Math.round(100 - (penaltyWeak + penaltyMedium + penaltyBreached + penaltyUnsecuredMfa)));
    } else {
      // Unused/empty vault has an baseline rating of 100
      healthScore = req.user.isTwoFactorEnabled ? 100 : 85;
    }

    return res.status(200).json({
      success: true,
      data: {
        totalPasswords: totalCount,
        healthScore,
        mfaEnabled: req.user.isTwoFactorEnabled,
        breachedCount,
        expiredOrExpiringCount,
        strengths: {
          excellent: excellentCount,
          strong: strongCount,
          medium: mediumCount,
          weak: weakCount
        },
        categories: categoryDistribution
      }
    });

  } catch (err) {
    console.error('Compile dashboard stats exception:', err.message);
    return res.status(500).json({ error: 'System error processing statistical reports.' });
  }
});

/**
 * @route   GET /api/security/alerts
 * @desc    Retrieves security alerts including expiring credentials, breached records, and weak passwords
 * @access  Private
 */
router.get('/alerts', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const credentials = await Password.find({ userId });

    const alerts = {
      expired: [],
      expiringSoon: [],
      breached: [],
      weak: []
    };

    credentials.forEach(record => {
      // Create clean payload copy removing raw encrypted passwords
      const meta = {
        id: record._id,
        siteName: record.siteName,
        siteUrl: record.siteUrl,
        username: record.username,
        category: record.category,
        passwordStrength: record.passwordStrength,
        expiryDate: record.expiryDate
      };

      // 1. Expiration alerts
      if (record.expiryDate) {
        const expiry = new Date(record.expiryDate);
        if (expiry < new Date()) {
          alerts.expired.push({ ...meta, daysOverdue: Math.ceil((new Date() - expiry) / (1000 * 60 * 60 * 24)) });
        } else if (expiry <= thirtyDaysFromNow) {
          alerts.expiringSoon.push({ ...meta, daysRemaining: Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24)) });
        }
      }

      // 2. Breach alerts
      if (record.breached) {
        alerts.breached.push(meta);
      }

      // 3. Weak password alerts
      if (record.passwordStrength === 'Weak') {
        alerts.weak.push(meta);
      }
    });

    return res.status(200).json({
      success: true,
      data: alerts
    });

  } catch (err) {
    console.error('Failed compiling security alerts list:', err.message);
    return res.status(500).json({ error: 'System failure querying active security alerts.' });
  }
});

/**
 * @route   POST /api/security/export
 * @desc    Decrypts entire database record lists, generating a portable JSON file for archive downloads
 * @access  Private
 */
router.post('/export', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';

    // Retrieve full encrypted list matching user identification details
    const records = await Password.find({ userId }).sort({ siteName: 1 });

    const exportedCredentials = records.map(record => {
      let clearTextPassword = '';
      try {
        clearTextPassword = decrypt(record.encryptedPassword);
      } catch (err) {
        clearTextPassword = '[Error Decrypting Ciphertext]';
      }

      return {
        siteName: record.siteName,
        siteUrl: record.siteUrl || '',
        username: record.username,
        password: clearTextPassword,
        category: record.category || 'General',
        notes: record.notes || '',
        breached: record.breached || false,
        expiryDate: record.expiryDate ? record.expiryDate.toISOString() : null,
        lastAccessed: record.lastAccessed ? record.lastAccessed.toISOString() : null,
        createdAt: record.createdAt.toISOString()
      };
    });

    // Write high-integrity security trace identifying vault decryption extraction events
    await logSecurityEvent({
      userId,
      eventType: 'VAULT_EXPORTED',
      description: `Complete vault exported successfully containing ${exportedCredentials.length} decrypted records`,
      severity: 'Critical',
      ipAddress
    });

    return res.status(200).json({
      success: true,
      message: 'Vault export created and decrypted successfully. Maintain and guard this file with high security.',
      recordsCount: exportedCredentials.length,
      timestamp: new Date().toISOString(),
      data: exportedCredentials
    });

  } catch (err) {
    console.error('Vault data export crash:', err.message);
    return res.status(500).json({ error: 'Internal system complications executing decrypted extraction.' });
  }
});

module.exports = router;
