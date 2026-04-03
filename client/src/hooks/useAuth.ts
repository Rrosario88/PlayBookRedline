import { useCallback, useEffect, useState } from 'react';
import type { User } from '../types';

const apiFetch = async (input: string, init?: RequestInit) => {
  const response = await fetch(input, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || 'Request failed.');
  return payload;
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const refreshUser = useCallback(async () => {
    try {
      const payload = await apiFetch('/api/auth/me', { method: 'GET' });
      setUser(payload.user);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const submitAuth = useCallback(async (mode: 'login' | 'register', email: string, password: string) => {
    setAuthError(null);
    setAuthLoading(true);
    try {
      const payload = await apiFetch(`/api/auth/${mode}`, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setUser(payload.user);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Authentication failed.');
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await apiFetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  }, []);

  return {
    user,
    authError,
    authLoading,
    login: (email: string, password: string) => submitAuth('login', email, password),
    register: (email: string, password: string) => submitAuth('register', email, password),
    logout,
    refreshUser,
  };
};
