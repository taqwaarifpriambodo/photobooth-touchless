import type { FrameTemplate, FrameRecord, PhotoSlot } from '@/types';

export interface FrameValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validasi ketat bahwa record frame dari Supabase memiliki semua data yang diperlukan:
 * 1. frame_name (string tidak kosong)
 * 2. filename (string tidak kosong)
 * 3. publicUrl (URL publik tidak kosong)
 * 4. canvas_width (angka > 0)
 * 5. canvas_height (angka > 0)
 * 6. slots (array tidak kosong, tiap slot memiliki x, y, width, height valid)
 */
export function validateFrameRecord(
  record: FrameRecord,
  publicUrl?: string
): FrameValidationResult {
  if (!record) {
    return { isValid: false, error: 'Data record frame kosong atau undefined.' };
  }

  if (!record.frame_name || typeof record.frame_name !== 'string' || record.frame_name.trim() === '') {
    return { isValid: false, error: 'Nama frame (`frame_name`) tidak valid atau kosong.' };
  }

  if (!record.filename || typeof record.filename !== 'string' || record.filename.trim() === '') {
    return { isValid: false, error: 'Nama file gambar (`filename`) tidak valid atau kosong.' };
  }

  if (!publicUrl || typeof publicUrl !== 'string' || publicUrl.trim() === '') {
    return { isValid: false, error: 'URL publik gambar frame (`publicUrl`) tidak valid atau kosong.' };
  }

  if (typeof record.canvas_width !== 'number' || isNaN(record.canvas_width) || record.canvas_width <= 0) {
    return {
      isValid: false,
      error: `Lebar canvas (\`canvas_width\`: ${record.canvas_width}) tidak valid (harus angka > 0).`,
    };
  }

  if (typeof record.canvas_height !== 'number' || isNaN(record.canvas_height) || record.canvas_height <= 0) {
    return {
      isValid: false,
      error: `Tinggi canvas (\`canvas_height\`: ${record.canvas_height}) tidak valid (harus angka > 0).`,
    };
  }

  if (!Array.isArray(record.slots) || record.slots.length === 0) {
    return {
      isValid: false,
      error: 'Konfigurasi slot foto (`slots`) harus berupa array dan minimal memiliki 1 slot.',
    };
  }

  for (let i = 0; i < record.slots.length; i++) {
    const slot = record.slots[i];
    if (
      !slot ||
      typeof slot.x !== 'number' ||
      isNaN(slot.x) ||
      slot.x < 0 ||
      typeof slot.y !== 'number' ||
      isNaN(slot.y) ||
      slot.y < 0 ||
      typeof slot.width !== 'number' ||
      isNaN(slot.width) ||
      slot.width <= 0 ||
      typeof slot.height !== 'number' ||
      isNaN(slot.height) ||
      slot.height <= 0
    ) {
      return {
        isValid: false,
        error: `Slot foto ke-${i + 1} tidak valid (x=${slot?.x}, y=${slot?.y}, width=${slot?.width}, height=${slot?.height}).`,
      };
    }
  }

  return { isValid: true };
}

/**
 * Buat FrameTemplate dari data record Supabase `frames`.
 * 100% data diambil murni dari record Supabase tanpa fallback default lokal.
 * Melemparkan error jika data record Supabase tidak valid.
 */
export function getFrameTemplateFromRecord(
  record: FrameRecord,
  publicUrl: string
): FrameTemplate {
  const validation = validateFrameRecord(record, publicUrl);
  if (!validation.isValid) {
    throw new Error(
      `[Frame Validation] Frame ID "${record?.id || 'unknown'}" tidak valid: ${validation.error}`
    );
  }

  return {
    id: record.id,
    name: record.frame_name.trim(),
    file: record.filename.trim(),
    publicUrl: publicUrl.trim(),
    status: record.status,
    canvasWidth: record.canvas_width as number,
    canvasHeight: record.canvas_height as number,
    slots: record.slots as PhotoSlot[],
  };
}

/**
 * Parsing dan validasi teks JSON slots sekaligus memastikan posisi slot
 * tidak melebihi batas ukuran canvas (canvasWidth & canvasHeight).
 */
export function parseAndValidateSlots(
  jsonInput: string,
  canvasWidth: number,
  canvasHeight: number
): { slots: PhotoSlot[] | null; error?: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonInput);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Format JSON tidak valid';
    return { slots: null, error: `Format JSON tidak valid: ${msg}` };
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    return { slots: null, error: 'Slots harus berupa array JSON dan minimal memiliki 1 slot.' };
  }

  const validatedSlots: PhotoSlot[] = [];

  for (let i = 0; i < parsed.length; i++) {
    const item = parsed[i];
    if (
      !item ||
      typeof item !== 'object' ||
      typeof item.x !== 'number' || isNaN(item.x) || item.x < 0 ||
      typeof item.y !== 'number' || isNaN(item.y) || item.y < 0 ||
      typeof item.width !== 'number' || isNaN(item.width) || item.width <= 0 ||
      typeof item.height !== 'number' || isNaN(item.height) || item.height <= 0
    ) {
      return {
        slots: null,
        error: `Slot ke-${i + 1} tidak valid. Pastikan x >= 0, y >= 0, width > 0, height > 0.`,
      };
    }

    if (item.x + item.width > canvasWidth) {
      return {
        slots: null,
        error: `Slot ke-${i + 1} keluar batas kanan canvas (x + width = ${item.x + item.width} > canvasWidth = ${canvasWidth}).`,
      };
    }

    if (item.y + item.height > canvasHeight) {
      return {
        slots: null,
        error: `Slot ke-${i + 1} keluar batas bawah canvas (y + height = ${item.y + item.height} > canvasHeight = ${canvasHeight}).`,
      };
    }

    validatedSlots.push({
      x: Math.round(item.x),
      y: Math.round(item.y),
      width: Math.round(item.width),
      height: Math.round(item.height),
    });
  }

  return { slots: validatedSlots };
}

