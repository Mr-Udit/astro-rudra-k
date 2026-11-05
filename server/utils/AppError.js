/**
 * Standardized Application Error
 * 
 * All service errors should use this to ensure consistent frontend handling
 * Frontend reads error.code to determine user-facing message
 * 
 * RESPONSE FORMAT (STANDARDIZED):
 * {
 *   ok: false,
 *   error: {
 *     code: 'ERROR_CODE',
 *     message: 'User-facing message'
 *   }
 * }
 */

export class AppError extends Error {
  constructor(code, message, statusCode = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      ok: false,
      error: {
        code: this.code,
        message: this.message,
      },
    };
  }
}

/**
 * BOOKING ERROR CODES & MESSAGES
 * 
 * Frontend switches on error.code, not message
 * This ensures consistent, context-aware error handling
 */

export const BookingErrorCodes = {
  USER_INACTIVE: 'USER_INACTIVE',
  ASTROLOGER_UNVERIFIED: 'ASTROLOGER_UNVERIFIED',
  DUPLICATE_BOOKING: 'DUPLICATE_BOOKING',
  ASTROLOGER_PROFILE_MISSING: 'ASTROLOGER_PROFILE_MISSING',
  SLOT_OUTSIDE_AVAILABILITY: 'SLOT_OUTSIDE_AVAILABILITY',
  SLOT_OVERLAP: 'SLOT_OVERLAP',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_DATE_FORMAT: 'INVALID_DATE_FORMAT',
  INVALID_TIME_FORMAT: 'INVALID_TIME_FORMAT',
  INVALID_CONSULTATION_TYPE: 'INVALID_CONSULTATION_TYPE',
  BOOKING_NOT_FOUND: 'BOOKING_NOT_FOUND',
};

/**
 * Booking error factory functions
 * Use these in services to throw structured errors
 */

export const BookingErrors = {
  userInactive: () =>
    new AppError(
      BookingErrorCodes.USER_INACTIVE,
      'Your account is inactive. Please contact support.'
    ),

  astrologerUnverified: () =>
    new AppError(
      BookingErrorCodes.ASTROLOGER_UNVERIFIED,
      'This astrologer is not currently available for booking.'
    ),

  duplicateBooking: () =>
    new AppError(
      BookingErrorCodes.DUPLICATE_BOOKING,
      'You already have a booking with this astrologer on this date.'
    ),

  astrologerProfileMissing: () =>
    new AppError(
      BookingErrorCodes.ASTROLOGER_PROFILE_MISSING,
      'Astrologer profile not found.'
    ),

  slotOutsideAvailability: () =>
    new AppError(
      BookingErrorCodes.SLOT_OUTSIDE_AVAILABILITY,
      'The selected time slot is outside the astrologer\'s availability.'
    ),

  slotOverlap: () =>
    new AppError(
      BookingErrorCodes.SLOT_OVERLAP,
      'The selected time slot overlaps with an existing booking.'
    ),

  invalidDateFormat: () =>
    new AppError(
      BookingErrorCodes.INVALID_DATE_FORMAT,
      'Invalid booking date format. Use YYYY-MM-DD.'
    ),

  invalidTimeFormat: () =>
    new AppError(
      BookingErrorCodes.INVALID_TIME_FORMAT,
      'Invalid booking time format. Use HH:mm (24-hour).'
    ),

  invalidConsultationType: (provided) =>
    new AppError(
      BookingErrorCodes.INVALID_CONSULTATION_TYPE,
      `Invalid consultation type: "${provided}". Must be one of: voice_call, video_call, chat.`
    ),

  bookingNotFound: () =>
    new AppError(
      BookingErrorCodes.BOOKING_NOT_FOUND,
      'Booking not found. It may have been deleted or cancelled.'
    ),

  validationError: (details) =>
    new AppError(
      BookingErrorCodes.VALIDATION_ERROR,
      details || 'Booking validation failed.'
    ),
};

/**
 * CONSULTATION TYPE CANONICAL VALUES
 * Backend source of truth
 */
export const CONSULTATION_TYPES = {
  VOICE_CALL: 'voice_call',
  VIDEO_CALL: 'video_call',
  CHAT: 'chat',
};

/**
 * Validate consultation type
 */
export function isValidConsultationType(type) {
  return Object.values(CONSULTATION_TYPES).includes(type);
}
