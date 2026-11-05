import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('user' | 'astrologer' | 'admin')[];
}

/**
 * Production-Grade Protected Route
 * 
 * Features:
 * - Strict loading gate (no UI flicker)
 * - Preserves location for post-login redirect
 * - Role-based access control
 * - Profile completion enforcement
 */
export default function ProtectedRoute({ children, allowedRoles, requireProfileComplete = true }: ProtectedRouteProps & { requireProfileComplete?: boolean }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // CRITICAL: Wait for auth to resolve before any render
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login with return path
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Profile incomplete - redirect to complete profile
  if (requireProfileComplete && !user?.isProfileComplete) {
    return <Navigate to="/complete-profile" replace />;
  }

  // Already on complete profile page but profile IS complete
  if (!requireProfileComplete && user?.isProfileComplete) {
    return <Navigate to="/" replace />;
  }

  // Role-based access control
  if (allowedRoles && allowedRoles.length > 0) {
    const hasAllowedRole = allowedRoles.some((role) => user?.role === role);
    if (!hasAllowedRole) {
      toast.error('You do not have permission to access this page');
      return <Navigate to="/" replace />;
    }
  }

  // All checks passed - render protected content
  return <>{children}</>;
}
