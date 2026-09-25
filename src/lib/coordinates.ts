import type { Point2D } from '@/types';

/**
 * Konversi koordinat landmark MediaPipe (normalized 0-1)
 * ke koordinat layar dalam piksel, dengan efek cermin horizontal,
 * serta clamping agar kursor tidak keluar dari batas layar.
 */
export function landmarkToScreen(
  landmark: { x: number; y: number },
  screenWidth: number,
  screenHeight: number
): Point2D {
  const rawX = (1 - landmark.x) * screenWidth;
  const rawY = landmark.y * screenHeight;

  // Clamp 10px dari tepi layar agar kursor tetap dapat mengklik tombol di pinggir
  return {
    x: Math.max(10, Math.min(screenWidth - 10, rawX)),
    y: Math.max(10, Math.min(screenHeight - 10, rawY)),
  };
}

/**
 * Exponential Moving Average (EMA) smoothing filter
 * untuk mengurangi jitter pada posisi kursor virtual.
 */
export function smoothPosition(
  current: Point2D,
  previous: Point2D | null,
  alpha: number = 0.3
): Point2D {
  if (!previous) return current;

  return {
    x: previous.x + alpha * (current.x - previous.x),
    y: previous.y + alpha * (current.y - previous.y),
  };
}

/**
 * Cek apakah sebuah titik berada di dalam bounding rect elemen HTML.
 * Digunakan untuk hit-test dwell timer.
 */
export function isPointInElement(
  point: Point2D,
  element: HTMLElement
): boolean {
  const rect = element.getBoundingClientRect();
  return (
    point.x >= rect.left &&
    point.x <= rect.right &&
    point.y >= rect.top &&
    point.y <= rect.bottom
  );
}
