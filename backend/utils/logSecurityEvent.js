/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * File 11: backend/utils/logSecurityEvent.js
 * Centralized utility function to record security and audit log entries.
 * Connects securely with the SecurityLog model to store trace history.
 * Ensures parent request processes never fail if writing the log encounters an issue.
 */

const SecurityLog = require('../models/SecurityLog');

/**
 * Log a high-integrity security audit event to the persistent storage layer.
 * 
 * @param {Object} params - Audit logging details
 * @param {string|Object} params.userId - The ID of the authenticated user triggering the event
 * @param {string} params.eventType - Category of security action (e.g., 'AUTH_SUCCEEDED', 'DECRYPT_ATTEMPT', 'MFA_UPDATED')
 * @param {string} params.description - Human-readable message detailing exactly what happened
 * @param {'Low'|'Medium'|'High'|'Critical'} [params.severity='Low'] - Severity rating classification of the audit log
 * @param {string} [params.ipAddress='127.0.0.1'] - Client origin IP address for security auditing and tracking
 * @returns {Promise<Object|null>} The saved SecurityLog document or null if failed
 */
async function logSecurityEvent({
  userId,
  eventType,
  description,
  severity = 'Low',
  ipAddress = '127.0.0.1'
}) {
  // Validate basic required parameters to prevent incomplete records
  if (!userId) {
    console.warn(`[Security Log Warning] Missing userId for security event: ${eventType}. Recording aborted.`);
    return null;
  }
  if (!eventType) {
    console.warn('[Security Log Warning] Event type classification is missing. Recording aborted.');
    return null;
  }
  if (!description) {
    console.warn('[Security Log Warning] Event descriptive details are missing. Recording aborted.');
    return null;
  }

  try {
    // Normalization parameters before insertion
    const cleanIpAddress = ipAddress || '127.0.0.1';
    const cleanSeverity = ['Low', 'Medium', 'High', 'Critical'].includes(severity) ? severity : 'Low';

    const logEntry = await SecurityLog.create({
      userId,
      eventType: eventType.toUpperCase().trim(),
      description: description.trim(),
      severity: cleanSeverity,
      ipAddress: cleanIpAddress,
      createdAt: new Date()
    });

    console.log(`[Security Log] [${cleanSeverity}] ${eventType}: ${description} (IP: ${cleanIpAddress})`);
    return logEntry;
  } catch (err) {
    // We catch and log to console instead of throwing, ensuring a logging failure
    // never causes a parent user-facing transaction (like password updates) to revert.
    console.error(`[Security Log Failure] Failed to commit log entry [${eventType}]:`, err.message);
    return null;
  }
}

module.exports = logSecurityEvent;
