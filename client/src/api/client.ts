import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse } from '../types';
import { queryClient } from '@/lib/react-query';
import { queryKeys } from '@/lib/queryKeys';

// Get API base URL from environment variable
// For production and development, VITE_API_URL must be set in .env
const API_BASE_URL = import.meta.env.VITE_API_URL;

/**
 * Production-Grade API Client
 * 
 * Key Features:
 * - Cookie-based authentication (HttpOnly)
 * - No client-side token usage
 * - Graceful 401 handling via React Query state updates
 * - Automatic credentials attachment
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    // CSRF protection: required by backend csrfMiddleware
    'X-Requested-With': 'XMLHttpRequest',
  },
  withCredentials: true, // Critical: sends cookies with every request
});

/**
 * Request Interceptor
 * 
 * No Authorization header injection - cookies handle auth
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // No manual token handling - cookies are sent automatically
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * 
 * Handles 401 gracefully without recursive auth revalidation loops.
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse<any>>) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || '';

    if (status === 401) {
      const isVerifyRequest = requestUrl.includes('/auth/verify');

      // Keep UI auth state in sync without forcing /auth/verify to refetch itself.
      if (!isVerifyRequest) {
        queryClient.setQueryData(queryKeys.auth, null);
      }

      // DO NOT redirect here - let React Router handle it
    }

    return Promise.reject(error);
  }
);

export default apiClient;
