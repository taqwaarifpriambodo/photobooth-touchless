'use client';

import { useRef, useState, useEffect, useCallback } from 'react';

interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  stream: MediaStream | null;
  isReady: boolean;
  error: string | null;
  requestPermission: () => Promise<void>;
}

/**
 * Hook untuk mengakses kamera webcam via getUserMedia.
 * Mengelola lifecycle stream: request → active → cleanup.
 *
 * Otomatis mencoba mengaktifkan kamera saat mount jika izin sudah diberikan di browser.
 */
export function useCamera(): UseCameraReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestPermission = useCallback(async () => {
    try {
      setError(null);
      console.log('[Camera] Requesting stream...');

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
          frameRate: { ideal: 30, min: 24 },
        },
        audio: false,
      });

      console.log('[Camera] ✅ Stream obtained:', mediaStream.getVideoTracks()[0].label);
      setStream(mediaStream);
    } catch (err) {
      const error = err as Error;
      console.error('[Camera] ❌ Error:', error.name, error.message);

      if (error.name === 'NotAllowedError') {
        setError(
          'Izin kamera ditolak. Silakan izinkan akses kamera di pengaturan browser Anda.'
        );
      } else if (error.name === 'NotFoundError') {
        setError(
          'Kamera tidak ditemukan. Pastikan perangkat Anda memiliki kamera yang terhubung.'
        );
      } else if (error.name === 'NotReadableError') {
        setError(
          'Kamera sedang digunakan oleh aplikasi lain. Tutup aplikasi lain dan coba lagi.'
        );
      } else {
        setError(`Gagal mengakses kamera: ${error.message}`);
      }
    }
  }, []);

  // Auto check permission / start camera on mount if granted
  useEffect(() => {
    let cancelled = false;

    async function checkAutoStart() {
      if (typeof window === 'undefined' || !navigator.mediaDevices) return;

      try {
        if ('permissions' in navigator) {
          const status = await navigator.permissions.query({
            name: 'camera' as PermissionName,
          });

          if (status.state === 'granted' && !cancelled) {
            console.log('[Camera] Permission already granted, auto starting camera...');
            requestPermission();
          }
        }
      } catch (err) {
        // Fallback for browsers that don't support permissions.query for camera
        console.log('[Camera] Permissions API query skipped:', err);
      }
    }

    checkAutoStart();

    return () => {
      cancelled = true;
    };
  }, [requestPermission]);

  // Attach stream ke video element secara reaktif
  useEffect(() => {
    if (!stream) return;

    const attachStream = () => {
      const video = videoRef.current;
      if (!video) {
        const timer = setTimeout(attachStream, 100);
        return () => clearTimeout(timer);
      }

      console.log('[Camera] Attaching stream to video element...');
      video.srcObject = stream;
      video.onloadedmetadata = () => {
        video
          .play()
          .then(() => {
            console.log(
              '[Camera] ✅ Video playing!',
              video.videoWidth,
              'x',
              video.videoHeight
            );
            setIsReady(true);
          })
          .catch((err) => {
            console.error('[Camera] ❌ Play failed:', err);
          });
      };
    };

    attachStream();
  }, [stream]);

  // Cleanup: stop semua tracks saat unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  return {
    videoRef,
    stream,
    isReady,
    error,
    requestPermission,
  };
}
