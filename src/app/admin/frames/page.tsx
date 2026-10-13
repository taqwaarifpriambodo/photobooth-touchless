'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useAdminFrames } from '@/hooks/useAdminFrames';
import { isAdminEmail, ADMIN_EMAIL } from '@/lib/adminConfig';
import LoginGate from '@/components/LoginGate';
import FrameTable from '@/components/admin/FrameTable';
import AddFrameModal from '@/components/admin/AddFrameModal';

export default function AdminFramesPage() {
  const {
    user,
    isAuthenticated,
    isCheckingSession,
    isLoggingIn,
    error: authError,
    login,
    logout,
    clearError,
  } = useAuth();

  const {
    frames,
    isLoading: isFramesLoading,
    error: framesError,
    refreshFrames,
    toggleStatus,
    addFrame,
    removeFrame,
  } = useAdminFrames();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // 1. Tampilan loading saat memeriksa sesi
  if (isCheckingSession) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-black gap-4 text-white">
        <div className="w-10 h-10 border-3 border-zinc-800 border-t-amber-500 rounded-full animate-spin" />
        <p className="text-zinc-400 text-sm font-medium">Memeriksa sesi administrator...</p>
      </div>
    );
  }

  // 2. Tampilan Form Login jika belum login
  if (!isAuthenticated) {
    return (
      <div className="conventional-cursor min-h-screen bg-black">
        <LoginGate
          onLogin={login}
          error={authError}
          isLoading={isLoggingIn}
          onClearError={clearError}
        />
      </div>
    );
  }

  // 3. Tampilan Akses Ditolak jika login dengan akun non-admin
  if (!isAdminEmail(user?.email)) {
    return (
      <div className="conventional-cursor min-h-screen w-full flex flex-col items-center justify-center p-4 bg-black text-white">
        <div className="w-full max-w-md p-8 rounded-3xl bg-zinc-900/90 border border-red-500/30 text-center shadow-2xl flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-3xl">
            🚫
          </div>

          <h1 className="text-xl font-bold text-white">Akses Ditolak</h1>

          <p className="text-sm text-zinc-300 leading-relaxed">
            Halaman manajemen frame hanya dapat diakses oleh administrator (
            <code className="text-amber-400 font-mono text-xs">{ADMIN_EMAIL}</code>).
          </p>

          <div className="p-3 rounded-xl bg-zinc-950 border border-white/5 w-full text-xs text-zinc-400 text-left">
            <span>Login saat ini sebagai:</span>
            <p className="font-semibold text-white truncate mt-0.5">{user?.email}</p>
          </div>

          <div className="flex items-center gap-3 w-full pt-2">
            <Link
              href="/"
              className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white text-center transition-colors"
            >
              ← Ke Photobooth
            </Link>
            <button
              type="button"
              onClick={logout}
              className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white text-center transition-colors cursor-pointer"
            >
              Logout Akun
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Tampilan Halaman Admin Manajemen Frame
  const activeCount = frames.filter((f) => f.status === 1).length;
  const inactiveCount = frames.filter((f) => f.status !== 1).length;

  return (
    <div className="conventional-cursor min-h-screen w-full bg-black text-white flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 w-full bg-zinc-950/80 backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
            >
              ← Photobooth
            </Link>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>🎨 Manajemen Frame</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-mono border border-amber-500/30">
                  Admin
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-400 bg-zinc-900/60 px-3 py-1.5 rounded-xl border border-white/5">
              <span>👤</span>
              <span className="font-mono text-zinc-300 truncate max-w-45">{user?.email}</span>
            </div>

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-amber-900/30 transition-all flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-95"
            >
              <span>+</span>
              <span>Tambah Frame Baru</span>
            </button>

            <button
              type="button"
              onClick={logout}
              className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-semibold text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
              title="Logout"
            >
              Keluar
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-8 pb-28 sm:pb-36 flex flex-col gap-6 flex-1">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-zinc-900/70 border border-white/10 shadow-lg flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Total Frame</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-white mt-1 font-mono">
                {frames.length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-xl">
              🖼️
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900/70 border border-white/10 shadow-lg flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Frame Aktif</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-green-400 mt-1 font-mono">
                {activeCount}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-green-500/10 text-green-400 flex items-center justify-center text-xl">
              ✅
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900/70 border border-white/10 shadow-lg flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Frame Nonaktif</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-zinc-400 mt-1 font-mono">
                {inactiveCount}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-zinc-800 text-zinc-400 flex items-center justify-center text-xl">
              ⏸️
            </div>
          </div>
        </div>

        {/* Global Error Banner */}
        {framesError && (
          <div className="p-4 rounded-2xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs flex items-center justify-between gap-3">
            <span>⚠️ {framesError}</span>
            <button
              type="button"
              onClick={refreshFrames}
              className="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-semibold cursor-pointer shrink-0"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Table / Grid Frames */}
        <FrameTable
          frames={frames}
          isLoading={isFramesLoading}
          onToggleStatus={toggleStatus}
          onDeleteFrame={removeFrame}
          onRefresh={refreshFrames}
        />
      </main>

      {/* Modal Tambah Frame Baru */}
      <AddFrameModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddFrame={addFrame}
      />
    </div>
  );
}
