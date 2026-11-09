import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Phone, Video, MessageSquare, Star, User, Settings, LogOut, TrendingUp, Users, DollarSign, CheckCircle, XCircle, Loader2, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { User as UserType } from '@/types';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { astrologersApi } from '@/api/astrologers';
import { profileApi } from '@/api/profile';
import type { AvailabilitySlot } from '@/types/api';

interface BookingType {
  _id?: string;
  id?: string;
  userName: string;
  userEmail?: string;
  astrologerName?: string;
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

export default function AstrologerDashboard() {
  useDocumentTitle('Astrologer Dashboard');
  const navigate = useNavigate();
  const authContext = useAuth();
  const user = authContext?.user as UserType | null;
  const logout = authContext?.logout;

  const [activeTab, setActiveTab] = useState<'upcoming' | 'requests' | 'completed'>('upcoming');
  const [bookings, setBookings] = useState<BookingType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [earnings, setEarnings] = useState<{ totalEarnings: number; totalConsultations: number } | null>(null);
  const [loadingEarnings, setLoadingEarnings] = useState(true);

  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get('/bookings/astrologer/my-consultations');
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

    const fetchEarnings = async () => {
      try {
        setLoadingEarnings(true);
        const earningsData = await profileApi.getEarningsSummary();
        setEarnings(earningsData);
      } catch (err: any) {
        console.error('Failed to fetch earnings:', err.message);
        setEarnings({ totalEarnings: 0, totalConsultations: 0 });
      } finally {
        setLoadingEarnings(false);
      }
    };

    fetchBookings();
    fetchEarnings();
  }, []);

  const openScheduleDialog = async () => {
    if (!user?._id) return;
    setScheduleDialogOpen(true);
    setScheduleLoading(true);
    try {
      const slots = await astrologersApi.getAvailability(user._id);
      setAvailability(slots.length ? slots : [
        { day: 'Monday', startTime: '08:00', endTime: '20:00' },
      ]);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to load availability';
      toast.error(msg);
      setAvailability([
        { day: 'Monday', startTime: '08:00', endTime: '20:00' },
      ]);
    } finally {
      setScheduleLoading(false);
    }
  };

  const updateSlot = (index: number, field: keyof AvailabilitySlot, value: string) => {
    setAvailability((prev) =>
      prev.map((slot, i) => (i === index ? { ...slot, [field]: value } : slot)),
    );
  };

  const addSlot = () => {
    setAvailability((prev) => [
      ...prev,
      { day: 'Monday', startTime: '08:00', endTime: '20:00' },
    ]);
  };

  const removeSlot = (index: number) => {
    setAvailability((prev) => prev.filter((_, i) => i !== index));
  };

  const saveSchedule = async () => {
    if (!user?._id) return;
    if (!availability.length) {
      toast.error('Please add at least one availability slot');
      return;
    }

    // Basic client-side validation before hitting the API
    for (const slot of availability) {
      if (!slot.day || !slot.startTime || !slot.endTime) {
        toast.error('Each slot must have a day, start time, and end time');
        return;
      }
      if (slot.startTime >= slot.endTime) {
        toast.error('Start time must be before end time');
        return;
      }
    }

    try {
      setScheduleSaving(true);
      await astrologersApi.updateAvailability(user._id, availability);
      toast.success('Availability updated successfully');
      setScheduleDialogOpen(false);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to update availability';
      toast.error(msg);
    } finally {
      setScheduleSaving(false);
    }
  };

  if (!user || user.role !== 'astrologer') {
    return (
      <div className="min-h-screen bg-background pt-24 flex items-center justify-center">
        <div className="text-center bg-background-card p-8 rounded-2xl shadow-xl">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-primary mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-6">Only astrologers can access this dashboard</p>
          <Button onClick={() => navigate('/login')} className="btn-primary">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  if (!user || (loading && bookings.length === 0)) {
    return (
      <div className="min-h-screen bg-background pt-24 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">{!user ? 'Loading astrologer profile...' : 'Fetching your consultations...'}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background pt-24 flex items-center justify-center">
        <div className="text-center bg-background-card p-8 rounded-2xl shadow-xl">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-primary mb-2">Error Loading Dashboard</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => window.location.reload()} className="btn-primary">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const upcomingBookings = bookings.filter((b: BookingType) => b.status === 'confirmed');
  const pendingRequests = bookings.filter((b: BookingType) => b.status === 'pending');
  const completedBookings = bookings.filter((b: BookingType) => b.status === 'completed');

  const stats = [
    {
      label: 'Total Earnings',
      value: earnings && !loadingEarnings ? `₹${earnings.totalEarnings.toLocaleString()}` : (loadingEarnings ? 'Loading...' : `₹${bookings.reduce((sum, b) => sum + (b.amount || b.totalAmount || 0), 0).toLocaleString()}`),
      icon: DollarSign,
    },
    {
      label: 'Consultations',
      value: earnings && !loadingEarnings ? earnings.totalConsultations.toString() : bookings.length.toString(),
      icon: CheckCircle,
    },
    {
      label: 'Clients',
      value: new Set(bookings.map((b) => b.userName)).size.toString(),
      icon: Users,
    },
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

  const handleAcceptBooking = async (bookingId: string) => {
    try {
      const response = await api.patch(`/bookings/${bookingId}/status`, { status: 'confirmed' });
      if (response.data.ok) {
        toast.success('Booking accepted!');
        // Refresh bookings
        const response = await api.get('/bookings/astrologer/my-consultations');
        if (response.data.ok) {
          setBookings(response.data.data || []);
        }
      } else {
        toast.error(response.data.message || 'Failed to accept booking');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to accept booking');
    }
  };

  const handleRejectBooking = async (bookingId: string) => {
    try {
      const response = await api.patch(`/bookings/${bookingId}/status`, { status: 'cancelled', reason: 'Rejected by astrologer' });
      if (response.data.ok) {
        toast.info('Booking rejected');
        // Refresh bookings
        const response = await api.get('/bookings/astrologer/my-consultations');
        if (response.data.ok) {
          setBookings(response.data.data || []);
        }
      } else {
        toast.error(response.data.message || 'Failed to reject booking');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reject booking');
    }
  };

  const today = new Date();
  const todayName = DAYS[today.getDay()];
  const todaySlots = availability
    .filter((slot) => slot.day === todayName)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const formatTime = (time: string) => {
    const [hStr, mStr] = time.split(':');
    const hours = parseInt(hStr, 10);
    const minutes = parseInt(mStr || '0', 10);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary to-secondary rounded-3xl p-8 mb-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-background-card/20 flex items-center justify-center overflow-hidden">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.fullName} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10" />
                )}
              </div>
              <div>
                <h1 className="font-serif text-3xl font-bold mb-1">Welcome, {user?.fullName}!</h1>
                <p className="text-white/80">Manage your consultations and availability</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="bg-background-card/10 border-white/30 text-white hover:bg-background-card/20"
                onClick={openScheduleDialog}
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
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

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="bg-background-card rounded-2xl shadow-lg shadow-[hsl(var(--primary))]/5 overflow-hidden">
              <div className="flex border-b border-border">
                {[
                  { id: 'upcoming', label: 'Upcoming Sessions' },
                  { id: 'requests', label: 'New Requests' },
                  { id: 'completed', label: 'Completed' },
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
                    {tab.id === 'requests' && pendingRequests.length > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                        {pendingRequests.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {activeTab === 'upcoming' && (
                  <div className="space-y-4">
                    {upcomingBookings.length > 0 ? (
                      upcomingBookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="flex flex-col md:flex-row md:items-center gap-4 p-4 bg-background-elevated rounded-xl"
                        >
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-accent to-accent flex items-center justify-center">
                            <span className="text-white font-bold">{(booking.userName || 'U').charAt(0)}</span>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-primary">{booking.userName || 'User'}</h4>
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(booking.bookingDate || booking.date || new Date()).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {booking.time}
                              </span>
                              <span className="flex items-center gap-1">
                                {booking.consultationType === 'audio' && <Phone className="w-4 h-4" />}
                                {booking.consultationType === 'video' && <Video className="w-4 h-4" />}
                                {booking.consultationType === 'chat' && <MessageSquare className="w-4 h-4" />}
                                {booking.consultationType}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-primary">₹{booking.amount || booking.totalAmount}</span>
                            <Button
                              size="sm"
                              className="btn-primary"
                              onClick={() => navigate(`/consultation/${booking.id || booking._id}`)}
                            >
                              Join
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="font-serif text-xl font-bold text-primary mb-2">
                          No upcoming sessions
                        </h3>
                        <p className="text-muted-foreground">Your upcoming consultations will appear here</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'requests' && (
                  <div className="space-y-4">
                    {pendingRequests.length > 0 ? (
                      pendingRequests.map((booking) => (
                        <div
                          key={booking.id}
                          className="flex flex-col md:flex-row md:items-center gap-4 p-4 bg-background-elevated rounded-xl"
                        >
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-accent to-accent flex items-center justify-center">
                            <span className="text-white font-bold">{(booking.userName || 'U').charAt(0)}</span>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-primary">{booking.userName || 'User'}</h4>
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(booking.bookingDate || booking.date || new Date()).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {booking.time}
                              </span>
                              <span className="flex items-center gap-1">
                                {booking.consultationType === 'audio' && <Phone className="w-4 h-4" />}
                                {booking.consultationType === 'video' && <Video className="w-4 h-4" />}
                                {booking.consultationType === 'chat' && <MessageSquare className="w-4 h-4" />}
                                {booking.consultationType}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-primary">₹{booking.amount || booking.totalAmount}</span>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-destructive border-red-200 hover:bg-red-50"
                                onClick={() => handleRejectBooking(booking._id || booking.id || '')}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleAcceptBooking(booking._id || booking.id || '')}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <CheckCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="font-serif text-xl font-bold text-primary mb-2">
                          No new requests
                        </h3>
                        <p className="text-muted-foreground">New booking requests will appear here</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'completed' && (
                  <div className="space-y-4">
                    {completedBookings.length > 0 ? (
                      completedBookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="flex flex-col md:flex-row md:items-center gap-4 p-4 bg-background-elevated rounded-xl"
                        >
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-accent to-accent flex items-center justify-center">
                            <span className="text-white font-bold">{(booking.userName || 'U').charAt(0)}</span>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-primary">{booking.userName || 'User'}</h4>
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(booking.bookingDate || booking.date || new Date()).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1">
                                {booking.consultationType === 'audio' && <Phone className="w-4 h-4" />}
                                {booking.consultationType === 'video' && <Video className="w-4 h-4" />}
                                {booking.consultationType === 'chat' && <MessageSquare className="w-4 h-4" />}
                                {booking.consultationType}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-primary">₹{booking.amount || booking.totalAmount}</span>
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-background-elevated text-secondary">
                              Completed
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <TrendingUp className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="font-serif text-xl font-bold text-primary mb-2">
                          No completed consultations
                        </h3>
                        <p className="text-muted-foreground">Your completed sessions will appear here</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Availability */}
            <div className="bg-background-card rounded-2xl p-6 shadow-lg shadow-[hsl(var(--primary))]/5">
              <h3 className="font-serif text-lg font-bold text-primary mb-4">
                Today's Schedule
              </h3>
              {scheduleLoading ? (
                <div className="flex items-center justify-center py-4 text-muted-foreground">
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Loading schedule...
                </div>
              ) : (
                <div className="space-y-3">
                  {todaySlots.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No availability configured for today. Use "Manage Schedule" to add your working hours.
                    </p>
                  ) : (
                    todaySlots.map((slot, index) => (
                      <div
                        key={`${slot.day}-${slot.startTime}-${slot.endTime}-${index}`}
                        className="flex items-center justify-between p-3 rounded-lg bg-green-50"
                      >
                        <span className="text-sm font-medium">
                          {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-green-200 text-green-700">
                          available
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
              <Button variant="outline" className="w-full justify-center mt-4" onClick={openScheduleDialog}>
                <Calendar className="w-4 h-4 mr-2" />
                Manage Schedule
              </Button>
            </div>

            {/* Earnings */}
            <div className="bg-background-card rounded-2xl p-6 shadow-lg shadow-[hsl(var(--primary))]/5">
              <h3 className="font-serif text-lg font-bold text-primary mb-4">
                Earnings Overview
              </h3>
              <div className="space-y-4">
                {loadingEarnings ? (
                  <div className="flex items-center justify-center py-4 text-muted-foreground">
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Loading earnings...
                  </div>
                ) : earnings ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Earnings</span>
                      <span className="font-semibold text-primary">₹{earnings.totalEarnings.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Consultations</span>
                      <span className="font-semibold text-primary">{earnings.totalConsultations}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Completed Sessions</span>
                      <span className="font-semibold text-primary">{completedBookings.length}</span>
                    </div>
                    <div className="pt-4 border-t border-border">
                      <Button variant="outline" className="w-full">
                        View Details
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Earnings</span>
                      <span className="font-semibold text-primary">₹0</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Consultations</span>
                      <span className="font-semibold text-primary">0</span>
                    </div>
                    <div className="pt-4 border-t border-border">
                      <Button variant="outline" className="w-full">
                        View Details
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-background-card rounded-2xl p-6 shadow-lg shadow-[hsl(var(--primary))]/5">
              <h3 className="font-serif text-lg font-bold text-primary mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start gap-3">
                  <Settings className="w-5 h-5" />
                  Edit Profile
                </Button>
                <Button variant="outline" className="w-full justify-start gap-3" onClick={openScheduleDialog}>
                  <Calendar className="w-5 h-5" />
                  Manage Schedule
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
          </div>
        </div>
      </div>

      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Manage Schedule</DialogTitle>
            <DialogDescription>
              Define your weekly availability. Users will only be able to book consultations during these time windows.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-3 max-h-[360px] overflow-y-auto pr-1">
            {scheduleLoading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Loading availability...
              </div>
            ) : availability.length === 0 ? (
              <p className="text-sm text-muted-foreground">No availability configured yet. Add your first time slot.</p>
            ) : (
              availability.map((slot, index) => (
                <div key={index} className="flex items-center gap-3">
                  <select
                    className="w-32 py-2 px-2 border border-border rounded-lg text-sm bg-background-card"
                    value={slot.day}
                    onChange={(e) => updateSlot(index, 'day', e.target.value)}
                  >
                    {DAYS.map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                  <Input
                    type="time"
                    value={slot.startTime}
                    onChange={(e) => updateSlot(index, 'startTime', e.target.value)}
                    className="w-28"
                  />
                  <span className="text-sm text-muted-foreground">to</span>
                  <Input
                    type="time"
                    value={slot.endTime}
                    onChange={(e) => updateSlot(index, 'endTime', e.target.value)}
                    className="w-28"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0 text-destructive hover:bg-red-50"
                    onClick={() => removeSlot(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <Button type="button" variant="outline" onClick={addSlot}>
              <Plus className="w-4 h-4 mr-2" />
              Add Time Slot
            </Button>
          </div>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setScheduleDialogOpen(false)}
              disabled={scheduleSaving}
            >
              Cancel
            </Button>
            <Button type="button" onClick={saveSchedule} disabled={scheduleSaving} className="btn-primary">
              {scheduleSaving ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </span>
              ) : (
                'Save Schedule'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
