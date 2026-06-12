/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * File 4: backend/models/Password.js
 * Password Credential Schema and Model Definition.
 * Represents saved login records belonging to authorized users. Includes fields for URL, 
 * category, strength metrics, access logs, and safety flags (such as breach status).
 * Leverages our resilient DB adapter to support standard Mongo deployments or local file persistence.
 */

const { mongoose, getResilientModel } = require('../db/connection');

const passwordSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID association is required']
  },
  siteName: {
    type: String,
    required: [true, 'Site name or service label is required'],
    trim: true,
    maxlength: [100, 'Site name cannot exceed 100 characters']
  },
  siteUrl: {
    type: String,
    trim: true,
    maxLength: [500, 'URL address cannot exceed 500 characters'],
    default: ''
  },
  username: {
    type: String,
    required: [true, 'Username or login identification is required'],
    trim: true,
    maxlength: [150, 'Username cannot exceed 150 characters']
  },
  encryptedPassword: {
    type: String,
    required: [true, 'Encrypted password string is required']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    default: ''
  },
  category: {
    type: String,
    trim: true,
    default: 'General',
    maxlength: [50, 'Category cannot exceed 50 characters']
  },
  passwordStrength: {
    type: String,
    enum: {
      values: ['Weak', 'Medium', 'Strong', 'Excellent'],
      message: '{VALUE} is not a valid password strength rating'
    },
    default: 'Medium'
  },
  breached: {
    type: Boolean,
    default: false
  },
  lastAccessed: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    default: null
  }
}, {
  timestamps: true // Auto-manages createdAt and updatedAt fields
});

// Configure composite indexes for high-speed query indexing
passwordSchema.index({ userId: 1, category: 1 });
passwordSchema.index({ userId: 1, siteName: 1 });

const Password = getResilientModel('Password', passwordSchema);

module.exports = Password;
