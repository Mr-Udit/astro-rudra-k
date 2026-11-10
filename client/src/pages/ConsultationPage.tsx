import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  MessageSquare,
  Phone,
  Shield,
  Video,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import ConstellationBg from "@/components/ui-custom/ConstellationBg";

interface Booking {
  _id?: string;
  id?: string;
  userId?: string;
  astrologerId?: string;
  astrologerName?: string;
  bookingDate?: string;
  date?: string;
  bookingTime?: string;
  time?: string;
  duration?: number;
  consultationType: "chat" | "voice_call" | "video_call";
  status: string;
}

interface JoinData {
  roomName: string;
  token: string;
  appId: string;
  consultationType: Booking["consultationType"];
  startsAt: string;
  endsAt: string;
}

interface JitsiApi {
  dispose: () => void;
  addListener: (event: string, handler: () => void) => void;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI?: new (
      domain: string,
      options: Record<string, unknown>,
    ) => JitsiApi;
  }
}

const IST_OFFSET_MINUTES = 330;

const getBookingStart = (booking: Booking) => {
  const dateValue = booking.bookingDate || booking.date;
  const timeValue = booking.bookingTime || booking.time;
  if (!dateValue || !timeValue) return null;

  const date = new Date(dateValue);
  const [hours, minutes] = timeValue.split(":").map(Number);
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      hours,
      minutes,
    ) -
      IST_OFFSET_MINUTES * 60 * 1000,
  );
};

const loadJitsiApi = (appId: string) =>
  new Promise<void>((resolve, reject) => {
    if (window.JitsiMeetExternalAPI) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://8x8.vc/${encodeURIComponent(appId)}/external_api.js`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Unable to load the JaaS meeting client"));
    document.head.appendChild(script);
  });

export default function ConsultationPage() {
  useDocumentTitle("Consultation");
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth() || {};
  const containerRef = useRef<HTMLDivElement>(null);
  const jitsiRef = useRef<JitsiApi | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [joinData, setJoinData] = useState<JoinData | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"waiting" | "connected" | "ended">("waiting");
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      navigate("/login", { state: { from: { pathname: `/consultation/${id}` } } });
      return;
    }
    if (!id) {
      setError("Invalid booking ID");
      setLoading(false);
      return;
    }

    api
      .get(`/bookings/${id}`)
      .then((response) => {
        if (response.data.ok && response.data.data) {
          setBooking(response.data.data);
        } else {
          setError("Booking not found");
        }
      })
      .catch((err: unknown) => {
        const data = axios.isAxiosError(err) ? err.response?.data : undefined;
        setError(data?.error?.message || data?.message || "Failed to load booking");
      })
      .finally(() => setLoading(false));
  }, [id, isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(
    () => () => {
      jitsiRef.current?.dispose();
      jitsiRef.current = null;
    },
    [],
  );

  const startAt = useMemo(() => (booking ? getBookingStart(booking) : null), [booking]);
  const endAt = useMemo(
    () =>
      startAt
        ? new Date(startAt.getTime() + (booking?.duration || 30) * 60 * 1000)
        : null,
    [booking?.duration, startAt],
  );
  const joinOpensAt = startAt ? startAt.getTime() - 10 * 60 * 1000 : null;
  const joinClosesAt = endAt ? endAt.getTime() + 5 * 60 * 1000 : null;
  const isTooEarly = joinOpensAt !== null && now < joinOpensAt;
  const isEnded = joinClosesAt !== null && now > joinClosesAt;
  const isCancelled = booking?.status === "cancelled";
  const isCompleted = booking?.status === "completed";
  const canJoin =
    booking?.status === "confirmed" &&
    !isTooEarly &&
    !isEnded &&
    !isCancelled &&
    !isCompleted;

  const consultationInfo = {
    voice_call: { label: "Audio Call", icon: Phone },
    video_call: { label: "Video Call", icon: Video },
    chat: { label: "Chat", icon: MessageSquare },
  }[booking?.consultationType || "chat"];
  const TypeIcon = consultationInfo.icon;

  const joinConsultation = async () => {
    if (!id || !booking || !canJoin || !containerRef.current) return;
    try {
      setJoining(true);
      setError(null);
      const response = await api.post(`/bookings/${id}/join-token`);
      const data = response.data.data as JoinData;
      await loadJitsiApi(data.appId);
      if (!window.JitsiMeetExternalAPI || !containerRef.current) {
        throw new Error("JaaS meeting client is unavailable");
      }

      const audioOnly = data.consultationType === "voice_call";
      const chatOnly = data.consultationType === "chat";
      jitsiRef.current?.dispose();
      jitsiRef.current = new window.JitsiMeetExternalAPI("8x8.vc", {
        roomName: data.roomName,
        jwt: data.token,
        parentNode: containerRef.current,
        width: "100%",
        height: "100%",
        configOverwrite: {
          startAudioOnly: audioOnly,
          startWithVideoMuted: audioOnly || chatOnly,
          startWithAudioMuted: chatOnly,
        },
        userInfo: { displayName: user?.fullName || "Participant" },
      });
      jitsiRef.current.addListener("videoConferenceJoined", () => setStatus("connected"));
      jitsiRef.current.addListener("readyToClose", () => {
        jitsiRef.current?.dispose();
        jitsiRef.current = null;
        setStatus("ended");
      });
      setJoinData(data);
      setStatus("connected");
      toast.success("Joined consultation");
    } catch (err: unknown) {
      const data = axios.isAxiosError(err) ? err.response?.data : undefined;
      const code = data?.error?.code;
      const message =
        data?.error?.message ||
        data?.message ||
        (err instanceof Error ? err.message : "Unable to join consultation");
      setError(message);
      if (code === "CONSULTATION_TOO_EARLY") {
        setError(startAt ? `This consultation opens at ${startAt.toLocaleString()}` : message);
      }
      toast.error(message);
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return <PageMessage icon={<Loader2 className="animate-spin" />} text="Loading consultation..." />;
  }
  if (error && !booking) {
    return <PageMessage icon={<AlertCircle />} text={error} />;
  }
  if (!booking) {
    return <PageMessage icon={<AlertCircle />} text="Booking not found" />;
  }

  const currentUserId = user?._id;
  const hasAccess =
    String(booking.userId) === String(currentUserId) ||
    String(booking.astrologerId) === String(currentUserId);
  if (!hasAccess) {
    return <PageMessage icon={<Shield />} text="You do not have permission to join this consultation" />;
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <ConstellationBg starCount={30} opacity={0.08} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => navigate(-1)}>Back</Button>
          <div>
            <h1 className="font-serif text-2xl font-bold text-primary">Consultation Session</h1>
            <p className="text-sm text-muted-foreground">
              {booking.astrologerName || "Astrologer"} · {startAt?.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-background-card rounded-2xl p-4 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <TypeIcon className="w-6 h-6 text-primary" />
            <div>
              <h2 className="font-semibold text-primary">{consultationInfo.label}</h2>
              <p className="text-sm text-muted-foreground">
                {joinData ? "JaaS room connected" : booking.status}
              </p>
            </div>
          </div>

          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
          <div
            ref={containerRef}
            className="min-h-[520px] rounded-xl overflow-hidden bg-gray-900"
          >
            {status === "connected" && joinData ? null : (
              <div className="h-[520px] flex flex-col items-center justify-center text-center text-white px-6">
                {isCancelled ? (
                  <>
                    <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
                    <p>This consultation was cancelled.</p>
                  </>
                ) : isCompleted ? (
                  <>
                    <CheckCircle className="w-12 h-12 text-green-400 mb-3" />
                    <p>This consultation has ended.</p>
                  </>
                ) : isEnded ? (
                  <>
                    <CheckCircle className="w-12 h-12 text-gray-400 mb-3" />
                    <p>This consultation session has ended.</p>
                  </>
                ) : isTooEarly ? (
                  <>
                    <AlertCircle className="w-12 h-12 text-amber-400 mb-3" />
                    <p>Joining opens at {startAt?.toLocaleString()}.</p>
                  </>
                ) : (
                  <>
                    <TypeIcon className="w-12 h-12 text-white/60 mb-3" />
                    <p className="mb-4">Join the secure JaaS consultation room.</p>
                    <Button onClick={joinConsultation} disabled={!canJoin || joining}>
                      {joining ? <Loader2 className="animate-spin" /> : "Join consultation"}
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PageMessage({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="min-h-screen bg-background pt-24 flex items-center justify-center">
      <div className="text-center bg-background-card p-8 rounded-2xl shadow-xl max-w-md">
        <div className="w-12 h-12 mx-auto mb-4 text-primary">{icon}</div>
        <p className="text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}
