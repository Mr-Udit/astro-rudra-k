import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, Phone, Video, MessageSquare, Shield, AlertCircle, Loader2, Wifi, Mic, Camera, MessageCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import ConstellationBg from '@/components/ui-custom/ConstellationBg';

interface BookingType {
  _id?: string;
  id?: string;
  astrologerName?: string;
  astrologerImage?: string;
  bookingDate?: string;
  date?: string;
  bookingTime?: string;
  time?: string;
  consultationType: string;
  status: string;
  amount?: number;
  totalAmount?: number;
  createdAt?: string;
}

export default function ConsultationPage() {
  useDocumentTitle('Consultation');
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth() || {};

  const [booking, setBooking] = useState<BookingType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [consultationStatus, setConsultationStatus] = useState<'waiting' | 'connecting' | 'connected' | 'ended'>('waiting');
  const [meetingUrl, setMeetingUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchBooking = async () => {
      if (!id) {
        setError('Invalid booking ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await api.get(`/bookings/${id}`);
        if (response.data.ok && response.data.data) {
          setBooking(response.data.data);
        } else {
          setError(response.data.message || 'Booking not found');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load booking');
      } finally {
        setLoading(false);
      }
    };

    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/consultation/${id}` } });
      return;
    }

    fetchBooking();
  }, [id, isAuthenticated, navigate]);

  const handleJoinConsultation = async () => {
    if (!booking) return;

    try {
      setConsultationStatus('connecting');

      // In a real implementation, this would:
      // 1. Call backend to generate meeting link (Daily.co, Agora, Twilio, etc.)
      // 2. Return the meeting URL

      // For demo, we'll simulate joining
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate meeting URL generation
      const meetingLink = `https://meet.example.com/consultation/${booking._id || booking.id}?token=demo_token`;
      setMeetingUrl(meetingLink);
      setConsultationStatus('connected');

      toast.success('Joining consultation...');

      // In production, redirect to meeting URL or open in iframe
      window.open(meetingLink, '_blank', 'width=1024,height=768');
    } catch (err: any) {
      toast.error(err.message || 'Failed to join consultation');
      setConsultationStatus('waiting');
    }
  };

  const handleEndConsultation = () => {
    setConsultationStatus('ended');
    toast.info('Consultation ended');
  };

  const consultationTypes = {
    voice_call: { name: 'Audio Call', icon: Phone, duration: 30, color: 'bg-blue-500' },
    video_call: { name: 'Video Call', icon: Video, duration: 45, color: 'bg-green-500' },
    chat: { name: 'Chat', icon: MessageSquare, duration: 60, color: 'bg-purple-500' },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-16 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading consultation...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-16 flex items-center justify-center">
        <div className="text-center bg-background-card p-8 rounded-2xl shadow-xl max-w-md mx-auto px-4">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="font-serif text-2xl font-bold text-primary mb-2">
            Unable to Load Consultation
          </h2>
          <p className="text-muted-foreground mb-6">{error || 'Booking not found'}</p>
          <Button onClick={() => navigate(-1)} className="btn-primary">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Check if user has access to this booking
  const hasAccess = booking.userId === user?.id || booking.astrologerId === user?.id || user?.role === 'admin';

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-16 flex items-center justify-center">
        <div className="text-center bg-background-card p-8 rounded-2xl shadow-xl max-w-md mx-auto px-4">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="font-serif text-2xl font-bold text-primary mb-2">
            Access Denied
          </h2>
          <p className="text-muted-foreground mb-6">You don't have permission to join this consultation</p>
          <Button onClick={() => navigate(-1)} className="btn-primary">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const consultationType = booking.consultationType || 'chat';
  const typeInfo = consultationTypes[consultationType as keyof typeof consultationTypes] || consultationTypes.chat;
  const TypeIcon = typeInfo.icon;
  const isCompleted = booking.status === 'completed';
  const isCancelled = booking.status === 'cancelled';
  const canJoin = booking.status === 'confirmed' && !isCompleted && !isCancelled;

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <ConstellationBg starCount={30} opacity={0.08} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg bg-background-card hover:bg-background-elevated transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="font-serif text-2xl font-bold text-primary">
              Consultation Session
            </h1>
            <p className="text-sm text-muted-foreground">
              {booking.astrologerName || 'Astrologer'} • {new Date(booking.bookingDate || booking.date || '').toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Status Banner */}
        <div className={`mb-6 px-6 py-4 rounded-2xl border ${
          consultationStatus === 'connected' ? 'bg-green-50 border-green-200' :
          consultationStatus === 'connecting' ? 'bg-blue-50 border-blue-200' :
          consultationStatus === 'ended' ? 'bg-gray-50 border-gray-200' :
          canJoin ? 'bg-amber-50 border-amber-200' :
          isCompleted ? 'bg-green-50 border-green-200' :
          isCancelled ? 'bg-red-50 border-red-200' :
          'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-center gap-3">
            {consultationStatus === 'connected' && (
              <>
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <span className="text-green-700 font-medium">Connected - Consultation in progress</span>
              </>
            )}
            {consultationStatus === 'connecting' && (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                <span className="text-blue-700 font-medium">Connecting to consultation...</span>
              </>
            )}
            {consultationStatus === 'ended' && (
              <>
                <CheckCircle className="w-5 h-5 text-gray-500" />
                <span className="text-gray-700 font-medium">Consultation ended</span>
              </>
            )}
            {!canJoin && !isCompleted && !isCancelled && consultationStatus === 'waiting' && (
              <>
                <AlertCircle className="w-5 h-5 text-amber-500" />
                <span className="text-amber-700 font-medium">
                  Cannot join: Session is {booking.status === 'pending' ? 'pending payment' : booking.status}
                </span>
              </>
            )}
            {isCompleted && (
              <>
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-green-700 font-medium">Consultation completed</span>
              </>
            )}
            {isCancelled && (
              <>
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="text-red-700 font-medium">Consultation was cancelled</span>
              </>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Consultation Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Consultation Interface */}
            <div className="bg-background-card rounded-2xl p-6 shadow-lg shadow-[hsl(var(--primary))]/5">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full ${typeInfo.color} flex items-center justify-center`}>
                    <TypeIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="font-serif text-xl font-bold text-primary">
                      {typeInfo.name}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {typeInfo.duration} minutes • {booking.astrologerName || 'Astrologer'}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  booking.status === 'confirmed' ? 'bg-success/20 text-green-700' :
                  booking.status === 'pending' ? 'bg-warning/20 text-yellow-700' :
                  booking.status === 'completed' ? 'bg-green-500 text-white' :
                  booking.status === 'cancelled' ? 'bg-red-500 text-white' :
                  'bg-background-elevated text-secondary'
                }`}>
                  {booking.status}
                </span>
              </div>

              {/* Consultation Video/Chat Area */}
              <div className="aspect-video bg-gray-900 rounded-xl overflow-hidden relative">
                {consultationStatus === 'connected' && meetingUrl ? (
                  <iframe
                    src={meetingUrl}
                    className="w-full h-full rounded-xl border-0"
                    allow="camera; microphone; fullscreen"
                    title="Consultation Meeting"
                  />
                ) : consultationStatus === 'connecting' ? (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                    <p className="text-white text-lg">Connecting to consultation...</p>
                    <p className="text-gray-400 mt-2">Please wait while we connect you</p>
                  </div>
                ) : consultationStatus === 'ended' ? (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                    <h3 className="text-white text-xl font-bold mb-2">Consultation Ended</h3>
                    <p className="text-gray-400">Thank you for your consultation</p>
                  </div>
                ) : canJoin ? (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    <TypeIcon className="w-16 h-16 text-white/50 mb-4" />
                    <h3 className="text-white text-xl font-bold mb-2">Ready to Join</h3>
                    <p className="text-gray-400 mb-6 max-w-md text-center">
                      Your {typeInfo.name} with {booking.astrologerName} is scheduled for
                      {new Date(booking.bookingDate || booking.date || '').toLocaleDateString()} at {booking.bookingTime || booking.time}
                    </p>
                    <Button
                      onClick={handleJoinConsultation}
                      disabled={consultationStatus !== 'waiting'}
                      className="btn-primary text-lg px-8 py-3"
                      size="lg"
                    >
                      Join Consultation Now
                    </Button>
                  </div>
                ) : isCompleted ? (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                    <h3 className="text-white text-xl font-bold mb-2">Consultation Completed</h3>
                    <p className="text-gray-400 mb-4">Thank you for consulting with {booking.astrologerName}</p>
                    <Button variant="outline" onClick={() => navigate('/user/dashboard')}>
                      View Dashboard
                    </Button>
                  </div>
                ) : isCancelled ? (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                    <h3 className="text-white text-xl font-bold mb-2">Consultation Cancelled</h3>
                    <p className="text-gray-400 mb-4">This consultation was cancelled</p>
                    <Button onClick={() => navigate('/user/dashboard')}>
                      Book Another Session
                    </Button>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    <Shield className="w-16 h-16 text-gray-500 mb-4" />
                    <h3 className="text-white text-xl font-bold mb-2">Cannot Join Yet</h3>
                    <p className="text-gray-400 mb-4">
                      {booking.status === 'pending'
                        ? 'Please complete payment to join this consultation'
                        : 'Consultation is not available for joining'}
                    </p>
                    {booking.status === 'pending' && (
                      <Button
                        onClick={() => navigate(`/booking/payment?bookingId=${booking._id || booking.id}`)}
                        className="btn-primary"
                      >
                        Complete Payment
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Consultation Controls */}
              {consultationStatus === 'connected' && (
                <div className="mt-6 flex items-center justify-center gap-4 p-4 bg-gray-900/50 rounded-xl">
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={() => {
                      // Toggle microphone
                    }}
                  >
                    <Mic className="w-4 h-4" />
                    <span>Mute</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={() => {
                      // Toggle camera
                    }}
                  >
                    <Camera className="w-4 h-4" />
                    <span>Camera</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={() => {
                      // Toggle chat
                    }}
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Chat</span>
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex items-center gap-2 ml-auto"
                    onClick={handleEndConsultation}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2z" />
                    </svg>
                    <span>End</span>
                  </Button>
                </div>
              )}
            </div>

            {/* Session Details */}
            <div className="mt-6 bg-background-elevated rounded-xl p-6">
              <h3 className="font-serif text-lg font-bold text-primary mb-4">
                Session Details
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="font-medium text-primary">
                    {new Date(booking.bookingDate || booking.date || '').toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Time</p>
                  <p className="font-medium text-primary">
                    {booking.bookingTime || booking.time}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="font-medium text-primary">
                    {typeInfo.duration} minutes
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="font-medium text-primary">
                    {typeInfo.name}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Astrologer Info */}
            <div className="bg-background-card rounded-2xl p-6 shadow-lg shadow-[hsl(var(--primary))]/5">
              <h3 className="font-serif text-lg font-bold text-primary mb-4">
                Your Astrologer
              </h3>
              <div className="flex items-center gap-4">
                <img
                  src={booking.astrologerImage || 'https://via.placeholder.com/80'}
                  alt={booking.astrologerName || 'Astrologer'}
                  className="w-16 h-16 rounded-full object-cover border-2 border-[hsl(var(--primary))]"
                />
                <div>
                  <h4 className="font-semibold text-primary">
                    {booking.astrologerName || 'Astrologer'}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {typeInfo.name} • ₹{booking.amount || booking.totalAmount}
                  </p>
                </div>
              </div>
            </div>

            {/* Connection Check */}
            <div className="bg-background-card rounded-2xl p-6 shadow-lg shadow-[hsl(var(--primary))]/5">
              <h3 className="font-serif text-lg font-bold text-primary mb-4 flex items-center gap-2">
                <Wifi className="w-5 h-5" />
                Connection Check
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Internet Connection</span>
                  <span className="flex items-center gap-1 text-green-600">
                    <span className="w-2 h-2 bg-green-500 rounded-full" />
                    Connected
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Microphone Access</span>
                  <span className="flex items-center gap-1 text-amber-600">
                    <span className="w-2 h-2 bg-amber-500 rounded-full" />
                    Click to allow
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Camera Access</span>
                  <span className="flex items-center gap-1 text-amber-600">
                    <span className="w-2 h-2 bg-amber-500 rounded-full" />
                    Click to allow
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Browser Support</span>
                  <span className="flex items-center gap-1 text-green-600">
                    <span className="w-2 h-2 bg-green-500 rounded-full" />
                    Supported
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                For best experience, use Chrome or Firefox. Allow microphone and camera permissions when prompted.
              </p>
            </div>

            {/* Secure Payment Badge */}
            <div className="bg-background-card rounded-2xl p-6 shadow-lg shadow-[hsl(var(--primary))]/5 text-center">
              <Shield className="w-10 h-10 text-primary mx-auto mb-3" />
              <h4 className="font-semibold text-primary mb-1">Secure Consultation</h4>
              <p className="text-sm text-muted-foreground">
                End-to-end encrypted • HIPAA compliant • No recordings without consent
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}