import type { FrameTemplate, FrameRecord } from '@/types';

/**
 * Peta konfigurasi preset sebagai fallback lokal jika DB belum mengisi slots.
 */
const framePresets: Record<string, Partial<FrameTemplate>> = {
  'frame_01_bunga.png': {
    name: 'Bunga Floral 🌸',
  },
  'frame_02_biru.png': {
    name: 'Ocean Blue 🌊',
  },
  'frame_03_kayu.png': {
    name: 'Wooden Classic 🪵',
  },
  'frame_04_minimal.png': {
    name: 'Minimalist White ⚪',
  },
  'frame_05_hitam_emas.png': {
    name: 'Luxury Gold & Black 👑',
  },
  'frame_06_lavender.png': {
    name: 'Lavender Dream 💜',
  },
};

/**
 * Default photo slot layout untuk strip 3 foto lanskap (745x310 px)
 */
const DEFAULT_CANVAS_WIDTH = 745;
const DEFAULT_CANVAS_HEIGHT = 310;

const DEFAULT_SLOTS = [
  { x: 55, y: 55, width: 195, height: 200 },
  { x: 275, y: 55, width: 195, height: 200 },
  { x: 495, y: 55, width: 195, height: 200 },
];

/**
 * Buat FrameTemplate dari data record Supabase `frames`.
 * Mengutamakan `canvas_width`, `canvas_height`, dan `slots` dari Supabase DB jika tersedia!
 */
export function getFrameTemplateFromRecord(
  record: FrameRecord,
  publicUrl: string
): FrameTemplate {
  const preset = framePresets[record.filename];

  const canvasWidth = record.canvas_width || preset?.canvasWidth || DEFAULT_CANVAS_WIDTH;
  const canvasHeight = record.canvas_height || preset?.canvasHeight || DEFAULT_CANVAS_HEIGHT;
  const slots =
    record.slots && Array.isArray(record.slots) && record.slots.length > 0
      ? record.slots
      : preset?.slots || DEFAULT_SLOTS;

  return {
    id: record.id,
    name: record.frame_name || preset?.name || 'Custom Frame',
    file: record.filename,
    publicUrl: publicUrl,
    status: record.status,
    canvasWidth: canvasWidth,
    canvasHeight: canvasHeight,
    slots: slots,
  };
}

/**
 * Buat/dapatkan FrameTemplate untuk nama file lokal di /public/frames/
 */
export function getFrameTemplateForFile(fileName: string): FrameTemplate {
  const preset = framePresets[fileName];
  const formattedName = fileName
    .replace(/\.png$/i, '')
    .replace(/^frame_\d+_?/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    name: preset?.name || formattedName || 'Custom Frame',
    file: fileName,
    publicUrl: `/frames/${fileName}`,
    canvasWidth: preset?.canvasWidth || DEFAULT_CANVAS_WIDTH,
    canvasHeight: preset?.canvasHeight || DEFAULT_CANVAS_HEIGHT,
    slots: preset?.slots || DEFAULT_SLOTS,
  };
}
