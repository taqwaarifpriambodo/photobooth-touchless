'use client';

import { useRef, useState, useCallback } from 'react';
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
}

const ITEMS_PER_PAGE = 6;

export default function FrameSelector({
  frames,
  selectedFrame,
  cursorPositionRef,
  onSelectFrame,
  onConfirm,
}: FrameSelectorProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  const totalPages = Math.max(1, Math.ceil(frames.length / ITEMS_PER_PAGE));
  const startIndex = currentPage * ITEMS_PER_PAGE;
  const visibleFrames = frames.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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
    onConfirm();
  }, [selectedFrame, frames, onSelectFrame, onConfirm]);

  const { secondsLeft } = useAutoReset({
    durationSeconds: 120, // 2 Menit
    enabled: true,
    onReset: handleAutoStart,
  });

  const formatCountdown = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const { progress, isHovered } = useDwellTimer({
    cursorPositionRef,
    elementRef: confirmBtnRef,
    durationMs: 1500,
    onComplete: onConfirm,
    enabled: selectedFrame !== null,
  });

  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <motion.div
      className="absolute inset-0 z-20 flex flex-col items-center justify-between p-4 sm:p-5 pointer-events-auto bg-black/50 backdrop-blur-sm overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="text-center mt-1 flex flex-col items-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Pilih Frame
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-0.5 max-w-md mx-auto">
          Tunjuk frame yang Anda inginkan dengan telunjuk ☝️ dan tahan selama 1.5 detik
        </p>

        {/* 2-Minute Auto-Start Countdown Badge */}
        <div className="mt-1.5 flex items-center gap-2">
          <span className="text-xs text-zinc-400">Otomatis mulai:</span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold font-mono border transition-colors duration-300 ${
              secondsLeft <= 10
                ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                : 'bg-zinc-800/90 text-amber-400 border-white/10'
            }`}
          >
            ⏱️ {formatCountdown(secondsLeft)}
          </span>
        </div>
      </div>

      {/* Frame Gallery with Navigation Arrows */}
      <div className="w-full max-w-6xl my-auto flex items-center justify-between gap-2 sm:gap-4 px-2">
        {/* Left Arrow Button */}
        <NavDwellButton
          direction="prev"
          disabled={currentPage === 0}
          cursorPositionRef={cursorPositionRef}
          onClick={handlePrevPage}
        />

        {/* Frames Grid */}
        <div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3.5 w-full justify-items-center"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
            >
              {visibleFrames.map((frame) => (
                <FrameCard
                  key={frame.file}
                  frame={frame}
                  isSelected={selectedFrame?.file === frame.file}
                  cursorPositionRef={cursorPositionRef}
                  onSelect={onSelectFrame}
                />
              ))}
            </motion.div>
          </AnimatePresence>

          {/* Page Dots Indicator */}
          {totalPages > 1 && (
            <div className="flex items-center gap-2 mt-3">
              {Array.from({ length: totalPages }).map((_, idx) => (
                <div
                  key={idx}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === currentPage
                      ? 'w-7 bg-amber-500'
                      : 'w-2 bg-white/20'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Arrow Button */}
        <NavDwellButton
          direction="next"
          disabled={currentPage >= totalPages - 1}
          cursorPositionRef={cursorPositionRef}
          onClick={handleNextPage}
        />
      </div>

      {/* Footer / Confirm CTA */}
      <div className="mb-4 sm:mb-8 flex flex-col items-center gap-2">
        {selectedFrame && (
          <p className="text-xs sm:text-sm text-zinc-400">
            Frame Terpilih:{' '}
            <span className="font-semibold text-white">{selectedFrame.name}</span>
          </p>
        )}

        <button
          ref={confirmBtnRef}
          onClick={onConfirm}
          className="relative group overflow-hidden px-10 py-4 sm:px-14 sm:py-5 rounded-full bg-amber-600 hover:bg-amber-500 text-white font-bold text-lg sm:text-xl shadow-lg shadow-amber-900/30 transition-all duration-200 hover:scale-[1.03] active:scale-95 flex items-center gap-3 cursor-pointer"
        >
          {/* Circular progress on confirm button when hovered */}
          {isHovered && (
            <div className="relative w-10 h-10 flex items-center justify-center">
              <svg className="w-10 h-10 -rotate-90 transform">
                <circle
                  cx="20"
                  cy="20"
                  r={radius}
                  className="stroke-white/30"
                  strokeWidth="4"
                  fill="transparent"
                />
                <circle
                  cx="20"
                  cy="20"
                  r={radius}
                  className="stroke-white transition-all duration-75"
                  strokeWidth="4"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
            </div>
          )}

          <span>
            Mulai Foto ({selectedFrame?.slots?.length || 3}x Take) 📸
          </span>

          <svg
            className="w-6 h-6 transition-transform group-hover:translate-x-1"
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
        </button>
      </div>
    </motion.div>
  );
}
