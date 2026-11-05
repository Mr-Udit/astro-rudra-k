import apiClient from './client';
import type { ApiResponse, Booking } from '../types';
import type { BookingApiResponse } from '../types/api';

export interface CreateBookingPayload {
  astrologerProfileId: string;
  bookingDate: string; // ISO date string (YYYY-MM-DD)
  bookingTime: string; // HH:mm format
  consultationType: 'voice_call' | 'video_call' | 'chat';
  durationMinutes?: number;
  amount?: number;
  problemStatement?: string;
  placeOfBirth?: string;
  timeOfBirth?: string;
}

export interface ReschedulePayload {
  newDate: string;
  newTime: string;
}

/**
 * Bookings API Client
 * All methods directly interface with backend booking endpoints
 * Type-safe with strict request/response contracts
 */
export const bookingsApi = {
  /**
   * Create new booking
   * @returns Full booking details from backend
   */
  create: async (payload: CreateBookingPayload): Promise<Booking> => {
    try {
      const response = await apiClient.post<ApiResponse<BookingApiResponse>>(
        '/bookings/create',
        payload
      );

      if (!response.data.ok || !response.data.data) {
        throw new Error(response.data.message || 'Failed to create booking');
      }

      // Transform backend response to frontend Booking type
      const booking = response.data.data;
      return {
        id: booking.id || booking._id,  // create endpoint returns `id`; list/detail return `_id`
        bookingId: booking.bookingId,
        userId: booking.userId,
        astrologerProfileId: booking.astrologerProfileId,
        astrologerName: booking.astrologerName,
        userName: booking.userName,
        userEmail: booking.userEmail,
        userPhone: booking.userPhone,
        bookingDate: booking.bookingDate,
        bookingTime: booking.bookingTime,
        consultationType: booking.consultationType,
        durationMinutes: booking.durationMinutes,
        amount: booking.amount,
        status: booking.status,
        problemStatement: booking.problemStatement,
        placeOfBirth: booking.placeOfBirth,
        timeOfBirth: booking.timeOfBirth,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
      };
    } catch (error: any) {
      // Preserve error structure from backend (with error codes)
      if (error.response?.data?.error?.code) {
        throw error;  // Re-throw with original error structure
      }
      throw error;
    }
  },

  /**
   * Get user's bookings list
   */
  myBookings: async (): Promise<Booking[]> => {
    const response = await apiClient.get<ApiResponse<BookingApiResponse[]>>(
      '/bookings/my-bookings'
    );

    if (!response.data.ok || !response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch bookings');
    }

    return response.data.data.map((booking) => ({
      id: booking._id,
      bookingId: booking.bookingId,
      userId: booking.userId,
      astrologerProfileId: booking.astrologerProfileId,
      astrologerName: booking.astrologerName,
      userName: booking.userName,
      userEmail: booking.userEmail,
      userPhone: booking.userPhone,
      bookingDate: booking.bookingDate,
      bookingTime: booking.bookingTime,
      consultationType: booking.consultationType,
      durationMinutes: booking.durationMinutes,
      amount: booking.amount,
      status: booking.status,
      problemStatement: booking.problemStatement,
      placeOfBirth: booking.placeOfBirth,
      timeOfBirth: booking.timeOfBirth,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    }));
  },

  /**
   * Get single booking by ID
   */
  getById: async (id: string): Promise<Booking> => {
    const response = await apiClient.get<ApiResponse<BookingApiResponse>>(
      `/bookings/${id}`
    );

    if (!response.data.ok || !response.data.data) {
      throw new Error(response.data.message || 'Booking not found');
    }

    const booking = response.data.data;
    return {
      id: booking._id,
      bookingId: booking.bookingId,
      userId: booking.userId,
      astrologerProfileId: booking.astrologerProfileId,
      astrologerName: booking.astrologerName,
      userName: booking.userName,
      userEmail: booking.userEmail,
      userPhone: booking.userPhone,
      bookingDate: booking.bookingDate,
      bookingTime: booking.bookingTime,
      consultationType: booking.consultationType,
      durationMinutes: booking.durationMinutes,
      amount: booking.amount,
      status: booking.status,
      problemStatement: booking.problemStatement,
      placeOfBirth: booking.placeOfBirth,
      timeOfBirth: booking.timeOfBirth,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    };
  },

  /**
   * Cancel booking
   */
  cancel: async (
    id: string,
    reason?: string
  ): Promise<{ ok: boolean; message: string }> => {
    const response = await apiClient.patch<ApiResponse>(
      `/bookings/${id}/cancel`,
      { reason }
    );

    if (!response.data.ok) {
      throw new Error(response.data.message || 'Failed to cancel booking');
    }

    return {
      ok: true,
      message: response.data.message || 'Booking cancelled successfully',
    };
  },

  /**
   * Reschedule booking
   */
  reschedule: async (id: string, payload: ReschedulePayload): Promise<Booking> => {
    const response = await apiClient.patch<ApiResponse<BookingApiResponse>>(
      `/bookings/${id}/reschedule`,
      payload
    );

    if (!response.data.ok || !response.data.data) {
      throw new Error(response.data.message || 'Failed to reschedule booking');
    }

    const booking = response.data.data;
    return {
      id: booking._id,
      bookingId: booking.bookingId,
      userId: booking.userId,
      astrologerProfileId: booking.astrologerProfileId,
      astrologerName: booking.astrologerName,
      userName: booking.userName,
      userEmail: booking.userEmail,
      userPhone: booking.userPhone,
      bookingDate: booking.bookingDate,
      bookingTime: booking.bookingTime,
      consultationType: booking.consultationType,
      durationMinutes: booking.durationMinutes,
      amount: booking.amount,
      status: booking.status,
      problemStatement: booking.problemStatement,
      placeOfBirth: booking.placeOfBirth,
      timeOfBirth: booking.timeOfBirth,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    };
  },
};
