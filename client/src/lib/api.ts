import axios from 'axios';
import { toast } from 'sonner';

// Get API base URL from environment variable
// For development, fallback to localhost:4000
// For production, VITE_API_URL must be set in .env.production


// Create axios instance with base URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // Important for handling cookies
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest', // CSRF protection
  },
});

let lastSessionToastAt = 0;
let lastRateLimitToastAt = 0;

/**
 * Request Interceptor
 * No token injection needed - cookies are sent automatically via withCredentials
 * Backend reads JWT from HTTP-only cookies
 */
// Removed Authorization header logic - using secure HTTP-only cookies instead

/**
 * Response Interceptor
 * Handles errors globally:
 * - 401: Let route guards handle navigation
 * - 429: Rate-limit aware toast (throttled)
 * - 4xx/5xx: Show error toast
 */
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || '';
    const isVerifyRequest = requestUrl.includes('/auth/verify') || requestUrl.includes('/verify');

    // Handle 401 Unauthorized - token expired or invalid
    if (status === 401) {
      // Don't show toast for verify endpoint to avoid spam
      if (!isVerifyRequest && window.location.pathname !== '/login') {
        const now = Date.now();
        if (now - lastSessionToastAt > 5000) {
          toast.error('Session expired. Please login again.');
          lastSessionToastAt = now;
        }
      }
    } else if (status === 429) {
      const now = Date.now();
      if (now - lastRateLimitToastAt > 5000) {
        toast.error('Too many requests. Please wait a moment and try again.');
        lastRateLimitToastAt = now;
      }
    } else {
      // Extract message from both simple errors ({ ok: false, message })
      // and structured AppErrors ({ ok: false, error: { code, message } })
      const message =
        error.response?.data?.message ||
        error.response?.data?.error?.message ||
        'Something went wrong';
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default api;
