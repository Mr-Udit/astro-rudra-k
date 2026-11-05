import apiClient from './client';
import type { AuthResponse, LoginCredentials, User } from '../types';

export const authApi = {
  // Request OTP or verify OTP for login
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  // Verify current session
  verifySession: async (): Promise<{ ok: boolean; user: User }> => {
    const response = await apiClient.get<{ ok: boolean; user: User }>('/auth/verify');
    return response.data;
  },

  // Logout user
  logout: async (): Promise<{ ok: boolean; message: string }> => {
    const response = await apiClient.post<{ ok: boolean; message: string }>('/auth/logout');
    return response.data;
  },
};
