'use client';

import { useState, useEffect, useCallback } from 'react';
import type { FrameTemplate } from '@/types';
import {
  fetchAllAdminFrames,
  updateFrameStatus,
  createFrame,
  deleteFrame,
  type CreateFrameParams,
} from '@/lib/frameAdminService';

export function useAdminFrames() {
  const [frames, setFrames] = useState<FrameTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshFrames = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAllAdminFrames();
      setFrames(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat data frame';
      console.error('[useAdminFrames] Error fetching frames:', err);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshFrames();
  }, [refreshFrames]);

  // Toggle status aktif (1) / nonaktif (0) dengan Optimistic Update
  const toggleStatus = useCallback(
    async (frameId: string, currentStatus: number): Promise<boolean> => {
      const newStatus = currentStatus === 1 ? 0 : 1;

      // Optimistic update
      setFrames((prev) =>
        prev.map((f) => (f.id === frameId ? { ...f, status: newStatus } : f))
      );

      try {
        await updateFrameStatus(frameId, newStatus);
        return true;
      } catch (err: unknown) {
        // Rollback jika gagal
        setFrames((prev) =>
          prev.map((f) => (f.id === frameId ? { ...f, status: currentStatus } : f))
        );
        const msg = err instanceof Error ? err.message : 'Gagal mengubah status frame';
        alert(msg);
        return false;
      }
    },
    []
  );

  // Tambah frame baru
  const addFrame = useCallback(
    async (
      params: CreateFrameParams
    ): Promise<{ success: boolean; frame?: FrameTemplate; error?: string }> => {
      try {
        const newFrame = await createFrame(params);
        setFrames((prev) => [newFrame, ...prev]);
        return { success: true, frame: newFrame };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal menambahkan frame baru';
        return { success: false, error: msg };
      }
    },
    []
  );

  // Hapus frame
  const removeFrame = useCallback(
    async (frame: FrameTemplate): Promise<{ success: boolean; error?: string }> => {
      try {
        await deleteFrame({ id: frame.id, file: frame.file });
        setFrames((prev) => prev.filter((f) => f.id !== frame.id));
        return { success: true };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal menghapus frame';
        return { success: false, error: msg };
      }
    },
    []
  );

  return {
    frames,
    isLoading,
    error,
    refreshFrames,
    toggleStatus,
    addFrame,
    removeFrame,
  };
}
