import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Star, Calendar, DollarSign, Settings, LogOut, CheckCircle, XCircle, Search, Filter, BarChart3, Loader2, Plus, X, Upload, AsteriskIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import type { EarningsSummary } from '@/api/profile';

interface RevenueChartData {
  labels: string[];
  revenue: number[];
  counts: number[];
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PHONE_REGEX = /^[0-9+]+$/;

interface BookingType {
  _id?: string;
  id?: string;
  bookingId?: string;
  userName: string;
  userEmail?: string;
  astrologerName?: string;
  bookingDate?: string;
  date?: string;
  amount?: number;
  totalAmount?: number; // legacy fallback
  status: string;
  createdAt?: string;
}

interface AdminUserType {
  _id?: string;
  id?: string;
  fullName?: string;
  name?: string;
  email: string;
  phoneNumber?: string;
  role: string;
  isActive?: boolean;
  isProfileComplete?: boolean;
  lastLoginAt?: string;
  astrologerProfileId?: string;
  avatar?: string;
  createdAt?: string;
  skills?: string[];
  experienceYears?: number;
  isVerified?: boolean;
  title?: string;
  profileImage?: string;
  // rating removed temporarily
  specializations?: string[];
  totalBookings?: number;
  joinDate?: string;
}

export default function AdminDashboard() {
  useDocumentTitle('Admin Dashboard');
  const navigate = useNavigate();
  const authContext = useAuth();
  const user = authContext?.user as any;
  const logout = authContext?.logout;
  const [bookings, setBookings] = useState<BookingType[]>([]);
  const [users, setUsers] = useState<AdminUserType[]>([]);
  const [astrologers, setAstrologers] = useState<AdminUserType[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [revenueChart, setRevenueChart] = useState<RevenueChartData | null>(null);
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [monitoring, setMonitoring] = useState<any | null>(null);
  const [monitoringLoading, setMonitoringLoading] = useState(false);
  const [monitoringError, setMonitoringError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'astrologers' | 'bookings' | 'payments' | 'monitoring'>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [showAstrologerModal, setShowAstrologerModal] = useState(false);
  // image upload state for astrologer creation
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [astrologerAvailability, setAstrologerAvailability] = useState<Array<{ day: string; startTime: string; endTime: string }>>([
    { day: 'Monday', startTime: '09:00', endTime: '17:00' }
  ]);

  // State for search and filters - for future implementation
  /*
  const [userSearch, setUserSearch] = useState('');
  const [astrologerSearch, setAstrologerSearch] = useState('');
  const [bookingSearch, setBookingSearch] = useState('');
  */

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch bookings
        const bookingsResponse = await api.get('/admin/list-all-bookings');
        if (bookingsResponse.data.ok) {
          setBookings(bookingsResponse.data.data || []);
        } else {
          setError(bookingsResponse.data.message || 'Failed to fetch bookings');
        }

        // Fetch users
        const usersResponse = await api.get('/admin/users');
        if (usersResponse.data.ok) {
          setUsers(usersResponse.data.data || []);
        } else {
          setError(usersResponse.data.message || 'Failed to fetch users');
        }

        // Fetch astrologers
        const astrologersResponse = await api.get('/admin/astrologers');
        if (astrologersResponse.data.ok) {
          setAstrologers(astrologersResponse.data.data || []);
        } else {
          setError(astrologersResponse.data.message || 'Failed to fetch astrologers');
        }

        // Fetch payments
        try {
          const paymentsResponse = await api.get('/admin/payments');
          if (paymentsResponse.data?.ok) {
            setPayments(paymentsResponse.data.data || []);
          }
        } catch (paymentsErr: any) {
          console.error('Failed to fetch payments:', paymentsErr.message);
        }

        // Fetch revenue chart data
        try {
          setRevenueLoading(true);
          const revenueResponse = await api.get('/admin/revenue/chart');
          if (revenueResponse.data?.ok) {
            setRevenueChart(revenueResponse.data.data);
          }
        } catch (revenueErr: any) {
          console.error('Failed to fetch revenue chart:', revenueErr.message);
        } finally {
          setRevenueLoading(false);
        }

        // Fetch monitoring summary (non-fatal if it fails)
        try {
          setMonitoringLoading(true);
          const monitoringResponse = await api.get('/admin/monitoring/summary');
          if (monitoringResponse.data?.ok) {
            setMonitoring(monitoringResponse.data.data);
            setMonitoringError(null);
          } else if (monitoringResponse.data?.message) {
            setMonitoringError(monitoringResponse.data.message);
          }
        } catch (monitoringErr: any) {
          const msg = monitoringErr.response?.data?.message || 'Failed to load monitoring data';
          setMonitoringError(msg);
        } finally {
          setMonitoringLoading(false);
        }
      } catch (err: any) {
        const errorMsg = err.response?.data?.message || 'Failed to fetch data';
        setError(errorMsg);
        // Don't show toast for 401, handled by interceptor
        if (err.response?.status !== 401) {
          toast.error(errorMsg);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  
  // Role-based access control
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background pt-24 flex items-center justify-center">
        <div className="text-center bg-background-card p-8 rounded-2xl shadow-xl">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-primary mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-6">Only admins can access this dashboard</p>
          <Button onClick={() => navigate('/login')} className="btn-primary">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Total Users',
      value: users.length.toString(),
      icon: Users,
      color: 'from-blue-500 to-blue-600',
    },
    {
      label: 'Total Astrologers',
      value: astrologers.length.toString(),
      icon: Star,
      color: 'from-purple-500 to-purple-600',
    },
    {
      label: 'Total Bookings',
      value: bookings.length.toString(),
      icon: Calendar,
      color: 'from-green-500 to-green-600',
    },
    {
      label: 'Total Revenue',
      value: `₹${bookings
        .reduce((sum, b) => sum + (b.amount || b.totalAmount || 0), 0)
        .toLocaleString()}`,
      icon: DollarSign,
      color: 'from-orange-500 to-orange-600',
    },
  ];

  const recentBookings = bookings.slice(0, 5);
  const recentUsers = users.slice(0, 5);

  const handleLogout = async () => {
    try {
      await logout?.();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/login');
    }
  };

  const handleApproveAstrologer = async (id: string , isVerified: boolean) => {
    try {
      const response = await api.patch(`/admin/astrologer/${id}/status`, { isVerified: !isVerified });
      if (response.data.ok) {
        toast.success(isVerified ? 'Astrologer unverified successfully' : 'Astrologer verified successfully');
        // Refresh data
        const astrologersResponse = await api.get('/admin/astrologers');
        if (astrologersResponse.data.ok) {
          setAstrologers(astrologersResponse.data.data || []);
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to verify astrologer');
    }
  };

  const handleRejectAstrologer = async (id: string) => {
    try {
      const response = await api.patch(`/admin/astrologer/${id}/status`, { isVerified: false });
      if (response.data.ok) {
        toast.info('Astrologer unverified');
        // Refresh data
        const astrologersResponse = await api.get('/admin/astrologers');
        if (astrologersResponse.data.ok) {
          setAstrologers(astrologersResponse.data.data || []);
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to unverify astrologer');
    }
  };

  const handleToggleUserStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await api.patch(`/admin/users/${id}/status`, { isActive: !currentStatus });
      if (response.data.ok) {
        toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'}`);
        // Refresh data
        const usersResponse = await api.get('/admin/users');
        if (usersResponse.data.ok) {
          setUsers(usersResponse.data.data || []);
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update user status');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    try {
      const response = await api.delete(`/admin/users/${id}`);
      if (response.data.ok) {
        toast.success('User deleted successfully');
        // Refresh data
        const usersResponse = await api.get('/admin/users');
        if (usersResponse.data.ok) {
          setUsers(usersResponse.data.data || []);
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleDeleteAstrologer = async (id: string) => {
    if (!confirm('Are you sure you want to delete this astrologer? This action cannot be undone.')) {
      return;
    }
    try {
      const response = await api.delete(`/admin/astrologer/${id}`);
      if (response.data.ok) {
        toast.success('Astrologer deleted successfully');
        // Refresh data
        const astrologersResponse = await api.get('/admin/astrologers');
        if (astrologersResponse.data.ok) {
          setAstrologers(astrologersResponse.data.data || []);
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete astrologer');
    }
  };

  // Create user handler
  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const userData = {
      fullName: formData.get('fullName') as string,
      email: formData.get('email') as string,
      phoneNumber: formData.get('phoneNumber') as string,
      role: formData.get('role') as string || 'user'
    };

    try {
      const response = await api.post('/admin/user/create', userData);
      if (response.data.ok) {
        toast.success('User created successfully');
        setShowUserModal(false);
        // Refresh users list
        const usersResponse = await api.get('/admin/users');
        if (usersResponse.data.ok) {
          setUsers(usersResponse.data.data || []);
        }
      } else {
        toast.error(response.data.message || 'Failed to create user');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  // client-side regexes to mirror backend validation
  const PHONE_REGEX = /^[0-9+]{8,15}$/;

  // Create astrologer handler
  const updateAstrologerAvailability = (index: number, field: 'day' | 'startTime' | 'endTime', value: string) => {
    const availability = [...astrologerAvailability];
    availability[index][field] = value;
    setAstrologerAvailability(availability);
  };

  const addAstrologerAvailability = () => {
    setAstrologerAvailability([
      ...astrologerAvailability,
      { day: 'Monday', startTime: '', endTime: '' }
    ]);
  };

  const removeAstrologerAvailability = (index: number) => {
    setAstrologerAvailability(astrologerAvailability.filter((_, i) => i !== index));
  };

  const handleCreateAstrologer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const skills = (formData.get('skills') as string)
      .split(',')
      .map(s => s.trim())
      .filter(s => s);

    // basic front-end validation before touching the network
    const phone = (formData.get('phoneNumber') as string) || '';
    if (!PHONE_REGEX.test(phone)) {
      toast.error('Phone number must be 8–15 digits and may include +');
      setSubmitting(false);
      return;
    }
    if (skills.length === 0) {
      toast.error('Please specify at least one skill');
      setSubmitting(false);
      return;
    }

    // if an image file was chosen, upload it before sending the payload
    const uploadImage = async (): Promise<string | null> => {
      if (!profileImageFile) return null;
      try {
        const sigRes = await api.get('/api/cloudinary/signature');
        const { signature, timestamp, cloudName, apiKey } = sigRes.data.data;
        const fd = new FormData();
        fd.append('file', profileImageFile);
        fd.append('api_key', apiKey);
        fd.append('timestamp', timestamp);
        fd.append('signature', signature);
        const uploadRes = await fetch(
          `${import.meta.env.VITE_CLOUDINARY_UPLOAD_BASE}/${cloudName}/image/upload`,
          { method: 'POST', body: fd }
        );
        const data = await uploadRes.json();
        return data.secure_url;
      } catch (err) {
        console.error('Image upload failed:', err);
        return null;
      }
    };

    let imageUrl = formData.get('profileImageUrl') as string;
    if (profileImageFile) {
      const uploaded = await uploadImage();
      if (uploaded) {
        imageUrl = uploaded;
      }
    }

    const title = (formData.get('title') as string) || '';
    const languages = (formData.get('languages') as string)
      .split(',')
      .map(l => l.trim())
      .filter(Boolean);

    const astrologerData = {
      fullName: formData.get('fullName') as string,
      email: formData.get('email') as string,
      phoneNumber: formData.get('phoneNumber') as string,
      title,
      skills: skills,
      experienceYears: parseInt(formData.get('experienceYears') as string) || 0,
      languages,
      profileImage: imageUrl || import.meta.env.VITE_DEFAULT_PROFILE_IMAGE_URL,
      availability: astrologerAvailability
    };

    try {
      const response = await api.post('/admin/astrologer/create', astrologerData);
      if (response.data.ok) {
        toast.success('Astrologer created successfully');
        setShowAstrologerModal(false);
        // clear image state so next open starts fresh
        setProfileImageFile(null);
        setPreviewUrl('');
        // Refresh astrologers list
        const astrologersResponse = await api.get('/admin/astrologers');
        if (astrologersResponse.data.ok) {
          setAstrologers(astrologersResponse.data.data || []);
        }
      } else {
        toast.error(response.data.message || 'Failed to create astrologer');
      }
    } catch (error: any) {
      const status = error.response?.status;
      let msg = error.response?.data?.message || error.response?.data?.error?.message;
      if (status === 422) {
        const details: string[] = error.response?.data?.error?.details || [];
        msg = details.join(', ') || msg || 'Invalid form data';
        console.error('Validation failed:', details);
      }
      toast.error(msg || 'Failed to create astrologer');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Loading state */}
        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="text-center py-12 text-destructive">
            <p>{error}</p>
            <Button
              className="mt-4"
              onClick={() => {
                setError(null);
                // Retry fetching data
                const fetchData = async () => {
                  try {
                    setLoading(true);
                    const bookingsResponse = await api.get('/admin/list-all-bookings');
                    if (bookingsResponse.data.ok) {
                      setBookings(bookingsResponse.data.data || []);
                    }

                    const usersResponse = await api.get('/admin/users');
                    if (usersResponse.data.ok) {
                      setUsers(usersResponse.data.data || []);
                    }

                    const astrologersResponse = await api.get('/admin/astrologers');
                    if (astrologersResponse.data.ok) {
                      setAstrologers(astrologersResponse.data.data || []);
                    }
                  } catch (err: any) {
                    setError(err.response?.data?.message || 'Failed to fetch data');
                    toast.error('Failed to load dashboard data');
                  } finally {
                    setLoading(false);
                  }
                };
                fetchData();
              }}
            >
              Retry
            </Button>
          </div>
        )}

        {/* Main content */}
        {!loading && !error && (
          <>
            {/* Header */}
            <div className="bg-gradient-to-br from-primary to-secondary rounded-2xl lg:rounded-3xl p-5 lg:p-8 mb-6 lg:mb-8 text-white">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 lg:gap-6">
                <div>
                  <h1 className="font-serif text-2xl lg:text-3xl font-bold mb-1">Admin Dashboard</h1>
                  <p className="text-white/80 text-sm lg:text-base">Manage users, astrologers, and platform operations</p>
                </div>
                <div className="flex flex-wrap gap-2 lg:gap-3">
                  <Button
                    variant="outline"
                    className="bg-background-card/10 border-white/30 text-white hover:bg-background-card/20"
                    onClick={() => navigate('/complete-profile')}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Button>
                  <Button
                    variant="outline"
                    className="bg-background-card/10 border-white/30 text-white hover:bg-background-card/20"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
              {stats.map((stat) => (
                <div key={stat.label} className="bg-background-card rounded-2xl p-6 shadow-lg shadow-[hsl(var(--primary))]/5">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-primary mb-1">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Navigation Tabs */}
            <div className="bg-background-card rounded-2xl shadow-lg shadow-[hsl(var(--primary))]/5 overflow-hidden mb-8">
              <div className="flex border-b border-border overflow-x-auto">
                {[
                  { id: 'overview', label: 'Overview', icon: BarChart3 },
                  { id: 'users', label: 'Users', icon: Users },
                  { id: 'astrologers', label: 'Astrologers', icon: Star },
                  { id: 'bookings', label: 'Bookings', icon: Calendar },
                  { id: 'payments', label: 'Payments', icon: DollarSign },
                  { id: 'monitoring', label: 'Monitoring', icon: AsteriskIcon },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab.id
                      ? 'text-primary border-b-2 border-[hsl(var(--secondary))]'
                      : 'text-muted-foreground hover:text-primary'
                      }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-8">
                    {/* Charts Row */}
                    <div className="grid lg:grid-cols-2 gap-8">
                      {/* Revenue Chart */}
                      <div className="bg-background-elevated rounded-2xl p-6">
                        <h3 className="font-serif text-lg font-bold text-primary mb-4">
                          Revenue Overview
                        </h3>
                        {revenueLoading ? (
                          <div className="flex items-center justify-center h-64">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                          </div>
                        ) : revenueChart ? (
                          <div className="h-64 flex items-end justify-around">
                            {revenueChart.labels.map((label, i) => (
                              <div key={label} className="flex flex-col items-center gap-2">
                                <div
                                  className="w-12 bg-gradient-to-t from-primary to-secondary rounded-t-lg"
                                  style={{
                                    height: `${Math.max(40, (revenueChart.revenue[i] / Math.max(1, ...revenueChart.revenue)) * 200)}px`
                                  }}
                                />
                                <span className="text-xs text-muted-foreground">{label}</span>
                                <span className="text-xs font-medium text-primary">
                                  ₹{revenueChart.revenue[i].toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-64 text-muted-foreground">
                            No revenue data available
                          </div>
                        )}
                      </div>

                      {/* Booking Stats */}
                      <div className="bg-background-elevated rounded-2xl p-6">
                        <h3 className="font-serif text-lg font-bold text-primary mb-4">
                          Booking Statistics
                        </h3>
                        <div className="space-y-4">
                          {[
                            { label: 'Completed', value: bookings.filter(b => b.status === 'completed').length, color: 'bg-green-500' },
                            { label: 'Pending', value: bookings.filter(b => b.status === 'pending').length, color: 'bg-yellow-500' },
                            { label: 'Cancelled', value: bookings.filter(b => b.status === 'cancelled').length, color: 'bg-red-500' },
                            { label: 'Confirmed', value: bookings.filter(b => b.status === 'confirmed').length, color: 'bg-blue-500' },
                          ].map((stat) => (
                            <div key={stat.label}>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-muted-foreground">{stat.label}</span>
                                <span className="font-medium text-primary">{stat.value.toLocaleString()}</span>
                              </div>
                              <div className="h-2 bg-border rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${stat.color} rounded-full`}
                                  style={{ width: `${Math.min(100, (stat.value / Math.max(1, bookings.length)) * 100)}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="grid lg:grid-cols-2 gap-8">
                      <div className="bg-background-card border border-border rounded-2xl p-6">
                        <h3 className="font-serif text-lg font-bold text-primary mb-4">
                          Recent Bookings
                        </h3>
                        <div className="space-y-4">
                          {recentBookings.map((booking) => (
                            <div key={booking._id || booking.id} className="flex items-center gap-4 p-3 bg-background-elevated rounded-xl">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-accent flex items-center justify-center">
                                <span className="text-white font-bold text-sm">{booking.astrologerName?.charAt(0) || 'A'}</span>
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-primary">{booking.astrologerName}</p>
                                <p className="text-xs text-muted-foreground">{booking.userName || 'N/A'}</p>
                              </div>
                              <span className="text-sm font-semibold text-primary">₹{booking.amount || booking.totalAmount}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-background-card border border-border rounded-2xl p-6">
                        <h3 className="font-serif text-lg font-bold text-primary mb-4">
                          New Users
                        </h3>
                        <div className="space-y-4">
                          {recentUsers.map((user) => (
                            <div key={user._id} className="flex items-center gap-4 p-3 bg-background-elevated rounded-xl">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-accent flex items-center justify-center">
                                <span className="text-white font-bold text-sm">{(user.name || user.fullName || 'U').charAt(0)}</span>
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-primary">{user.name || user.fullName || 'Unknown User'}</p>
                                <p className="text-xs text-muted-foreground">{user.email}</p>
                              </div>
                              <span className={`text-xs px-2 py-1 rounded-full ${user.role === 'admin' ? 'bg-primary/15 text-purple-700' :
                                user.role === 'astrologer' ? 'bg-blue-100 text-blue-700' :
                                  'bg-success/20 text-green-700'
                                }`}>
                                {user.role}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div className="relative max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="Search users..."
                          className="pl-12 py-6 border-2 border-border rounded-xl"
                        />
                      </div>
                      <div className="flex gap-3">
                        <Button variant="outline">
                          <Filter className="w-4 h-4 mr-2" />
                          Filter
                        </Button>
                        <Button className="btn-primary" onClick={() => setShowUserModal(true)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add New User
                        </Button>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-4 px-4 font-medium text-muted-foreground">User</th>
                            <th className="text-left py-4 px-4 font-medium text-muted-foreground">Email</th>
                            <th className="text-left py-4 px-4 font-medium text-muted-foreground">Role</th>
                            <th className="text-left py-4 px-4 font-medium text-muted-foreground">Status</th>
                            <th className="text-left py-4 px-4 font-medium text-muted-foreground">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((user: AdminUserType) => (
                            <tr key={user._id} className="border-b border-border hover:bg-background-elevated">
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-accent flex items-center justify-center">
                                    <span className="text-white font-bold">{user.fullName?.charAt(0) || 'U'}</span>
                                  </div>
                                  <span className="font-medium text-primary">{user.fullName}</span>
                                </div>
                              </td>
                              <td className="py-4 px-4 text-muted-foreground">{user.email}</td>
                              <td className="py-4 px-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-primary/15 text-purple-700' :
                                  user.role === 'astrologer' ? 'bg-blue-100 text-blue-700' :
                                    'bg-success/20 text-green-700'
                                  }`}>
                                  {user.role}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-success/20 text-green-700">
                                  {user.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleToggleUserStatus(user._id || '', user.isActive || false)}
                                  >
                                    {user.isActive ? 'Deactivate' : 'Activate'}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDeleteUser(user._id || '')}
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Astrologers Tab */}
                {activeTab === 'astrologers' && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div className="relative max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="Search astrologers..."
                          className="pl-12 py-6 border-2 border-border rounded-xl"
                        />
                      </div>
                      <div className="flex gap-3">
                        <Button variant="outline">
                          <Filter className="w-4 h-4 mr-2" />
                          Filter
                        </Button>
                        <Button className="btn-primary" onClick={() => setShowAstrologerModal(true)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Astrologer
                        </Button>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {astrologers.map((astrologer: AdminUserType) => (
                        <div key={astrologer._id || astrologer.id} className="bg-background-elevated rounded-2xl p-6">
                          <div className="flex items-center gap-4 p-3 bg-background-elevated rounded-xl">
                            <img
                              src={astrologer.profileImage || '/placeholder-astrologer.jpg'}
                              alt={astrologer.name || astrologer.fullName || 'Astrologer'}
                              className="w-10 h-10 rounded-full object-cover border-2 border-accent"
                            />
                            <div className="flex-1">
                              <h4 className="font-semibold text-primary">{astrologer.name || astrologer.fullName || 'Unknown Astrologer'}</h4>
                              <p className="text-sm text-muted-foreground">{astrologer.title || 'Astrologer'}</p>
                              {astrologer.experienceYears !== undefined && (
                                <p className="text-xs text-muted-foreground">
                                  {astrologer.experienceYears} yr(s)
                                </p>
                              )}
                              {astrologer.specializations && astrologer.specializations.length > 0 && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {astrologer.specializations.join(', ')}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {astrologer.specializations?.slice(0, 3).map((spec: string) => (
                              <span key={spec} className="px-2 py-1 bg-background-card rounded-full text-xs">
                                {spec}
                              </span>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 text-destructive border-red-200 hover:bg-red-50"
                              onClick={() => handleDeleteAstrologer(astrologer._id || astrologer.id || '')}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                            <Button
                              size="sm"
                              className={`flex-1 ${astrologer.isVerified
                                ? 'bg-orange-600 hover:bg-orange-700'
                                : 'bg-green-600 hover:bg-green-700'}`}
                              onClick={() => astrologer.isVerified
                                ? handleRejectAstrologer(astrologer._id || astrologer.id || '')
                                : handleApproveAstrologer(astrologer._id || astrologer.id || '', astrologer?.isVerified || false) }
                            >
                              {astrologer.isVerified ? (
                                <>
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Unverify
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Verify
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bookings Tab */}
                {activeTab === 'bookings' && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div className="relative max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="Search bookings..."
                          className="pl-12 py-6 border-2 border-border rounded-xl"
                        />
                      </div>
                      <Button variant="outline">
                        <Filter className="w-4 h-4 mr-2" />
                        Filter
                      </Button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-4 px-4 font-medium text-muted-foreground">Booking ID</th>
                            <th className="text-left py-4 px-4 font-medium text-muted-foreground">User</th>
                            <th className="text-left py-4 px-4 font-medium text-muted-foreground">Astrologer</th>
                            <th className="text-left py-4 px-4 font-medium text-muted-foreground">Date</th>
                            <th className="text-left py-4 px-4 font-medium text-muted-foreground">Amount</th>
                            <th className="text-left py-4 px-4 font-medium text-muted-foreground">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bookings.map((booking: BookingType) => (
                            <tr key={booking._id || booking.id} className="border-b border-border hover:bg-background-elevated">
                              <td className="py-4 px-4 font-mono text-sm">{booking.bookingId || booking._id || booking.id}</td>
                              <td className="py-4 px-4 text-primary">{booking.userName || 'User'}</td>
                              <td className="py-4 px-4 text-primary">{booking.astrologerName}</td>
                              <td className="py-4 px-4 text-muted-foreground">
                                {new Date(booking.bookingDate || booking.date || new Date()).toLocaleDateString()}
                              </td>
                              <td className="py-4 px-4 font-semibold text-primary">₹{booking.amount || booking.totalAmount}</td>
                              <td className="py-4 px-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${booking.status === 'confirmed' ? 'bg-success/20 text-green-700' :
                                  booking.status === 'pending' ? 'bg-warning/20 text-yellow-700' :
                                    booking.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                                      booking.status === 'cancelled' ? 'bg-destructive/20 text-red-700' :
                                        'bg-background-elevated text-secondary'
                                  }`}>
                                  {booking.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Payments Tab */}
                {activeTab === 'payments' && (
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white">
                        <p className="text-green-100 text-sm mb-2">Total Revenue</p>
                        <p className="text-3xl font-bold">₹{payments.filter(p => p.status === 'captured').reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString()}</p>
                        <p className="text-green-100 text-sm mt-2">From captured payments</p>
                      </div>
                      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
                        <p className="text-blue-100 text-sm mb-2">This Month</p>
                        <p className="text-3xl font-bold">₹{payments.filter(p => p.status === 'captured' && p.createdAt && new Date(p.createdAt).getMonth() === new Date().getMonth()).reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString()}</p>
                        <p className="text-blue-100 text-sm mt-2">From captured payments</p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
                        <p className="text-purple-100 text-sm mb-2">Pending Payouts</p>
                        <p className="text-3xl font-bold">₹{payments.filter(p => p.status === 'captured' && p.bookingId?.astrologerName).reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString()}</p>
                        <p className="text-purple-100 text-sm mt-2">{payments.filter(p => p.status === 'captured' && p.bookingId?.astrologerName).length} transactions</p>
                      </div>
                    </div>

                    <div className="bg-background-card border border-border rounded-2xl p-6">
                      <h3 className="font-serif text-lg font-bold text-primary mb-4">
                        Recent Transactions
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left py-4 px-4 font-medium text-muted-foreground">Transaction ID</th>
                              <th className="text-left py-4 px-4 font-medium text-muted-foreground">User</th>
                              <th className="text-left py-4 px-4 font-medium text-muted-foreground">Astrologer</th>
                              <th className="text-left py-4 px-4 font-medium text-muted-foreground">Amount</th>
                              <th className="text-left py-4 px-4 font-medium text-muted-foreground">Method</th>
                              <th className="text-left py-4 px-4 font-medium text-muted-foreground">Status</th>
                              <th className="text-left py-4 px-4 font-medium text-muted-foreground">Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {payments.map((payment: any, index: number) => (
                              <tr key={payment._id || payment.id || index} className="border-b border-border hover:bg-background-elevated">
                                <td className="py-4 px-4 font-mono text-sm">{payment.razorpayOrderId || payment.paymentId || `TXN${100000 + index}`}</td>
                                <td className="py-4 px-4 text-primary">{payment.bookingId?.userName || 'N/A'}</td>
                                <td className="py-4 px-4 text-primary">{payment.bookingId?.astrologerName || 'N/A'}</td>
                                <td className="py-4 px-4 font-semibold text-primary">₹{payment.amount?.toLocaleString() || 0}</td>
                                <td className="py-4 px-4 text-muted-foreground">{payment.gateway || 'Razorpay'}</td>
                                <td className="py-4 px-4">
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${payment.status === 'captured' ? 'bg-success/20 text-green-700' :
                                    payment.status === 'failed' ? 'bg-destructive/20 text-red-700' :
                                      payment.status === 'refunded' ? 'bg-warning/20 text-yellow-700' :
                                        'bg-background-elevated text-secondary'
                                  }`}>
                                    {payment.status || 'pending'}
                                  </span>
                                </td>
                                <td className="py-4 px-4 text-muted-foreground">{payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : 'N/A'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Monitoring Tab */}
                {activeTab === 'monitoring' && (
                  <div className="space-y-6">
                    {monitoringLoading && (
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Loading monitoring data...</span>
                      </div>
                    )}

                    {monitoringError && !monitoringLoading && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center justify-between">
                        <span className="text-sm">{monitoringError}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            try {
                              setMonitoringLoading(true);
                              const monitoringResponse = await api.get('/admin/monitoring/summary');
                              if (monitoringResponse.data?.ok) {
                                setMonitoring(monitoringResponse.data.data);
                                setMonitoringError(null);
                              } else if (monitoringResponse.data?.message) {
                                setMonitoringError(monitoringResponse.data.message);
                              }
                            } catch (err: any) {
                              const msg = err.response?.data?.message || 'Failed to load monitoring data';
                              setMonitoringError(msg);
                            } finally {
                              setMonitoringLoading(false);
                            }
                          }}
                        >
                          Retry
                        </Button>
                      </div>
                    )}

                    {monitoring && !monitoringLoading && !monitoringError && (
                      <>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="bg-background-elevated rounded-2xl p-6">
                            <h3 className="font-serif text-lg font-bold text-primary mb-4">System Health</h3>
                            <div className="space-y-3 text-sm">
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">MongoDB</span>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${monitoring.infra?.mongoUp >= 1 ? 'bg-success/20 text-green-700' : 'bg-destructive/20 text-red-700'}`}>
                                  {monitoring.infra?.mongoUp >= 1 ? 'Up' : 'Down'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Redis</span>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${monitoring.infra?.redisUp >= 1 ? 'bg-success/20 text-green-700' : 'bg-destructive/20 text-red-700'}`}>
                                  {monitoring.infra?.redisUp >= 1 ? 'Up' : 'Down'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-background-elevated rounded-2xl p-6">
                            <h3 className="font-serif text-lg font-bold text-primary mb-4">Operational Alerts</h3>
                            <ul className="space-y-2 text-sm text-primary list-disc pl-5">
                              {monitoring.bookings?.failedTotal > 0 && (
                                <li>{monitoring.bookings.failedTotal} booking creation failures since startup</li>
                              )}
                              {monitoring.payments?.failedTotal > 0 && (
                                <li>{monitoring.payments.failedTotal} payment failures recorded</li>
                              )}
                              {monitoring.payments?.webhookUnknownPaymentTotal > 0 && (
                                <li>{monitoring.payments.webhookUnknownPaymentTotal} webhook events for unknown payments</li>
                              )}
                              {monitoring.bookings?.failedTotal === 0 &&
                                monitoring.payments?.failedTotal === 0 &&
                                monitoring.payments?.webhookUnknownPaymentTotal === 0 && (
                                  <li>No critical issues reported by metrics</li>
                                )}
                            </ul>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="bg-background-card border border-border rounded-2xl p-6">
                            <h3 className="font-serif text-lg font-bold text-primary mb-4">Booking Metrics</h3>
                            <div className="space-y-2 text-sm text-primary">
                              <p>Total bookings: <span className="font-semibold">{monitoring.bookings?.total ?? 0}</span></p>
                              <p>Last 24h created: <span className="font-semibold">{monitoring.bookings?.last24h?.created ?? 0}</span></p>
                              <p>Last 24h completed: <span className="font-semibold">{monitoring.bookings?.last24h?.completed ?? 0}</span></p>
                            </div>
                            <div className="mt-4 space-y-1 text-xs text-muted-foreground">
                              {Object.entries(monitoring.bookings?.byStatus || {}).map(([status, count]) => (
                                <div key={status} className="flex justify-between">
                                  <span className="capitalize">{status}</span>
                                  <span className="font-medium text-primary">{(count as number).toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="bg-background-card border border-border rounded-2xl p-6">
                            <h3 className="font-serif text-lg font-bold text-primary mb-4">Payment Metrics</h3>
                            <div className="space-y-2 text-sm text-primary">
                              <p>Total payments: <span className="font-semibold">{monitoring.payments?.total ?? 0}</span></p>
                              <p>Last 24h created: <span className="font-semibold">{monitoring.payments?.last24h?.created ?? 0}</span></p>
                              <p>Last 24h captured: <span className="font-semibold">{monitoring.payments?.last24h?.captured ?? 0}</span></p>
                              <p>Last 24h failed: <span className="font-semibold">{monitoring.payments?.last24h?.failed ?? 0}</span></p>
                            </div>
                            <div className="mt-4 space-y-1 text-xs text-muted-foreground">
                              {Object.entries(monitoring.payments?.byStatus || {}).map(([status, count]) => (
                                <div key={status} className="flex justify-between">
                                  <span className="capitalize">{status}</span>
                                  <span className="font-medium text-primary">{(count as number).toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background-card rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-primary">Add New User</h2>
              <button onClick={() => setShowUserModal(false)} className="p-2 hover:bg-background-elevated rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label htmlFor="admin-user-name" className="block text-sm font-medium text-primary mb-1">Full Name *</label>
                <Input id="admin-user-name" name="fullName" required placeholder="Enter full name" className="w-full" />
              </div>
              <div>
                <label htmlFor="admin-user-email" className="block text-sm font-medium text-primary mb-1">Email *</label>
                <Input id="admin-user-email" name="email" type="email" required placeholder="Enter email" className="w-full" />
              </div>
              <div>
                <label htmlFor="admin-user-phone" className="block text-sm font-medium text-primary mb-1">Phone Number</label>
                <Input id="admin-user-phone" name="phoneNumber" type="tel" placeholder="Enter phone number" className="w-full" />
              </div>
              <div>
                <label htmlFor="admin-user-role" className="block text-sm font-medium text-primary mb-1">Role</label>
                <select id="admin-user-role" name="role" className="w-full px-3 py-2 border-2 border-border rounded-xl">
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowUserModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="flex-1 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary) / 0.85)]">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create User'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Astrologer Modal */}
      {showAstrologerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background-card rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-primary">Add New Astrologer</h2>
              <button 
                onClick={() => {
                  setShowAstrologerModal(false);
                  setAstrologerAvailability([{ day: 'Monday', startTime: '09:00', endTime: '17:00' }]);
                }} 
                className="p-2 hover:bg-background-elevated rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateAstrologer} className="space-y-4">
              <div>
                <label htmlFor="admin-astro-name" className="block text-sm font-medium text-primary mb-1">Full Name *</label>
                <Input id="admin-astro-name" name="fullName" required placeholder="Enter full name" className="w-full" />
              </div>
              <div>
                <label htmlFor="admin-astro-email" className="block text-sm font-medium text-primary mb-1">Email *</label>
                <Input id="admin-astro-email" name="email" type="email" required placeholder="Enter email" className="w-full" />
              </div>
              <div>
                <label htmlFor="admin-astro-phone" className="block text-sm font-medium text-primary mb-1">Phone Number *</label>
                <Input id="admin-astro-phone" name="phoneNumber" type="tel" required placeholder="Enter phone number" className="w-full" />
              </div>
              <div>
                <label htmlFor="admin-astro-title" className="block text-sm font-medium text-primary mb-1">Title</label>
                <Input id="admin-astro-title" name="title" placeholder="e.g., Vedic Astrologer" className="w-full" />
              </div>
              <div>
                <label htmlFor="admin-astro-skills" className="block text-sm font-medium text-primary mb-1">Skills *</label>
                <Input id="admin-astro-skills" name="skills" required placeholder="e.g., Vedic Astrology, Numerology, Palmistry" className="w-full" />
                <p className="text-xs text-muted-foreground mt-1">Separate skills with commas</p>
              </div>
              <div>
                <label htmlFor="admin-astro-experience" className="block text-sm font-medium text-primary mb-1">Experience (Years) *</label>
                <Input id="admin-astro-experience" name="experienceYears" type="number" required placeholder="e.g., 5" className="w-full" />
              </div>
              <div>
                <label htmlFor="admin-astro-languages" className="block text-sm font-medium text-primary mb-1">Languages</label>
                <Input id="admin-astro-languages" name="languages" placeholder="e.g., Hindi, English" className="w-full" />
                <p className="text-xs text-muted-foreground mt-1">Separate languages with commas</p>
              </div>
              
              {/* Availability Section */}
              <div className="pt-4 border-t">
                <label htmlFor="admin-astro-avail-day-0" className="block text-sm font-medium text-primary mb-3">Availability Schedule *</label>
                <div className="space-y-3">
                  {astrologerAvailability.map((slot, index) => (
                    <div key={slot.day} className="flex items-center gap-2">
                      <select
                        value={slot.day}
                        id={index === 0 ? "admin-astro-avail-day-0" : undefined}
                        onChange={(e) => updateAstrologerAvailability(index, 'day', e.target.value)}
                        className="px-2 py-2 text-sm border border-border rounded flex-1"
                      >
                        {DAYS.map(day => <option key={day} value={day}>{day}</option>)}
                      </select>
                      <input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => updateAstrologerAvailability(index, 'startTime', e.target.value)}
                        className="px-2 py-2 text-sm border border-border rounded w-20"
                      />
                      <span className="text-xs">to</span>
                      <input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) => updateAstrologerAvailability(index, 'endTime', e.target.value)}
                        className="px-2 py-2 text-sm border border-border rounded w-20"
                      />
                      {astrologerAvailability.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeAstrologerAvailability(index)}
                          className="p-1 rounded text-red-500 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addAstrologerAvailability}
                  className="btn-secondary mt-2 w-full flex items-center justify-center gap-2 text-sm"
                >
                  <Plus className="w-3 h-3" />
                  Add Time Slot
                </button>
              </div>

              <div>
                <label htmlFor="admin-astro-profile-image" className="block text-sm font-medium text-primary mb-1">Profile Image</label>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click(); } }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      if (file.size > 5 * 1024 * 1024) {
                        alert('Image size should be less than 5MB');
                      } else {
                        setProfileImageFile(file);
                        setPreviewUrl(URL.createObjectURL(file));
                      }
                    }
                  }}
                  className="w-24 h-24 rounded-full border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden"
                  style={{ borderColor: previewUrl ? 'transparent' : 'hsl(var(--border))' }}
                >
                  {previewUrl ? (
                    <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <Upload className="w-6 h-6" style={{ color: 'hsl(var(--text-muted))' }} />
                  )}
                </div>
                <input
                  id="admin-astro-profile-image"
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 5 * 1024 * 1024) {
                        alert('Image size should be less than 5MB');
                        return;
                      }
                      setProfileImageFile(file);
                      setPreviewUrl(URL.createObjectURL(file));
                    }
                  }}
                  className="hidden"
                />
                <p className="text-xs text-muted-foreground mt-1">You can drag & drop or click to upload. <br />or paste URL below</p>
                <Input name="profileImageUrl" placeholder="https://..." className="w-full mt-2" />
              </div>
              <div className="flex gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowAstrologerModal(false);
                    setAstrologerAvailability([{ day: 'Monday', startTime: '09:00', endTime: '17:00' }]);
                  }} 
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="flex-1 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary) / 0.85)]">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Astrologer'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
