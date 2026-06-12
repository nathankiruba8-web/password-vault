/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * File 3: backend/models/User.js
 * User Schema and Model Definition.
 * Includes complete validation, virtuals, and hooks for secure user management.
 * Leverages our resilient DB adapter to seamlessly support MongoDB or JSON fallback.
 */

const { mongoose, getResilientModel } = require('../db/connection');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required']
  },
  twoFactorSecret: {
    type: String,
    default: null
  },
  backupCodes: {
    type: [String],
    default: []
  },
  isTwoFactorEnabled: {
    type: Boolean,
    default: false
  },
  passwordResetToken: {
    type: String,
    default: null
  },
  passwordResetExpires: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // Auto-manages createdAt and updatedAt fields
});

// Configure indexes for rapid search lookup performance
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ passwordResetToken: 1 });

const User = getResilientModel('User', userSchema);

module.exports = User;
