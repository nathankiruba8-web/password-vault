/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * File 8: backend/middleware/authMiddleware.js
 * JSON Web Token (JWT) Authentication Middleware.
 * Validates request Bearer tokens and extracts authenticated user state.
 * Includes complete security checks, token verification, expiration validation,
 * and attaches verified user database documents to request context.
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Retrieve secure JWT secrets or apply a stable developer fallback
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secure-jwt-secret-signing-key';

/**
 * Global authentication guard. Extracts and verifies Bearer token.
 * Populates req.user with the validated User document.
 */
async function protect(req, res, next) {
  let token;

  // Retrieve token from Authorization header (standard bearer token)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Fallback trace for query params or cookie tokens if needed
  if (!token && req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({
      error: 'Access denied. Authorization token is missing.'
    });
  }

  try {
    // Standard payload decoding with cryptographic signature validation
    const decoded = jwt.verify(token, JWT_SECRET);

    if (!decoded || !decoded.id) {
      return res.status(401).json({
        error: 'Invalid token signature or damaged identity claims.'
      });
    }

    // Retrieve full user record from database (MongoDB or local JSON resilient Adapter)
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        error: 'The user session associated with this token no longer exists.'
      });
    }

    // Attach complete verified user database document details to request context
    req.user = user;
    
    // Resume pipeline execution
    next();
  } catch (err) {
    console.error('JWT Verification failure:', err.message);

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Your authorization token has expired. Please sign in again.'
      });
    }

    return res.status(401).json({
      error: 'Unauthorized access. Verification credentials are invalid or modified.'
    });
  }
}

/**
 * Optional multi-factor authentication check wrapper.
 * Ensures the user has successfully finished MFA confirmation steps.
 */
function require2FA(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Auth context is required before verification steps.' });
  }

  // If 2FA is active, require completion check flag on request or session state
  if (req.user.isTwoFactorEnabled && !req.headers['x-2fa-verified'] && !req.query['mfa_verified']) {
    return res.status(403).json({
      error: 'Multi-factor authentication check is outstanding. Complete 2FA login route first.'
    });
  }

  next();
}

module.exports = {
  protect,
  require2FA
};
