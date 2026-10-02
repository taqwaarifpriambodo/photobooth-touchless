'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import type { Point2D } from '@/types';
import { useDwellTimer } from '@/hooks/useDwellTimer';

interface WelcomeScreenProps {
  cursorPositionRef: React.RefObject<Point2D | null>;
  onStart: () => void;
  onLogout?: () => void;
  userEmail?: string | null;
}

export default function WelcomeScreen({
  cursorPositionRef,
  onStart,
  onLogout,
  userEmail,
}: WelcomeScreenProps) {
  const startBtnRef = useRef<HTMLButtonElement>(null);

  const { progress, isHovered } = useDwellTimer({
    cursorPositionRef,
    elementRef: startBtnRef,
    durationMs: 1500,
    onComplete: onStart,
    enabled: true,
  });

  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const steps = [
    {
      icon: '☝️',
      title: '1. Gerakkan Kursor',
      desc: 'Arahkan jari telunjuk ke arah kamera untuk menggerakkan kursor di layar.',
    },
    {
      icon: '⏱️',
      title: '2. Tahan untuk Memilih',
      desc: 'Arahkan dan tahan kursor selama 1.5 detik pada tombol atau frame pilihanmu.',
    },
    {
      icon: '📲',
      title: '3. Scan & Download',
      desc: 'Berpose di depan kamera, lalu scan QR Code dengan HP untuk mengunduh foto.',
    },
  ];

  return (
    <motion.div
      className="absolute inset-0 z-20 flex flex-col items-center justify-between p-4 sm:p-6 md:p-8 pt-14 sm:pt-10 pb-6 sm:pb-8 pointer-events-auto bg-black/65 backdrop-blur-md overflow-y-auto sm:overflow-hidden no-scrollbar"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4 }}
    >
      {/* Discreet Operator Logout Pill (Top Left) */}
      {onLogout && (
        <div className="absolute top-3 left-3 sm:top-6 sm:left-6 z-30">
          <button
            onClick={onLogout}
            title="Keluar Sesi Operator"
            className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/10 text-[10px] sm:text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>👤</span>
            <span className="max-w-[120px] truncate hidden sm:inline">{userEmail || 'Operator'}</span>
            <span className="text-zinc-500">|</span>
            <span>Keluar 🚪</span>
          </button>
        </div>
      )}

      {/* Top Header & Greeting */}
      <div className="text-center flex flex-col items-center max-w-2xl shrink-0">
        <motion.div
          className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] sm:text-xs md:text-sm font-semibold mb-1.5 sm:mb-3 tracking-wide"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <span>✨</span>
          <span>TOUCHLESS PHOTO BOOTH</span>
        </motion.div>

        <motion.h1
          className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Selamat Datang!
        </motion.h1>

        <motion.p
          className="text-xs sm:text-sm md:text-base text-zinc-300 mt-1 sm:mt-2 max-w-xs sm:max-w-md md:max-w-lg leading-relaxed"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Abadikan momen spesialmu secara mandiri, higienis, dan tanpa perlu menyentuh layar.
        </motion.p>
      </div>

      {/* Quick Start Guide Cards */}
      <motion.div
        className="w-full max-w-4xl my-auto py-2 grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3 md:gap-4 px-1 sm:px-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
      >
        {steps.map((step, idx) => (
          <div
            key={idx}
            className="bg-zinc-900/80 border border-white/8 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 md:p-5 flex flex-row md:flex-col items-center text-left md:text-center shadow-lg transition-transform duration-200 hover:border-white/20 gap-3 md:gap-0"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl sm:rounded-2xl bg-zinc-800 flex items-center justify-center text-xl sm:text-2xl md:text-3xl shrink-0 md:mb-3 shadow-inner border border-white/5">
              {step.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs sm:text-base md:text-lg font-bold text-white mb-0.5 sm:mb-1 truncate md:whitespace-normal">
                {step.title}
              </h3>
              <p className="text-[11px] sm:text-xs md:text-sm text-zinc-400 leading-snug sm:leading-relaxed">
                {step.desc}
              </p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Footer / Start CTA Button */}
      <motion.div
        className="flex flex-col items-center gap-2 sm:gap-3 shrink-0"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
      >
        <button
          ref={startBtnRef}
          onClick={onStart}
          className="relative group overflow-hidden px-8 py-3 sm:px-12 sm:py-4 md:px-16 md:py-5 rounded-full bg-amber-600 hover:bg-amber-500 text-white font-bold text-base sm:text-xl md:text-2xl shadow-xl shadow-amber-900/30 transition-all duration-200 hover:scale-[1.03] active:scale-95 flex items-center gap-3 sm:gap-4 cursor-pointer"
        >
          {/* Circular progress on confirm button when hovered */}
          {isHovered && (
            <div className="relative w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center shrink-0">
              <svg className="w-7 h-7 sm:w-9 sm:h-9 -rotate-90 transform">
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

          <span>Mulai Sekarang ✨</span>

          <svg
            className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 transition-transform group-hover:translate-x-1 shrink-0"
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

        <p className="text-[11px] sm:text-xs text-zinc-400 text-center px-4">
          Tunjuk tombol di atas dengan telunjuk ☝️ dan tahan selama 1.5 detik
        </p>
      </motion.div>
    </motion.div>
  );
}
