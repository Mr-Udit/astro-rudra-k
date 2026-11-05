import { create } from 'zustand';
import type { Astrologer, ConsultationType, BookingStep } from '@/types';

/**
 * Booking UI State Store (Zustand)
 * 
 * Purpose: Ephemeral UI state for the booking flow.
 * This state is NOT persisted and resets on:
 * - Page refresh
 * - Navigation away from booking
 * - Booking completion
 * - Logout
 * 
 * DO NOT store server data here - use React Query for that.
 */

export interface UserDetails {
    name: string;
    gender: string;
    date: string;
    time: string;
    place: string;
    phone: string;
    problem?: string;
}

interface BookingStore {
    // UI State
    selectedAstrologer: Astrologer | null;
    consultationType: ConsultationType | null;
    selectedDate: Date | null;
    selectedTime: string | null;
    userDetails: UserDetails | null;
    bookingStep: BookingStep;

    // Actions
    setSelectedAstrologer: (astrologer: Astrologer | null) => void;
    setConsultationType: (type: ConsultationType | null) => void;
    setSelectedDate: (date: Date | null) => void;
    setSelectedTime: (time: string | null) => void;
    setUserDetails: (details: UserDetails | null) => void;
    setBookingStep: (step: BookingStep) => void;

    // Helpers
    calculateTotal: () => number;
    resetBooking: () => void;
}

export const useBookingStore = create<BookingStore>((set, get) => ({
    // Initial state
    selectedAstrologer: null,
    consultationType: null,
    selectedDate: null,
    selectedTime: null,
    userDetails: null,
    bookingStep: 'astrologer',

    // Setters
    setSelectedAstrologer: (astrologer) => set({ selectedAstrologer: astrologer }),
    setConsultationType: (type) => set({ consultationType: type }),
    setSelectedDate: (date) => set({ selectedDate: date }),
    setSelectedTime: (time) => set({ selectedTime: time }),
    setUserDetails: (details) => set({ userDetails: details }),
    setBookingStep: (step) => set({ bookingStep: step }),

    // Calculate total based on selected astrologer and consultation type
    calculateTotal: () => {
        const { selectedAstrologer, consultationType } = get();
        if (!selectedAstrologer || !consultationType) return 0;

        let total = selectedAstrologer.price;

        // Adjust based on consultation type
        if (consultationType.id === 'video') total += 100;
        if (consultationType.id === 'chat') total = Math.max(0, total - 100);

        return total;
    },

    // Reset all booking state
    resetBooking: () => set({
        selectedAstrologer: null,
        consultationType: null,
        selectedDate: null,
        selectedTime: null,
        userDetails: null,
        bookingStep: 'astrologer',
    }),
}));
