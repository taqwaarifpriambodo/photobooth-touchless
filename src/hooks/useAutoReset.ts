'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseAutoResetOptions {
  durationSeconds?: number; // Default 60 detik
  enabled?: boolean;
  onReset: () => void;
}

interface UseAutoResetReturn {
  secondsLeft: number;
  resetTimer: () => void;
}

export function useAutoReset({
  durationSeconds = 60,
  enabled = true,
  onReset,
}: UseAutoResetOptions): UseAutoResetReturn {
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds);
  const onResetRef = useRef(onReset);

  useEffect(() => {
    onResetRef.current = onReset;
  }, [onReset]);

  const resetTimer = useCallback(() => {
    setSecondsLeft(durationSeconds);
  }, [durationSeconds]);

  useEffect(() => {
    if (!enabled) {
      setSecondsLeft(durationSeconds);
      return;
    }

    setSecondsLeft(durationSeconds);

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Defer onReset to avoid setState-during-render conflict
          setTimeout(() => onResetRef.current?.(), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [durationSeconds, enabled]);

  return {
    secondsLeft,
    resetTimer,
  };
}
