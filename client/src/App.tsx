import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/react-query';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';

// Pages
import { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';
import CompleteProfile from './pages/CompleteProfile';
import CheckoutPage from './pages/CheckoutPage';

// Lazy load pages
const LandingPage = lazy(() => import('@/pages/LandingPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const CompleteProfilePage = lazy(() => import('@/pages/CompleteProfilePage'));
const SignupPage = lazy(() => import('@/pages/SignupPage'));
const AstrologersPage = lazy(() => import('@/pages/AstrologersPage'));
const BookingPage = lazy(() => import('@/pages/BookingPage'));
const BookingDetailsPage = lazy(() => import('@/pages/BookingDetailsPage'));
const PaymentPage = lazy(() => import('@/pages/PaymentPage'));
const ServicesPage = lazy(() => import('@/pages/ServicesPage'));
const ContactPage = lazy(() => import('@/pages/ContactPage'));
const UserDashboard = lazy(() => import('@/pages/UserDashboard'));
const AstrologerDashboard = lazy(() => import('@/pages/AstrologerDashboard'));
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
const KundliGeneratorPage = lazy(() => import('@/pages/KundliGeneratorPage'));
const ConsultationPage = lazy(() => import('@/pages/ConsultationPage'));

// Loading Fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="w-12 h-12 animate-spin text-primary" />
      <p className="text-primary font-medium animate-pulse">Loading...</p>
    </div>
  </div>
);

// Pages where Navbar and Footer should be hidden
const authRoutes = ['/login', '/signup'];

function AppContent() {
  const location = useLocation();
  const showNavAndFooter = !authRoutes.includes(location.pathname);

  return (
    <div className="min-h-screen flex flex-col">
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          style: {
            fontFamily: 'Poppins, sans-serif',
          },
        }}
      />
      {showNavAndFooter && <Navbar />}
      <main className="flex-1">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/astrologers" element={<AstrologersPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/kundli" element={<KundliGeneratorPage />} />
            <Route path="/consultation/:id" element={<ConsultationPage />} />

            <Route
              path="/complete-profile"
              element={
                <ProtectedRoute requireProfileComplete={false}>
                  <CompleteProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Booking Flow */}
            <Route path="/booking" element={<BookingPage />} />
            <Route
              path="/booking/details"
              element={
                <ProtectedRoute>
                  <BookingDetailsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/booking/payment"
              element={
                <ProtectedRoute>
                  <PaymentPage />
                </ProtectedRoute>
              }
            />

            {/* User Dashboard */}
            <Route
              path="/user/dashboard"
              element={
                <ProtectedRoute allowedRoles={['user']}>
                  <UserDashboard />
                </ProtectedRoute>
              }
            />

            {/* Astrologer Dashboard */}
            <Route
              path="/astrologer/dashboard"
              element={
                <ProtectedRoute allowedRoles={['astrologer']}>
                  <AstrologerDashboard />
                </ProtectedRoute>
              }
            />

            {/* Admin Dashboard */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute allowedRoles={['user', 'admin']}>
                  <CheckoutPage />
                </ProtectedRoute>
              }
            />

            {/* Catch all - redirect to home */}
            <Route path="*" element={<LandingPage />} />
          </Routes>
        </Suspense>
      </main>
      {showNavAndFooter && <Footer />}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ErrorBoundary>
          <Router>
            <AppContent />
          </Router>
        </ErrorBoundary>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
