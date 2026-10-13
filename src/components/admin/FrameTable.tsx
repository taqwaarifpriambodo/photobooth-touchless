'use client';

import { useState, useMemo } from 'react';
import type { FrameTemplate } from '@/types';
import ConfirmDialog from './ConfirmDialog';

interface FrameTableProps {
  frames: FrameTemplate[];
  isLoading: boolean;
  onToggleStatus: (id: string, currentStatus: number) => Promise<boolean>;
  onDeleteFrame: (frame: FrameTemplate) => Promise<{ success: boolean; error?: string }>;
  onRefresh: () => void;
}

export default function FrameTable({
  frames,
  isLoading,
  onToggleStatus,
  onDeleteFrame,
  onRefresh,
}: FrameTableProps) {
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [frameToDelete, setFrameToDelete] = useState<FrameTemplate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter & Search
  const filteredFrames = useMemo(() => {
    return frames.filter((frame) => {
      // Filter status
      if (filter === 'active' && frame.status !== 1) return false;
      if (filter === 'inactive' && frame.status === 1) return false;

      // Filter pencarian nama / file
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = frame.name.toLowerCase().includes(q);
        const matchFile = frame.file.toLowerCase().includes(q);
        return matchName || matchFile;
      }

      return true;
    });
  }, [frames, filter, searchQuery]);

  const activeCount = useMemo(() => frames.filter((f) => f.status === 1).length, [frames]);
  const inactiveCount = useMemo(() => frames.filter((f) => f.status !== 1).length, [frames]);

  // Eksekusi hapus frame
  const handleConfirmDelete = async () => {
    if (!frameToDelete) return;
    setIsDeleting(true);
    const res = await onDeleteFrame(frameToDelete);
    setIsDeleting(false);

    if (res.success) {
      setFrameToDelete(null);
    } else {
      alert(res.error || 'Gagal menghapus frame');
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Toolbar: Filter Tabs, Search & Refresh */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-900 border border-white/10 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Semua ({frames.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('active')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filter === 'active'
                ? 'bg-green-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Aktif ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('inactive')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filter === 'inactive'
                ? 'bg-zinc-700 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Nonaktif ({inactiveCount})
          </button>
        </div>

        <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
          <input
            type="text"
            placeholder="Cari frame..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-white/10 focus:border-amber-500 focus:outline-none text-xs text-white placeholder-zinc-500 w-44 sm:w-56"
          />
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
            title="Refresh data dari Supabase"
          >
            <span className={isLoading ? 'animate-spin' : ''}>🔄</span>
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-zinc-400">
          <div className="w-9 h-9 border-3 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
          <p className="text-sm font-medium">Memuat daftar frame dari Supabase...</p>
        </div>
      ) : filteredFrames.length === 0 ? (
        /* Empty State */
        <div className="py-16 px-4 text-center rounded-2xl bg-zinc-900/60 border border-white/10 flex flex-col items-center justify-center gap-2">
          <span className="text-4xl">🖼️</span>
          <h3 className="text-base font-bold text-white">Tidak ada frame yang ditemukan</h3>
          <p className="text-xs text-zinc-400 max-w-sm">
            {searchQuery
              ? `Tidak ditemukan frame dengan kata kunci "${searchQuery}".`
              : 'Belum ada frame yang terdaftar di database Supabase.'}
          </p>
        </div>
      ) : (
        /* Grid Kartu Frame */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFrames.map((frame) => {
            const isActive = frame.status === 1;
            const ratio = (frame.canvasWidth / frame.canvasHeight).toFixed(2);

            return (
              <div
                key={frame.id || frame.file}
                className="group relative rounded-2xl bg-zinc-900/80 border border-white/10 hover:border-white/20 transition-all p-4 flex flex-col justify-between gap-3 shadow-lg"
              >
                {/* Thumbnail Frame (Flexible container, object-contain untuk semua rasio) */}
                <div className="relative w-full h-44 bg-zinc-950 rounded-xl overflow-hidden border border-white/5 flex items-center justify-center p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={frame.publicUrl || frame.file}
                    alt={frame.name}
                    className="max-w-full max-h-full object-contain filter drop-shadow-md"
                  />

                  {/* Badge Status */}
                  <div className="absolute top-2.5 right-2.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        isActive
                          ? 'bg-green-500/20 text-green-400 border-green-500/40'
                          : 'bg-zinc-800 text-zinc-400 border-white/10'
                      }`}
                    >
                      {isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                </div>

                {/* Detail Informasi Frame */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-white truncate" title={frame.name}>
                      {frame.name}
                    </h3>
                  </div>
                  <p className="text-[11px] font-mono text-zinc-400 truncate" title={frame.file}>
                    {frame.file}
                  </p>

                  <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-400 font-mono">
                    <span className="px-1.5 py-0.5 rounded bg-zinc-800 border border-white/5">
                      📐 {frame.canvasWidth} × {frame.canvasHeight} px ({ratio}:1)
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-zinc-800 border border-white/5">
                      📸 {frame.slots?.length || 0} slot
                    </span>
                  </div>
                </div>

                {/* Actions: Toggle Status & Hapus Button */}
                <div className="flex items-center justify-between pt-3 border-t border-white/10 gap-2">
                  {/* Toggle Aktif / Nonaktif */}
                  <button
                    type="button"
                    onClick={() => onToggleStatus(frame.id as string, frame.status as number)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/10'
                        : 'bg-green-600/30 hover:bg-green-600/40 text-green-300 border border-green-500/40'
                    }`}
                  >
                    <span>{isActive ? '⏸️ Nonaktifkan' : '▶️ Aktifkan'}</span>
                  </button>

                  {/* Tombol Hapus */}
                  <button
                    type="button"
                    onClick={() => setFrameToDelete(frame)}
                    className="p-2 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                    title="Hapus frame dari database & storage"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dialog Konfirmasi Hapus */}
      <ConfirmDialog
        isOpen={frameToDelete !== null}
        title="Hapus Frame?"
        message={`Apakah Anda yakin ingin menghapus frame "${frameToDelete?.name}"?\n\nFile gambar di Supabase Storage (${frameToDelete?.file}) dan data record-nya akan dihapus permanen.`}
        confirmLabel="Ya, Hapus Permanen"
        cancelLabel="Batal"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setFrameToDelete(null)}
      />
    </div>
  );
}
