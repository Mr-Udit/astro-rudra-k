import { createContext } from 'react';
import type { Astrologer, ConsultationType, BookingStep } from '@/types';

interface UserDetails {
  name: string;
  gender: string;
  date: string;
  time: string;
  place: string;
  phone: string;
  problem?: string;
}

interface BookingContextType {
  selectedAstrologer: Astrologer | null;
  consultationType: ConsultationType | null;
  selectedDate: Date | null;
  selectedTime: string | null;
  userDetails: UserDetails | null;
  bookingStep: BookingStep;

  setSelectedAstrologer: (astrologer: Astrologer | null) => void;
  setConsultationType: (type: ConsultationType | null) => void;
  setSelectedDate: (date: Date | null) => void;
  setSelectedTime: (time: string | null) => void;
  setUserDetails: (details: UserDetails | null) => void;
  setBookingStep: (step: BookingStep) => void;

  calculateTotal: () => number;
  createBooking: () => Promise<string | null>;
  updateBookingStatus: (bookingId: string, status: string) => Promise<boolean>;
  resetBooking: () => void;
  isLoading: boolean;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export { BookingContext };
export type { BookingContextType, UserDetails };