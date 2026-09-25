'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { FrameTemplate, SessionPhase } from '@/types';
import { captureVideoFrame, compositePhotosWithFrame } from '@/lib/photoCompositor';

interface UseMultiShotSessionOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  selectedFrame: FrameTemplate | null;
  totalShots?: number; // Default 3 foto
  onSessionComplete?: (compositedBlob: Blob, photos: Blob[]) => void;
}

interface UseMultiShotSessionReturn {
  currentShot: number;
  totalShots: number;
  countdown: number;
  sessionPhase: SessionPhase | 'IDLE' | 'COMPOSITING';
  isFlashing: boolean;
  capturedPhotos: Blob[];
  isProcessing: boolean;
  startSession: () => void;
  resetSession: () => void;
}

export function useMultiShotSession({
  videoRef,
  selectedFrame,
  totalShots = 3,
  onSessionComplete,
}: UseMultiShotSessionOptions): UseMultiShotSessionReturn {
  const [currentShot, setCurrentShot] = useState(1);
  const [countdown, setCountdown] = useState(10);
  const [sessionPhase, setSessionPhase] = useState<SessionPhase | 'IDLE' | 'COMPOSITING'>('IDLE');
  const [isFlashing, setIsFlashing] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<Blob[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const capturedPhotosRef = useRef<Blob[]>([]);
  const currentShotRef = useRef(1);
  const isSessionActiveRef = useRef(false);
  const onCompleteRef = useRef(onSessionComplete);

  useEffect(() => {
    onCompleteRef.current = onSessionComplete;
  }, [onSessionComplete]);

  const resetSession = useCallback(() => {
    isSessionActiveRef.current = false;
    capturedPhotosRef.current = [];
    currentShotRef.current = 1;
    setCurrentShot(1);
    setCountdown(10);
    setSessionPhase('IDLE');
    setIsFlashing(false);
    setCapturedPhotos([]);
    setIsProcessing(false);
  }, []);

  const runShotSequence = useCallback(
    async (shotIndex: number) => {
      if (!isSessionActiveRef.current) return;

      currentShotRef.current = shotIndex;
      setCurrentShot(shotIndex);
      setSessionPhase('COUNTDOWN');

      // 1. Countdown loop: 10 -> ... -> 1
      for (let c = 10; c >= 1; c--) {
        if (!isSessionActiveRef.current) return;
        setCountdown(c);
        await new Promise((res) => setTimeout(res, 1000));
      }

      if (!isSessionActiveRef.current) return;

      // 2. Flash & Capture phase
      setSessionPhase('FLASH');
      setIsFlashing(true);

      let photoBlob: Blob | null = null;
      if (videoRef.current) {
        try {
          photoBlob = await captureVideoFrame(videoRef.current);
        } catch (err) {
          console.error('[MultiShot] Capture error:', err);
        }
      }

      // Hide flash quickly after 200ms
      await new Promise((res) => setTimeout(res, 200));
      setIsFlashing(false);

      if (photoBlob) {
        capturedPhotosRef.current = [...capturedPhotosRef.current, photoBlob];
        setCapturedPhotos([...capturedPhotosRef.current]);
      }

      // 3. Next shot or Finish
      if (shotIndex < totalShots) {
        setSessionPhase('PREVIEW');
        // Jeda preview 1.5 detik sebelum shot berikutnya
        await new Promise((res) => setTimeout(res, 1500));
        await runShotSequence(shotIndex + 1);
      } else {
        // Semua foto selesai -> Compositing phase!
        setSessionPhase('COMPOSITING');
        setIsProcessing(true);

        try {
          if (selectedFrame) {
            console.log('[MultiShot] Compositing photos with frame...');
            const compositedBlob = await compositePhotosWithFrame(
              capturedPhotosRef.current,
              selectedFrame
            );
            console.log('[MultiShot] ✅ Compositing success!');
            if (onCompleteRef.current) {
              onCompleteRef.current(compositedBlob, capturedPhotosRef.current);
            }
          }
        } catch (err) {
          console.error('[MultiShot] Compositing error:', err);
        } finally {
          setIsProcessing(false);
        }
      }
    },
    [selectedFrame, totalShots, videoRef]
  );

  const startSession = useCallback(() => {
    resetSession();
    isSessionActiveRef.current = true;
    runShotSequence(1);
  }, [resetSession, runShotSequence]);

  return {
    currentShot,
    totalShots,
    countdown,
    sessionPhase,
    isFlashing,
    capturedPhotos,
    isProcessing,
    startSession,
    resetSession,
  };
}
