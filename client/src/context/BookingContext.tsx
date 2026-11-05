
import { useContext, useState } from 'react';
import type { Astrologer, ConsultationType, BookingStep } from '@/types';
import api from '@/lib/api';
import { toast } from 'sonner';
import { BookingContext, type UserDetails } from './booking.context';

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [selectedAstrologer, setSelectedAstrologer] = useState<Astrologer | null>(null);
  const [consultationType, setConsultationType] = useState<ConsultationType | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [bookingStep, setBookingStep] = useState<BookingStep>('astrologer');
  const [isLoading, setIsLoading] = useState(false);

  const calculateTotal = () => {
    if (!selectedAstrologer || !consultationType) return 0;

    // Base price from astrologer
    let total = selectedAstrologer.price;

    // Adjust based on type if needed (e.g. video might be more expensive)
    // For now, assuming price is flat or handled by backend logic, but UI might want to show diff
    if (consultationType.id === 'video') total += 100;
    if (consultationType.id === 'chat') total = Math.max(0, total - 100);

    return total;
  };

  const createBooking = async (): Promise<string | null> => {
    if (!selectedAstrologer || !selectedDate || !selectedTime || !userDetails || !consultationType) {
      toast.error("Missing booking details");
      return null;
    }

    setIsLoading(true);
    try {
      // Format date as YYYY-MM-DD for backend
      const formattedDate = selectedDate.toISOString().split('T')[0];

      // Construct backend payload
      const payload = {
        astrologerProfileId: selectedAstrologer.id,
        bookingDate: formattedDate,
        bookingTime: selectedTime,
        consultationType: consultationType.id === 'audio' ? 'voice_call' : consultationType.id === 'video' ? 'video_call' : 'chat',
        problemStatement: userDetails.problem,
        placeOfBirth: userDetails.place,
        timeOfBirth: userDetails.time,
        // Backend handles duration and amount
      };

      const { data } = await api.post('/bookings/create', payload);

      if (data.ok) {
        toast.success('Booking created successfully!');
        // Backend response: { ok: true, message, data: { id, bookingId, ... } }
        // The booking is inside data.data, NOT data.booking
        return data.data?.id || data.data?.bookingId || 'success';
      } else {
        // Backend returned ok: false
        const errorMessage = data.message || data.error?.message || 'Failed to create booking';
        toast.error(errorMessage);
        return null;
      }
    } catch (error: any) {
      // Handle axios errors (4xx, 5xx responses)
      const errorMessage =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        'Something went wrong while creating booking';

      // Don't crash UI, just show error message
      console.error('[BookingContext] Error creating booking:', error);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, status: string): Promise<boolean> => {
    try {
      const { data } = await api.patch(`/bookings/${bookingId}/status`, { status });
      return data.ok;
    } catch (error) {
      console.error('Failed to update booking status', error);
      return false;
    }
  };

  const resetBooking = () => {
    setSelectedAstrologer(null);
    setConsultationType(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setUserDetails(null);
    setBookingStep('astrologer');
  };

  return (
    <BookingContext.Provider value={{
      selectedAstrologer,
      consultationType,
      selectedDate,
      selectedTime,
      userDetails,
      bookingStep,
      setSelectedAstrologer,
      setConsultationType,
      setSelectedDate,
      setSelectedTime,
      setUserDetails,
      setBookingStep,
      calculateTotal,
      createBooking,
      updateBookingStatus,
      resetBooking,
      isLoading
    }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
}
