import apiClient from './client';
import type { ApiResponse } from '../types';

export interface ContactPayload {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

/**
 * Contact form API Client
 */
export const contactApi = {
  /**
   * Submit a contact form message via Nodemailer
   */
  submit: async (payload: ContactPayload): Promise<{ ok: boolean; message: string }> => {
    const response = await apiClient.post<ApiResponse>(
      '/contact',
      payload
    );

    if (!response.data.ok) {
      throw new Error(response.data.message || 'Failed to send message');
    }

    return response.data;
  },
};
