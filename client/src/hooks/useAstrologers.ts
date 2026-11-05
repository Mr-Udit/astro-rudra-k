import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { Astrologer } from '@/types';
import type { AstrologerApiResponse } from '@/types/api';

export function useAstrologers() {
    const astrologersQuery = useQuery({
        queryKey: queryKeys.astrologers.all,
        queryFn: async () => {
            const { data } = await api.get('/astrologers/list');
            if (data.ok && Array.isArray(data.data)) {
                return data.data.map((item: AstrologerApiResponse): Astrologer => {
                    // BACKEND → FRONTEND TYPE MAPPING
                    // Use properties returned by the new list API
                    return {
                        id: item._id,
                        name: item.name || 'Astrologer',
                        title: item.title || item.specializations?.[0] || '',
                        image: item.profileImage || import.meta.env.VITE_DEFAULT_PROFILE_IMAGE_URL,
                        experience: item.experience || 0,
                        consultations: 500, // Default: placeholder, would need aggregation
                        accuracy: 95, // Default: placeholder metric
                        price: item.price || 500,
                        specializations: item.specializations || [],
                        languages: item.languages || [],
                        status: item.isVerified ? 'online' : 'offline',
                        about: item.bio || item.experienceSummary || 'Experienced astrologer.',
                        availability: item.availability || []
                    };
                });
            }
            return [];
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    const specializationsQuery = useQuery({
        queryKey: queryKeys.astrologers.specializations,
        queryFn: async () => {
            const { data } = await api.get('/astrologers/specializations');
            if (data.ok && Array.isArray(data.data)) {
                return ['All', ...data.data];
            }
            return ['All'];
        },
        staleTime: 60 * 60 * 1000, // 1 hour
    });

    return {
        astrologers: astrologersQuery.data || [],
        specializations: specializationsQuery.data || ['All'],
        isLoading: astrologersQuery.isLoading || specializationsQuery.isLoading,
        isError: astrologersQuery.isError || specializationsQuery.isError,
        error: astrologersQuery.error || specializationsQuery.error,
        refetch: astrologersQuery.refetch,
    };
}
