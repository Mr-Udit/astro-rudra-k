import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { User, Phone, Calendar, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import apiClient from "../api/client";
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export default function CompleteProfile() {
  useDocumentTitle('Complete Profile');
  const navigate = useNavigate();
  const {
    user,
    isAuthenticated,
    isLoading: authLoading,
    checkAuth: refreshUser,
  } = useAuth();

  const [form, setForm] = useState({
    fullName: "",
    phoneNumber: "",
    dateOfBirth: "",
    gender: "",
  });
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      navigate("/login", { replace: true });
      return;
    }

    if (user?.isProfileComplete) {
      navigate("/dashboard", { replace: true });
      return;
    }

    setInitializing(false);
  }, [user, authLoading, isAuthenticated, navigate]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await apiClient.patch("/profile/update", form);

      if (!response.data?.ok) {
        setMessage(response.data?.message || "Update failed.");
        return;
      }

      setMessage("Profile updated successfully!");
      refreshUser();

      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 1000);
    } catch (err) {
      setMessage("An error occurred while updating profile.");
    } finally {
      setLoading(false);
    }
  };

  if (initializing || authLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--cream)" }}
      >
        <Loader2
          className="w-10 h-10 animate-spin"
          style={{ color: "var(--royal-purple)" }}
        />
      </div>
    );
  }

  return (
    <LazyMotion features={domAnimation}>
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--cream)" }}
    >
      <m.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="card p-8 md:p-12 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, var(--rose-gold), var(--copper))",
            }}
          >
            <User className="w-8 h-8 text-white" />
          </div>
          <h1
            className="font-display text-2xl font-bold mb-2"
            style={{ color: "var(--deep-indigo)" }}
          >
            Complete Your Profile
          </h1>
          <p style={{ color: "var(--text-muted)" }}>
            Please provide a few more details to get started
          </p>
        </div>

        {message && (
          <div
            className={`p-4 rounded-xl mb-6 text-center ${
              message.includes("success")
                ? "bg-green-100 text-green-700"
                : "bg-destructive/20 text-red-700"
            }`}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full Name */}
          <div>
            <label
              htmlFor="full-name"
              className="block text-sm font-medium mb-2"
              style={{ color: "var(--text-dark)" }}
            >
              Full Name
            </label>
            <div className="relative">
              <User
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
                style={{ color: "var(--text-muted)" }}
              />
              <input
                id="full-name"
                type="text"
                name="fullName"
                required
                value={form.fullName}
                onChange={handleChange}
                className="form-input pl-12"
                placeholder="Enter your full name"
              />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label
              htmlFor="phone-number"
              className="block text-sm font-medium mb-2"
              style={{ color: "var(--text-dark)" }}
            >
              Phone Number
            </label>
            <div className="relative">
              <Phone
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
                style={{ color: "var(--text-muted)" }}
              />
              <input
                id="phone-number"
                type="tel"
                name="phoneNumber"
                required
                value={form.phoneNumber}
                onChange={handleChange}
                className="form-input pl-12"
                placeholder="Enter your phone number"
              />
            </div>
          </div>

          {/* Date of Birth */}
          <div>
            <label
              htmlFor="date-of-birth"
              className="block text-sm font-medium mb-2"
              style={{ color: "var(--text-dark)" }}
            >
              Date of Birth
            </label>
            <div className="relative">
              <Calendar
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
                style={{ color: "var(--text-muted)" }}
              />
              <input
                id="date-of-birth"
                type="date"
                name="dateOfBirth"
                required
                value={form.dateOfBirth}
                onChange={handleChange}
                className="form-input pl-12"
              />
            </div>
          </div>

          {/* Gender */}
          <div>
            <label
              htmlFor="gender"
              className="block text-sm font-medium mb-2"
              style={{ color: "var(--text-dark)" }}
            >
              Gender
            </label>
            <select
              id="gender"
              name="gender"
              required
              value={form.gender}
              onChange={handleChange}
              className=""
            >
              <option value="" disabled>
                Select your gender
              </option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              "Complete Profile"
            )}
          </button>
        </form>
      </m.div>
    </div>
    </LazyMotion>
  );
}
