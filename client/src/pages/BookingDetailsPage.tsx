import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Shield,
} from "lucide-react";

import { useBookingStore } from "@/stores/booking.store";
import { useAuth } from "@/context/AuthContext";

import StepIndicator from "@/components/ui-custom/StepIndicator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { toast } from "sonner";
import { useCreateBooking } from "@/hooks/useBookingMutations";
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export default function BookingDetailsPage() {
  useDocumentTitle('Booking Details');
  const navigate = useNavigate();
  const createBookingMutation = useCreateBooking();

  const selectedAstrologer = useBookingStore(
    (state) => state.selectedAstrologer,
  );
  const consultationType = useBookingStore((state) => state.consultationType);
  const selectedDate = useBookingStore((state) => state.selectedDate);
  const selectedTime = useBookingStore((state) => state.selectedTime);
  const userDetails = useBookingStore((state) => state.userDetails);
  const setUserDetails = useBookingStore((state) => state.setUserDetails);
  const resetBooking = useBookingStore(state => state.resetBooking);

  const { user } = useAuth();

  const [formData, setFormData] = useState({
    name: userDetails?.name || user?.fullName || "",
    gender: userDetails?.gender || "",
    dateOfBirth: userDetails?.date || "",
    timeOfBirth: userDetails?.time || "",
    placeOfBirth: userDetails?.place || "",
    phone: userDetails?.phone || user?.phoneNumber || "",
    problem: userDetails?.problem || "",
  });

  const [isLoading, setIsLoading] = useState(false);

  if (
    !selectedAstrologer ||
    !consultationType ||
    !selectedDate ||
    !selectedTime
  ) {
    return (
      <div className="min-h-screen bg-[#FAF8F3] pt-24 pb-16 flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-serif text-2xl font-bold text-[#2D1B69] mb-4">
            Incomplete Booking
          </h2>
          <p className="text-[#6B6B80] mb-6">
            Please complete the previous steps to proceed.
          </p>
          <Link to="/booking">
            <Button className="btn-primary">Go Back</Button>
          </Link>
        </div>
      </div>
    );
  }

  const steps = [
    { label: "Consultation", description: "Select type" },
    { label: "Date & Time", description: "Choose slot" },
    { label: "Details", description: "Your info" },
    { label: "Payment", description: "Complete" },
  ];

  const consultationTypes = {
    audio: { name: "Audio Call", duration: 30 },
    video: { name: "Video Call", duration: 45 },
    chat: { name: "Chat", duration: 60 },
  };

  const selectedType =
    consultationTypes[consultationType.id as keyof typeof consultationTypes] ||
    consultationTypes.audio;

  const totalPrice =
    selectedAstrologer.price +
    (consultationType.id === "video"
      ? 100
      : consultationType.id === "chat"
        ? -100
        : 0);

  const platformFee = 50;
  const discount = 200;
  const finalTotal = Math.max(0, totalPrice + platformFee - discount);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (
      !formData.name ||
      !formData.phone ||
      !formData.placeOfBirth ||
      !formData.timeOfBirth ||
      !formData.dateOfBirth
    ) {
      toast.error("Please fill in all required fields");
      return false;
    }
    return true;
  };

  const handlePayNow = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setUserDetails({
      name: formData.name,
      gender: formData.gender,
      date: formData.dateOfBirth,
      time: formData.timeOfBirth,
      place: formData.placeOfBirth,
      phone: formData.phone,
      problem: formData.problem,
    });

    toast.success("Details saved successfully!");
    navigate("/booking/payment");
  };

  const handlePayLater = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      console.log({
        astrologer: selectedAstrologer,
        consultationType,
        date: selectedDate,
        time: selectedTime,
        userDetails: {
          name: formData.name,
          gender: formData.gender,
          date: formData.dateOfBirth,
          time: formData.timeOfBirth,
          place: formData.placeOfBirth,
          phone: formData.phone,
          problem: formData.problem,
        },
      });

      const booking = await createBookingMutation.mutateAsync({
        astrologer: selectedAstrologer,
        consultationType,
        date: selectedDate,
        time: selectedTime,
        userDetails: {
          name: formData.name,
          gender: formData.gender,
          date: formData.dateOfBirth,
          time: formData.timeOfBirth,
          place: formData.placeOfBirth,
          phone: formData.phone,
          problem: formData.problem,
        },
      });

      if (!booking?.id) {
        throw new Error("Failed to create booking");
      }

      toast.success("Booking created successfully!");
      // Reset booking after delay and redirect
        setTimeout(() => {
          resetBooking();
          navigate('/');
        }, 3000);
      navigate("/");
    } catch (error) {
      toast.error("Failed to create booking");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3] pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/booking">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="font-serif text-2xl font-bold text-[#2D1B69]">
            Enter Your Details
          </h1>
        </div>

        {/* Step indicator */}
        <div className="mb-12">
          <StepIndicator
            steps={steps}
            currentStep={2}
            completedSteps={[0, 1]}
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <form
              onSubmit={handlePayNow}
              className="bg-white rounded-2xl p-8 shadow-lg shadow-[#2D1B69]/5"
            >
              <h2 className="font-serif text-2xl font-bold text-[#2D1B69] mb-6">
                Personal Information
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B6B80]" />
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="pl-12 py-6"
                      required
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B6B80]" />
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="pl-12 py-6"
                      required
                    />
                  </div>
                </div>

                {/* DOB */}
                <div className="space-y-2">
                  <Label>Date of Birth *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B6B80]" />
                    <Input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      className="pl-12 py-6"
                      required
                    />
                  </div>
                </div>

                {/* TOB */}
                <div className="space-y-2">
                  <Label>Time of Birth *</Label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B6B80]" />
                    <Input
                      type="time"
                      name="timeOfBirth"
                      value={formData.timeOfBirth}
                      onChange={handleInputChange}
                      className="pl-12 py-6"
                      required
                    />
                  </div>
                </div>

                {/* Place */}
                <div className="space-y-2 md:col-span-2">
                  <Label>Place of Birth *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B6B80]" />
                    <Input
                      name="placeOfBirth"
                      value={formData.placeOfBirth}
                      onChange={handleInputChange}
                      className="pl-12 py-6"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Pay Now */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary mt-8 py-6"
              >
                Pay now and complete booking
              </Button>

              {/* Pay Later */}
              <Button
                type="button"
                onClick={handlePayLater}
                disabled={isLoading}
                className="w-full btn-primary mt-4 py-6"
              >
                Pay Later
              </Button>
            </form>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-2xl p-6 shadow-lg sticky top-24 h-fit">
            <h3 className="font-serif text-xl font-bold mb-6">
              Booking Summary
            </h3>

            <div className="flex items-center gap-4 pb-6 mb-6 border-b">
              <img
                src={selectedAstrologer.image}
                className="w-16 h-16 rounded-full"
              />
              <div>
                <h4 className="font-semibold">{selectedAstrologer.name}</h4>
                <p className="text-sm">{selectedAstrologer.title}</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span>Consultation</span>
                <span>{selectedType.name}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span>Date</span>
                <span>{new Date(selectedDate).toLocaleDateString()}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span>Time</span>
                <span>{selectedTime}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span>Duration</span>
                <span>{selectedType.duration} min</span>
              </div>
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span>Consultation Fee</span>
                <span>₹{totalPrice}</span>
              </div>

              <div className="flex justify-between">
                <span>Platform Fee</span>
                <span>₹{platformFee}</span>
              </div>

              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-₹{discount}</span>
              </div>

              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total</span>
                <span>₹{finalTotal}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm mt-4">
              <Shield className="w-4 h-4" />
              Secure payment powered by Razorpay
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
