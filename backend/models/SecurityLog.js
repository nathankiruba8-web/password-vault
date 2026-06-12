/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * File 6: backend/models/SecurityLog.js
 * Tracks and audits administrative and critical operations inside the vault (e.g. Master password updates,
 * 2FA status adjustments, export actions, failed decrypt attempts).
 * Integrates directly with our resilient dual-layer DB adapter.
 */

const { mongoose, getResilientModel } = require('../db/connection');

const securityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID association is required']
  },
  eventType: {
    type: String,
    required: [true, 'Security event type is required'],
    trim: true,
    maxlength: [100, 'Security event type classification cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Detailed event explanation is required'],
    trim: true,
    maxlength: [1000, 'Security event description details cannot exceed 1000 characters']
  },
  severity: {
    type: String,
    required: [true, 'Severity classification levels are required'],
    enum: {
      values: ['Low', 'Medium', 'High', 'Critical'],
      message: '{VALUE} is not a valid security log severity classification'
    },
    default: 'Low'
  },
  ipAddress: {
    type: String,
    required: [true, 'Client origin IP address is required for accountability'],
    trim: true,
    maxlength: [45, 'IP Address cannot exceed 45 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now,
    required: true
  }
}, {
  timestamps: false // We already have a specific createdAt timestamp configured above
});

// Configure rapid audit trailing indexes on user search scopes and event parameters
securityLogSchema.index({ userId: 1, createdAt: -1 });
securityLogSchema.index({ eventType: 1, createdAt: -1 });

const SecurityLog = getResilientModel('SecurityLog', securityLogSchema);

module.exports = SecurityLog;
