import apiClient from './client';
import type { ApiResponse } from '../types';
import type { AstrologerApiResponse, AvailabilitySlot } from '../types/api';

/**
 * Extended astrologer response with user information
 * Used for list and detail endpoints
 */
export interface AstrologerWithUser extends AstrologerApiResponse {
  // Already includes user field from base type
}

/**
 * Astrologers API Client
 * All methods directly interface with backend astrologer endpoints
 * Type-safe with strict request/response contracts
 */
export const astrologersApi = {
  /**
   * List all verified astrologers
   * @returns Array of astrologer profiles with embedded user data
   */
  list: async (): Promise<AstrologerWithUser[]> => {
    const response = await apiClient.get<ApiResponse<AstrologerApiResponse[]>>(
      '/astrologers/list'
    );

    if (!response.data.ok || !response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch astrologers');
    }

    return response.data.data;
  },

  /**
   * Get single astrologer profile by ID
   * @param id Astrologer profile ID (MongoDB ObjectId)
   * @returns Complete astrologer profile with user details
   */
  getById: async (id: string): Promise<AstrologerWithUser> => {
    const response = await apiClient.get<ApiResponse<AstrologerApiResponse>>(
      `/astrologers/${id}`
    );

    if (!response.data.ok || !response.data.data) {
      throw new Error(response.data.message || 'Astrologer not found');
    }

    return response.data.data;
  },

  /**
   * Get astrologer availability schedule
   * @param id Astrologer profile ID
   * @returns Array of availability slots with day and time ranges
   */
  getAvailability: async (id: string): Promise<AvailabilitySlot[]> => {
    const response = await apiClient.get<ApiResponse<AvailabilitySlot[]>>(
      `/astrologers/${id}/availability`
    );
    console.log("Availability response:", response);

    if (!response.data.ok || !response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch availability');
    }

    return response.data.data;
  },

  /**
   * Update astrologer availability (astrologer only)
   * Requires appropriate authentication
   * @param id Astrologer profile ID
   * @param availability Array of availability slots
   * @returns Updated availability slots
   */
  updateAvailability: async (
    id: string,
    availability: AvailabilitySlot[]
  ): Promise<AvailabilitySlot[]> => {
    const response = await apiClient.patch<ApiResponse<AvailabilitySlot[]>>(
      `/astrologers/${id}/availability`,
      { availability }
    );

    if (!response.data.ok || !response.data.data) {
      throw new Error(response.data.message || 'Failed to update availability');
    }

    return response.data.data;
  },
};
