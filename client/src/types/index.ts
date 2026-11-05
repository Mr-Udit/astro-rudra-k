export interface User {
  _id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  role: 'user' | 'astrologer' | 'admin';
  isProfileComplete: boolean;
  isActive: boolean;
  lastLoginAt?: string;
  astrologerProfileId?: string;
  avatar?: string;
  createdAt?: string;
}

export interface Astrologer {
  id: string;
  name: string;
  title: string;
  image: string;
  // rating & reviews are currently disabled
  experience: number;
  consultations: number;
  accuracy: number;
  price: number;
  specializations: string[];
  languages: string[];
  about: string;
  availability: AvailabilitySlot[];
  status: 'online' | 'offline';
}

/**
 * Booking type matches the backend API response structure directly
 * Maps to MongoDB Booking model fields
 */
export interface Booking {
  id: string; // Maps to _id
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

export interface Testimonial {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  text: string;
  date: string;
}

export interface ConsultationType {
  id: 'audio' | 'video' | 'chat';
  name: string;
  icon: any;
  duration: number;
  description: string;
  price?: number;
}

export type BookingStep = 'astrologer' | 'consultation' | 'datetime' | 'details' | 'payment' | 'confirmation';

export interface ApiResponse<T = any> {
  ok: boolean;
  message?: string;
  data?: T;
  user?: User; // specific for auth responses sometimes
  booking?: Booking; // specific for booking responses
  [key: string]: any;
}

export interface AstrologerProfile extends Astrologer {
  // Add any specific profile fields if different from Astrologer, or just alias it
}

export interface AvailabilitySlot {
  day: string;
  startTime: string;
  endTime: string;
}

export interface AuthResponse {
  ok: boolean;
  /** Legacy alias kept for callers that check `success`. Use `ok` for new code. */
  success?: boolean;
  message?: string;
  user?: User;
  astrologer?: {
    _id: string;
    username: string;
    name: string;
    isVerified: boolean;
    isActive: boolean;
  };
  otp?: string; // Dev-mode debug OTP returned by backend
  [key: string]: any;
}

export interface LoginCredentials {
  /** Backend login uses username (not email) */
  username: string;
  role: 'user' | 'astrologer' | 'admin';
  action: 'request' | 'verify';
  otp?: string;
}
