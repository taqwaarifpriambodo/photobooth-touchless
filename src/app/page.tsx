'use client';

import { useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useCamera } from '@/hooks/useCamera';
import { useHandTracking } from '@/hooks/useHandTracking';
import { useFrames } from '@/hooks/useFrames';
import { useMultiShotSession } from '@/hooks/useMultiShotSession';
import LoginGate from '@/components/LoginGate';
import PermissionGate from '@/components/PermissionGate';
import CameraView from '@/components/CameraView';
import VirtualCursor from '@/components/VirtualCursor';
import WelcomeScreen from '@/components/WelcomeScreen';
import FrameSelector from '@/components/FrameSelector';
import MultiShotOverlay from '@/components/MultiShotOverlay';
import ResultView from '@/components/ResultView';
import type { AppState, FrameTemplate } from '@/types';

export default function Home() {
  const {
    user,
    isAuthenticated,
    isCheckingSession,
    isLoggingIn,
    error: authError,
    login,
    logout,
    clearError: clearAuthError,
  } = useAuth();

  const [appState, setAppState] = useState<AppState>('AUTH');
  const [compositedBlob, setCompositedBlob] = useState<Blob | null>(null);

  const { videoRef, stream, isReady, error: cameraError, requestPermission } = useCamera();
  const {
    cursorPosition,
    isHandDetected,
    isModelLoading,
    modelLoadProgress,
    cursorRef,
  } = useHandTracking(videoRef, isReady);

  const { frames, selectedFrame, setSelectedFrame } = useFrames();

  // Callback saat foto & compositing selesai
  const handleSessionComplete = useCallback(
    (compositedImageBlob: Blob) => {
      console.log('[App] Multi-shot session & compositing finished!');
      setCompositedBlob(compositedImageBlob);
      setAppState('RESULT');
    },
    []
  );

  const {
    currentShot,
    totalShots,
    countdown,
    sessionPhase,
    isFlashing,
    isProcessing,
    startSession,
    resetSession,
  } = useMultiShotSession({
    videoRef,
    selectedFrame,
    totalShots: selectedFrame?.slots?.length || 3,
    onSessionComplete: handleSessionComplete,
  });

  const hasStream = stream !== null;

  // Sync status autentikasi dengan appState
  useEffect(() => {
    if (isCheckingSession) return;

    if (!isAuthenticated) {
      setAppState('AUTH');
    } else {
      if (appState === 'AUTH') {
        if (hasStream) {
          setAppState('WELCOME');
        } else {
          setAppState('PERMISSION');
        }
      }
    }
  }, [isAuthenticated, isCheckingSession, hasStream, appState]);

  // Auto transition to WELCOME once camera stream is active (if authenticated)
  useEffect(() => {
    if (isAuthenticated && hasStream && (appState === 'PERMISSION' || appState === 'AUTH')) {
      setAppState('WELCOME');
    }
  }, [hasStream, appState, isAuthenticated]);

  const handleRequestPermission = useCallback(() => {
    requestPermission();
  }, [requestPermission]);

  const handleStartFromWelcome = useCallback(() => {
    console.log('[App] Starting from Welcome screen to Frame Selection...');
    setAppState('FRAME_SELECTION');
  }, []);

  const handleSelectFrame = useCallback(
    (frame: FrameTemplate) => {
      setSelectedFrame(frame);
    },
    [setSelectedFrame]
  );

  const handleConfirmFrame = useCallback(() => {
    console.log('[App] Frame confirmed. Starting photo session...');
    setAppState('MULTI_SHOT');
    startSession();
  }, [startSession]);

  const handleFinish = useCallback(() => {
    console.log('[App] Session finished or auto-reset. Resetting booth to Welcome screen...');
    resetSession();
    setCompositedBlob(null);
    setAppState('WELCOME');
  }, [resetSession]);

  const handleLogout = useCallback(async () => {
    console.log('[App] Operator logging out...');
    resetSession();
    setCompositedBlob(null);
    await logout();
    setAppState('AUTH');
  }, [logout, resetSession]);

  // 1. Tampilan loading saat pertama kali memeriksa sesi Supabase
  if (isCheckingSession) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#0a0a0a] gap-4">
        <div className="w-10 h-10 border-3 border-zinc-800 border-t-amber-500 rounded-full animate-spin" />
        <p className="text-zinc-400 text-sm font-medium">Memeriksa sesi operator...</p>
      </div>
    );
  }

  // 2. Tampilan Form Login jika belum terautentikasi
  if (!isAuthenticated || appState === 'AUTH') {
    return (
      <LoginGate
        onLogin={login}
        error={authError}
        isLoading={isLoggingIn}
        onClearError={clearAuthError}
      />
    );
  }

  // 3. Tampilan Photobooth jika sudah login
  return (
    <>
      <AnimatePresence mode="wait">
        {!hasStream && (
          <PermissionGate
            key="permission"
            error={cameraError}
            onRequestPermission={handleRequestPermission}
          />
        )}

        {hasStream && (
          <CameraView key="camera" ref={videoRef} isReady={isReady}>
            {/* Model loading indicator */}
            {isModelLoading && (
              <motion.div
                className="absolute top-6 left-0 right-0 flex justify-center z-30 pointer-events-none"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="glass-card px-6 py-3 flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-zinc-700 border-t-amber-500 rounded-full animate-spin" />
                  <span className="text-sm text-zinc-300">
                    {modelLoadProgress}
                  </span>
                </div>
              </motion.div>
            )}

            {/* Hand tracking status pill */}
            {!isModelLoading && (appState === 'WELCOME' || appState === 'FRAME_SELECTION') && (
              <div className="absolute top-3 sm:top-6 left-0 right-0 sm:left-auto sm:right-6 z-30 flex justify-center sm:justify-end pointer-events-none px-4">
                <motion.div
                  className="bg-black/75 backdrop-blur-md px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full sm:rounded-lg text-[11px] sm:text-xs flex items-center gap-2 border border-white/10 shadow-lg max-w-[92vw] truncate"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {isHandDetected ? (
                    <>
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      <span className="text-zinc-200 font-medium truncate">
                        {appState === 'WELCOME'
                          ? 'Telunjuk Terdeteksi — Tunjuk Mulai ☝️'
                          : 'Telunjuk Terdeteksi — Tunjuk Frame ☝️'}
                      </span>
                    </>
                  ) : (
                    <>
                      <motion.span
                        className="text-sm shrink-0"
                        animate={{ y: [0, -3, 0] }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      >
                        ☝️
                      </motion.span>
                      <span className="text-zinc-400 truncate">
                        Tunjuk dengan jari telunjuk ☝️ di depan kamera
                      </span>
                    </>
                  )}
                </motion.div>
              </div>
            )}

            {/* Welcome / Quick Start Guide Screen */}
            {appState === 'WELCOME' && (
              <WelcomeScreen
                key="welcome-screen"
                cursorPositionRef={cursorPosition}
                onStart={handleStartFromWelcome}
                onLogout={handleLogout}
                userEmail={user?.email}
              />
            )}

            {/* Frame Selection Overlay */}
            {appState === 'FRAME_SELECTION' && (
              <FrameSelector
                key="frame-selector"
                frames={frames}
                selectedFrame={selectedFrame}
                cursorPositionRef={cursorPosition}
                onSelectFrame={handleSelectFrame}
                onConfirm={handleConfirmFrame}
              />
            )}

            {/* Multi-Shot 3x Photo Session Overlay */}
            {appState === 'MULTI_SHOT' && (
              <MultiShotOverlay
                key="multi-shot-overlay"
                currentShot={currentShot}
                totalShots={totalShots}
                countdown={countdown}
                sessionPhase={sessionPhase}
                isFlashing={isFlashing}
                selectedFrame={selectedFrame}
                isProcessing={isProcessing}
              />
            )}

            {/* Result View (Upload, QR Code & Auto Reset) */}
            {appState === 'RESULT' && (
              <ResultView
                key="result-view"
                compositedImageBlob={compositedBlob}
                selectedFrame={selectedFrame}
                cursorPositionRef={cursorPosition}
                onFinish={handleFinish}
              />
            )}
          </CameraView>
        )}
      </AnimatePresence>

      {/* Virtual Cursor — High Performance Imperative Handle */}
      <VirtualCursor ref={cursorRef} />
    </>
  );
}

