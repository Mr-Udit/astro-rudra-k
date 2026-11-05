/**
 * Booking Error Codes & Messages
 * 
 * Maps backend error codes to user-friendly frontend messages
 * Used in error handling and UI feedback
 */

export const BookingErrorMessages: Record<string, string> = {
  USER_INACTIVE: 'Your account is inactive. Please contact support to continue booking.',
  ASTROLOGER_UNVERIFIED: 'This astrologer is not currently available for booking.',
  DUPLICATE_BOOKING: 'You already have a booking with this astrologer on this date. Choose a different date or astrologer.',
  ASTROLOGER_PROFILE_MISSING: 'The astrologer profile could not be found. Please try again.',
  SLOT_OUTSIDE_AVAILABILITY: 'The selected time slot is outside the astrologer\'s available hours. Please choose a different time.',
  SLOT_OVERLAP: 'That time slot is already booked. Please select a different time.',
  VALIDATION_ERROR: 'Please check your booking details and try again.',
  INVALID_DATE_FORMAT: 'Invalid booking date. Please select a valid date.',
  INVALID_TIME_FORMAT: 'Invalid booking time. Please select a valid time.',
  INVALID_CONSULTATION_TYPE: 'Please select a valid consultation type.',
  BOOKING_NOT_FOUND: 'The booking could not be found. It may have been deleted or cancelled.',
  INTERNAL_SERVER_ERROR: 'Something went wrong on our end. Please try again later.',
};

/**
 * Get user-friendly error message from backend error code
 */
export function getErrorMessage(code: string): string {
  return BookingErrorMessages[code] || 'An error occurred. Please try again.';
}

/**
 * Determine if error is recoverable (user can retry)
 */
export function isRecoverableError(code: string): boolean {
  const nonRecoverable = [
    'DUPLICATE_BOOKING',
    'ASTROLOGER_UNVERIFIED',
    'USER_INACTIVE',
    'BOOKING_NOT_FOUND',
  ];
  return !nonRecoverable.includes(code);
}

/**
 * Determine UI action based on error code
 */
export function getErrorAction(code: string): 'retry' | 'select_time' | 'select_astrologer' | 'none' {
  switch (code) {
    case 'SLOT_OUTSIDE_AVAILABILITY':
    case 'SLOT_OVERLAP':
    case 'INVALID_TIME_FORMAT':
      return 'select_time';
    
    case 'DUPLICATE_BOOKING':
    case 'ASTROLOGER_UNVERIFIED':
      return 'select_astrologer';
    
    case 'USER_INACTIVE':
    case 'ASTROLOGER_PROFILE_MISSING':
    case 'BOOKING_NOT_FOUND':
      return 'none';
    
    default:
      return 'retry';
  }
}
