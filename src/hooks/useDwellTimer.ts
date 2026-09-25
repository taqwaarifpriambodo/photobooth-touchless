'use client';

import { useState, useEffect, useRef } from 'react';
import type { Point2D } from '@/types';
import { isPointInElement } from '@/lib/coordinates';

interface UseDwellTimerOptions {
  cursorPositionRef: React.RefObject<Point2D | null>;
  elementRef: React.RefObject<HTMLElement | null>;
  durationMs?: number; // Default 1500ms (1.5 detik)
  onComplete?: () => void;
  enabled?: boolean;
}

interface UseDwellTimerReturn {
  progress: number; // 0 - 100
  isHovered: boolean;
  reset: () => void;
}

export function useDwellTimer({
  cursorPositionRef,
  elementRef,
  durationMs = 1500,
  onComplete,
  enabled = true,
}: UseDwellTimerOptions): UseDwellTimerReturn {
  const [progress, setProgress] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number>(0);
  const isCompletedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  // Sync onComplete ref
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const reset = () => {
    startTimeRef.current = null;
    isCompletedRef.current = false;
    setProgress(0);
    setIsHovered(false);
  };

  useEffect(() => {
    if (!enabled) {
      reset();
      return;
    }

    function checkDwell() {
      const cursor = cursorPositionRef.current;
      const element = elementRef.current;

      if (!cursor || !element) {
        if (startTimeRef.current !== null || isHovered) {
          startTimeRef.current = null;
          isCompletedRef.current = false;
          setProgress(0);
          setIsHovered(false);
        }
        animationFrameRef.current = requestAnimationFrame(checkDwell);
        return;
      }

      const isInside = isPointInElement(cursor, element);

      if (isInside) {
        if (!isHovered) {
          setIsHovered(true);
        }

        const now = performance.now();

        if (startTimeRef.current === null) {
          startTimeRef.current = now;
        }

        const elapsed = now - startTimeRef.current;
        const currentProgress = Math.min(100, (elapsed / durationMs) * 100);

        setProgress(currentProgress);

        if (currentProgress >= 100 && !isCompletedRef.current) {
          isCompletedRef.current = true;
          if (onCompleteRef.current) {
            onCompleteRef.current();
          }
        }
      } else {
        if (startTimeRef.current !== null || isHovered) {
          startTimeRef.current = null;
          isCompletedRef.current = false;
          setProgress(0);
          setIsHovered(false);
        }
      }

      animationFrameRef.current = requestAnimationFrame(checkDwell);
    }

    animationFrameRef.current = requestAnimationFrame(checkDwell);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [cursorPositionRef, elementRef, durationMs, enabled, isHovered]);

  return { progress, isHovered, reset };
}
