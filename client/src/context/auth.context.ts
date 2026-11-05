import { createContext } from 'react';
import type { User, AuthResponse } from '@/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    username: string,
    action: "request" | "verify",
    otp?: string,
    role?: "user" | "astrologer" | "admin"
  ) => Promise<AuthResponse>;
  register: (
    username: string,
    email: string,
    action: "request" | "verify",
    otp?: string,
    role?: "user" | "astrologer"
  ) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<any>; // ← fix this
  hasRole: (role: "user" | "astrologer" | "admin") => boolean;
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export { AuthContext };
export type { AuthContextType };