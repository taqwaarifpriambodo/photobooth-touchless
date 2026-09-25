'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { FrameTemplate, SessionPhase } from '@/types';

interface MultiShotOverlayProps {
  currentShot: number;
  totalShots: number;
  countdown: number;
  sessionPhase: SessionPhase | 'IDLE' | 'COMPOSITING';
  isFlashing: boolean;
  selectedFrame: FrameTemplate | null;
  isProcessing: boolean;
}

export default function MultiShotOverlay({
  currentShot,
  totalShots,
  countdown,
  sessionPhase,
  isFlashing,
  selectedFrame,
  isProcessing,
}: MultiShotOverlayProps) {
  // Ambil data slot aktif sesuai urutan foto (currentShot: 1..3)
  const currentSlot =
    selectedFrame?.slots && selectedFrame.slots.length > 0
      ? selectedFrame.slots[currentShot - 1] || selectedFrame.slots[0]
      : null;

  return (
    <>
      {/* 1. Fullscreen Camera Flash Effect */}
      {isFlashing && (
        <motion.div
          className="fixed inset-0 bg-white z-50 pointer-events-none"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        />
      )}

      {/* 2. Main Overlay UI Container */}
      <div className="absolute inset-0 z-30 flex flex-col items-center justify-between p-3 pointer-events-none select-none">
        {/* Top Header Status Badge */}
        <div className="mt-1 z-40">
          <motion.div
            className="bg-black/60 backdrop-blur-md px-5 py-2 rounded-full flex items-center gap-3 border border-white/8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-semibold text-white tracking-wide">
              FOTO {currentShot} DARI {totalShots}
            </span>
            {selectedFrame && (
              <span className="text-xs text-zinc-400 font-medium border-l border-white/10 pl-3">
                {selectedFrame.name}
              </span>
            )}
          </motion.div>
        </div>

        {/* Center Screen: Framing Guide Box & Animated Content */}
        <div className="my-auto flex flex-col items-center justify-center text-center w-full max-w-full px-1 z-40">
          <AnimatePresence mode="wait">
            {/* Countdown / Photo Capture Phase with Framing Guide Marker */}
            {sessionPhase === 'COUNTDOWN' && (
              <motion.div
                key={`countdown-container-${currentShot}`}
                className="relative flex flex-col items-center justify-center my-auto w-full"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                {/* GARIS BANTU / FRAMING GUIDE OVERLAY */}
                {currentSlot ? (
                  <div
                    className="relative flex items-center justify-center rounded-2xl p-2 transition-all duration-500"
                    style={{
                      aspectRatio: `${currentSlot.width} / ${currentSlot.height}`,
                      width: `min(90vw, calc(82vh * (${currentSlot.width} / ${currentSlot.height})))`,
                      maxHeight: '82vh',
                      maxWidth: '90vw',
                    }}
                  >
                    {/* Subtle Border */}
                    <div className="absolute inset-0 bg-black/10 rounded-2xl border border-dashed border-white/40 shadow-sm" />

                    {/* Viewfinder 4 Corner Brackets */}
                    <div className="absolute -top-1 -left-1 w-7 h-7 border-t-2 border-l-2 border-amber-400/60 rounded-tl-lg" />
                    <div className="absolute -top-1 -right-1 w-7 h-7 border-t-2 border-r-2 border-amber-400/60 rounded-tr-lg" />
                    <div className="absolute -bottom-1 -left-1 w-7 h-7 border-b-2 border-l-2 border-amber-400/60 rounded-bl-lg" />
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 border-b-2 border-r-2 border-amber-400/60 rounded-br-lg" />

                    {/* Top Guide Badge */}
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-3.5 py-0.5 rounded-full text-[11px] font-medium text-white/80 tracking-wide flex items-center gap-1.5 border border-white/10 whitespace-nowrap z-20">
                      <span>Area Foto ({currentSlot.width}×{currentSlot.height}px)</span>
                    </div>

                    {/* Bottom Helper Hint */}
                    <div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-3.5 py-0.5 rounded-full text-[10px] font-normal text-white/70 tracking-wide border border-white/10 whitespace-nowrap z-20">
                      Posisikan subjek di dalam garis bantu ☝️
                    </div>

                    {/* Center Countdown Number */}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`num-${countdown}`}
                        className="relative z-10 flex flex-col items-center justify-center pointer-events-none"
                        initial={{ scale: 0.3, opacity: 0 }}
                        animate={{ scale: 1.2, opacity: 1 }}
                        exit={{ scale: 2, opacity: 0 }}
                        transition={{ duration: 0.4, ease: 'backOut' }}
                      >
                        <div className="text-8xl sm:text-9xl font-black text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.7)]">
                          {countdown}
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                ) : (
                  /* Fallback tanpa slot */
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`num-${countdown}`}
                      className="flex flex-col items-center justify-center"
                      initial={{ scale: 0.3, opacity: 0 }}
                      animate={{ scale: 1.2, opacity: 1 }}
                      exit={{ scale: 2, opacity: 0 }}
                      transition={{ duration: 0.5, ease: 'backOut' }}
                    >
                      <div className="text-8xl sm:text-9xl font-black text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.7)]">
                        {countdown}
                      </div>
                      <p className="text-lg font-medium text-white/80 mt-2">
                        Tersenyum & Bersiap!
                      </p>
                    </motion.div>
                  </AnimatePresence>
                )}
              </motion.div>
            )}

            {/* Preview Phase between shots */}
            {sessionPhase === 'PREVIEW' && (
              <motion.div
                key="preview-msg"
                className="bg-zinc-900/90 backdrop-blur-md px-8 py-5 rounded-2xl flex flex-col items-center gap-2 border border-white/8"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <div className="w-10 h-10 rounded-full bg-emerald-600/20 text-emerald-400 flex items-center justify-center text-xl">
                  ✓
                </div>
                <h3 className="text-lg font-bold text-white">
                  Foto Ke-{currentShot} Berhasil!
                </h3>
                <p className="text-sm text-zinc-400">
                  Bersiap untuk foto ke-{currentShot + 1}...
                </p>
              </motion.div>
            )}

            {/* Compositing Loading Phase */}
            {(sessionPhase === 'COMPOSITING' || isProcessing) && (
              <motion.div
                key="compositing-msg"
                className="bg-zinc-900/90 backdrop-blur-md px-10 py-8 rounded-2xl flex flex-col items-center gap-4 text-center max-w-sm border border-white/8"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="relative w-14 h-14 flex items-center justify-center">
                  <div className="w-14 h-14 border-3 border-zinc-700 border-t-amber-500 rounded-full animate-spin" />
                  <span className="absolute text-xl">🖼️</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Memproses Foto...
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    Menggabungkan {totalShots} foto ke dalam frame pilihan Anda
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Shot Progress Bar */}
        <div className="mb-3 w-full max-w-xs z-40">
          <div className="flex items-center justify-between gap-2 mb-1">
            {Array.from({ length: totalShots }).map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                  idx < currentShot
                    ? 'bg-amber-500'
                    : 'bg-white/15'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
