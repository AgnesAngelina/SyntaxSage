import React, { createContext, useCallback, useContext, useState } from 'react';
import { User, UserStats } from '../types';

interface AuthContextValue {
  token: string | null;
  user: User | null;
  stats: UserStats | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: {
    name: string;
    preferredExplanationLanguage: string;
    preferredLevel: string;
  }) => Promise<void>;
  apiFetch: <T>(url: string, options?: RequestInit) => Promise<T>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Token kept strictly in React memory for security (never persisted to localStorage)
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);

  const apiFetch = useCallback(
    async <T,>(url: string, options: RequestInit = {}): Promise<T> => {
      const headers = new Headers(options.headers);
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }

      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || `Request failed (${response.status})`);
      }
      return data as T;
    },
    [token]
  );

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Unable to sign in.');
    }
    setToken(data.token);
    setUser(data.user);
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Unable to create account.');
    }
    setToken(data.token);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setStats(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!token) return;
    const data = await apiFetch<{ user: User; stats: UserStats }>('/api/auth/me');
    setUser(data.user);
    setStats(data.stats);
  }, [token, apiFetch]);

  const updateProfile = useCallback(
    async (updates: {
      name: string;
      preferredExplanationLanguage: string;
      preferredLevel: string;
    }) => {
      const data = await apiFetch<{ user: User; stats: UserStats }>('/api/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      setUser(data.user);
      setStats(data.stats);
    },
    [apiFetch]
  );

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        stats,
        isAuthenticated: Boolean(token && user),
        login,
        signup,
        logout,
        refreshProfile,
        updateProfile,
        apiFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
