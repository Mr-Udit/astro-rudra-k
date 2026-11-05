import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { getErrorMessage } from '@/lib/bookingErrors';
import type { Astrologer, ConsultationType } from '@/types';
import type { UserDetails } from '@/stores/booking.store';

/**
 * Booking Mutations (React Query)
 * 
 * Server-side booking operations.
 * These are separate from UI state and managed by React Query.
 */

interface CreateBookingPayload {
    astrologer: Astrologer;
    consultationType: ConsultationType;
    date: Date;
    time: string;
    userDetails: UserDetails;
}

export function useCreateBooking() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: CreateBookingPayload) => {
            const { astrologer, consultationType, date, time, userDetails } = payload;

            // Format data for backend
            const formattedDate = date.toISOString().split('T')[0];
            const consultationTypeMap: Record<string, string> = {
                audio: 'voice_call',
                video: 'video_call',
                chat: 'chat',
            };

            const convertTo24Hour = (timeStr: string) => {
                const [time, period] = timeStr.split(' ');
                if (!period) return timeStr; // Already 24h or invalid
                let [hours, minutes] = time.split(':');
                let hoursInt = parseInt(hours);
                if (period === 'PM' && hoursInt !== 12) hoursInt += 12;
                if (period === 'AM' && hoursInt === 12) hoursInt = 0;
                return `${hoursInt.toString().padStart(2, '0')}:${minutes}`;
            };

            const backendPayload = {
                // Note: bookingId is generated server-side; do NOT send from client
                astrologerProfileId: astrologer.id,
                bookingDate: formattedDate,
                bookingTime: convertTo24Hour(time),
                consultationType: consultationTypeMap[consultationType.id] || 'chat',
                problemStatement: userDetails.problem,
                placeOfBirth: userDetails.place,
                timeOfBirth: userDetails.time,
            };

            const { data } = await api.post('/bookings/create', backendPayload);

            if (!data.ok) {
                throw new Error(data.message || data.error?.message || 'Failed to create booking');
            }

            // Verify response has expected structure
            // Backend create endpoint returns data.data with `id` (already mapped from _id)
            if (!data.data) {
                throw new Error('Invalid booking response structure');
            }

            return data.data;
        },
        onSuccess: (booking) => {
            toast.success('Booking created successfully!');
            // Invalidate bookings list to refetch
            queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
        },
        onError: (error: any) => {
            // Try to extract error code and message from backend error response
            const errorCode = error.response?.data?.error?.code || 'UNKNOWN_ERROR';
            const backendMessage = error.response?.data?.error?.message;

            // Get user-friendly message based on error code
            const userMessage = getErrorMessage(errorCode);

            // Show toast with appropriate message
            if (backendMessage && backendMessage !== userMessage) {
                // If backend has more specific message, use it for user feedback
            }

            toast.error(userMessage);
        },
    });
}

export function useUpdateBookingStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ bookingId, status }: { bookingId: string; status: string }) => {
            const { data } = await api.patch(`/bookings/${bookingId}/status`, { status });

            if (!data.ok) {
                throw new Error(data.message || 'Failed to update booking status');
            }

            return data.data;
        },
        onSuccess: (booking, variables) => {
            toast.success(`Booking ${variables.status}`);
            // Invalidate specific booking and list
            queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(variables.bookingId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
        },
        onError: (error: any) => {
            const errorCode = error.response?.data?.error?.code || 'UNKNOWN_ERROR';
            const userMessage = getErrorMessage(errorCode);

            toast.error(userMessage);
        },
    });
}
