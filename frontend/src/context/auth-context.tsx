'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  AuthUser,
  authAPI,
  clearSession,
  getAuthToken,
  getStoredUser,
  persistSession,
} from '@/lib/api';

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (payload: { email: string; password: string }) => Promise<void>;
  register: (payload: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const userRef = useRef<AuthUser | null>(null);
  userRef.current = user;

  useEffect(() => {
    const cached = getStoredUser();
    if (cached) setUser(cached);
    const token = getAuthToken();
    if (!token) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    authAPI
      .me()
      .then((res) => {
        if (cancelled) return;
        persistSession({ token, user: res.data.user });
        setUser(res.data.user);
      })
      .catch(() => {
        if (cancelled || userRef.current) return;
        clearSession();
        setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (payload: { email: string; password: string }) => {
    const { data } = await authAPI.login(payload);
    persistSession(data);
    setUser(data.user);
    setLoading(false);
  };

  const register = async (payload: { name: string; email: string; password: string }) => {
    const { data } = await authAPI.register(payload);
    persistSession(data);
    setUser(data.user);
    setLoading(false);
  };

  const logout = () => {
    clearSession();
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, loading, login, register, logout, isAuthenticated: Boolean(user) }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
