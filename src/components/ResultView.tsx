"use client";

import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import type { Point2D, FrameTemplate } from "@/types";
import { useDwellTimer } from "@/hooks/useDwellTimer";
import { useAutoReset } from "@/hooks/useAutoReset";
import { uploadPhotoStrip } from "@/lib/storage";
import { insertPhotoRecord } from "@/lib/db";

interface ResultViewProps {
  compositedImageBlob: Blob | null;
  selectedFrame: FrameTemplate | null;
  cursorPositionRef: React.RefObject<Point2D | null>;
  onFinish: () => void;
  onRetake?: () => void;
}

export default function ResultView({
  compositedImageBlob,
  selectedFrame,
  cursorPositionRef,
  onFinish,
}: ResultViewProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const finishBtnRef = useRef<HTMLButtonElement>(null);
  const retryBtnRef = useRef<HTMLButtonElement>(null);

  // Auto Reset 60 detik (aktif jika sudah mengunggah / QR Code tampil)
  const { secondsLeft } = useAutoReset({
    durationSeconds: 60,
    enabled: signedUrl !== null && !isUploading,
    onReset: onFinish,
  });

  const localImageUrl = compositedImageBlob
    ? URL.createObjectURL(compositedImageBlob)
    : null;

  // Auto Upload Blob saat komponen pertama kali dirender
  useEffect(() => {
    if (!compositedImageBlob || signedUrl || isUploading) return;

    async function handleUpload() {
      try {
        setIsUploading(true);
        setUploadError(null);

        // 1. Upload ke Supabase Storage & dapatkan Signed URL (1 jam)
        const { signedUrl: sUrl, publicUrl: pUrl } = await uploadPhotoStrip(
          compositedImageBlob!,
        );
        setSignedUrl(sUrl);

        // 2. Insert record ke tabel Supabase photos
        await insertPhotoRecord(
          pUrl,
          selectedFrame?.name || selectedFrame?.file || null,
          selectedFrame?.slots?.length || 3,
        );
      } catch (err) {
        const error = err as Error;
        console.error("[ResultView] Upload error:", error);
        setUploadError(error.message || "Gagal mengunggah foto");
      } finally {
        setIsUploading(false);
      }
    }

    handleUpload();
  }, [compositedImageBlob, signedUrl, isUploading, selectedFrame]);

  // Touchless Dwell Timer: Selesai & Kembali 🏁
  const { progress: finishProgress, isHovered: isFinishHovered } =
    useDwellTimer({
      cursorPositionRef,
      elementRef: finishBtnRef,
      durationMs: 1500,
      onComplete: onFinish,
      enabled: !isUploading,
    });

  // Touchless Dwell Timer: Retry Upload 🔄
  const { progress: retryProgress, isHovered: isRetryHovered } = useDwellTimer({
    cursorPositionRef,
    elementRef: retryBtnRef,
    durationMs: 1500,
    onComplete: () => {
      setSignedUrl(null);
      setUploadError(null);
    },
    enabled: uploadError !== null,
  });

  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (finishProgress / 100) * circumference;

  return (
    <motion.div
      className="absolute inset-0 z-40 flex flex-col items-center justify-between p-3 sm:p-6 pt-6 sm:pt-6 pb-6 sm:pb-8 pointer-events-auto bg-black/85 backdrop-blur-md overflow-y-auto sm:overflow-hidden no-scrollbar"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="text-center mt-1 sm:mt-2 shrink-0">
        <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
          Hasil Foto Anda
        </h1>
        {selectedFrame && (
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
            Frame:{" "}
            <span className="font-medium text-zinc-200">
              {selectedFrame.name}
            </span>
          </p>
        )}
      </div>

      {/* Main Content Layout (Photo Preview + QR Code) */}
      <div className="w-full max-w-5xl my-auto py-2 flex flex-col md:flex-row items-center justify-center gap-3 sm:gap-8 px-2 sm:px-4">
        {/* Top/Left Column: Composited Photo Strip Preview */}
        <div className="w-full max-w-sm sm:max-w-md md:flex-1 flex flex-col items-center justify-center">
          <div className="relative w-full aspect-[745/310] rounded-xl bg-zinc-900/90 border border-white/10 shadow-lg overflow-hidden flex items-center justify-center">
            {localImageUrl ? (
              <Image
                src={localImageUrl}
                alt="Hasil Photobooth"
                fill
                className="object-contain p-1"
                unoptimized
                priority
              />
            ) : (
              <div className="text-zinc-500 text-xs sm:text-sm">Memuat gambar...</div>
            )}
          </div>
        </div>

        {/* Bottom/Right Column: QR Code & Status */}
        <div className="w-full max-w-xs sm:max-w-sm md:w-80 flex flex-col items-center text-center shrink-0">
          <AnimatePresence mode="wait">
            {/* 1. Loading State (Uploading to Supabase) */}
            {isUploading && (
              <motion.div
                key="uploading"
                className="bg-zinc-900/90 backdrop-blur-md p-4 sm:p-6 rounded-2xl w-full flex flex-col items-center gap-3 sm:gap-4 border border-white/8"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 border-3 border-zinc-700 border-t-amber-500 rounded-full animate-spin" />
                <div>
                  <h3 className="text-sm sm:text-base font-semibold text-white">
                    Mengunggah foto...
                  </h3>
                  <p className="text-[11px] sm:text-xs text-zinc-500 mt-0.5 sm:mt-1">
                    Menyiapkan QR Code unduhan
                  </p>
                </div>
              </motion.div>
            )}

            {/* 2. Error State (Upload Failed) */}
            {uploadError && !isUploading && (
              <motion.div
                key="error"
                className="bg-zinc-900/90 backdrop-blur-md p-4 sm:p-6 rounded-2xl w-full flex flex-col items-center gap-3 sm:gap-4 border border-red-500/20"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-red-500/15 text-red-400 flex items-center justify-center text-lg sm:text-xl">
                  ⚠️
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-red-300">
                    Gagal Mengunggah
                  </h3>
                  <p className="text-[11px] sm:text-xs text-zinc-500 mt-0.5">{uploadError}</p>
                </div>
                <button
                  ref={retryBtnRef}
                  onClick={() => {
                    setSignedUrl(null);
                    setUploadError(null);
                  }}
                  className="px-5 py-2 rounded-full bg-red-600 hover:bg-red-500 text-white font-semibold text-xs shadow-sm transition-colors"
                >
                  Coba Lagi 🔄
                </button>
              </motion.div>
            )}

            {/* 3. QR Code Success State */}
            {signedUrl && !isUploading && (
              <motion.div
                key="qrcode"
                className="bg-zinc-900/90 backdrop-blur-md p-3.5 sm:p-5 rounded-2xl w-full flex flex-col items-center gap-2 sm:gap-3 border border-white/8 shadow-lg"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                {/* QR Code Canvas Card */}
                <div className="p-2 sm:p-3 bg-white rounded-xl shadow-md">
                  <QRCodeSVG
                    value={signedUrl}
                    size={140}
                    className="w-32 h-32 sm:w-44 sm:h-44"
                    level="H"
                    includeMargin={false}
                  />
                </div>

                <div>
                  <h3 className="text-xs sm:text-base font-semibold text-white flex items-center justify-center gap-1.5">
                    <span>Scan QR Code</span>
                    <span className="text-base sm:text-lg">📱</span>
                  </h3>
                  <p className="text-[10px] sm:text-xs text-zinc-400 mt-0.5">
                    Arahkan kamera HP ke QR Code untuk unduh foto
                  </p>
                </div>

                {/* Alert Warning Expiration 1 Jam */}
                <div className="w-full px-2.5 py-1 sm:py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] sm:text-[11px] font-medium flex items-center justify-center gap-1">
                  <span className="text-xs">⏳</span>
                  <span>
                    Link berlaku selama <strong>1 Jam</strong>
                  </span>
                </div>

                {/* Auto Reset Timer Bar */}
                <div className="w-full pt-1.5 sm:pt-2 border-t border-white/6 flex items-center justify-between text-[11px] sm:text-xs text-zinc-400">
                  <span>Auto-reset:</span>
                  <span className="font-semibold text-white bg-zinc-800 px-2 py-0.5 rounded-full border border-white/8">
                    {secondsLeft}s
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Action Buttons Footer */}
      <div className="flex flex-col items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Finish / Auto-Reset Button */}
        <button
          ref={finishBtnRef}
          onClick={onFinish}
          disabled={isUploading}
          className="relative group overflow-hidden px-8 py-3 sm:px-14 sm:py-5 rounded-full bg-amber-600 hover:bg-amber-500 text-white font-bold text-base sm:text-2xl shadow-xl shadow-amber-900/30 transition-all duration-200 hover:scale-[1.03] active:scale-95 flex items-center gap-3 sm:gap-4 cursor-pointer disabled:opacity-50"
        >
          {/* Circular progress on confirm button when hovered */}
          {isFinishHovered && (
            <div className="relative w-7 h-7 sm:w-10 sm:h-10 flex items-center justify-center shrink-0">
              <svg className="w-7 h-7 sm:w-10 sm:h-10 -rotate-90 transform">
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

          <span>Selesai & Kembali ✨</span>

          <svg
            className="w-4 h-4 sm:w-6 sm:h-6 transition-transform group-hover:translate-x-1 shrink-0"
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

        <p className="text-[10px] sm:text-xs text-zinc-400 text-center px-4">
          Tunjuk tombol di atas dengan telunjuk ☝️ dan tahan selama 1.5 detik
        </p>
      </div>
    </motion.div>
  );
}
