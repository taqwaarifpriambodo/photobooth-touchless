'use client';

import { useEffect } from 'react';

/**
 * Global handler untuk menangani dan mencegah Next.js runtime error overlay
 * saat browser menginterupsi pemanggilan video.play() (AbortError) karena load request baru.
 */
export default function GlobalErrorHandler() {
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event?.reason;
      const isAbortError =
        reason?.name === 'AbortError' ||
        (typeof reason?.message === 'string' &&
          (reason.message.includes('interrupted by a new load request') ||
            reason.message.includes('The play() request was interrupted')));

      if (isAbortError) {
        // Batalkan event agar Turbopack tidak menampilkan error overlay merah
        event.preventDefault();
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return null;
}
