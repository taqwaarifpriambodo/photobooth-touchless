'use client';

import { useState, useEffect, useRef } from 'react';
import type { FrameTemplate } from '@/types';
import { getFrameTemplateForFile } from '@/lib/frameConfig';

export function useFrames() {
  const [frames, setFrames] = useState<FrameTemplate[]>([]);
  const [selectedFrame, setSelectedFrame] = useState<FrameTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isFetchedRef = useRef(false);

  useEffect(() => {
    // Mencegah fetch 2x akibat React 18 Strict Mode pada environment development
    if (isFetchedRef.current) return;
    isFetchedRef.current = true;

    async function loadFrames() {
      try {
        const res = await fetch('/api/frames');
        const data = await res.json();
        if (data.frames && Array.isArray(data.frames) && data.frames.length > 0) {
          setFrames(data.frames);
          setSelectedFrame(data.frames[0]);
        } else {
          // Fallback jika API mengembalikan array kosong
          const fallbackFrames = [
            getFrameTemplateForFile('frame_01_bunga.png'),
            getFrameTemplateForFile('frame_02_biru.png'),
            getFrameTemplateForFile('frame_03_kayu.png'),
            getFrameTemplateForFile('frame_04_minimal.png'),
            getFrameTemplateForFile('frame_05_hitam_emas.png'),
            getFrameTemplateForFile('frame_06_lavender.png'),
          ];
          setFrames(fallbackFrames);
          setSelectedFrame(fallbackFrames[0]);
        }
      } catch (err) {
        console.error('[useFrames] Error loading frames:', err);
        const fallbackFrames = [
          getFrameTemplateForFile('frame_01_bunga.png'),
          getFrameTemplateForFile('frame_02_biru.png'),
          getFrameTemplateForFile('frame_03_kayu.png'),
          getFrameTemplateForFile('frame_04_minimal.png'),
          getFrameTemplateForFile('frame_05_hitam_emas.png'),
          getFrameTemplateForFile('frame_06_lavender.png'),
        ];
        setFrames(fallbackFrames);
        setSelectedFrame(fallbackFrames[0]);
      } finally {
        setIsLoading(false);
      }
    }

    loadFrames();
  }, []);

  return {
    frames,
    selectedFrame,
    setSelectedFrame,
    isLoading,
  };
}
