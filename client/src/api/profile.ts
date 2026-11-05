import apiClient from './client';
import type { User } from '../types';

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
};
