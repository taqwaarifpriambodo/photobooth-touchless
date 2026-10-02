'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import type { Point2D } from '@/types';
import { useDwellTimer } from '@/hooks/useDwellTimer';

interface NavDwellButtonProps {
  direction: 'prev' | 'next';
  disabled?: boolean;
  cursorPositionRef: React.RefObject<Point2D | null>;
  onClick: () => void;
}

export default function NavDwellButton({
  direction,
  disabled = false,
  cursorPositionRef,
  onClick,
}: NavDwellButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const { progress, isHovered } = useDwellTimer({
    cursorPositionRef,
    elementRef: buttonRef,
    durationMs: 1000, // 1 detik dwell time untuk navigasi cepat
    onComplete: onClick,
    enabled: !disabled,
  });

  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const isNext = direction === 'next';

  if (disabled) {
    return (
      <div className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-zinc-800/40 opacity-20 flex items-center justify-center cursor-not-allowed shrink-0">
        <svg
          className="w-5 h-5 sm:w-7 sm:h-7 text-zinc-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d={isNext ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'}
          />
        </svg>
      </div>
    );
  }

  return (
    <motion.button
      ref={buttonRef}
      onClick={onClick}
      className="relative group w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-zinc-800/80 border border-white/10 hover:border-amber-500/50 hover:bg-zinc-700/80 text-white shadow-md flex items-center justify-center cursor-pointer overflow-hidden transition-colors duration-200 shrink-0"
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Radial Dwell Progress Ring */}
      {isHovered && (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="w-full h-full p-1 -rotate-90 transform">
            <circle
              cx="50%"
              cy="50%"
              r={radius}
              className="stroke-white/15"
              strokeWidth="3"
              fill="transparent"
            />
            <circle
              cx="50%"
              cy="50%"
              r={radius}
              className="stroke-amber-400 transition-all duration-75"
              strokeWidth="3"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
        </div>
      )}

      {/* Arrow Icon */}
      <svg
        className={`w-5 h-5 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white transition-transform ${
          isNext
            ? 'group-hover:translate-x-0.5'
            : 'group-hover:-translate-x-0.5'
        }`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.5}
          d={isNext ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'}
        />
      </svg>
    </motion.button>
  );
}
