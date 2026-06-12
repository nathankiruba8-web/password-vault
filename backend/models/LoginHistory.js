/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * File 5: backend/models/LoginHistory.js
 * Tracks and audits successful or failed user log-in attempts.
 * Includes detailed fields like IP address, device types, browser clients,
 * status markers, and timestamps.
 * Integrates directly with our resilient DB adapter.
 */

const { mongoose, getResilientModel } = require('../db/connection');

const loginHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID association is required']
  },
  ipAddress: {
    type: String,
    required: [true, 'IP Address is required'],
    trim: true,
    maxlength: [45, 'IP Address cannot exceed 45 characters'] // Covers IPv4 and IPv6
  },
  device: {
    type: String,
    required: [true, 'Device descriptor is required'],
    trim: true,
    maxlength: [100, 'Device description cannot exceed 100 characters']
  },
  browser: {
    type: String,
    required: [true, 'Browser agent description is required'],
    trim: true,
    maxlength: [100, 'Browser description cannot exceed 100 characters']
  },
  loginStatus: {
    type: String,
    required: [true, 'Login status classification is required'],
    enum: {
      values: ['Success', 'Failed', '2FA_Pending', 'Account_Locked'],
      message: '{VALUE} is not a valid login status'
    }
  },
  loginTime: {
    type: Date,
    default: Date.now,
    required: true
  }
}, {
  timestamps: false // We already have a specific loginTime field
});

// Create high-speed query indexing on userId and loginTime for audit trails
loginHistorySchema.index({ userId: 1, loginTime: -1 });

const LoginHistory = getResilientModel('LoginHistory', loginHistorySchema);

module.exports = LoginHistory;
