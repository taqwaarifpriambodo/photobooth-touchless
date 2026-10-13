'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FrameTemplate, Point2D } from '@/types';
import FrameCard from './FrameCard';
import NavDwellButton from './NavDwellButton';
import { useDwellTimer } from '@/hooks/useDwellTimer';
import { useAutoReset } from '@/hooks/useAutoReset';

interface FrameSelectorProps {
  frames: FrameTemplate[];
  selectedFrame: FrameTemplate | null;
  cursorPositionRef: React.RefObject<Point2D | null>;
  onSelectFrame: (frame: FrameTemplate) => void;
  onConfirm: () => void;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export default function FrameSelector({
  frames,
  selectedFrame,
  cursorPositionRef,
  onSelectFrame,
  onConfirm,
  isLoading = false,
  error = null,
  onRetry,
}: FrameSelectorProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  // Deteksi mode mobile untuk 1 item per baris (3 item per halaman di HP, 6 di desktop)
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const itemsPerPage = isMobile ? 3 : 6;
  const totalPages = Math.max(1, Math.ceil(frames.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages - 1);
  const startIndex = safeCurrentPage * itemsPerPage;
  const visibleFrames = frames.slice(startIndex, startIndex + itemsPerPage);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
  };

  // Auto-start setelah 2 menit (120 detik) jika tidak menekan tombol mulai foto
  const handleAutoStart = useCallback(() => {
    if (!selectedFrame && frames.length > 0) {
      onSelectFrame(frames[0]);
    }
    if (selectedFrame || frames.length > 0) {
      onConfirm();
    }
  }, [selectedFrame, frames, onSelectFrame, onConfirm]);

  const { secondsLeft } = useAutoReset({
    durationSeconds: 120, // 2 Menit
    enabled: frames.length > 0 && !isLoading,
    onReset: handleAutoStart,
  });

  const formatCountdown = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isConfirmEnabled = selectedFrame !== null && frames.length > 0 && !isLoading;

  const { progress, isHovered } = useDwellTimer({
    cursorPositionRef,
    elementRef: confirmBtnRef,
    durationMs: 1500,
    onComplete: onConfirm,
    enabled: isConfirmEnabled,
  });

  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <motion.div
      className="absolute inset-0 z-20 flex flex-col items-center justify-between p-3 sm:p-5 pt-14 sm:pt-6 pb-6 sm:pb-8 pointer-events-auto bg-black/60 backdrop-blur-sm overflow-y-auto sm:overflow-hidden no-scrollbar"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="text-center flex flex-col items-center shrink-0">
        <h1 className="text-xl sm:text-3xl font-bold text-white tracking-tight">
          Pilih Frame
        </h1>
        <p className="text-[11px] sm:text-sm text-zinc-400 mt-0.5 max-w-xs sm:max-w-md mx-auto">
          Tunjuk frame yang Anda inginkan dengan telunjuk ☝️ dan tahan selama 1.5 detik
        </p>

        {/* 2-Minute Auto-Start Countdown Badge (hanya tampil jika frame tersedia) */}
        {frames.length > 0 && !isLoading && (
          <div className="mt-1 flex items-center gap-1.5 sm:gap-2">
            <span className="text-[10px] sm:text-xs text-zinc-400">Otomatis mulai:</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold font-mono border transition-colors duration-300 ${
                secondsLeft <= 10
                  ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                  : 'bg-zinc-800/90 text-amber-400 border-white/10'
              }`}
            >
              ⏱️ {formatCountdown(secondsLeft)}
            </span>
          </div>
        )}
      </div>

      {/* Frame Gallery / Loading / Error / Empty States */}
      {isLoading ? (
        <div className="my-auto flex flex-col items-center justify-center gap-3 py-12">
          <div className="w-10 h-10 border-3 border-zinc-700 border-t-amber-500 rounded-full animate-spin" />
          <p className="text-sm font-medium text-zinc-300">Memuat frame dari Supabase...</p>
        </div>
      ) : error ? (
        <div className="my-auto flex flex-col items-center justify-center py-8 px-6 text-center max-w-md bg-zinc-900/90 backdrop-blur-md rounded-2xl border border-red-500/30 shadow-2xl">
          <div className="text-4xl mb-3">⚠️</div>
          <h2 className="text-base sm:text-lg font-bold text-red-400">Gagal Memuat Frame</h2>
          <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
            {error}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-4 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold border border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95"
            >
              🔄 Coba Muat Ulang
            </button>
          )}
        </div>
      ) : frames.length === 0 ? (
        <div className="my-auto flex flex-col items-center justify-center py-8 px-6 text-center max-w-md bg-zinc-900/90 backdrop-blur-md rounded-2xl border border-amber-500/20 shadow-2xl">
          <div className="text-4xl mb-3">🖼️</div>
          <h2 className="text-base sm:text-lg font-bold text-white">Tidak Ada Frame Aktif</h2>
          <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
            Tidak ditemukan frame dengan status aktif (<code className="text-amber-400 font-mono">status = 1</code>) di Supabase. Pastikan frame telah ditambahkan dan diaktifkan.
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-4 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold border border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95"
            >
              🔄 Refresh Data
            </button>
          )}
        </div>
      ) : (
        <div className="w-full max-w-5xl my-auto py-1 flex items-center justify-between gap-1.5 sm:gap-4 px-1 sm:px-2">
          {/* Left Arrow Button */}
          {totalPages > 1 && (
            <NavDwellButton
              direction="prev"
              disabled={currentPage === 0}
              cursorPositionRef={cursorPositionRef}
              onClick={handlePrevPage}
            />
          )}

          {/* Frames Grid */}
          <div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto px-1 sm:px-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3.5 w-full justify-items-center"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
              >
                {visibleFrames.map((frame) => (
                  <FrameCard
                    key={frame.id || frame.file}
                    frame={frame}
                    isSelected={selectedFrame?.id ? selectedFrame.id === frame.id : selectedFrame?.file === frame.file}
                    cursorPositionRef={cursorPositionRef}
                    onSelect={onSelectFrame}
                  />
                ))}
              </motion.div>
            </AnimatePresence>

            {/* Page Dots Indicator */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5 sm:gap-2 mt-2 sm:mt-3">
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                      idx === currentPage
                        ? 'w-5 sm:w-7 bg-amber-500'
                        : 'w-1.5 sm:w-2 bg-white/20'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Arrow Button */}
          {totalPages > 1 && (
            <NavDwellButton
              direction="next"
              disabled={currentPage >= totalPages - 1}
              cursorPositionRef={cursorPositionRef}
              onClick={handleNextPage}
            />
          )}
        </div>
      )}

      {/* Footer / Confirm CTA */}
      <div className="flex flex-col items-center gap-1.5 sm:gap-2 shrink-0">
        {selectedFrame && (
          <p className="text-[11px] sm:text-sm text-zinc-400">
            Frame Terpilih:{' '}
            <span className="font-semibold text-white">{selectedFrame.name}</span>
          </p>
        )}

        <button
          ref={confirmBtnRef}
          onClick={onConfirm}
          disabled={!isConfirmEnabled}
          className={`relative group overflow-hidden px-8 py-3 sm:px-14 sm:py-5 rounded-full font-bold text-sm sm:text-xl shadow-lg transition-all duration-200 flex items-center gap-2.5 sm:gap-3 ${
            isConfirmEnabled
              ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/30 hover:scale-[1.03] active:scale-95 cursor-pointer'
              : 'bg-zinc-800 text-zinc-500 border border-white/5 cursor-not-allowed pointer-events-none'
          }`}
        >
          {/* Circular progress on confirm button when hovered */}
          {isHovered && isConfirmEnabled && (
            <div className="relative w-7 h-7 sm:w-10 sm:h-10 flex items-center justify-center shrink-0">
              <svg className="w-7 h-7 sm:w-10 sm:h-10 -rotate-90 transform">
                <circle
                  cx="50%"
                  cy="50%"
                  r={radius}
                  className="stroke-white/30"
                  strokeWidth="3.5"
                  fill="transparent"
                />
                <circle
                  cx="50%"
                  cy="50%"
                  r={radius}
                  className="stroke-white transition-all duration-75"
                  strokeWidth="3.5"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
            </div>
          )}

          <span>
            {selectedFrame
              ? `Mulai Foto (${selectedFrame.slots?.length || 3}x Take) 📸`
              : 'Pilih Frame Dahulu'}
          </span>

          {isConfirmEnabled && (
            <svg
              className="w-4 h-4 sm:w-6 sm:h-6 transition-transform group-hover:translate-x-1 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          )}
        </button>
      </div>
    </motion.div>
  );
}

