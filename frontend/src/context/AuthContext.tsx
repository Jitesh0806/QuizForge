'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import Cookies from 'js-cookie';
import { authApi } from '@/lib/api';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, password2: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    const token = Cookies.get('access_token');
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await authApi.me();
      setUser(data);
    } catch {
      Cookies.remove('access_token');
      Cookies.remove('refresh_token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMe(); }, [fetchMe]);

  const login = async (username: string, password: string) => {
    const { data } = await authApi.login({ username, password });
    Cookies.set('access_token', data.access, { expires: 1 });
    Cookies.set('refresh_token', data.refresh, { expires: 30 });
    const me = await authApi.me();
    setUser(me.data);
  };

  const register = async (username: string, email: string, password: string, password2: string) => {
    const { data } = await authApi.register({ username, email, password, password2 });
    Cookies.set('access_token', data.access, { expires: 1 });
    Cookies.set('refresh_token', data.refresh, { expires: 30 });
    setUser(data.user);
  };

  const logout = () => {
    Cookies.remove('access_token');
    Cookies.remove('refresh_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
