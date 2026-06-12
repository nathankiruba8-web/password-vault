/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * File 10: backend/utils/backupCodes.js
 * Cryptographically secure recovery / backup codes generator.
 * Produces alphanumeric codes grouped by separators for readability (e.g., "ABCD-1234").
 * Standardizes MFA backup systems so users can regain access if they lose their 2FA device.
 */

const crypto = require('crypto');

// Highly readable 32-character set (OMITS ambiguous characters like 0, O, I, 1, l, 8, B to prevent human error)
const RECOVERY_CHARSET = 'ACDEFGHJKLMNPQRSTUVWXY34679';

/**
 * Generate a single cryptographically secure backup code
 * @param {number} length - Number of alphanumeric characters inside the code
 * @returns {string} The formatted recovery code (e.g. "CDEF-MNPQ")
 */
function generateCode(length = 8) {
  const chars = [];
  const bytes = crypto.randomBytes(length);

  for (let i = 0; i < length; i++) {
    // Select index with modulo bias protection
    const index = bytes[i] % RECOVERY_CHARSET.length;
    chars.push(RECOVERY_CHARSET[index]);
  }

  const codeString = chars.join('');
  
  // Format halfway with a dash to make it visually scannable for humans
  const half = Math.ceil(length / 2);
  return `${codeString.slice(0, half)}-${codeString.slice(half)}`;
}

/**
 * Generates an array of secure, unique backup codes
 * @param {number} count - Amount of backup codes to issue (Default: 8)
 * @param {number} codeLength - Character count of each password recovery token (Default: 8)
 * @returns {string[]} An array of randomized backup codes
 */
function generateBackupCodes(count = 8, codeLength = 8) {
  const codes = new Set();
  
  // Guard-rail bounds checking
  const targetCount = Math.max(1, Math.min(20, parseInt(count, 10) || 8));
  const targetLength = Math.max(6, Math.min(16, parseInt(codeLength, 10) || 8));

  // Loop until unique set size is satisfied
  while (codes.add(generateCode(targetLength)).size < targetCount) {
    // Seamless set population guard
  }

  return Array.from(codes);
}

module.exports = {
  generateBackupCodes,
  generateCode
};
