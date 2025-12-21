// ===========================================
// Authentication Context
// ===========================================

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { apiClient } from '../services/api';

// Types
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'TEACHER' | 'PARENT' | 'STUDENT';
  schoolId: string;
  schoolName: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface LoginCredentials {
  email: string;
  password: string;
  schoolSlug?: string;
}

interface LoginResponse {
  status: string;
  data: {
    accessToken: string;
    refreshToken: string;
    user: User;
  };
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        setState({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }

      try {
        const response = await apiClient.get<{ data: { user: User } }>('/auth/me');
        setState({
          user: response.data.user,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch {
        // Token invalid, clear storage
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setState({ user: null, isAuthenticated: false, isLoading: false });
      }
    };

    initAuth();
  }, []);

  // Login function
  const login = useCallback(async (credentials: LoginCredentials) => {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials);

    const { accessToken, refreshToken, user } = response.data;

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);

    setState({
      user,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken });
      }
    } catch {
      // Ignore errors during logout
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setState({ user: null, isAuthenticated: false, isLoading: false });
    }
  }, []);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    try {
      const response = await apiClient.get<{ data: { user: User } }>('/auth/me');
      setState((prev) => ({
        ...prev,
        user: response.data.user,
      }));
    } catch {
      // If refresh fails, logout
      await logout();
    }
  }, [logout]);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
