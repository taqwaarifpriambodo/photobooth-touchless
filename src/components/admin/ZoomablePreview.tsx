'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PhotoSlot } from '@/types';

interface ZoomablePreviewProps {
  src: string;
  alt: string;
  canvasWidth: number;
  canvasHeight: number;
  slots?: PhotoSlot[];
  showSlots?: boolean;
  className?: string;
  maxHeightClass?: string;
}

const MIN_SCALE = 0.25; // Mendukung zoom out hingga 25% (di bawah 100%)
const MAX_SCALE = 4.0;  // Mendukung zoom in hingga 400%
const SCALE_STEP = 0.25;

export default function ZoomablePreview({
  src,
  alt,
  canvasWidth,
  canvasHeight,
  slots = [],
  showSlots = false,
  className = '',
  maxHeightClass = 'max-h-72',
}: ZoomablePreviewProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });

  // Reset zoom & posisi ke ukuran fit normal (100%)
  const handleResetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  // Zoom In (+25%, max 400%)
  const handleZoomIn = () => {
    setScale((prev) => {
      const next = Math.min(Number((prev + SCALE_STEP).toFixed(2)), MAX_SCALE);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  // Zoom Out (-25%, min 25% - bisa di bawah 100%)
  const handleZoomOut = () => {
    setScale((prev) => {
      const next = Math.max(Number((prev - SCALE_STEP).toFixed(2)), MIN_SCALE);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  // Double click untuk toggle 100% <-> 200%
  const handleDoubleClick = () => {
    if (scale !== 1) {
      handleResetZoom();
    } else {
      setScale(2);
    }
  };

  // Mouse wheel zoom (bisa zoom out di bawah 100% dan zoom in hingga 400%)
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setScale((prev) => Math.min(Number((prev + 0.15).toFixed(2)), MAX_SCALE));
    } else {
      setScale((prev) => {
        const next = Math.max(Number((prev - 0.15).toFixed(2)), MIN_SCALE);
        if (next === 1) setPosition({ x: 0, y: 0 });
        return next;
      });
    }
  };

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale === 1 && position.x === 0 && position.y === 0) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: position.x,
      posY: position.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPosition({
      x: dragStartRef.current.posX + dx,
      y: dragStartRef.current.posY + dy,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch drag handlers untuk layar sentuh / mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if ((scale === 1 && position.x === 0 && position.y === 0) || e.touches.length !== 1) return;
    setIsDragging(true);
    const touch = e.touches[0];
    dragStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      posX: position.x,
      posY: position.y,
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const dx = touch.clientX - dragStartRef.current.x;
    const dy = touch.clientY - dragStartRef.current.y;
    setPosition({
      x: dragStartRef.current.posX + dx,
      y: dragStartRef.current.posY + dy,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Tombol Escape menutup lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isLightboxOpen) {
        setIsLightboxOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen]);

  const aspectRatio = `${canvasWidth} / ${canvasHeight}`;
  const zoomPercent = Math.round(scale * 100);
  const isPannable = scale !== 1 || position.x !== 0 || position.y !== 0;

  return (
    <>
      <div
        className={`relative flex flex-col bg-zinc-950/80 rounded-xl border border-white/10 overflow-hidden ${className}`}
      >
        {/* Floating Zoom Toolbar */}
        <div className="flex items-center justify-between px-3 py-2 bg-zinc-900/90 border-b border-white/10 text-xs shrink-0 select-none">
          <div className="flex items-center gap-1.5 text-zinc-400">
            <span className="text-[11px] font-mono text-zinc-300">
              {canvasWidth} × {canvasHeight} px
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-[11px] font-mono font-semibold text-amber-400">
              {zoomPercent}%
            </span>
          </div>

          <div className="flex items-center gap-1 bg-zinc-950/80 p-0.5 rounded-lg border border-white/10">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={scale <= MIN_SCALE}
              title="Perkecil Zoom (-)"
              className="w-6 h-6 rounded flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer font-bold"
            >
              −
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              title="Reset Zoom ke 100%"
              className="px-2 h-6 rounded flex items-center justify-center text-[10px] font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer"
            >
              Fit
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={scale >= MAX_SCALE}
              title="Perbesar Zoom (+)"
              className="w-6 h-6 rounded flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer font-bold"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => setIsLightboxOpen(true)}
              title="Buka Zoom Layar Penuh (Inspect)"
              className="w-6 h-6 rounded flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer text-xs ml-0.5"
            >
              ⛶
            </button>
          </div>
        </div>

        {/* Viewport Gambar dengan Pan & Zoom (Bisa Zoom Out < 100%) */}
        <div
          ref={containerRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onDoubleClick={handleDoubleClick}
          className={`relative w-full ${maxHeightClass} flex items-center justify-center p-3 overflow-hidden select-none ${
            isDragging
              ? 'cursor-grabbing'
              : isPannable
              ? 'cursor-grab'
              : 'cursor-zoom-in'
          }`}
          title={
            isPannable
              ? 'Drag untuk geser • Dobel-klik untuk reset ke 100%'
              : 'Dobel-klik atau scroll mouse untuk zoom in/out'
          }
        >
          <div
            className="relative max-w-full max-h-full transition-transform duration-75"
            style={{
              aspectRatio,
              transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${scale})`,
              transformOrigin: 'center center',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              draggable={false}
              className="w-full h-full object-contain pointer-events-none drop-shadow-md rounded-md"
            />

            {/* Wireframe Slots Overlay (jika showSlots aktif) */}
            {showSlots &&
              slots.map((slot, idx) => {
                const leftPct = (slot.x / canvasWidth) * 100;
                const topPct = (slot.y / canvasHeight) * 100;
                const widthPct = (slot.width / canvasWidth) * 100;
                const heightPct = (slot.height / canvasHeight) * 100;

                return (
                  <div
                    key={idx}
                    style={{
                      left: `${leftPct}%`,
                      top: `${topPct}%`,
                      width: `${widthPct}%`,
                      height: `${heightPct}%`,
                    }}
                    className="absolute border-2 border-amber-400 bg-amber-400/20 rounded flex items-center justify-center pointer-events-none"
                  >
                    <span className="bg-amber-500 text-black font-extrabold text-[9px] px-1 py-0.5 rounded shadow">
                      #{idx + 1}
                    </span>
                  </div>
                );
              })}
          </div>

          {/* Petunjuk Interaksi saat Zoom (In maupun Out) */}
          {scale !== 1 && (
            <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/75 backdrop-blur border border-white/10 text-[10px] text-zinc-300 pointer-events-none flex items-center gap-1.5 shadow-lg">
              <span>✋ Drag untuk geser</span>
              <span className="text-zinc-500">•</span>
              <span>Dobel-klik untuk reset (100%)</span>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox / Fullscreen Modal untuk Inspeksi Detail */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 bg-black/95 backdrop-blur-lg flex flex-col p-4 sm:p-6"
          >
            {/* Lightbox Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-xl">🔍</span>
                <div>
                  <h3 className="text-sm font-bold text-white">Inspeksi Detail Resolusi Penuh</h3>
                  <p className="text-xs text-zinc-400 font-mono">
                    {canvasWidth} × {canvasHeight} px ({zoomPercent}%)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-white/10 text-xs">
                  <button
                    type="button"
                    onClick={handleZoomOut}
                    disabled={scale <= MIN_SCALE}
                    title="Perkecil Zoom (-)"
                    className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 disabled:opacity-40 cursor-pointer font-bold"
                  >
                    −
                  </button>
                  <button
                    type="button"
                    onClick={handleResetZoom}
                    title="Reset ke 100%"
                    className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 cursor-pointer font-semibold"
                  >
                    Fit
                  </button>
                  <button
                    type="button"
                    onClick={handleZoomIn}
                    disabled={scale >= MAX_SCALE}
                    title="Perbesar Zoom (+)"
                    className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 disabled:opacity-40 cursor-pointer font-bold"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(false)}
                  className="w-9 h-9 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Lightbox Content Area */}
            <div
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onDoubleClick={handleDoubleClick}
              className={`flex-1 flex items-center justify-center overflow-hidden p-4 relative ${
                isDragging
                  ? 'cursor-grabbing'
                  : isPannable
                  ? 'cursor-grab'
                  : 'cursor-zoom-in'
              }`}
            >
              <div
                className="relative max-w-[90vw] max-h-[80vh] transition-transform duration-75"
                style={{
                  aspectRatio,
                  transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${scale})`,
                  transformOrigin: 'center center',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={alt}
                  draggable={false}
                  className="w-full h-full object-contain pointer-events-none drop-shadow-2xl"
                />

                {showSlots &&
                  slots.map((slot, idx) => {
                    const leftPct = (slot.x / canvasWidth) * 100;
                    const topPct = (slot.y / canvasHeight) * 100;
                    const widthPct = (slot.width / canvasWidth) * 100;
                    const heightPct = (slot.height / canvasHeight) * 100;

                    return (
                      <div
                        key={idx}
                        style={{
                          left: `${leftPct}%`,
                          top: `${topPct}%`,
                          width: `${widthPct}%`,
                          height: `${heightPct}%`,
                        }}
                        className="absolute border-2 border-amber-400 bg-amber-400/20 rounded flex items-center justify-center pointer-events-none"
                      >
                        <span className="bg-amber-500 text-black font-extrabold text-[10px] px-1.5 py-0.5 rounded shadow">
                          #{idx + 1}
                        </span>
                      </div>
                    );
                  })}
              </div>

              {/* Instructions */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-zinc-900/90 border border-white/10 text-xs text-zinc-300 pointer-events-none flex items-center gap-2 shadow-xl">
                <span>💡 Scroll mouse untuk zoom in/out</span>
                <span className="text-zinc-600">•</span>
                <span>Drag untuk navigasi</span>
                <span className="text-zinc-600">•</span>
                <span>Dobel-klik untuk reset (100%)</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
