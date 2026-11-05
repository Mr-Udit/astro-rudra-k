/**
 * Standardized API Response Contracts
 * 
 * All backend endpoints MUST return responses conforming to these types.
 * This ensures consistent error handling and type safety across the app.
 */

export interface ApiSuccess<T> {
    ok: true;
    data: T;
    message?: string;
}

export interface ApiErrorDetail {
    code: string;
    message: string;
}

export interface ApiError {
    ok: false;
    error: ApiErrorDetail;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

/**
 * Type guard to check if response is an error
 */
export function isApiError<T>(response: ApiResponse<T>): response is ApiError {
    return response.ok === false;
}

/**
 * Get error code from response
 */
export function getErrorCode(response: any): string | null {
    if (response?.ok === false && response?.error?.code) {
        return response.error.code;
    }
    return null;
}

/**
 * Get error message from response
 */
export function getErrorMessage(response: any): string | null {
    if (response?.ok === false && response?.error?.message) {
        return response.error.message;
    }
    return null;
}

/**
 * ASTROLOGER API CONTRACTS
 * These types represent the ACTUAL structure returned by backend endpoints
 */

export interface AvailabilitySlot {
    day: string;
    startTime: string;
    endTime: string;
}

/**
 * User data embedded in astrologer responses (from lookup)
 */
export interface AstrologerUserData {
    fullName: string;
    isActive: boolean;
    email?: string;
    phoneNumber?: string;
}

/**
 * Raw astrologer data from backend list/detail endpoints
 * Maps exactly to MongoDB AstrologerProfile + User lookup
 */
export interface AstrologerApiResponse {
    _id: string;
    name: string;              // profile name (fullName equivalent)
    title: string;
    email: string;
    phoneNumber?: string;
    profileImage?: string;
    experience: number;         // years of experience stored in DB
    availability: AvailabilitySlot[];
    createdAt: string;
    price: number;
    isVerified: boolean;
    specializations: string[];  // aka "skills" from admin form
    languages: string[];        // optional set by admin
    bio?: string;
    experienceSummary?: string;
    // previous contract had embedded user object; it's no longer used
}

/**
 * BOOKING API CONTRACTS
 * These types represent the ACTUAL structure returned by backend endpoints
 */

/**
 * Raw booking data from backend endpoints
 * Maps exactly to MongoDB Booking model
 */
export interface BookingApiResponse {
    _id: string;
    /** Create endpoint maps _id → id server-side; present only in create response */
    id?: string;
    bookingId: string;
    userId: string;
    astrologerProfileId: string;
    astrologerName: string;
    userName: string;
    userEmail: string;
    userPhone: string;
    bookingDate: string;
    bookingTime: string;
    consultationType: 'voice_call' | 'video_call' | 'chat';
    durationMinutes: number;
    amount: number;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'expired';
    problemStatement?: string;
    placeOfBirth?: string;
    timeOfBirth?: string;
    createdAt: string;
    updatedAt: string;
}

/**
 * Standardized response envelope for booking creation
 */
export interface BookingCreateResponse {
    ok: true;
    message: string;
    data: BookingApiResponse;
}
