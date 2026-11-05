import apiClient from './client';

export interface FeaturedTestimonial {
  id: string;
  text: string;
  name: string;
  role: string;
  rating: number;
  date: string;
}

export interface CreateReviewPayload {
  astrologerId: string;
  bookingId: string;
  rating: number;
  comment?: string;
}

export const testimonialsApi = {
  async getFeatured(): Promise<FeaturedTestimonial[]> {
    const response = await apiClient.get<{ ok: boolean; data?: FeaturedTestimonial[]; message?: string }>(
      '/astrologers/featured-testimonials'
    );

    if (!response.data.ok || !response.data.data) {
      return [];
    }

    return response.data.data;
  },

  async createReview(payload: CreateReviewPayload): Promise<void> {
    const { astrologerId, bookingId, rating, comment } = payload;
    const response = await apiClient.post<{ ok: boolean; message?: string }>(
      `/astrologers/${astrologerId}/reviews`,
      {
        bookingId,
        rating,
        comment,
      }
    );

    if (!response.data.ok) {
      throw new Error(response.data.message || 'Failed to submit review');
    }
  },
};
