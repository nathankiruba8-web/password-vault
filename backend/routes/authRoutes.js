/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * File 13: backend/routes/authRoutes.js
 * Comprehensive Authentication API Routes.
 * Implements:
 * - Part 1: Register, Login, JWT Generation.
 * - Part 2: Google Authenticator Setup, QR Code Generation, Enable 2FA.
 * - Part 3: Verify OTP, Backup Code Login, Forgot Password, Reset Password.
 * Provides high-integrity audit trails with LoginHistory and SecurityLog repositories.
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const crypto = require('crypto');

const User = require('../models/User');
const LoginHistory = require('../models/LoginHistory');
const { protect } = require('../middleware/authMiddleware');
const logSecurityEvent = require('../utils/logSecurityEvent');
const { generateBackupCodes } = require('../utils/backupCodes');
const { sendPasswordResetEmail } = require('../utils/emailService');

// Server JSON Web Token signature secret configuration
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secure-jwt-secret-signing-key';

/**
 * Helper to generate standard authorization JWT token.
 * Expired in 24 hours to secure standard user vault sessions.
 * @param {string} userId - User identifier
 * @returns {string} Signed JWT token
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '24h' });
};

/**
 * Custom light-weight client User-Agent parser.
 * Extracts browser brand and device layout details without extra packages.
 * @param {string} userAgentHeader - Request user-agent header
 * @returns {Object} { browser, device }
 */
const parseUserAgent = (userAgentHeader) => {
  const ua = userAgentHeader || '';
  let browser = 'Unknown Browser';
  let device = 'Desktop';

  if (/chrome|crios/i.test(ua)) {
    browser = 'Chrome';
  } else if (/firefox|iceweasel/i.test(ua)) {
    browser = 'Firefox';
  } else if (/safari/i.test(ua) && !/chrome/i.test(ua)) {
    browser = 'Safari';
  } else if (/msie|trident/i.test(ua)) {
    browser = 'Internet Explorer';
  } else if (/edge|edg/i.test(ua)) {
    browser = 'Edge';
  }

  if (/mobile|android|iphone|ipad|phone/i.test(ua)) {
    device = /ipad/i.test(ua) ? 'Tablet' : 'Mobile';
  }

  return { browser, device };
};

// ==========================================
// PART 1: User Registration & Core Login
// ==========================================

/**
 * @route   POST /api/auth/register
 * @desc    Registers a new user, hashes password, and issues JWT access token
 * @access  Public
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const { browser, device } = parseUserAgent(req.headers['user-agent']);

    // 1. Strict parameter validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Please provide all required registration fields.' });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({ error: 'Name must consist of at least 2 characters.' });
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email format.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Master password must consist of at least 8 characters.' });
    }

    // 2. Conflict validation with current active emails
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'An account associated with this email already exists.' });
    }

    // 3. Encrypt and secure password string using bcrypt
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Record new User model document
    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword
    });

    // 5. Generate validation authorization token
    const token = generateToken(newUser._id);

    // 6. Record Initial Login entry
    await LoginHistory.create({
      userId: newUser._id,
      ipAddress,
      device,
      browser,
      loginStatus: 'Success'
    });

    // 7. Write audit log
    await logSecurityEvent({
      userId: newUser._id,
      eventType: 'USER_REGISTERED',
      description: `User registration finalized successfully for ${newUser.email}`,
      severity: 'Low',
      ipAddress
    });

    // 8. Return response
    return res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        isTwoFactorEnabled: newUser.isTwoFactorEnabled
      }
    });

  } catch (err) {
    console.error('Registration processing exception:', err.message);
    return res.status(500).json({ error: 'Internal system failure during user registration.' });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticates username and password credentials. Resolves 2FA state conditions.
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const { browser, device } = parseUserAgent(req.headers['user-agent']);

    // 1. Inputs validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Please enter both email and master password.' });
    }

    // 2. Fetch User
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid master key credentials or email address.' });
    }

    // 3. Confirm password signature matching
    const isMatched = await bcrypt.compare(password, user.password);
    if (!isMatched) {
      // Audit tracking for failure investigation
      await LoginHistory.create({
        userId: user._id,
        ipAddress,
        device,
        browser,
        loginStatus: 'Failed'
      });

      await logSecurityEvent({
        userId: user._id,
        eventType: 'LOGIN_FAILED',
        description: `Unsuccessful login attempt detected for ${user.email}`,
        severity: 'Medium',
        ipAddress
      });

      return res.status(401).json({ error: 'Invalid master key credentials or email address.' });
    }

    // 4. Handle 2-Factor Authentication state flow
    if (user.isTwoFactorEnabled) {
      await LoginHistory.create({
        userId: user._id,
        ipAddress,
        device,
        browser,
        loginStatus: '2FA_Pending'
      });

      await logSecurityEvent({
        userId: user._id,
        eventType: 'LOGIN_MFA_CHALLENGE',
        description: 'Multi-factor authentication required for session validation',
        severity: 'Low',
        ipAddress
      });

      // Issue temporary/pending metadata mapping instead of global session token
      return res.status(200).json({
        twoFactorRequired: true,
        userId: user._id,
        email: user.email,
        message: 'Two-factor confirmation authorization is required.'
      });
    }

    // 5. Finalize general success path
    const token = generateToken(user._id);

    await LoginHistory.create({
      userId: user._id,
      ipAddress,
      device,
      browser,
      loginStatus: 'Success'
    });

    await logSecurityEvent({
      userId: user._id,
      eventType: 'LOGIN_SUCCESS',
      description: `Authenticated user session created for ${user.email}`,
      severity: 'Low',
      ipAddress
    });

    return res.status(200).json({
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isTwoFactorEnabled: false
      }
    });

  } catch (err) {
    console.error('Login processing exception:', err.message);
    return res.status(500).json({ error: 'Internal system failure during user sign-in.' });
  }
});


// ==========================================
// PART 2: MFA/2FA Setup & Enabling
// ==========================================

/**
 * @route   POST /api/auth/2fa/setup
 * @desc    Generates TOTP secret key and corresponding QR Code for Google Authenticator registration
 * @access  Private
 */
router.post('/2fa/setup', protect, async (req, res) => {
  try {
    const user = req.user;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';

    // Generates a cryptographically strong TOTP multi-factor secret
    const secret = speakeasy.generateSecret({
      name: `SecureVault:${user.email}`,
      issuer: 'SecureVault'
    });

    // Temporarily save secret code on user document without enabling 2FA immediately
    user.twoFactorSecret = secret.base32;
    await user.save();

    // Create a high-quality visual QR Code representation of the otpauth alignment URL
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

    // Send the raw secret and visual base64 URI back to the client
    return res.status(200).json({
      qrCodeUrl,
      secret: secret.base32,
      issuer: 'SecureVault',
      account: user.email
    });

  } catch (err) {
    console.error('MFA setup execution error:', err.message);
    return res.status(500).json({ error: 'Internal system error rendering authentication QR barcode.' });
  }
});

/**
 * @route   POST /api/auth/2fa/verify
 * @desc    Validates setup token verification, updates activation confirmation, issues secure backup codes
 * @access  Private
 */
router.post('/2fa/verify', protect, async (req, res) => {
  try {
    const { token } = req.body;
    const user = req.user;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';

    if (!token) {
      return res.status(400).json({ error: 'Please input the 6-digit TOTP validation code.' });
    }

    if (!user.twoFactorSecret) {
      return res.status(400).json({ error: 'Please initiate MFA setup process before validating.' });
    }

    // Verify token matches live Google Authenticator configuration values
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1 // Allow 1 step (30 seconds) tolerance window backwards and forwards
    });

    if (!verified) {
      return res.status(400).json({ error: 'The verification code provided is incorrect or expired.' });
    }

    // Capture success state and generate backup disaster keys
    const backupCodesList = generateBackupCodes(8, 8); // Generates 8 readable codes of length 8 characters

    user.isTwoFactorEnabled = true;
    user.backupCodes = backupCodesList;
    await user.save();

    // Record audit event
    await logSecurityEvent({
      userId: user._id,
      eventType: 'MFA_ENABLED',
      description: 'Two-Factor Authentication activated and backup recovery codes generated',
      severity: 'High',
      ipAddress
    });

    return res.status(200).json({
      message: 'Two-factor Authentication enabled successfully.',
      backupCodes: backupCodesList
    });

  } catch (err) {
    console.error('MFA validation verification error:', err.message);
    return res.status(500).json({ error: 'Internal technical complication registering active MFA status.' });
  }
});


// ==========================================
// PART 3: OTP Verification, Backup Code, Forgot & Reset Password
// ==========================================

/**
 * @route   POST /api/auth/verify-otp
 * @desc    General OTP Verification route (verify TOTP/OTP token independently)
 * @access  Public/Private (Supports both validated user sessions and standalone context)
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { userId, token } = req.body;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';

    if (!userId || !token) {
      return res.status(400).json({ error: 'User ID and OTP token are required parameters.' });
    }

    const user = await User.findById(userId);
    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({ error: 'Invalid user id or two-factor secret not configurated.' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1
    });

    if (!verified) {
      return res.status(400).json({ error: 'The OTP code provided is incorrect or expired.' });
    }

    return res.status(200).json({
      success: true,
      message: 'OTP verification matched successfully.'
    });

  } catch (err) {
    console.error('Verify OTP request error:', err.message);
    return res.status(500).json({ error: 'System error during OTP verification processing.' });
  }
});

/**
 * @route   POST /api/auth/login/2fa
 * @desc    Completes multi-factor challenge authentication to log in isTwoFactorEnabled accounts
 * @access  Public
 */
router.post('/login/2fa', async (req, res) => {
  try {
    const { userId, token } = req.body;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const { browser, device } = parseUserAgent(req.headers['user-agent']);

    if (!userId || !token) {
      return res.status(400).json({ error: 'Incorrect request parameters. User ID and validation token required.' });
    }

    const user = await User.findById(userId);
    if (!user || !user.isTwoFactorEnabled) {
      return res.status(400).json({ error: 'Action denied. MFA authentication status is mismatching.' });
    }

    let isChallengeCleared = false;
    let isBackupKeyUsed = false;

    // 1. Check Totp sequence alignment
    const isTotpValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1
    });

    if (isTotpValid) {
      isChallengeCleared = true;
    } else {
      // 2. Check disaster key backup codes
      const matchedCode = user.backupCodes.find(code => code === token || code.replace('-', '') === token);
      if (matchedCode) {
        isChallengeCleared = true;
        isBackupKeyUsed = true;
        // Strip out the used single-use disaster token
        user.backupCodes = user.backupCodes.filter(code => code !== matchedCode);
        await user.save();
      }
    }

    if (!isChallengeCleared) {
      await LoginHistory.create({
        userId: user._id,
        ipAddress,
        device,
        browser,
        loginStatus: 'Failed'
      });

      await logSecurityEvent({
        userId: user._id,
        eventType: 'MFA_LOGIN_FAILED',
        description: 'Incorrect security token supplied during MFA challenge login verification',
        severity: 'Medium',
        ipAddress
      });

      return res.status(401).json({ error: 'The challenge token is incorrect or expired.' });
    }

    // Issue standard valid session authorization key
    const sessionToken = generateToken(user._id);

    await LoginHistory.create({
      userId: user._id,
      ipAddress,
      device,
      browser,
      loginStatus: 'Success'
    });

    await logSecurityEvent({
      userId: user._id,
      eventType: isBackupKeyUsed ? 'MFA_BACKUP_LOGIN_SUCCESS' : 'LOGIN_SUCCESS',
      description: isBackupKeyUsed 
        ? 'Session authenticated with single-use disaster recovery backup code' 
        : 'Session authenticated successfully via multi-factor challenge verification',
      severity: isBackupKeyUsed ? 'High' : 'Low',
      ipAddress
    });

    return res.status(200).json({
      message: 'Login successful.',
      token: sessionToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isTwoFactorEnabled: true
      }
    });

  } catch (err) {
    console.error('MFA callback verification error:', err.message);
    return res.status(500).json({ error: 'Technical complications validating MFA token sequences.' });
  }
});

/**
 * @route   POST /api/auth/login/backup
 * @desc    Dedicated route for Backup Code Login authentication
 * @access  Public
 */
router.post('/login/backup', async (req, res) => {
  try {
    const { userId, backupCode } = req.body;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const { browser, device } = parseUserAgent(req.headers['user-agent']);

    if (!userId || !backupCode) {
      return res.status(400).json({ error: 'User ID and single-use backup recovery code are required parameters.' });
    }

    const user = await User.findById(userId);
    if (!user || !user.isTwoFactorEnabled) {
      return res.status(400).json({ error: 'MFA authorization flow is conflictive or deactivated.' });
    }

    // Clean space separators if any are entered by user
    const processedCode = backupCode.trim();
    const matchedCode = user.backupCodes.find(code => code === processedCode || code.replace('-', '') === processedCode);

    if (!matchedCode) {
      await LoginHistory.create({
        userId: user._id,
        ipAddress,
        device,
        browser,
        loginStatus: 'Failed'
      });

      await logSecurityEvent({
        userId: user._id,
        eventType: 'BACKUP_LOGIN_FAILED',
        description: 'Failed login attempt using invalid backup recovery code',
        severity: 'Medium',
        ipAddress
      });

      return res.status(401).json({ error: 'The backup recovery code provided is mismatching or already used.' });
    }

    // Consume the requested single-use backup restoration code
    user.backupCodes = user.backupCodes.filter(code => code !== matchedCode);
    await user.save();

    const sessionToken = generateToken(user._id);

    await LoginHistory.create({
      userId: user._id,
      ipAddress,
      device,
      browser,
      loginStatus: 'Success'
    });

    await logSecurityEvent({
      userId: user._id,
      eventType: 'MFA_BACKUP_LOGIN_SUCCESS',
      description: 'Authorized session established successfully using single-use emergency backup code',
      severity: 'High',
      ipAddress
    });

    return res.status(200).json({
      message: 'Emergency recovery login completed successfully.',
      token: sessionToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isTwoFactorEnabled: true
      }
    });

  } catch (err) {
    console.error('Backup recovery validation crash:', err.message);
    return res.status(500).json({ error: 'Technical failure validating database emergency codes.' });
  }
});

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Triggers search for email address, generates unique resetting token, and dispatches recovery email.
 * @access  Public
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';

    if (!email) {
      return res.status(400).json({ error: 'Email configuration is required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    // Return standard success messaging to deter email profiling/harvesting attacks
    const standardSuccessMessage = 'If a valid account exists with this email address, a password recovery link has been sent.';

    if (!user) {
      console.log(`[Forgot Password Query] Non-existent recipient requested: ${email}`);
      return res.status(200).json({ message: standardSuccessMessage });
    }

    // Generate unique cryptographically secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Save to user with 1 hour expiration limit
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = Date.now() + 3600000; // 1 Hour
    await user.save();

    // Determine current requests host origin
    const originUrl = req.headers.origin || `${req.protocol}://${req.get('host')}`;

    // Dispatch the email securely using the nodemailer dispatcher helper
    await sendPasswordResetEmail(user.email, resetToken, originUrl);

    // Audit trace event
    await logSecurityEvent({
      userId: user._id,
      eventType: 'PASSWORD_RESET_REQUESTED',
      description: `Recovery verification link issued and emailed to ${user.email}`,
      severity: 'Medium',
      ipAddress
    });

    return res.status(200).json({ message: standardSuccessMessage });

  } catch (err) {
    console.error('Forgot password processing error:', err.message);
    return res.status(500).json({ error: 'Internal system error compiling recovery parameters.' });
  }
});

/**
 * @route   POST /api/auth/reset-password
 * @desc    Validates reset token matching and freshness. Hashes new password and registers changes.
 * @access  Public
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and new master password are required.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Master password must consist of at least 8 characters.' });
    }

    // Find valid unexpired token matches
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'The password reset token is incorrect, expired, or already used.' });
    }

    // Encrypt new password using robust bcrypt hashes
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    user.password = hashedPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    await logSecurityEvent({
      userId: user._id,
      eventType: 'PASSWORD_RESET_SUCCESS',
      description: 'Master password updated and stored successfully via email token recovery',
      severity: 'High',
      ipAddress
    });

    return res.status(200).json({
      message: 'Master password changed successfully. You may now proceed to log in.'
    });

  } catch (err) {
    console.error('Reset password processing error:', err.message);
    return res.status(500).json({ error: 'Internal system error saving new master password configuration.' });
  }
});


// ==========================================
// Administrative Options
// ==========================================

/**
 * @route   POST /api/auth/2fa/disable
 * @desc    Deactivates multi-factor authentication, clears secret code mapping, and wipes backup records
 * @access  Private
 */
router.post('/2fa/disable', protect, async (req, res) => {
  try {
    const user = req.user;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';

    if (!user.isTwoFactorEnabled) {
      return res.status(400).json({ error: 'Multi-factor authentication is currently not enabled for this user.' });
    }

    user.isTwoFactorEnabled = false;
    user.twoFactorSecret = null;
    user.backupCodes = [];
    await user.save();

    await logSecurityEvent({
      userId: user._id,
      eventType: 'MFA_DISABLED',
      description: 'Two-Factor Authentication deactivated by user administrative settings override',
      severity: 'Critical',
      ipAddress
    });

    return res.status(200).json({ message: 'Two-Factor authentication has been deactivated.' });

  } catch (err) {
    console.error('MFA disabled request failure:', err.message);
    return res.status(500).json({ error: 'Internal system complications deactivating MFA.' });
  }
});

module.exports = router;
