import { QueryClient, type DefaultOptions } from '@tanstack/react-query';
import { toast } from 'sonner';

/**
 * Global React Query Configuration
 * 
 * Production-optimized defaults:
 * - No aggressive refetching
 * - Controlled retry behavior
 * - Global error handling
 */

const queryConfig: DefaultOptions = {
    queries: {
        // Auth queries must be fresh, others can be stale for performance
        staleTime: 5 * 60 * 1000, // 5 minutes default

        // Disable background refetching to prevent noise
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: false,

        // Conservative retry for non-auth queries
        retry: 1,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },

    mutations: {
        // Global mutation error handler
        onError: (error: any) => {
            const message =
                error?.response?.data?.message ||
                error?.message ||
                'Operation failed. Please try again.';
            toast.error(message);
        },
    },
};

export const queryClient = new QueryClient({
    defaultOptions: queryConfig,
});

/**
 * Override staleTime for specific query keys
 */
export const authQueryConfig = {
    staleTime: 5 * 60 * 1000, // 5 minutes - balance between freshness and performance
    retry: false, // No retry on auth failures
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
};
