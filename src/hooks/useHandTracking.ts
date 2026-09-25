'use client';

import { useState, useEffect, useRef } from 'react';
import {
  HandLandmarker,
  FilesetResolver,
} from '@mediapipe/tasks-vision';
import { landmarkToScreen } from '@/lib/coordinates';
import type { Point2D } from '@/types';
import type { VirtualCursorHandle } from '@/components/VirtualCursor';

interface UseHandTrackingReturn {
  cursorPosition: React.RefObject<Point2D | null>;
  isHandDetected: boolean;
  isModelLoading: boolean;
  modelLoadProgress: string;
  cursorRef: React.RefObject<VirtualCursorHandle | null>;
}

// Index finger tip landmark
const INDEX_FINGER_TIP = 8;

// Dead-zone: abaikan gerakan < N piksel
const DEAD_ZONE = 1.5;

// Toleransi frame hilang sebelum kursor disembunyikan (~300ms @ 60fps = 18 frame)
const MAX_MISSED_FRAMES = 18;

/**
 * Smoothing dengan Double Exponential (Holt's method).
 */
class DoubleExponentialSmoothing {
  private smoothed: Point2D | null = null;
  private trend: Point2D = { x: 0, y: 0 };
  private alpha: number;
  private beta: number;

  constructor(alpha = 0.4, beta = 0.15) {
    this.alpha = alpha;
    this.beta = beta;
  }

  update(raw: Point2D): Point2D {
    if (!this.smoothed) {
      this.smoothed = { ...raw };
      return this.smoothed;
    }

    const prevSmoothed = this.smoothed;

    this.smoothed = {
      x: this.alpha * raw.x + (1 - this.alpha) * (prevSmoothed.x + this.trend.x),
      y: this.alpha * raw.y + (1 - this.alpha) * (prevSmoothed.y + this.trend.y),
    };

    this.trend = {
      x: this.beta * (this.smoothed.x - prevSmoothed.x) + (1 - this.beta) * this.trend.x,
      y: this.beta * (this.smoothed.y - prevSmoothed.y) + (1 - this.beta) * this.trend.y,
    };

    return this.smoothed;
  }

  reset() {
    this.smoothed = null;
    this.trend = { x: 0, y: 0 };
  }
}

export function useHandTracking(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  isVideoReady: boolean
): UseHandTrackingReturn {
  const [isHandDetected, setIsHandDetected] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [modelLoadProgress, setModelLoadProgress] = useState('Memuat model AI...');

  const cursorRef = useRef<VirtualCursorHandle | null>(null);
  const cursorPositionRef = useRef<Point2D | null>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const animationFrameRef = useRef<number>(0);
  const lastVideoTimeRef = useRef<number>(-1);
  const isRunningRef = useRef(false);
  const smootherRef = useRef(new DoubleExponentialSmoothing(0.4, 0.15));
  const isHandDetectedRef = useRef(false);
  const lastPositionRef = useRef<Point2D | null>(null);
  const missedFramesRef = useRef(0);

  // Inisialisasi HandLandmarker dengan threshold yang lebih sensitif
  useEffect(() => {
    let cancelled = false;

    async function initHandLandmarker() {
      try {
        setModelLoadProgress('Mengunduh komponen vision...');
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        if (cancelled) return;

        setModelLoadProgress('Memuat model hand tracking...');
        const handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 1,
          minHandDetectionConfidence: 0.15, // Ditingkatkan sensitivitasnya
          minHandPresenceConfidence: 0.15,  // Mencegah terputus di pinggir kamera
          minTrackingConfidence: 0.15,
        });

        if (cancelled) return;

        handLandmarkerRef.current = handLandmarker;
        setIsModelLoading(false);
        setModelLoadProgress('Model siap!');
        console.log('[HandTracking] ✅ HandLandmarker ready with low-edge tolerance!');
      } catch (error) {
        console.error('[HandTracking] ❌ Failed to initialize:', error);
        setModelLoadProgress('Gagal memuat model. Coba refresh halaman.');
      }
    }

    initHandLandmarker();

    return () => {
      cancelled = true;
    };
  }, []);

  // Detection loop dengan grace period (persistence)
  useEffect(() => {
    if (!isVideoReady || isModelLoading) {
      return;
    }

    console.log('[HandTracking] 🚀 Starting detection loop');
    isRunningRef.current = true;

    function detectFrame() {
      if (!isRunningRef.current) return;

      const video = videoRef.current;
      const handLandmarker = handLandmarkerRef.current;

      if (!video || !handLandmarker || video.readyState < 2 || video.videoWidth === 0) {
        animationFrameRef.current = requestAnimationFrame(detectFrame);
        return;
      }

      const currentTime = video.currentTime;
      if (currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = currentTime;

        try {
          const results = handLandmarker.detectForVideo(video, performance.now());

          if (results.landmarks && results.landmarks.length > 0) {
            // Tangan terdeteksi -> reset miss counter
            missedFramesRef.current = 0;

            const indexFingerTip = results.landmarks[0][INDEX_FINGER_TIP];

            // Konversi ke koordinat layar (mirrored & clamped)
            const rawPosition = landmarkToScreen(
              indexFingerTip,
              window.innerWidth,
              window.innerHeight
            );

            // Double exponential smoothing
            const smoothed = smootherRef.current.update(rawPosition);

            // Dead-zone filter
            const last = lastPositionRef.current;
            if (last) {
              const dx = Math.abs(smoothed.x - last.x);
              const dy = Math.abs(smoothed.y - last.y);
              if (dx < DEAD_ZONE && dy < DEAD_ZONE) {
                animationFrameRef.current = requestAnimationFrame(detectFrame);
                return;
              }
            }

            lastPositionRef.current = smoothed;
            cursorPositionRef.current = smoothed;

            // Update DOM langsung via imperative handle
            cursorRef.current?.updatePosition(smoothed);

            if (!isHandDetectedRef.current) {
              isHandDetectedRef.current = true;
              setIsHandDetected(true);
              cursorRef.current?.setVisible(true);
            }
          } else {
            // Tangan terputus sementara (misal di pinggir kamera) -> gunakan Grace Period
            missedFramesRef.current += 1;

            if (missedFramesRef.current > MAX_MISSED_FRAMES) {
              if (isHandDetectedRef.current) {
                isHandDetectedRef.current = false;
                setIsHandDetected(false);
                cursorRef.current?.setVisible(false);
                cursorPositionRef.current = null;
                lastPositionRef.current = null;
                smootherRef.current.reset();
              }
            }
          }
        } catch (err) {
          console.error('[HandTracking] Detection error:', err);
        }
      }

      animationFrameRef.current = requestAnimationFrame(detectFrame);
    }

    animationFrameRef.current = requestAnimationFrame(detectFrame);

    return () => {
      isRunningRef.current = false;
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isVideoReady, isModelLoading, videoRef]);

  // Cleanup
  useEffect(() => {
    return () => {
      handLandmarkerRef.current?.close();
    };
  }, []);

  return {
    cursorPosition: cursorPositionRef,
    isHandDetected,
    isModelLoading,
    modelLoadProgress,
    cursorRef,
  };
}
