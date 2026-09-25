'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import type { Point2D } from '@/types';
import { useDwellTimer } from '@/hooks/useDwellTimer';

interface WelcomeScreenProps {
  cursorPositionRef: React.RefObject<Point2D | null>;
  onStart: () => void;
}

export default function WelcomeScreen({
  cursorPositionRef,
  onStart,
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
      className="absolute inset-0 z-20 flex flex-col items-center justify-between p-6 sm:p-8 pointer-events-auto bg-black/60 backdrop-blur-md overflow-hidden"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4 }}
    >
      {/* Top Header & Greeting */}
      <div className="text-center mt-2 sm:mt-4 flex flex-col items-center max-w-2xl">
        <motion.div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs sm:text-sm font-semibold mb-3 tracking-wide"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <span>✨</span>
          <span>TOUCHLESS PHOTO BOOTH</span>
        </motion.div>

        <motion.h1
          className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Selamat Datang!
        </motion.h1>

        <motion.p
          className="text-sm sm:text-base text-zinc-300 mt-2 max-w-lg leading-relaxed"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Abadikan momen spesialmu secara mandiri, higienis, dan tanpa perlu menyentuh layar.
        </motion.p>
      </div>

      {/* Quick Start Guide Cards */}
      <motion.div
        className="w-full max-w-4xl my-auto grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 px-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
      >
        {steps.map((step, idx) => (
          <div
            key={idx}
            className="bg-zinc-900/80 border border-white/8 rounded-2xl p-4 sm:p-5 flex flex-col items-center text-center shadow-lg transition-transform duration-200 hover:border-white/20"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-zinc-800 flex items-center justify-center text-2xl sm:text-3xl mb-3 shadow-inner border border-white/5">
              {step.icon}
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mb-1">
              {step.title}
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              {step.desc}
            </p>
          </div>
        ))}
      </motion.div>

      {/* Footer / Start CTA Button */}
      <motion.div
        className="mb-6 sm:mb-10 flex flex-col items-center gap-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
      >
        <button
          ref={startBtnRef}
          onClick={onStart}
          className="relative group overflow-hidden px-12 py-5 sm:px-16 sm:py-6 rounded-full bg-amber-600 hover:bg-amber-500 text-white font-bold text-xl sm:text-2xl shadow-xl shadow-amber-900/30 transition-all duration-200 hover:scale-[1.03] active:scale-95 flex items-center gap-4 cursor-pointer"
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

          <span>Mulai Sekarang ✨</span>

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

        <p className="text-xs text-zinc-400">
          Tunjuk tombol di atas dengan telunjuk ☝️ dan tahan selama 1.5 detik
        </p>
      </motion.div>
    </motion.div>
  );
}
