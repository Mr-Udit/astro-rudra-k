/**
 * Centralized Query Key Factory
 * 
 * All React Query keys must be defined here to ensure:
 * - Type safety
 * - Consistent invalidation
 * - No key collisions
 */

export const queryKeys = {
    // Auth queries
    auth: ['me'] as const,

    // Astrologer queries
    astrologers: {
        all: ['astrologers'] as const,
        detail: (id: string) => ['astrologers', id] as const,
        specializations: ['astrologers', 'specializations'] as const,
    },

    // Booking queries
    bookings: {
        all: ['bookings'] as const,
        detail: (id: string) => ['bookings', id] as const,
        user: (userId: string) => ['bookings', 'user', userId] as const,
    },

    // Profile queries
    profile: {
        current: ['profile', 'current'] as const,
        kundli: ['profile', 'kundli'] as const,
    },
} as const;
