import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Clock, Phone, Video, MessageSquare, Star, ChevronRight, User, Settings, LogOut, History, Heart, Loader2, XCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { User as UserType } from '@/types';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { testimonialsApi } from '@/api/testimonials';

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
  totalAmount?: number; // legacy fallback
  createdAt?: string;
  cancellation?: {
    cancelledBy?: string;
  };
}

export default function UserDashboard() {
  useDocumentTitle('My Dashboard');
  const navigate = useNavigate();
  const authContext = useAuth();
  const user = authContext?.user as UserType | null;
  const logout = authContext?.logout;

  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'favorites'>('upcoming');
  const [bookings, setBookings] = useState<BookingType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewModalBooking, setReviewModalBooking] = useState<BookingType | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get('/bookings/my-bookings');
        if (response.data.ok) {
          setBookings(response.data.data || []);
        } else {
          setError(response.data.message || 'Failed to fetch bookings');
        }
      } catch (err: any) {
        const errorMsg = err.response?.data?.message || 'Failed to fetch bookings';
        setError(errorMsg);
        if (err.response?.status !== 401) {
          toast.error(errorMsg);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  if (!user || user.role !== 'user') {
    return (
      <div className="min-h-screen bg-background pt-24 flex items-center justify-center">
        <div className="text-center bg-background-card p-8 rounded-2xl shadow-xl">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-primary mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-6">Only users can access this dashboard</p>
          <Button onClick={() => navigate('/login')} className="btn-primary">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  const upcomingBookings = bookings.filter(
    (b: BookingType) => b.status === 'confirmed' || b.status === 'pending'
  );
  const pastBookings = bookings.filter((b: BookingType) =>
    ['completed', 'cancelled', 'expired'].includes(b.status)
  );

  const stats = [
    { label: 'Total Consultations', value: bookings.length.toString(), icon: History },
    { label: 'Upcoming Sessions', value: upcomingBookings.length.toString(), icon: Calendar },
    { label: 'Favorite Astrologers', value: '0', icon: Heart },
    { label: 'Total Spent', value: `₹${bookings.reduce((sum, b) => sum + (b.amount || b.totalAmount || 0), 0).toLocaleString()}`, icon: Star },
  ];

  const handleLogout = async () => {
    try {
      await logout?.();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary to-secondary rounded-3xl p-8 mb-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-background-card/20 flex items-center justify-center">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.fullName} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User className="w-10 h-10" />
                )}
              </div>
              <div>
                <h1 className="font-serif text-3xl font-bold mb-1">Welcome, {user?.fullName}!</h1>
                <p className="text-white/80">Manage your consultations and preferences</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link to="/astrologers">
                <Button className="bg-background-card text-primary hover:bg-background-card/90">
                  Book New Consultation
                </Button>
              </Link>
              <Button
                variant="outline"
                className="bg-background-card/10 border-white/40 text-white hover:bg-background-card/20"
                onClick={() => navigate('/complete-profile')}
              >
                <Settings className="w-4 h-4 mr-2" />
                Profile Settings
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-background-card rounded-2xl p-6 shadow-lg shadow-[hsl(var(--primary))]/5">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold text-primary mb-1">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-destructive">
            <p>{error}</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Tabs */}
              <div className="bg-background-card rounded-2xl shadow-lg shadow-[hsl(var(--primary))]/5 overflow-hidden">
                <div className="flex border-b border-border">
                  {[
                    { id: 'upcoming', label: 'Upcoming Sessions' },
                    { id: 'past', label: 'Past Consultations' },
                    { id: 'favorites', label: 'Favorites' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as typeof activeTab)}
                      className={`flex-1 py-4 text-sm font-medium transition-colors ${activeTab === tab.id
                        ? 'text-primary border-b-2 border-[hsl(var(--secondary))]'
                        : 'text-muted-foreground hover:text-primary'
                        }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="p-6">
                  {activeTab === 'upcoming' && (
                    <div className="space-y-4">
                      {upcomingBookings.length > 0 ? (
                        upcomingBookings.map((booking) => (
                          <div
                            key={booking._id || booking.id}
                            className="flex flex-col md:flex-row md:items-center gap-4 p-4 bg-background-elevated rounded-xl"
                          >
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent to-accent flex items-center justify-center">
                              <span className="text-white font-bold text-xl">
                                {booking.astrologerName?.charAt(0) || 'A'}
                              </span>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-primary">{booking.astrologerName || 'Astrologer'}</h4>
                              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-1">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {new Date(booking.bookingDate || booking.date || new Date()).toLocaleDateString()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {booking.bookingTime || booking.time}
                                </span>
                                <span className="flex items-center gap-1">
                                  {booking.consultationType === 'voice_call' && <Phone className="w-4 h-4" />}
                                  {booking.consultationType === 'video_call' && <Video className="w-4 h-4" />}
                                  {booking.consultationType === 'chat' && <MessageSquare className="w-4 h-4" />}
                                  {booking.consultationType}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-background-elevated text-secondary'
                                }`}>
                                {booking.status}
                              </span>
                              {booking.status === 'pending' ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-primary"
                                  onClick={() =>
                                    navigate(
                                      `/booking/payment?bookingId=${
                                        booking.id || booking._id
                                      }`,
                                    )
                                  }
                                >
                                  Pay Now <ChevronRight className="w-4 h-4" />
                                </Button>
                              ) : (
                                <Button variant="ghost" size="sm" className="text-primary">
                                  View <ChevronRight className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12">
                          <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                          <h3 className="font-serif text-xl font-bold text-primary mb-2">
                            No upcoming sessions
                          </h3>
                          <p className="text-muted-foreground mb-4">Book a consultation to get started</p>
                          <Link to="/astrologers">
                            <Button className="btn-primary">Book Now</Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'past' && (
                    <div className="space-y-4">
                      {pastBookings.length > 0 ? (
                        pastBookings.map((booking: BookingType) => (
                          <div
                            key={booking._id || booking.id}
                            className="flex flex-col md:flex-row md:items-center gap-4 p-4 bg-background-elevated rounded-xl"
                          >
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent to-accent flex items-center justify-center">
                              <span className="text-white font-bold text-xl">
                                {booking.astrologerName?.charAt(0) || 'A'}
                              </span>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-primary">{booking.astrologerName || 'Astrologer'}</h4>
                              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-1">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {new Date(booking.bookingDate || booking.date || '').toLocaleDateString()}
                                </span>
                                <span className="flex items-center gap-1">
                                  {booking.consultationType === 'voice_call' && <Phone className="w-4 h-4" />}
                                  {booking.consultationType === 'video_call' && <Video className="w-4 h-4" />}
                                  {booking.consultationType === 'chat' && <MessageSquare className="w-4 h-4" />}
                                  {booking.consultationType}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-background-elevated text-secondary">
                                {booking.status === 'completed' && 'Completed'}
                                {booking.status === 'cancelled' &&
                                  (booking.cancellation?.cancelledBy === 'system'
                                    ? 'Auto-cancelled'
                                    : 'Cancelled')}
                                {booking.status === 'expired' && 'Expired'}
                              </span>
                              {booking.status === 'completed' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-primary"
                                  onClick={() => {
                                    setReviewModalBooking(booking);
                                    setReviewRating(5);
                                    setReviewComment('');
                                  }}
                                >
                                  Review
                                </Button>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12">
                          <History className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                          <h3 className="font-serif text-xl font-bold text-primary mb-2">
                            No past consultations
                          </h3>
                          <p className="text-muted-foreground">Your consultation history will appear here</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'favorites' && (
                    <div className="text-center py-12">
                      <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-serif text-xl font-bold text-primary mb-2">
                        Favorites coming soon
                      </h3>
                      <p className="text-muted-foreground">Save your favorite astrologers for quick access</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-background-card rounded-2xl p-6 shadow-lg shadow-[hsl(var(--primary))]/5">
                <h3 className="font-serif text-lg font-bold text-primary mb-4">
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <Link to="/astrologers">
                    <Button variant="outline" className="w-full justify-start gap-3">
                      <Calendar className="w-5 h-5" />

        {/* Review Modal */}
        {reviewModalBooking && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
            <div className="bg-background-card rounded-2xl max-w-md w-full p-6 shadow-xl">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-primary mb-1">Rate Your Consultation</h2>
                  <p className="text-sm text-muted-foreground">
                    {reviewModalBooking.astrologerName || 'Astrologer'} ·{' '}
                    {new Date(reviewModalBooking.bookingDate || reviewModalBooking.date || '').toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setReviewModalBooking(null);
                  }}
                  className="text-muted-foreground hover:text-primary"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-primary mb-2">Overall Rating</p>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= reviewRating
                              ? 'fill-[hsl(var(--accent))] text-accent'
                              : 'text-muted-foreground'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-sm text-muted-foreground ml-2">{reviewRating} / 5</span>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-primary mb-2">Share your experience (optional)</p>
                  <textarea
                    className="w-full min-h-[80px] border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--secondary))] focus:border-[hsl(var(--secondary))]"
                    maxLength={500}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="How was your session?"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Max 500 characters</p>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setReviewModalBooking(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    disabled={submittingReview}
                    onClick={async () => {
                      if (!reviewModalBooking?._id && !reviewModalBooking?.id) return;
                      try {
                        setSubmittingReview(true);
                        await testimonialsApi.createReview({
                          astrologerId:
                            (reviewModalBooking as any).astrologerProfileId || (reviewModalBooking as any).astrologerId || '',
                          bookingId: (reviewModalBooking._id || reviewModalBooking.id) as string,
                          rating: reviewRating,
                          comment: reviewComment,
                        });
                        toast.success('Thank you for your review!');
                        setReviewModalBooking(null);
                      } catch (err: any) {
                        toast.error(
                          err?.response?.data?.message ||
                            err?.message ||
                            'Failed to submit review'
                        );
                      } finally {
                        setSubmittingReview(false);
                      }
                    }}
                  >
                    {submittingReview ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Submit Review'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
                      Book Consultation
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3"
                    onClick={() => navigate('/complete-profile')}
                  >
                    <Settings className="w-5 h-5" />
                    Edit Profile
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3 text-destructive hover:bg-red-50"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-5 h-5" />
                    Logout
                  </Button>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-background-card rounded-2xl p-6 shadow-lg shadow-[hsl(var(--primary))]/5">
                <h3 className="font-serif text-lg font-bold text-primary mb-4">
                  Recent Activity
                </h3>
                <div className="space-y-4">
                  {bookings.slice(0, 3).map((booking: BookingType) => (
                    <div key={booking._id || booking.id} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-[hsl(var(--secondary))] mt-2" />
                      <div>
                        <p className="text-sm text-primary">
                          Booked consultation with {booking.astrologerName || 'an astrologer'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(booking.createdAt || booking.date || '').toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
