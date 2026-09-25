'use client';

import { forwardRef } from 'react';
import { motion } from 'framer-motion';

interface CameraViewProps {
  isReady: boolean;
  children?: React.ReactNode;
}

/**
 * Komponen video stream fullscreen dengan efek cermin.
 * Menampilkan feed webcam sebagai background dan overlay children di atasnya.
 */
const CameraView = forwardRef<HTMLVideoElement, CameraViewProps>(
  function CameraView({ isReady, children }, ref) {
    return (
      <div className="camera-container">
        {/* Video Feed */}
        <video
          ref={ref}
          autoPlay
          playsInline
          muted
          className="camera-video"
        />

        {/* Loading overlay saat video belum siap */}
        {!isReady && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-black z-10"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
              <p className="text-zinc-400 text-sm">Memuat kamera...</p>
            </div>
          </motion.div>
        )}

        {/* Overlay content (cursor, buttons, countdown, etc.) */}
        {isReady && (
          <div className="absolute inset-0 z-20">
            {children}
          </div>
        )}
      </div>
    );
  }
);

export default CameraView;
