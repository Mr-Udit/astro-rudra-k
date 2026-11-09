import apiClient from './client';
import type { User } from '../types';
import type { AstrologerProfile } from '../types';

export interface FavoriteAstrologer {
  _id: string;
  name: string;
  title: string;
  profileImage?: string;
  experience: number;
  price: number;
  specializations: string[];
  isVerified: boolean;
  isActive: boolean;
}

export interface EarningsSummary {
  totalEarnings: number;
  totalConsultations: number;
}

export const profileApi = {
  /**
   * Fetch the authenticated user's profile from /profile/get
   */
  get: async (): Promise<User> => {
    const response = await apiClient.get<{ ok: boolean; user: User }>(
      '/profile/get'
    );

    if (!response.data.ok || !response.data.user) {
      throw new Error('Failed to load profile');
    }

    return response.data.user;
  },

  /**
   * Get user's favorite astrologers
   */
  getFavorites: async (): Promise<FavoriteAstrologer[]> => {
    const response = await apiClient.get<{ ok: boolean; favorites: FavoriteAstrologer[] }>(
      '/profile/favorites'
    );

    if (!response.data.ok) {
      throw new Error('Failed to load favorites');
    }

    return response.data.favorites || [];
  },

  /**
   * Add astrologer to favorites
   */
  addFavorite: async (astrologerId: string): Promise<{ ok: boolean; favorites: string[] }> => {
    const response = await apiClient.post<{ ok: boolean; favorites: string[] }>(
      `/profile/favorites/${astrologerId}`,
      {}
    );

    if (!response.data.ok) {
      throw new Error('Failed to add favorite');
    }

    return response.data;
  },

  /**
   * Remove astrologer from favorites
   */
  removeFavorite: async (astrologerId: string): Promise<{ ok: boolean; favorites: string[] }> => {
    const response = await apiClient.delete<{ ok: boolean; favorites: string[] }>(
      `/profile/favorites/${astrologerId}`
    );

    if (!response.data.ok) {
      throw new Error('Failed to remove favorite');
    }

    return response.data;
  },

  /**
   * Toggle astrologer as favorite (add or remove)
   */
  toggleFavorite: async (astrologerId: string): Promise<{ ok: boolean; isFavorite: boolean }> => {
    const response = await apiClient.post<{ ok: boolean; isFavorite: boolean }>(
      `/profile/favorites/${astrologerId}`
    );

    if (!response.data.ok) {
      throw new Error('Failed to toggle favorite');
    }

    return response.data;
  },

  /**
   * Get astrologer earnings summary
   */
  getEarningsSummary: async (): Promise<EarningsSummary> => {
    const response = await apiClient.get<{ ok: boolean; data: EarningsSummary }>(
      '/profile/earnings/summary'
    );

    if (!response.data.ok || !response.data.data) {
      throw new Error('Failed to load earnings summary');
    }

    return response.data.data;
  },
};