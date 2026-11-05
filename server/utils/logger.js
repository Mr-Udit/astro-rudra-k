/**
 * Structured Logging Configuration
 * 
 * Production Modes:
 * - LOG_LEVEL=error: Only errors logged (default production)
 * - LOG_LEVEL=warn: Warnings + errors (slower)
 * - LOG_LEVEL=info: Operational events (development)
 * 
 * Debug Mode:
 * - DEBUG=true: Detailed debug logs (DO NOT USE IN PRODUCTION)
 * 
 * Security:
 * - Never log email, phone, passwords, tokens
 * - Never log full request bodies in production
 * - Safe to log: user IDs (ObjectId), booking IDs, error codes, timestamps
 */

import morgan from "morgan";

const isProduction = process.env.NODE_ENV === "production";
const logLevel = process.env.LOG_LEVEL || (isProduction ? "error" : "info");
const debugEnabled = process.env.DEBUG === "true" && !isProduction;

/**
 * Log Level Hierarchy (only log if severity >= configured level)
 * 0 = error (highest)
 * 1 = warn
 * 2 = info  
 * 3 = debug (lowest)
 */
const LogLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const currentLogLevel = LogLevels[logLevel] ?? LogLevels.info;

/**
 * Custom logger for application events
 * Prevents sensitive data exposure in production
 */
export const logger = {
  /**
   * Operational events (requests, booking creations, status changes)
   * Use for: notable business events, non-error paths
   */
  info: (message, context = {}) => {
    if (currentLogLevel >= LogLevels.info) {
      console.log(`[${new Date().toISOString()}] [INFO] ${message}`, 
        sanitizeContext(context));
    }
  },

  /**
   * Potential issues that don't stop execution (unusual conditions)
   * Use for: deprecated API usage, rate limiting, missing optional data
   */
  warn: (message, context = {}) => {
    if (currentLogLevel >= LogLevels.warn) {
      console.warn(`[${new Date().toISOString()}] [WARN] ${message}`,
        sanitizeContext(context));
    }
  },

  /**
   * Errors that prevent operation (ALWAYS logged in production)
   * Use for: validation failures, DB errors, auth failures
   */
  error: (message, context = {}) => {
    console.error(`[${new Date().toISOString()}] [ERROR] ${message}`,
      sanitizeContext(context));
  },

  /**
   * Detailed development debugging (NEVER in production)
   * Use for: tracing execution paths, variable inspection
   */
  debug: (message, context = {}) => {
    if (debugEnabled && currentLogLevel >= LogLevels.debug) {
      console.debug(`[${new Date().toISOString()}] [DEBUG] ${message}`,
        sanitizeContext(context));
    }
  },

  /**
   * Booking-specific logging with automatic context
   * Use for: all booking operations
   */
  booking: {
    created: (bookingId, userId, astrologerId, status) => {
      logger.info('[BOOKING_CREATE_SUCCESS]', {
        bookingId,
        userId: userId.toString(),
        astrologerId: astrologerId.toString(),
        status,
        timestamp: new Date().toISOString(),
      });
    },

    failed: (reason, userId, astrologerId, code) => {
      logger.error('[BOOKING_CREATE_FAILED]', {
        reason,
        userId: userId?.toString(),
        astrologerId: astrologerId?.toString(),
        code,
        timestamp: new Date().toISOString(),
      });
    },

    duplicate: (userId, astrologerId, bookingDate) => {
      logger.warn('[BOOKING_DUPLICATE_ATTEMPTED]', {
        userId: userId.toString(),
        astrologerId: astrologerId.toString(),
        bookingDate,
        timestamp: new Date().toISOString(),
      });
    },
  }
};

/**
 * Remove PII from logged context
 * Safe to log: IDs, codes, messages, timestamps
 * Remove: emails, phone numbers, full names, tokens, passwords
 */
function sanitizeContext(context) {
  if (!context || typeof context !== 'object') return context;

  const sanitized = { ...context };
  
  // List of sensitive fields to remove
  const sensitiveFields = [
    'email',
    'password',
    'token',
    'otp',
    'phoneNumber',
    'phone',
    'fullName',
    'firstName',
    'lastName',
    'ssn',
    'creditCard',
    'userEmail',
    'userPhone',
    'userName',
    'astrologerName',
    'problemStatement',
    'placeOfBirth',
    'timeOfBirth',
  ];

  sensitiveFields.forEach(field => {
    if (field in sanitized) {
      delete sanitized[field];
    }
  });

  return sanitized;
}

/**
 * Morgan HTTP request logger middleware
 * Configured to skip verbose endpoints
 */

// REMOVED: getMorganMiddleware() - verified never imported or used anywhere
// Morgan logging is configured directly in index.js

export default logger;
