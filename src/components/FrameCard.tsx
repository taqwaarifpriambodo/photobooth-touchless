'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import type { FrameTemplate, Point2D } from '@/types';
import { useDwellTimer } from '@/hooks/useDwellTimer';

interface FrameCardProps {
  frame: FrameTemplate;
  isSelected: boolean;
  cursorPositionRef: React.RefObject<Point2D | null>;
  onSelect: (frame: FrameTemplate) => void;
}

export default function FrameCard({
  frame,
  isSelected,
  cursorPositionRef,
  onSelect,
}: FrameCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const { progress, isHovered } = useDwellTimer({
    cursorPositionRef,
    elementRef: cardRef,
    durationMs: 1500,
    onComplete: () => {
      onSelect(frame);
    },
  });

  // Calculate SVG progress ring (radius = 24, circumference = 2 * PI * 24 ≈ 150.8)
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <motion.div
      ref={cardRef}
      className={`relative group cursor-pointer rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-200 w-full max-w-[165px] sm:max-w-[220px] md:max-w-[260px] ${
        isSelected
          ? 'ring-2 ring-amber-500 shadow-lg shadow-amber-900/20 scale-[1.02]'
          : 'border border-white/8 hover:border-white/20'
      }`}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Container aspect ratio matching horizontal 745x310 strip */}
      <div className="relative w-full aspect-[745/380] bg-zinc-950 flex flex-col justify-between p-1.5 sm:p-2.5 overflow-hidden">
        {/* Frame preview image */}
        <div className="relative w-full flex-1 rounded-lg overflow-hidden flex items-center justify-center min-h-[46px] sm:min-h-[70px]">
          <Image
            src={frame.publicUrl || `/frames/${frame.file}`}
            alt={frame.name}
            fill
            className="object-contain p-0.5 sm:p-1"
            sizes="(max-width: 640px) 150px, 260px"
            unoptimized={!!frame.publicUrl}
            priority
          />
        </div>

        {/* Frame Label */}
        <div className="text-center pt-0.5 sm:pt-1">
          <p className="text-[10px] sm:text-xs md:text-sm font-medium text-zinc-200 truncate px-1">
            {frame.name}
          </p>
        </div>

        {/* Hover Dwell Radial Progress Overlay */}
        {isHovered && progress < 100 && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center transition-opacity duration-200">
            <div className="relative flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14">
              <svg className="w-10 h-10 sm:w-14 sm:h-14 -rotate-90 transform">
                {/* Background Ring */}
                <circle
                  cx="50%"
                  cy="50%"
                  r={radius}
                  className="stroke-white/15"
                  strokeWidth="3"
                  fill="transparent"
                />
                {/* Progress Ring */}
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
              <span className="absolute text-[9px] sm:text-xs font-semibold text-white">
                {Math.round(progress)}%
              </span>
            </div>
            <span className="text-[8px] sm:text-xs text-zinc-300 font-medium mt-0.5">
              Tahan kursor...
            </span>
          </div>
        )}

        {/* Selection Badge */}
        {isSelected && (
          <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-amber-600 text-white rounded-full p-1 sm:p-1.5 shadow-sm">
            <svg
              className="w-2.5 h-2.5 sm:w-3 sm:h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        )}
      </div>
    </motion.div>
  );
}
