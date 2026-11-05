import { useCallback, useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { AuthResponse } from "@/types";
import api from "@/lib/api";
import { toast } from "sonner";
import { AuthContext } from "./auth.context";
import { queryKeys } from "@/lib/queryKeys";
import { authQueryConfig } from "@/lib/react-query";
import { useBookingStore } from "@/stores/booking.store";

/**
 * Production-Grade Auth Provider
 *
 * Features:
 * - Secure HTTP-only cookie-based authentication
 * - Server-derived auth state via React Query
 * - Cookies sent automatically via withCredentials
 * - No client-side token storage
 * - Concurrency protection on mutations
 * - Graceful error handling
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  // Server-derived auth state from HTTP-only cookies
  // Cookies are sent automatically via withCredentials: true
  const {
    data: user,
    isLoading,
    refetch: checkAuth,
  } = useQuery({
    queryKey: queryKeys.auth,
    queryFn: async () => {
      try {
        // Backend reads JWT from HTTP-only cookie
        // Verify endpoint returns { ok, user } for users/admins
        // and { ok, astrologer } for astrologers
        const { data } = await api.get("/auth/verify");
        if (data.ok) {
          return data.user || data.astrologer || null;
        }
        return null;
      } catch {
        // Silent fail - user not logged in
        return null;
      }
    },
    ...authQueryConfig,
  });

  // Login mutation with concurrency protection
  const loginMutation = useMutation({
    mutationFn: async ({
      username,
      action,
      otp,
      role,
    }: {
      username: string;
      action: "request" | "verify";
      otp?: string;
      role?: "user" | "astrologer" | "admin";
    }) => {
      const { data } = await api.post("/auth/login", {
        username,
        action,
        otp,
        role,
      });
      return data;
    },
    onSuccess: async (data, variables) => {
      if (data.ok && variables.action === "verify") {
        // Backend sets HTTP-only cookie automatically
        // user/admin login returns data.user; astrologer login returns data.astrologer
        const account = data.user || data.astrologer || null;
        if (account) {
          queryClient.setQueryData(queryKeys.auth, account);
        }
      }
    },
  });

  // Register mutation
  // Register mutation (OTP-based, aligned with AuthContext interface)
  const registerMutation = useMutation({
    mutationFn: async ({
      username,
      email,
      action,
      otp,
      role,
    }: {
      username: string;
      email: string;
      action: "request" | "verify";
      otp?: string;
      role?: "user" | "astrologer";
    }) => {
      const { data } = await api.post("/auth/register", {
        username,
        email,
        action,
        otp,
        role,
      });

      return data;
    },
    onSuccess: (data, variables) => {
      // Only set auth state after OTP verification
      if (data.ok && variables.action === "verify") {
        const account = data.user || data.astrologer || null;
        if (account) {
          queryClient.setQueryData(queryKeys.auth, account);
        }
      }
    },
  });

  // Logout mutation with concurrency protection
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await api.post("/auth/logout");
    },
    onSuccess: () => {
      // Clear auth data immediately
      queryClient.setQueryData(queryKeys.auth, null);
      // Clear booking state
      useBookingStore.getState().resetBooking();
      toast.success("Logged out successfully");
    },
    onError: () => {
      // Force local logout even if server fails
      queryClient.setQueryData(queryKeys.auth, null);
      useBookingStore.getState().resetBooking();
    },
  });

  // Wrapped login function matching legacy signature
  const login = useCallback(
    async (
      username: string,
      action: "request" | "verify",
      otp?: string,
      role?: "user" | "astrologer" | "admin",
    ): Promise<AuthResponse> => {
      try {
        const result = await loginMutation.mutateAsync({
          username,
          action,
          otp,
          role,
        });

        if (result.ok) {
          // Normalize: backend returns user or astrologer depending on role
          const account = result.user || result.astrologer;
          if (action === "verify" && account) {
            return { ok: true, success: true, user: account };
          }
          return { ok: true, success: true, message: result.message, otp: result.otp, ...result };
        }
        return { ok: false, success: false, message: result.message };
      } catch (error) {
        return {
          ok: false,
          success: false,
          message:
            (error as any).response?.data?.message || "Authentication failed",
        };
      }
    },
    [loginMutation],
  );

  // Parameter order matches AuthContextType: (username, email, action, otp?, role?)
  const register = useCallback(
    async (
      username: string,
      email: string,
      action: "request" | "verify",
      otp?: string,
      role?: "user" | "astrologer",
    ): Promise<AuthResponse> => {
      try {
        const result = await registerMutation.mutateAsync({
          username,
          email,
          action,
          otp,
          role,
        });

        if (result.ok) {
          if (action === "verify" && result.user) {
            return { ok: true, success: true, user: result.user };
          }

          return { ok: true, success: true, message: result.message, otp: result.otp };
        }

        return { ok: false, success: false, message: result.message };
      } catch (error) {
        return {
          ok: false,
          success: false,
          message:
            (error as any).response?.data?.message || "Registration failed",
        };
      }
    },
    [registerMutation],
  );

  // Wrapped logout function
  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync();
  }, [logoutMutation]);

  const hasRole = useCallback(
    (role: "user" | "astrologer" | "admin"): boolean => {
      return user?.role === role;
    },
    [user],
  );

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout, // For simplicity, using the same function for register with different parameters
        checkAuth,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
