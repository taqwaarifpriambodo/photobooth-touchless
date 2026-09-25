'use client';

import { motion } from 'framer-motion';

interface PermissionGateProps {
  error: string | null;
  onRequestPermission: () => void;
}

/**
 * Gate izin kamera.
 * Tampilkan UI menarik untuk meminta izin kamera,
 * atau pesan error jika ditolak.
 */
export default function PermissionGate({
  error,
  onRequestPermission,
}: PermissionGateProps) {
  return (
    <div className="flex flex-col flex-1 items-center justify-center h-screen bg-[#0a0a0a]">
      <motion.div
        className="glass-card p-12 text-center max-w-lg mx-4"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* Icon */}
        <motion.div
          className="text-7xl mb-8"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          📸
        </motion.div>

        {/* Title */}
        <h1 className="text-4xl font-bold mb-3 text-white">
          Touchless Photo Booth
        </h1>
        <p className="text-zinc-400 text-lg mb-8">
          Foto seru tanpa sentuh layar — cukup gerakkan tangan Anda!
        </p>

        {/* Error Message */}
        {error && (
          <motion.div
            className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="font-medium">⚠️ Error:</span> {error}
          </motion.div>
        )}

        {/* CTA Button */}
        <motion.button
          onClick={onRequestPermission}
          className="px-8 py-4 rounded-full bg-amber-600 hover:bg-amber-500 text-white font-semibold text-lg shadow-lg shadow-amber-900/30 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          🎥 Izinkan Akses Kamera
        </motion.button>

        {/* Instructions */}
        <div className="mt-8 flex flex-col gap-3 text-sm text-zinc-500">
          <div className="flex items-center gap-3 justify-center">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/15 text-amber-400 text-xs font-bold">
              1
            </span>
            Izinkan akses kamera
          </div>
          <div className="flex items-center gap-3 justify-center">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/15 text-amber-400 text-xs font-bold">
              2
            </span>
            Pilih frame favorit Anda
          </div>
          <div className="flex items-center gap-3 justify-center">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/15 text-amber-400 text-xs font-bold">
              3
            </span>
            Ambil 3 foto dengan gerakan tangan
          </div>
        </div>
      </motion.div>
    </div>
  );
}
