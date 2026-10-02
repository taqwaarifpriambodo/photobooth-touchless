'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface LoginGateProps {
  onLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  error: string | null;
  isLoading: boolean;
  onClearError: () => void;
}

export default function LoginGate({
  onLogin,
  error,
  isLoading,
  onClearError,
}: LoginGateProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || isLoading) return;
    await onLogin(email, password);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-[#0a0a0a] relative overflow-hidden conventional-cursor">
      {/* Background Decorative Ambient Lights */}
      <div className="absolute top-1/4 -left-20 w-72 h-72 bg-amber-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        className="w-full max-w-md bg-zinc-900/90 backdrop-blur-xl border border-white/10 p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-2xl relative z-10"
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      >
        {/* Top Header Branding */}
        <div className="flex flex-col items-center text-center mb-6 sm:mb-8">
          <motion.div
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 p-0.5 shadow-lg shadow-amber-600/20 mb-3 flex items-center justify-center"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 12, stiffness: 200 }}
          >
            <div className="w-full h-full bg-zinc-950 rounded-[14px] flex items-center justify-center text-2xl sm:text-3xl">
              📸
            </div>
          </motion.div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] sm:text-xs font-semibold mb-2">
            ✨ TOUCHLESS PHOTO BOOTH
          </span>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Masuk Operator
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xs">
            Silakan masuk dengan akun yang terdaftar untuk mengaktifkan photobooth.
          </p>
        </div>

        {/* Error Alert Message */}
        {error && (
          <motion.div
            className="mb-5 p-3 sm:p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="text-base shrink-0">⚠️</span>
            <div className="flex-1 leading-snug">{error}</div>
          </motion.div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Input */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5 ml-1">
              Email Operator
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-zinc-400 text-sm">✉️</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) onClearError();
                }}
                placeholder="nama@email.com"
                className="w-full pl-10 pr-4 py-3 bg-zinc-950/80 border border-white/10 focus:border-amber-500 rounded-xl text-sm text-white placeholder-zinc-500 outline-none transition-colors"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5 ml-1">
              Kata Sandi
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-zinc-400 text-sm">🔒</span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) onClearError();
                }}
                placeholder="••••••••"
                className="w-full pl-10 pr-11 py-3 bg-zinc-950/80 border border-white/10 focus:border-amber-500 rounded-xl text-sm text-white placeholder-zinc-500 outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-zinc-400 hover:text-zinc-200 text-sm p-1 transition-colors cursor-pointer"
                title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
              >
                {showPassword ? '👁️' : '🙈'}
              </button>
            </div>
          </div>

          {/* Submit CTA Button */}
          <button
            type="submit"
            disabled={isLoading || !email || !password}
            className="w-full mt-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-sm sm:text-base shadow-lg shadow-amber-900/30 transition-all duration-200 hover:scale-[1.01] active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Memverifikasi...</span>
              </>
            ) : (
              <>
                <span>Masuk ke Photobooth</span>
                <span className="text-base">→</span>
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-white/5 text-center">
          <p className="text-[11px] text-zinc-500">
            Akses dibatasi khusus operator booth terdaftar.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
