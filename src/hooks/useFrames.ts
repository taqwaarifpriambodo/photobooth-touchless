'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { FrameTemplate } from '@/types';

export function useFrames() {
  const [frames, setFrames] = useState<FrameTemplate[]>([]);
  const [selectedFrame, setSelectedFrame] = useState<FrameTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isFetchedRef = useRef(false);

  const fetchFrames = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/frames', { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Gagal memuat frame dari server (Status ${res.status})`);
      }
      if (data.frames && Array.isArray(data.frames) && data.frames.length > 0) {
        setFrames(data.frames);
        setSelectedFrame(data.frames[0]);
      } else {
        setFrames([]);
        setSelectedFrame(null);
        if (data.message) {
          setError(data.message);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat frame';
      console.error('[useFrames] Error loading frames from Supabase API:', err);
      setError(msg);
      setFrames([]);
      setSelectedFrame(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isFetchedRef.current) return;
    isFetchedRef.current = true;
    fetchFrames();
  }, [fetchFrames]);

  return {
    frames,
    selectedFrame,
    setSelectedFrame,
    isLoading,
    error,
    refreshFrames: fetchFrames,
  };
}

