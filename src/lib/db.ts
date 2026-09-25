import { supabase } from './supabase';
import type { PhotoRecord } from '@/types';

/**
 * Mencatat record foto yang sudah terunggah ke tabel Supabase `photos`.
 */
export async function insertPhotoRecord(
  imageUrl: string,
  frameUsed: string | null = null,
  photoCount: number = 3
): Promise<PhotoRecord> {
  console.log('[DB] Inserting photo record to Supabase table photos...');

  const { data, error } = await supabase
    .from('photos')
    .insert([
      {
        image_url: imageUrl,
        frame_used: frameUsed,
        photo_count: photoCount,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('[DB] Insert error:', error);
    throw new Error(`Gagal menyimpan data foto ke database: ${error.message}`);
  }

  console.log('[DB] ✅ Insert photo record success:', data);
  return data as PhotoRecord;
}
