import { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Phone, Video, MessageSquare, Shield } from 'lucide-react';
import { useBookingStore } from '@/stores/booking.store';
import { useAuth } from '@/context/AuthContext';
import StepIndicator from '@/components/ui-custom/StepIndicator';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { DayPicker } from 'react-day-picker';
import { astrologersApi } from '@/api/astrologers';
import type { AvailabilitySlot } from '@/types/api';
import 'react-day-picker/dist/style.css';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

// Custom styles for calendar
const calendarStyles = `
  .rdp-cell.rdp-day_disabled {
    color: hsl(var(--muted-foreground)) !important;
    background-color: hsl(var(--background-elevated)) !important;
    opacity: 0.6;
    cursor: not-allowed !important;
  }
  
  .rdp-day_disabled {
    cursor: not-allowed !important;
    opacity: 0.5;
  }
  
  .rdp-day:not([disabled]):hover {
    background-color: hsl(var(--primary) / 0.2) !important;
  }
  
  .rdp:not([disabled]) .rdp-day_selected {
    background-color: hsl(var(--secondary)) !important;
    color: white !important;
    font-weight: bold;
  }
  
  .rdp-head_cell {
    color: hsl(var(--text-primary));
    font-weight: 500;
  }
`;

const consultationTypes = [
  {
    id: 'audio' as const,
    name: 'Audio Call',
    icon: Phone,
    duration: 30,
    description: 'Voice consultation with crystal clear audio',
    price: 599, // Base price
  },
  {
    id: 'video' as const,
    name: 'Video Call',
    icon: Video,
    duration: 45,
    description: 'Face-to-face consultation with video',
    price: 999,
  },
  {
    id: 'chat' as const,
    name: 'Chat',
    icon: MessageSquare,
    duration: 60,
    description: 'Text-based consultation with instant messaging',
    price: 399,
  },
];



const timeSlots = [
  '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
  '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM'
];

const steps = [
  { label: 'Consultation', description: 'Select type' },
  { label: 'Date & Time', description: 'Choose slot' },
  { label: 'Details', description: 'Your info' },
  { label: 'Payment', description: 'Complete' },
];

export default function BookingPage() {
  useDocumentTitle('Book Consultation');
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  // Zustand store selectors
  const selectedAstrologer = useBookingStore(state => state.selectedAstrologer);
  const consultationType = useBookingStore(state => state.consultationType);
  const setConsultationType = useBookingStore(state => state.setConsultationType);
  const selectedDate = useBookingStore(state => state.selectedDate);
  const selectedTime = useBookingStore(state => state.selectedTime);
  const setSelectedDate = useBookingStore(state => state.setSelectedDate);
  const setSelectedTime = useBookingStore(state => state.setSelectedTime);

  const [currentStep, setCurrentStep] = useState(1);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);

  // Inject calendar styles on component mount
  useEffect(() => {
    const styleId = 'booking-calendar-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = calendarStyles;
      document.head.appendChild(style);
    }
    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  // Fetch astrologer availability when component mounts or astrologer changes
  useEffect(() => {
    if (selectedAstrologer?.id) {
      setIsLoadingAvailability(true);
      astrologersApi
        .getAvailability(selectedAstrologer.id)
        .then(setAvailability)
        .catch((error) => {
          console.error('Failed to fetch availability:', error);
          toast.error('Could not load astrologer availability');
        })
        .finally(() => setIsLoadingAvailability(false));
    }
  }, [selectedAstrologer?.id]);

  // Helper function to check if a date is available
  const isDateAvailable = (date: Date): boolean => {
    if (availability.length === 0) return true; // If no availability set, all dates are available
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[date.getDay()];
    
    // Check if this day is in the availability list
    return availability.some(slot => slot.day === dayName);
  };

  // Compute disabled dates based on availability
  const disabledDates = useMemo(() => {
    if (availability.length === 0) {
      return [{ before: new Date() }]; // Only disable past dates
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Generate disabled dates for the next 180 days
    const disabled: Date[] = [];
    for (let i = 0; i < 180; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      
      if (!isDateAvailable(date)) {
        disabled.push(new Date(date));
      }
    }
    
    return [
      { before: new Date() },
      ...disabled.map(d => d)
    ];
  }, [availability]);

  // Redirect if no astrologer selected
  if (!selectedAstrologer) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-16 flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-serif text-2xl font-bold text-primary mb-4">
            No Astrologer Selected
          </h2>
          <p className="text-muted-foreground mb-6">
            Please select an astrologer first to proceed with booking.
          </p>
          <Link to="/astrologers">
            <Button className="btn-primary">Browse Astrologers</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleContinue = () => {
    if (currentStep === 1 && !consultationType) {
      toast.error('Please select a consultation type');
      return;
    }
    if (currentStep === 2 && (!selectedDate || !selectedTime)) {
      toast.error('Please select date and time');
      return;
    }
    if (currentStep === 2) {
      if (!isAuthenticated) {
        toast.info('Please login to continue');
        navigate('/login', { state: { from: location } });
        return;
      }
      navigate('/booking/details');
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  };

  const selectedType = consultationType;
  const totalPrice = selectedType?.price || 0;
  const platformFee = 50;
  const discount = 200;
  const finalTotal = totalPrice + platformFee - discount;

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/astrologers">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="font-serif text-2xl font-bold text-primary">
            Book Consultation
          </h1>
        </div>

        {/* Step Indicator */}
        <div className="mb-12">
          <StepIndicator steps={steps} currentStep={currentStep - 1} />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Step 1: Consultation Type */}
            {currentStep === 1 && (
              <div className="animate-fade-in">
                <h2 className="font-serif text-2xl font-bold text-primary mb-6">
                  Choose Consultation Type
                </h2>
                <div className="grid sm:grid-cols-3 gap-4">
                  {consultationTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setConsultationType(type)}
                      className={`p-6 rounded-2xl border-2 text-left transition-all duration-300 ${consultationType?.id === type.id
                        ? 'border-[hsl(var(--secondary))] bg-gradient-to-br from-primary/5 to-secondary/5'
                        : 'border-border bg-background-card hover:border-[hsl(var(--secondary))]/50'
                        }`}
                    >
                      <type.icon
                        className={`w-10 h-10 mb-4 ${consultationType?.id === type.id
                          ? 'text-primary'
                          : 'text-muted-foreground'
                          }`}
                      />
                      <h3 className="font-semibold text-primary mb-1">
                        {type.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {type.duration} minutes
                      </p>
                      <p className="text-xs text-muted-foreground">{type.description}</p>
                      <p className="text-sm font-medium mt-2 text-primary">
                        ₹{type.price}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Date & Time */}
            {currentStep === 2 && (
              <div className="animate-fade-in space-y-8">
                {/* Date Selection */}
                <div>
                  <h2 className="font-serif text-2xl font-bold text-primary mb-6">
                    Select Date
                  </h2>
                  {isLoadingAvailability && (
                    <p className="text-muted-foreground mb-4">Loading availability...</p>
                  )}
                  <div className="bg-background-card p-4 rounded-2xl border-2 border-border shadow-sm inline-block">
                    <DayPicker
                      mode="single"
                      selected={selectedDate || undefined}
                      onSelect={(day) => day && setSelectedDate(day)}
                      disabled={disabledDates}
                      modifiersClassNames={{
                        selected: 'bg-[hsl(var(--secondary))] text-white hover:bg-[hsl(var(--primary))] rounded-xl',
                        today: 'text-primary font-bold',
                        disabled: 'text-muted-foreground opacity-50 cursor-not-allowed',
                      }}
                      modifiersStyles={{
                        disabled: {
                          color: 'hsl(var(--muted-foreground))',
                          backgroundColor: 'hsl(var(--background-elevated))',
                          cursor: 'not-allowed',
                        },
                      }}
                      className="border-0"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">
                    Only dates when the astrologer is available are enabled.
                  </p>
                </div>

                {/* Time Selection */}
                <div>
                  <h2 className="font-serif text-2xl font-bold text-primary mb-6">
                    Choose Time Slot
                  </h2>
                  <div className="grid grid-cols-4 gap-3">
                    {timeSlots.map((time) => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 ${selectedTime === time
                          ? 'bg-gradient-to-br from-primary to-secondary text-white'
                          : 'bg-background-card border-2 border-border hover:border-[hsl(var(--secondary))] text-primary'
                          }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Booking Summary */}
          <div className="lg:col-span-1">
            <div className="bg-background-card rounded-2xl p-6 shadow-lg shadow-[hsl(var(--primary))]/5 sticky top-24">
              <h3 className="font-serif text-xl font-bold text-primary mb-6">
                Booking Summary
              </h3>

              {/* Astrologer Info */}
              <div className="flex items-center gap-4 pb-6 mb-6 border-b border-border">
                <img
                  src={selectedAstrologer.image}
                  alt={selectedAstrologer.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-accent"
                />
                <div>
                  <h4 className="font-semibold text-primary">
                    {selectedAstrologer.name}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedAstrologer.title}
                  </p>
                </div>
              </div>

              {/* Discount Banner */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                <p className="text-green-700 text-sm font-medium text-center">
                  🎉 First consultation? Get 20% OFF!
                </p>
              </div>

              {/* Booking Details */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Consultation Type:</span>
                  <span className="font-medium text-primary">
                    {selectedType?.name || 'Not selected'}
                  </span>
                </div>
                {selectedDate && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Date:</span>
                    <span className="font-medium text-primary">
                      {new Date(selectedDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                )}
                {selectedTime && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Time:</span>
                    <span className="font-medium text-primary">
                      {selectedTime}
                    </span>
                  </div>
                )}
                {selectedType && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="font-medium text-primary">
                      {selectedType.duration} minutes
                    </span>
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="border-t border-border pt-4 mb-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Consultation Fee</span>
                  <span>₹{totalPrice}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Platform Fee</span>
                  <span>₹{platformFee}</span>
                </div>
                <div className="flex justify-between text-sm text-success">
                  <span>First Time Discount (20%)</span>
                  <span>-₹{discount}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-primary pt-2 border-t border-border">
                  <span>Total Amount</span>
                  <span>₹{finalTotal}</span>
                </div>
              </div>

              {/* Continue Button */}
              <Button
                onClick={handleContinue}
                className="w-full btn-primary mb-4"
                disabled={currentStep === 1 && !consultationType}
              >
                {currentStep === 2 ? 'Continue to Details' : 'Continue'}
              </Button>

              {/* Secure Payment */}
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4" />
                <span>Secure payment powered by Razorpay</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
