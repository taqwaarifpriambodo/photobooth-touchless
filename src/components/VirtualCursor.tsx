'use client';

import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import type { Point2D } from '@/types';

export interface VirtualCursorHandle {
  updatePosition: (position: Point2D | null) => void;
  setVisible: (visible: boolean) => void;
}

/**
 * Kursor virtual performa tinggi.
 * Menggunakan direct DOM manipulation untuk menghindari
 * React re-render setiap frame (~60fps).
 * Posisi diperbarui via ref imperative handle.
 */
const VirtualCursor = forwardRef<VirtualCursorHandle>(
  function VirtualCursor(_, ref) {
    const cursorRef = useRef<HTMLDivElement>(null);
    const isVisibleRef = useRef(false);

    useImperativeHandle(ref, () => ({
      updatePosition(position: Point2D | null) {
        if (!cursorRef.current) return;

        if (position) {
          cursorRef.current.style.transform =
            `translate3d(${position.x}px, ${position.y}px, 0)`;
        }
      },
      setVisible(visible: boolean) {
        if (!cursorRef.current) return;

        if (visible !== isVisibleRef.current) {
          isVisibleRef.current = visible;
          cursorRef.current.style.opacity = visible ? '1' : '0';
          cursorRef.current.style.transform = visible
            ? cursorRef.current.style.transform
            : 'translate3d(-100px, -100px, 0) scale(0)';
        }
      },
    }));

    // Set posisi awal offscreen
    useEffect(() => {
      if (cursorRef.current) {
        cursorRef.current.style.transform = 'translate3d(-100px, -100px, 0)';
      }
    }, []);

    return (
      <div
        ref={cursorRef}
        className="fixed top-0 left-0 z-9999 pointer-events-none"
        style={{
          opacity: 0,
          willChange: 'transform',
          transition: 'opacity 0.2s ease',
        }}
      >
        {/* Outer glow ring */}
        <div
          className="absolute rounded-full animate-pulse-glow"
          style={{
            width: 40,
            height: 40,
            top: -20,
            left: -20,
            border: '2px solid rgba(129, 140, 248, 0.3)',
          }}
        />
        {/* Main cursor dot */}
        <div
          className="absolute rounded-full"
          style={{
            width: 16,
            height: 16,
            top: -8,
            left: -8,
            background: 'radial-gradient(circle, #818cf8 0%, #6366f1 60%, #4f46e5 100%)',
            boxShadow: '0 0 12px rgba(99, 102, 241, 0.6), 0 0 24px rgba(99, 102, 241, 0.3)',
          }}
        />
        {/* Inner bright dot */}
        <div
          className="absolute rounded-full"
          style={{
            width: 6,
            height: 6,
            top: -3,
            left: -3,
            background: 'rgba(255, 255, 255, 0.9)',
          }}
        />
      </div>
    );
  }
);

export default VirtualCursor;
