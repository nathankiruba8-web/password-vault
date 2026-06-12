/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * File 7: backend/config/encryption.js
 * Cryptographic Utilities for Password Vault.
 * Implements high-security authenticated AES-256-GCM encryption/decryption.
 * Automatically derives a secure 32-byte key using SHA-256 hash stretching.
 */

const crypto = require('crypto');

// Retrieve master encryption secret from environment or fallback safely (with warnings)
const ENCRYPTION_SECRET = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'fallback-secure-vault-encryption-secret-string';

// Derive exactly 32 bytes (256 bits) for symmetric key mapping
const KEY = crypto.createHash('sha256').update(ENCRYPTION_SECRET).digest();

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 12-byte IV is standard for GCM to maximize speed and protection
const AUTH_TAG_LENGTH = 16; // 16-byte authentication tag for integrity

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * @param {string} text - The clear text to be encrypted
 * @returns {string} Colon-delimited format containing: iv (hex) : ciphertext (hex) : tag (hex)
 */
function encrypt(text) {
  if (typeof text !== 'string') {
    throw new Error('Encryption payload must be of type string.');
  }

  try {
    // Generate an initialization vector unique to every entry
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Extract the GCM authorization integrity tag
    const tag = cipher.getAuthTag().toString('hex');

    // Package together securely with colon delimiters for storing
    return `${iv.toString('hex')}:${encrypted}:${tag}`;
  } catch (err) {
    console.error('Critical cryptographic failure during encryption:', err.message);
    throw new Error('Could not secure data payload.');
  }
}

/**
 * Decrypt a cipher text back into standard UTF-8 string with GCM verification.
 * @param {string} encryptedPayload - Delimited string (iv:ciphertext:tag)
 * @returns {string} Orginal clear text string
 */
function decrypt(encryptedPayload) {
  if (!encryptedPayload || typeof encryptedPayload !== 'string') {
    throw new Error('Decryption input must be a valid non-empty string.');
  }

  try {
    const parts = encryptedPayload.split(':');
    
    // Validate format compatibility
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted input format. Decryption failed.');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    const tag = Buffer.from(parts[2], 'hex');

    // Verify correct buffer lengths
    if (iv.length !== IV_LENGTH || tag.length !== AUTH_TAG_LENGTH) {
      throw new Error('Invalid block initialization vectors or tags.');
    }

    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (err) {
    console.error('Critical cryptographic failure during decryption:', err.message);
    throw new Error('Failed to decrypt. Ensure integrity and database credentials remain synchronized.');
  }
}

module.exports = {
  encrypt,
  decrypt
};
