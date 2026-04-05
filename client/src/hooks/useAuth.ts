import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import type { User } from '../types';

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

  const submitAuth = useCallback(async (mode: 'login' | 'register', email: string, password: string, inviteToken?: string) => {
    setAuthError(null);
    setAuthLoading(true);
    try {
      const payload = await apiFetch(`/api/auth/${mode}`, {
        method: 'POST',
        body: JSON.stringify({ email, password, inviteToken }),
      });
      setUser(payload.user);
      return payload;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed.';
      setAuthError(message);
      throw new Error(message);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const login = useCallback((email: string, password: string) => submitAuth('login', email, password), [submitAuth]);
  const register = useCallback((email: string, password: string, inviteToken?: string) => submitAuth('register', email, password, inviteToken), [submitAuth]);

  const logout = useCallback(async () => {
    await apiFetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    return apiFetch('/api/auth/request-password-reset', { method: 'POST', body: JSON.stringify({ email }) });
  }, []);

  const resetPassword = useCallback(async (token: string, password: string) => {
    return apiFetch('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) });
  }, []);

  const requestVerification = useCallback(async () => {
    return apiFetch('/api/auth/request-email-verification', { method: 'POST' });
  }, []);

  const verifyEmail = useCallback(async (token: string) => {
    const payload = await apiFetch('/api/auth/verify-email', { method: 'POST', body: JSON.stringify({ token }) });
    setUser(payload.user);
    return payload;
  }, []);

  return {
    user,
    authError,
    authLoading,
    login,
    register,
    logout,
    refreshUser,
    requestPasswordReset,
    resetPassword,
    requestVerification,
    verifyEmail,
    setAuthError,
  };
};
