import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Phone, Loader2, MapPin } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import ConstellationBg from "@/components/ui-custom/ConstellationBg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import api from "@/lib/api";
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export default function CompleteProfilePage() {
  useDocumentTitle('Complete Profile');
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [location, setLocation] = useState("");
  const [gender, setGender] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { checkAuth, isAuthenticated } = useAuth() || {};
  const navigate = useNavigate();

  // Ensure user is authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--background))] to-[hsl(var(--background-elevated))] flex items-center justify-center">
        <div className="text-center bg-background-card p-8 rounded-2xl shadow-xl">
          <p className="text-muted-foreground mb-6">Please log in to continue</p>
          <Button onClick={() => navigate("/login")} className="btn-primary">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // --- Client-side validation (mirrors backend rules) ---
    if (!name.trim()) {
      toast.error("Full name is required");
      return;
    }
    if (!/^[a-zA-Z\s]{2,60}$/.test(name.trim())) {
      toast.error("Name must be 2–60 characters, letters and spaces only");
      return;
    }
    if (!phone.trim()) {
      toast.error("Phone number is required");
      return;
    }
    if (!/^\+[1-9]\d{7,14}$/.test(phone.trim())) {
      toast.error("Phone must be in international format, e.g. +919876543210");
      return;
    }
    if (!dob) {
      toast.error("Date of birth is required");
      return;
    }
    if (!location.trim()) {
      toast.error("Location is required");
      return;
    }
    if (!gender) {
      toast.error("Please select your gender");
      return;
    }

    setIsLoading(true);

    try {
      const { data } = await api.patch("/profile/update", {
        fullName: name.trim(),
        phoneNumber: phone.trim(),
        dateOfBirth: dob,
        location: location.trim(),
        gender,
      });

      if (data.ok) {
        toast.success("Profile updated successfully!");
        // Refresh auth state — backend upgrades cookie from profile → auth token
        await checkAuth?.();
        navigate("/");
      } else {
        // Backend returns { ok: false, errors: { fieldName: "msg" } } for validation
        // or { ok: false, message: "..." } for other errors
        if (data.errors && typeof data.errors === "object") {
          const firstError = Object.values(data.errors)[0] as string;
          toast.error(firstError || "Please check your details and try again.");
        } else {
          toast.error(data.message || "Failed to update profile.");
        }
      }
    } catch (error: any) {
      console.error("[CompleteProfilePage] Error:", error);
      // Also handle field errors surfaced via axios 400 response
      const responseData = error.response?.data;
      if (responseData?.errors && typeof responseData.errors === "object") {
        const firstError = Object.values(responseData.errors)[0] as string;
        toast.error(firstError || "Validation failed. Check your details.");
      } else {
        const errorMsg =
          responseData?.message ||
          responseData?.error?.message ||
          "Something went wrong. Please try again.";
        toast.error(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--background))] to-[hsl(var(--background-elevated))] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <ConstellationBg starCount={40} />

      <div className="max-w-xl w-full relative z-10">
        <div className="bg-background-card rounded-3xl p-8 md:p-10 shadow-2xl shadow-[hsl(var(--primary))]/10 animate-slide-in-up">
          <div className="text-center mb-8">
            <h2 className="font-serif text-3xl font-bold text-primary mb-2">
              Complete Your Profile
            </h2>
            <p className="text-muted-foreground">
              Tell us a bit about yourself to get started
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-primary font-medium">
                Full Name *
              </Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-12 py-6 border-2 border-border rounded-xl focus:border-[hsl(var(--secondary))] focus:ring-[hsl(var(--secondary))]/20"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-primary font-medium">
                Phone Number *
              </Label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-12 py-6 border-2 border-border rounded-xl focus:border-[hsl(var(--secondary))] focus:ring-[hsl(var(--secondary))]/20"
                  required
                />
              </div>
            </div>

            <div className="space-y-5">
              {/* Date of Birth */}
              <div className="space-y-2">
                <Label htmlFor="dob" className="text-primary font-medium">
                  Date of Birth
                </Label>
                <Input
                  id="dob"
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full py-6 border-2 border-border rounded-xl focus:border-[hsl(var(--secondary))] focus:ring-[hsl(var(--secondary))]/20"
                />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location" className="text-primary font-medium">
                  Location
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="location"
                    type="text"
                    placeholder="City, Country"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="pl-12 py-6 border-2 border-border rounded-xl focus:border-[hsl(var(--secondary))] focus:ring-[hsl(var(--secondary))]/20"
                  />
                </div>
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <Label htmlFor="gender" className="text-primary font-medium">
                  Gender
                </Label>
                <select
                  id="gender"
                  name="gender"
                  required
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full py-3 px-4 border-2 border-border rounded-xl focus:border-[hsl(var(--secondary))] focus:outline-none text-primary bg-background-card"
                >
                  <option value="" disabled>
                    Select your gender
                  </option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>


            <Button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-6 text-base mt-4"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </span>
              ) : (
                "Save & Continue"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
