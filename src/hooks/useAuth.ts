'use client';

import { useState, useEffect, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
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
          setIsCheckingSession(false);
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
        setIsCheckingSession(false);
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
      setIsLoggingIn(true);
      setError(null);

      const cleanEmail = email.trim();
      if (!cleanEmail) {
        const msg = 'Silakan masukkan alamat email Anda.';
        setError(msg);
        return { success: false, error: msg };
      }

      if (!password) {
        const msg = 'Silakan masukkan kata sandi Anda.';
        setError(msg);
        return { success: false, error: msg };
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (signInError) {
        console.warn('[useAuth] Supabase signIn error:', signInError);
        let userFriendlyMsg = signInError.message;
        const msgLower = signInError.message.toLowerCase();

        if (
          msgLower.includes('invalid login credentials') ||
          msgLower.includes('invalid_credentials') ||
          msgLower.includes('invalid grant')
        ) {
          userFriendlyMsg = 'Email atau kata sandi salah. Silakan periksa kembali.';
        } else if (msgLower.includes('email not confirmed')) {
          userFriendlyMsg = 'Email akun ini belum dikonfirmasi.';
        } else if (msgLower.includes('rate limit') || msgLower.includes('too many requests')) {
          userFriendlyMsg = 'Terlalu banyak percobaan login gagal. Mohon tunggu beberapa saat.';
        } else if (msgLower.includes('network') || msgLower.includes('failed to fetch')) {
          userFriendlyMsg = 'Gagal terhubung ke server. Periksa koneksi internet Anda.';
        } else if (msgLower.includes('user not found')) {
          userFriendlyMsg = 'Akun dengan email tersebut tidak ditemukan.';
        }

        setError(userFriendlyMsg);
        return { success: false, error: userFriendlyMsg };
      }

      setSession(data.session);
      setUser(data.user);
      setError(null);
      return { success: true };
    } catch (err) {
      const e = err as Error;
      console.error('[useAuth] Unexpected login error:', e);
      let msg = e.message || 'Terjadi kesalahan tidak terduga saat login.';
      if (msg.toLowerCase().includes('failed to fetch')) {
        msg = 'Gagal terhubung ke server. Periksa koneksi internet Anda.';
      }
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoggingIn(false);
    }
  }, []);

  // Fungsi Logout
  const logout = useCallback(async () => {
    try {
      setIsLoggingIn(true);
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (err) {
      console.error('[useAuth] Logout error:', err);
    } finally {
      setIsLoggingIn(false);
    }
  }, []);

  return {
    user,
    session,
    isAuthenticated: !!user,
    isCheckingSession,
    isLoggingIn,
    error,
    login,
    logout,
    clearError: () => setError(null),
  };
}
