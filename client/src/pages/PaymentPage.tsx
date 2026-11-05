import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Shield, Check } from "lucide-react";

import { useBookingStore } from "@/stores/booking.store";
import {
  useCreateBooking,
  useUpdateBookingStatus,
} from "@/hooks/useBookingMutations";

import StepIndicator from "@/components/ui-custom/StepIndicator";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import PaymentButton from "@/components/ui-custom/PymentButton";
import { bookingsApi } from "@/api/bookings";

export default function PaymentPage() {
  useDocumentTitle("Payment");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const existingBookingIdFromQuery = searchParams.get("bookingId");

  const selectedAstrologer = useBookingStore((s) => s.selectedAstrologer);
  const consultationType = useBookingStore((s) => s.consultationType);
  const selectedDate = useBookingStore((s) => s.selectedDate);
  const selectedTime = useBookingStore((s) => s.selectedTime);
  const userDetails = useBookingStore((s) => s.userDetails);
  const resetBooking = useBookingStore((s) => s.resetBooking);
  const calculateTotal = useBookingStore((s) => s.calculateTotal);

  const createBookingMutation = useCreateBooking();
  const updateStatusMutation = useUpdateBookingStatus();

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [bookingRecord, setBookingRecord] = useState<any | null>(null);
  const [isLoadingExistingBooking, setIsLoadingExistingBooking] = useState(
    false,
  );

  const hasExistingBookingFromUrl = Boolean(existingBookingIdFromQuery);

  // If user comes from dashboard with an existing pending booking,
  // fetch it and hydrate local state so we can start payment.
  if (hasExistingBookingFromUrl && !bookingRecord && !isLoadingExistingBooking) {
    setIsLoadingExistingBooking(true);
    bookingsApi
      .getById(existingBookingIdFromQuery as string)
      .then((booking) => {
        if (booking.status !== "pending") {
          toast.error("This booking is not available for payment.");
          navigate(-1);
          return;
        }
        setBookingRecord(booking);
      })
      .catch(() => {
        toast.error("Failed to load booking details.");
        navigate(-1);
      })
      .finally(() => {
        setIsLoadingExistingBooking(false);
      });
  }

  if (hasExistingBookingFromUrl && isLoadingExistingBooking) {
    return (
      <div className="min-h-screen bg-[#FAF8F3] pt-24 pb-16 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Loading Booking</h2>
        </div>
      </div>
    );
  }

  if (
    !hasExistingBookingFromUrl &&
    (!selectedAstrologer ||
      !consultationType ||
      !selectedDate ||
      !selectedTime ||
      !userDetails)
  ) {
    return (
      <div className="min-h-screen bg-[#FAF8F3] pt-24 pb-16 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Incomplete Booking</h2>
          <Link to="/booking">
            <Button>Go Back</Button>
          </Link>
        </div>
      </div>
    );
  }

  const consultationTypes = {
    audio: { name: "Audio Call", duration: 30 },
    video: { name: "Video Call", duration: 45 },
    chat: { name: "Chat", duration: 60 },
  };

  const selectedType =
    consultationType &&
    consultationTypes[consultationType.id as keyof typeof consultationTypes]
      ? consultationTypes[
          consultationType.id as keyof typeof consultationTypes
        ]
      : consultationTypes.audio;

  const estimatedTotal = calculateTotal();
  const payableAmount =
    bookingRecord?.amount ?? bookingRecord?.price ?? estimatedTotal;

  const ensureBooking = async () => {
    if (bookingRecord?.id) return bookingRecord.id;

    if (
      !selectedAstrologer ||
      !consultationType ||
      !selectedDate ||
      !selectedTime ||
      !userDetails
    ) {
      throw new Error("Missing booking details");
    }

    setIsProcessing(true);
    const booking = await createBookingMutation.mutateAsync({
      astrologer: selectedAstrologer,
      consultationType,
      date: selectedDate,
      time: selectedTime,
      userDetails,
    });

    if (!booking?.id) {
      setIsProcessing(false);
      throw new Error("Booking creation failed");
    }

    setBookingRecord(booking);
    setIsProcessing(false);
    return booking.id;
  };

  const handleVerified = async () => {
    try {
      const bookingId = bookingRecord?.id || (await ensureBooking());

      await updateStatusMutation.mutateAsync({
        bookingId,
        status: "confirmed",
      });

      setIsSuccess(true);
      toast.success("Payment successful!");

      setTimeout(() => {
        resetBooking();
        navigate("/");
      }, 1500);
    } catch (err) {
      toast.error("Failed to update booking after payment");
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#FAF8F3] flex items-center justify-center">
        <div className="bg-white rounded-3xl p-10 shadow-xl text-center">
          <Check className="w-14 h-14 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-3">Payment Successful</h2>
          <p className="mb-4">
            Your consultation with
            {" "}
            {bookingRecord?.astrologerName ||
              selectedAstrologer?.name ||
              "your astrologer"}
            {" "}
            is confirmed.
          </p>

          <div className="bg-gray-100 p-3 rounded-lg mb-4">
            Booking Ref: {bookingRecord?.bookingId || bookingRecord?.id}
          </div>

          <Link to="/">
            <Button className="w-full">Return Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F3] pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/booking/details">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Confirm & Pay</h1>
        </div>

        <StepIndicator
          steps={[
            { label: "Consultation", description: "Select type" },
            { label: "Date & Time", description: "Choose slot" },
            { label: "Details", description: "Your info" },
            { label: "Payment", description: "Complete" },
          ]}
          currentStep={3}
          completedSteps={[0, 1, 2]}
        />

        <div className="bg-white rounded-2xl p-8 shadow-lg mt-8">
          <h2 className="text-xl font-bold mb-6">Booking Summary</h2>

          <div className="flex items-center gap-4 mb-6">
            {selectedAstrologer?.image ? (
              <img
                src={selectedAstrologer.image}
                className="w-16 h-16 rounded-full"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-200" />
            )}
            <div>
              <h4 className="font-semibold">
                {bookingRecord?.astrologerName || selectedAstrologer?.name}
              </h4>
              {selectedAstrologer?.title && (
                <p className="text-sm">{selectedAstrologer.title}</p>
              )}
            </div>
          </div>

          <div className="space-y-2 mb-6">
            <div className="flex justify-between">
              <span>Consultation</span>
              <span>
                {bookingRecord?.consultationType === "voice_call" &&
                  "Audio Call"}
                {bookingRecord?.consultationType === "video_call" &&
                  "Video Call"}
                {bookingRecord?.consultationType === "chat" && "Chat"}
                {!bookingRecord?.consultationType && selectedType.name}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Date</span>
              <span>
                {new Date(
                  bookingRecord?.bookingDate || selectedDate,
                ).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Time</span>
              <span>{bookingRecord?.bookingTime || selectedTime}</span>
            </div>

            <div className="flex justify-between">
              <span>Duration</span>
              <span>
                {bookingRecord?.durationMinutes || selectedType.duration} min
              </span>
            </div>
          </div>

          <div className="border-t pt-4 space-y-2 mb-6">
            <div className="flex justify-between">
              <span>Consultation Fee</span>
              <span>₹{payableAmount}</span>
            </div>

            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total</span>
              <span>₹{payableAmount}</span>
            </div>
          </div>

          <PaymentButton
            bookingId={bookingRecord?.id}
            getBookingId={ensureBooking}
            amount={payableAmount}
            customer={{
              name:
                userDetails?.name ||
                bookingRecord?.userName ||
                "",
              email:
                (userDetails as any)?.email ||
                bookingRecord?.userEmail ||
                "",
              contact:
                userDetails?.phone ||
                bookingRecord?.userPhone ||
                "",
            }}
            onPaymentVerified={handleVerified}
            disabled={isProcessing || createBookingMutation.isPending}
            label="Pay Now"
          />

          <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-500">
            <Shield className="w-4 h-4" />
            Secure payment powered by Razorpay
          </div>
        </div>
      </div>
    </div>
  );
}
