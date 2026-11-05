import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Mail,
  User,
  ArrowRight,
  Sparkles,
  CheckCircle,
  Shield,
  KeyRound,
} from "lucide-react";
import ConstellationBg from "@/components/ui-custom/ConstellationBg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuth } from '@/context/AuthContext';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

type UsernameStatus =
  | "idle"
  | "invalid"
  | "checking"
  | "available"
  | "taken"
  | "error";

const USERNAME_REGEX =
  /^[a-zA-Z][a-zA-Z0-9]*(?:_[a-zA-Z0-9]+)*$/;

export default function SignupPage() {
  useDocumentTitle('Sign Up');
  const [step, setStep] = useState<"form" | "otp">("form");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] =
    useState<UsernameStatus>("idle");
  const [debugotp, setDebugOtp] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || null;

  /* ------------------ Username Validation + API Check ------------------ */

  useEffect(() => {
    const trimmed = username.trim();

    if (!trimmed) {
      setUsernameStatus("idle");
      return;
    }

    if (
      trimmed.length < 3 ||
      trimmed.length > 20 ||
      !USERNAME_REGEX.test(trimmed)
    ) {
      setUsernameStatus("invalid");
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      checkUsername(trimmed);
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [username]);

  const checkUsername = async (name: string) => {
    setUsernameStatus("checking");

    try {
      const { data } = await api.post<{ available: boolean }>(
        "/auth/check-username",
        { username: name.trim() },
      );

      setUsernameStatus(data.available ? "available" : "taken");
    } catch (err: any) {
      console.log("Username check error:", err);
      setUsernameStatus("error");
    }
  };


  /* ------------------ Signup Submit ------------------ */

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !email) {
      toast.error("Please fill in all fields");
      return;
    }

    if (usernameStatus === "invalid") {
      toast.error(
        "Username must be 3-20 chars, start with letter, only letters/numbers/_"
      );
      return;
    }

    if (usernameStatus === "taken") {
      toast.error("Username already exists");
      return;
    }

    if (usernameStatus === "checking") {
      toast.error("Wait until username validation completes");
      return;
    }

    if (usernameStatus !== "available") {
      toast.error("Please enter a valid username");
      return;
    }

    setIsLoading(true);

    // setTimeout(() => {
    //   setIsLoading(false);
    //   setStep("otp");
    //   toast.info("Debug OTP: 123456", { duration: 5000 });
    // }, 800);
    // Real API call
    try {
      const res = await register(username, email, 'request', undefined, "user");
      console.log("Register response:", res);
      if (res.success) {
        toast.success(res.message || 'OTP sent successfully!');
        if (res.otp) {
          // Dev-mode: backend returns plain OTP string
          setDebugOtp(res.otp);
          toast.info(`DEV OTP: ${res.otp}`, {
            duration: 10000,
          });
        }
        setStep('otp');
      } else {
        toast.error(res.message || 'Failed to send OTP.');
      }
    } catch (error) {

    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await register(username, email, 'verify', otp, "user");
      if (res.success && res.user) {
        toast.success('Welcome back!');

        // Redirect logic: preserve intended destination or go to dashboard
        if (!res.user.isProfileComplete) {
          navigate('/complete-profile');
        } else if (from) {
          // Redirect back to where they came from
          navigate(from);
        } else {
          // Default dashboard based on role
          if (res.user.role === 'admin') navigate('/admin/dashboard');
          else if (res.user.role === 'astrologer') navigate('/astrologer/dashboard');
          else navigate('/user/dashboard');
        }
      } else {
        toast.error(res.message || 'Invalid OTP.');
      }
    } catch (_error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    { icon: Sparkles, text: "Customized Astrological Insights" },
    { icon: CheckCircle, text: "Connect with Certified Experts" },
    { icon: Shield, text: "Secure & Private Consultations" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--background))] to-[hsl(var(--background-elevated))] flex items-center justify-center py-10 px-4 relative overflow-hidden">
      <ConstellationBg starCount={60} />

      <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-12 items-center relative z-10">
        {/* LEFT SIDE (UNCHANGED) */}
        <div className="hidden lg:block">
          <div className="mb-8">
            <h1 className="font-serif text-4xl font-bold text-primary mb-4">
              Join Astro-Rudra-K
            </h1>
            <p className="text-lg text-muted-foreground">
              Start your journey towards clarity and purpose
            </p>
          </div>

          <ul className="space-y-6">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-accent flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-primary font-medium">
                  {feature.text}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* RIGHT SIDE */}
        <div className="bg-background-card rounded-3xl p-10 shadow-2xl shadow-[hsl(var(--primary))]/10">
          {step === "form" ? (
            <form onSubmit={handleSignupSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>

                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />

                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={`pl-12 py-6 border-2 rounded-xl ${usernameStatus === "available"
                      ? "border-green-500"
                      : usernameStatus === "taken" ||
                        usernameStatus === "invalid"
                        ? "border-red-500"
                        : "border-border"
                      }`}
                    required
                  />
                </div>

                <div className="text-sm min-h-[20px]">
                  {usernameStatus === "invalid" &&
                    "Invalid format (3–20 chars, start with letter, no double underscores)"}
                  {usernameStatus === "checking" &&
                    "Checking availability..."}
                  {usernameStatus === "available" && (
                    <span className="text-success">
                      Username available
                    </span>
                  )}
                  {usernameStatus === "taken" && (
                    <span className="text-destructive">
                      Username already exists
                    </span>
                  )}
                  {usernameStatus === "error" &&
                    "Error checking username"}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={
                  isLoading ||
                  usernameStatus !== "available"
                }
                className="w-full py-6"
              >
                {isLoading ? "Processing..." : "Create Account"}
              </Button>

              <p className="text-center text-sm text-muted-foreground mt-2">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="text-primary font-semibold hover:underline"
                >
                  Login
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={setOtp}
                >
                  <InputOTPGroup>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <InputOTPSlot key={i} index={i} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button type="submit" className="w-full py-6">
                Verify {debugotp}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
