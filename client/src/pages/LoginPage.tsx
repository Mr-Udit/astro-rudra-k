import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, ArrowRight, Loader2, Sparkles, CheckCircle, Shield, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import ConstellationBg from '@/components/ui-custom/ConstellationBg';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { useDocumentTitle } from '@/hooks/useDocumentTitle';


export default function LoginPage() {
  useDocumentTitle('Login');
  const [step, setStep] = useState<'username' | 'otp'>('username');
  const [role, setRole] = useState<'user' | 'astrologer'>('user');
  const [username, setusername] = useState('');
  const [otp, setOtp] = useState('');
  const [debugOtp, setDebugOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the intended destination (for "Book → Login → Return" flow)
  const from = (location.state as any)?.from?.pathname || null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) {
      toast.error('Please enter your username');
      return;
    }
    setIsLoading(true);

    try {
      const res = await login(username, 'request', undefined, role);
      // console.log('Login response:', res);
      if (res.success) {
        toast.success(res.message || 'OTP sent successfully!');
        if (res.otp) {
          // For demo/dev purposes only
          const otpCode = res.otp || "123456";
          setDebugOtp(otpCode);
          toast.info(`DEV OTP: ${otpCode}`, {
            duration: 10000,
          });
        }
        setStep('otp');
      } else {
        toast.error(res.message || 'Failed to send OTP.');
      }
    } catch (_error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }
    setIsLoading(true);

    try {
      const res = await login(username, 'verify', otp, role);
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
    { icon: Sparkles, text: 'Expert astrologers with 15+ years experience' },
    { icon: CheckCircle, text: 'Personalized Kundli analysis' },
    { icon: Shield, text: '100% confidential consultations' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--background))] to-[hsl(var(--background-elevated))] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <ConstellationBg starCount={60} />

      <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-8 lg:gap-12 items-center relative z-10">
        {/* Left Side */}
        <div className="hidden lg:block animate-slide-in-left">
          <div className="mb-6 lg:mb-8">
            <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4 lg:mb-6 shadow-xl shadow-[hsl(var(--primary))]/20">
              <span className="text-accent text-2xl lg:text-3xl animate-rotate">✦</span>
            </div>
            <h1 className="font-serif text-3xl lg:text-4xl font-bold text-primary mb-3 lg:mb-4">
              Astro-Rudra-K
            </h1>
            <p className="text-base lg:text-lg text-muted-foreground">
              Transform Your Life Through Vedic Wisdom
            </p>
          </div>

          <ul className="space-y-4 lg:space-y-6">
            {features.map((feature, index) => (
              <li
                key={feature.text}
                className="flex items-center gap-4 animate-slide-in-up"
                style={{ animationDelay: `${(index + 1) * 0.2}s` }}
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-accent flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-primary font-medium">{feature.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right Side - Form */}
        <div className="bg-background-card rounded-2xl lg:rounded-3xl p-6 md:p-8 lg:p-10 shadow-2xl shadow-[hsl(var(--primary))]/10 relative overflow-hidden animate-slide-in-right">
          <div className="relative z-10 transition-all duration-300">
            <div className="text-center mb-6 lg:mb-8">
              <h2 className="font-serif text-2xl lg:text-3xl font-bold text-primary mb-2">
                {step === 'username' ? 'Welcome' : 'Enter OTP'}
              </h2>
              <p className="text-sm lg:text-base text-muted-foreground">
                {step === 'username' ? 'Enter your username to continue' : `Code sent to ${username}`}
              </p>
            </div>

            {step === 'username' ? (
              <form onSubmit={handleSendOtp} className="space-y-6">
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => navigate('/signup')}
                    className="text-sm text-primary hover:text-primary font-medium transition-colors"
                  >
                    New user? Sign Up
                  </button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-primary font-medium">
                    Username
                  </Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="Username"
                      value={username}
                      onChange={(e) => setusername(e.target.value)}
                      className="pl-12 py-6 border-2 border-border rounded-xl focus:border-[hsl(var(--secondary))] focus:ring-[hsl(var(--secondary))]/20"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role" className="text-primary font-medium">
                    I am a...
                  </Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                    <Select value={role} onValueChange={(val: 'user' | 'astrologer') => setRole(val)}>
                      <SelectTrigger className="pl-12 py-6 border-2 border-border rounded-xl focus:border-[hsl(var(--secondary))] focus:ring-[hsl(var(--secondary))]/20 w-full">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User (Seeker)</SelectItem>
                        <SelectItem value="astrologer">Astrologer (Expert)</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-primary py-6 text-base"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Continue <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="flex justify-center mb-6">
                  <InputOTP maxLength={6} value={otp} onChange={(val) => setOtp(val)}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                {/* On-screen OTP Debug Display */}
                {step === 'otp' && debugOtp && (
                  <div className="bg-[hsl(var(--primary))]/5 border-2 border-dashed border-[hsl(var(--primary))]/20 rounded-xl p-4 mb-6 text-center animate-pulse">
                    <p className="text-xs font-bold uppercase tracking-widest text-primary/60 mb-1">
                      Debug OTP Code
                    </p>
                    <p className="text-3xl font-mono font-bold text-primary">
                      {debugOtp}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-2 italic">
                      (Enter this code to login)
                    </p>
                  </div>
                )}

                <div className="text-center text-sm text-muted-foreground mb-4">
                  Didn't receive code? <button type="button" onClick={handleSendOtp} className="text-primary font-semibold underline">Resend</button>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-primary py-6 text-base"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    'Verify & Login'
                  )}
                </Button>

                <button
                  type="button"
                  onClick={() => setStep('username')}
                  className="w-full text-sm text-muted-foreground mt-4 hover:text-primary"
                >
                  Change username
                </button>
              </form>
            )}

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-background-card text-muted-foreground">
                  New here? No problem.
                </span>
              </div>
            </div>

            <p className="text-center text-sm text-muted-foreground mt-4">
              We will create an account for you automatically.
            </p>

          </div>
        </div>
      </div>
    </div>
  );
}
