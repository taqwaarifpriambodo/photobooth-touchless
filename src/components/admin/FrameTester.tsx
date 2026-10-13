'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { FrameTemplate } from '@/types';
import { compositePhotosWithFrame, captureVideoFrame } from '@/lib/photoCompositor';
import ZoomablePreview from './ZoomablePreview';

export interface FrameTesterProps {
  frameTemplate: FrameTemplate;
  onComposited?: (blob: Blob) => void;
  onCompositedUrlChange?: (url: string | null, blob: Blob | null) => void;
  onIsCompositingChange?: (loading: boolean) => void;
  hidePreview?: boolean;
}

export default function FrameTester({
  frameTemplate,
  onComposited,
  onCompositedUrlChange,
  onIsCompositingChange,
  hidePreview = false,
}: FrameTesterProps) {
  const [sourceMode, setSourceMode] = useState<'camera' | 'upload'>('upload');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [compositedUrl, setCompositedUrl] = useState<string | null>(null);
  const [isCompositing, setIsCompositing] = useState(false);
  const [compositeError, setCompositeError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalSlots = frameTemplate.slots.length;

  // Matikan stream kamera saat unmount atau saat kamera dimatikan
  const stopCamera = useCallback(() => {
    if (videoRef.current) {
      try {
        videoRef.current.onloadedmetadata = null;
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      } catch {
        // Abaikan error saat reset video element
      }
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setCameraError(null);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Nyalakan kamera
  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      setIsCameraActive(true);

      if (videoRef.current) {
        const video = videoRef.current;
        if (video.srcObject !== stream) {
          video.srcObject = stream;
        }

        const tryPlay = () => {
          if (video.paused) {
            const playPromise = video.play();
            if (playPromise !== undefined) {
              playPromise.catch((err: unknown) => {
                // AbortError & NotAllowedError adalah hal lumrah saat interupsi media
                if (
                  err instanceof Error &&
                  (err.name === 'AbortError' || err.name === 'NotAllowedError')
                ) {
                  return;
                }
                console.warn('[FrameTester] Video play error:', err);
              });
            }
          }
        };

        if (video.readyState >= 1) {
          tryPlay();
        } else {
          video.onloadedmetadata = () => {
            tryPlay();
          };
        }
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan.';
      setCameraError(msg);
      setIsCameraActive(false);
    }
  };

  // Jalankan proses compositing foto dengan frame yang sedang diuji
  const runCompositing = useCallback(
    async (photos: Blob[]) => {
      if (photos.length === 0) return;
      setIsCompositing(true);
      if (onIsCompositingChange) onIsCompositingChange(true);
      setCompositeError(null);

      try {
        // Jika foto yang tersedia kurang dari jumlah slot, duplikasi foto pertama untuk mengisi semua slot
        const filledPhotos = [...photos];
        while (filledPhotos.length < totalSlots) {
          filledPhotos.push(photos[0]);
        }

        const blob = await compositePhotosWithFrame(filledPhotos, frameTemplate);
        const url = URL.createObjectURL(blob);

        if (compositedUrl) {
          URL.revokeObjectURL(compositedUrl);
        }

        setCompositedUrl(url);
        if (onComposited) {
          onComposited(blob);
        }
        if (onCompositedUrlChange) {
          onCompositedUrlChange(url, blob);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal melakukan render komposisi frame';
        console.error('[FrameTester] Error compositing:', err);
        setCompositeError(msg);
      } finally {
        setIsCompositing(false);
        if (onIsCompositingChange) onIsCompositingChange(false);
      }
    },
    [compositedUrl, frameTemplate, onComposited, onCompositedUrlChange, onIsCompositingChange, totalSlots]
  );

  // Ambil 1 kali foto dari webcam dan terapkan langsung ke semua slot frame
  const handleCapturePhoto = async () => {
    if (!videoRef.current) return;
    try {
      const photoBlob = await captureVideoFrame(videoRef.current, 0.95);
      const filledPhotos = Array(totalSlots).fill(photoBlob);
      await runCompositing(filledPhotos);
    } catch (err) {
      console.error('[FrameTester] Capture error:', err);
      alert('Gagal mengambil foto dari kamera');
    }
  };

  // Handle upload file foto lokal
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const blobs: Blob[] = [];
    for (let i = 0; i < files.length; i++) {
      blobs.push(files[i]);
    }

    await runCompositing(blobs);
    e.target.value = '';
  };

  // Reset pengujian
  const handleResetTest = () => {
    if (compositedUrl) {
      URL.revokeObjectURL(compositedUrl);
      setCompositedUrl(null);
    }
    setCompositeError(null);
    if (onCompositedUrlChange) {
      onCompositedUrlChange(null, null);
    }
  };

  // Unduh hasil komposisi
  const handleDownloadResult = () => {
    if (!compositedUrl) return;
    const a = document.createElement('a');
    a.href = compositedUrl;
    a.download = `test_composite_${frameTemplate.canvasWidth}x${frameTemplate.canvasHeight}.png`;
    a.click();
  };

  return (
    <div className="flex flex-col gap-3 p-3.5 rounded-xl bg-zinc-950/70 border border-white/10">
      {/* Header Pengujian & Switcher Sumber */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-white">📸 Uji Foto Sendiri</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            {totalSlots} Slot
          </span>
        </div>

        {/* Tab Upload vs Webcam */}
        <div className="flex items-center rounded-lg bg-zinc-900 border border-white/10 p-0.5 text-[11px]">
          <button
            type="button"
            onClick={() => {
              stopCamera();
              setSourceMode('upload');
            }}
            className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
              sourceMode === 'upload' ? 'bg-amber-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            📁 File
          </button>
          <button
            type="button"
            onClick={() => {
              setSourceMode('camera');
              if (!isCameraActive) startCamera();
            }}
            className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
              sourceMode === 'camera' ? 'bg-amber-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            📷 Webcam
          </button>
        </div>
      </div>

      {/* Kontrol Input Foto */}
      {sourceMode === 'camera' ? (
        <div className="flex flex-col gap-2.5">
          {cameraError && (
            <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              ⚠️ {cameraError}
            </div>
          )}

          <div className="relative aspect-video w-full max-h-44 bg-zinc-900 rounded-lg overflow-hidden border border-white/10 flex items-center justify-center">
            <video
              ref={videoRef}
              playsInline
              muted
              className={`w-full h-full object-cover scale-x-[-1] ${!isCameraActive ? 'hidden' : ''}`}
            />
            {!isCameraActive && (
              <button
                type="button"
                onClick={startCamera}
                className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-2 transition-transform active:scale-95"
              >
                📹 Nyalakan Kamera
              </button>
            )}
          </div>

          {isCameraActive && (
            <div className="flex items-center justify-between flex-wrap gap-2 pt-0.5">
              <span className="text-[11px] text-zinc-400">
                1 foto mengisi seluruh {totalSlots} slot
              </span>
              <button
                type="button"
                onClick={handleCapturePhoto}
                disabled={isCompositing}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md shadow-amber-900/30 cursor-pointer flex items-center gap-1.5 transition-transform active:scale-95 disabled:opacity-50"
              >
                <span>📸</span>
                <span>Ambil Foto</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="p-3.5 border border-dashed border-white/20 hover:border-amber-500/60 bg-zinc-900/50 hover:bg-zinc-900/80 rounded-xl text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1 group"
          >
            <span className="text-xl group-hover:scale-110 transition-transform">🖼️</span>
            <p className="text-xs font-semibold text-zinc-200">
              Pilih Foto Uji Coba dari Perangkat
            </p>
            <p className="text-[10px] text-zinc-400">
              Cukup 1 foto (otomatis mengisi seluruh {totalSlots} slot frame)
            </p>
          </div>
        </div>
      )}

      {/* Loading Status */}
      {isCompositing && (
        <div className="flex items-center justify-center gap-2 py-1 text-xs text-amber-400 font-medium">
          <div className="w-3.5 h-3.5 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
          <span>Memproses render komposisi...</span>
        </div>
      )}

      {compositeError && (
        <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
          ⚠️ {compositeError}
        </div>
      )}

      {/* Standalone Preview jika tidak di-render di luar */}
      {!hidePreview && compositedUrl && (
        <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-green-400">
              ✅ Preview Hasil ({frameTemplate.canvasWidth} × {frameTemplate.canvasHeight} px)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetTest}
                className="text-[11px] text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                Hapus
              </button>
              <button
                type="button"
                onClick={handleDownloadResult}
                className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] font-semibold border border-white/10 transition-colors cursor-pointer flex items-center gap-1"
              >
                ⬇️ Unduh
              </button>
            </div>
          </div>

          <ZoomablePreview
            src={compositedUrl}
            alt="Hasil Komposisi Frame"
            canvasWidth={frameTemplate.canvasWidth}
            canvasHeight={frameTemplate.canvasHeight}
            maxHeightClass="max-h-60"
          />
        </div>
      )}
    </div>
  );
}
