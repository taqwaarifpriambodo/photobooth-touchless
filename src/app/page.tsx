'use client';

import { useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useCamera } from '@/hooks/useCamera';
import { useHandTracking } from '@/hooks/useHandTracking';
import { useFrames } from '@/hooks/useFrames';
import { useMultiShotSession } from '@/hooks/useMultiShotSession';
import PermissionGate from '@/components/PermissionGate';
import CameraView from '@/components/CameraView';
import VirtualCursor from '@/components/VirtualCursor';
import WelcomeScreen from '@/components/WelcomeScreen';
import FrameSelector from '@/components/FrameSelector';
import MultiShotOverlay from '@/components/MultiShotOverlay';
import ResultView from '@/components/ResultView';
import type { AppState, FrameTemplate } from '@/types';

export default function Home() {
  const [appState, setAppState] = useState<AppState>('PERMISSION');
  const [compositedBlob, setCompositedBlob] = useState<Blob | null>(null);

  const { videoRef, stream, isReady, error, requestPermission } = useCamera();
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

  // Auto transition to WELCOME once camera stream is active
  useEffect(() => {
    if (hasStream && appState === 'PERMISSION') {
      setAppState('WELCOME');
    }
  }, [hasStream, appState]);

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

  return (
    <>
      <AnimatePresence mode="wait">
        {!hasStream && (
          <PermissionGate
            key="permission"
            error={error}
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

            {/* Hand tracking status pill (Top Right corner) */}
            {!isModelLoading && (appState === 'WELCOME' || appState === 'FRAME_SELECTION') && (
              <div className="absolute top-6 right-6 z-30 flex justify-end pointer-events-none">
                <motion.div
                  className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-lg text-xs flex items-center gap-2.5 border border-white/8"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  {isHandDetected ? (
                    <>
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-zinc-200 font-medium">
                        {appState === 'WELCOME'
                          ? 'Telunjuk Terdeteksi — Tunjuk Mulai ☝️'
                          : 'Telunjuk Terdeteksi — Tunjuk Frame ☝️'}
                      </span>
                    </>
                  ) : (
                    <>
                      <motion.span
                        className="text-base"
                        animate={{ y: [0, -4, 0] }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      >
                        ☝️
                      </motion.span>
                      <span className="text-zinc-400">
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
