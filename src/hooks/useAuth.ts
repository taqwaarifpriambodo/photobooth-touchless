'use client';

import { useState, useEffect, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Periksa sesi yang tersimpan di browser saat mount
  useEffect(() => {
    let isMounted = true;

    async function getInitialSession() {
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (isMounted) {
          setSession(data.session);
          setUser(data.session?.user ?? null);
        }
      } catch (err) {
        console.error('[useAuth] Error fetching initial session:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    getInitialSession();

    // Dengarkan perubahan auth state (misal login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (isMounted) {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Fungsi Login dengan Email & Password
  const login = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        let userFriendlyMsg = signInError.message;
        if (signInError.message.includes('Invalid login credentials')) {
          userFriendlyMsg = 'Email atau password yang Anda masukkan salah.';
        } else if (signInError.message.includes('Email not confirmed')) {
          userFriendlyMsg = 'Email belum dikonfirmasi di Supabase.';
        }
        setError(userFriendlyMsg);
        return { success: false, error: userFriendlyMsg };
      }

      setSession(data.session);
      setUser(data.user);
      return { success: true };
    } catch (err) {
      const e = err as Error;
      const msg = e.message || 'Terjadi kesalahan saat login.';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fungsi Logout
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (err) {
      console.error('[useAuth] Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    user,
    session,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    logout,
    clearError: () => setError(null),
  };
}
