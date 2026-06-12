/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * File 9: backend/utils/passwordGenerator.js
 * Cryptographically secure password generator helper.
 * Generates highly complex strings with optional inclusions (uppercase, lowercase, numbers, symbols)
 * and guaranteed representation from each active set.
 */

const crypto = require('crypto');

// Define character sets
const CHAR_SETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?~'
};

/**
 * Generate a cryptographically secure random number in range [min, max)
 * @param {number} min - Lower bound (inclusive)
 * @param {number} max - Upper bound (exclusive)
 * @returns {number} Random integer
 */
function getRandomInt(min, max) {
  const range = max - min;
  if (range <= 0) {
    throw new Error('Range must be greater than zero.');
  }

  // Calculate bytes needed
  const bitsNeeded = Math.ceil(Math.log2(range));
  const bytesNeeded = Math.ceil(bitsNeeded / 8);
  const maxNum = Math.pow(256, bytesNeeded);

  let randomVal;
  do {
    const bytes = crypto.randomBytes(bytesNeeded);
    randomVal = 0;
    for (let i = 0; i < bytesNeeded; i++) {
      randomVal = (randomVal << 8) + bytes[i];
    }
    // Mitigate modulo bias by skipping values outside the balanced multiples
  } while (randomVal >= maxNum - (maxNum % range));

  return min + (randomVal % range);
}

/**
 * Shuffle an array of characters in-place using Fisher-Yates secure shuffle
 * @param {string[]} array - Array to shuffle
 * @returns {string[]} Shuffled array
 */
function secureShuffle(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = getRandomInt(0, i + 1);
    const temp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = temp;
  }
  return shuffled;
}

/**
 * Generates a cryptographically secure resilient password
 * @param {Object} config - Construction options
 * @param {number} config.length - Desired length (default: 16)
 * @param {boolean} config.uppercase - Include uppercase letters (default: true)
 * @param {boolean} config.lowercase - Include lowercase letters (default: true)
 * @param {boolean} config.numbers - Include digits (default: true)
 * @param {boolean} config.symbols - Include special characters (default: true)
 * @returns {string} The generated secure password
 */
function generatePassword({
  length = 16,
  uppercase = true,
  lowercase = true,
  numbers = true,
  symbols = true
} = {}) {
  // Enforce parameter validation constraints
  const targetLength = Math.max(8, Math.min(128, parseInt(length, 10) || 16));

  const pools = [];
  const mandatoryCharacters = [];

  if (uppercase) {
    pools.push(CHAR_SETS.uppercase);
    // Guarantee at least one character of this class is drafted
    const index = getRandomInt(0, CHAR_SETS.uppercase.length);
    mandatoryCharacters.push(CHAR_SETS.uppercase[index]);
  }
  if (lowercase) {
    pools.push(CHAR_SETS.lowercase);
    const index = getRandomInt(0, CHAR_SETS.lowercase.length);
    mandatoryCharacters.push(CHAR_SETS.lowercase[index]);
  }
  if (numbers) {
    pools.push(CHAR_SETS.numbers);
    const index = getRandomInt(0, CHAR_SETS.numbers.length);
    mandatoryCharacters.push(CHAR_SETS.numbers[index]);
  }
  if (symbols) {
    pools.push(CHAR_SETS.symbols);
    const index = getRandomInt(0, CHAR_SETS.symbols.length);
    mandatoryCharacters.push(CHAR_SETS.symbols[index]);
  }

  // If no pools selected, defaulted to lowercase + numbers
  if (pools.length === 0) {
    pools.push(CHAR_SETS.lowercase, CHAR_SETS.numbers);
    mandatoryCharacters.push(
      CHAR_SETS.lowercase[getRandomInt(0, CHAR_SETS.lowercase.length)],
      CHAR_SETS.numbers[getRandomInt(0, CHAR_SETS.numbers.length)]
    );
  }

  // Aggregate all selected characters into a single draft pool
  const combinedAlphabet = pools.join('');
  const passwordChars = [...mandatoryCharacters];

  // Fill in the remaining slots of the password up to target length
  while (passwordChars.length < targetLength) {
    const idx = getRandomInt(0, combinedAlphabet.length);
    passwordChars.push(combinedAlphabet[idx]);
  }

  // Securely shuffle to eliminate prefix bias introduced by mandatory character insertion
  const finalPassword = secureShuffle(passwordChars).join('');

  return finalPassword;
}

module.exports = {
  generatePassword
};
