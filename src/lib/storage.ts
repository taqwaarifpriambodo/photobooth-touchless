import { supabase } from './supabase';

export interface UploadPhotoResult {
  signedUrl: string;
  publicUrl: string;
}

/**
 * Mengunggah Blob foto strip komposit ke Supabase Storage Bucket `photobooth_images`
 * dan mengembalikan Signed URL dengan batas waktu aktif 1 jam (3600 detik) untuk QR Code.
 */
export async function uploadPhotoStrip(blob: Blob): Promise<UploadPhotoResult> {
  const filename = `strip_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.png`;
  const filePath = `strips/${filename}`;

  console.log('[Storage] Uploading photo strip to Supabase bucket photobooth_images...');

  const { error } = await supabase.storage
    .from('photobooth_images')
    .upload(filePath, blob, {
      contentType: 'image/png',
      upsert: true,
    });

  if (error) {
    console.error('[Storage] Upload error:', error);
    throw new Error(`Gagal mengunggah foto ke storage: ${error.message}`);
  }

  // 1. Generate Signed URL aktif selama 1 jam (3600 detik)
  const { data: signedData } = await supabase.storage
    .from('photobooth_images')
    .createSignedUrl(filePath, 3600);

  // 2. Dapatkan Public URL dasar untuk record database
  const { data: publicUrlData } = supabase.storage
    .from('photobooth_images')
    .getPublicUrl(filePath);

  const signedUrl = signedData?.signedUrl || publicUrlData.publicUrl;
  const publicUrl = publicUrlData.publicUrl;

  console.log('[Storage] ✅ Upload success! Signed URL (Aktif 1 Jam):', signedUrl);
  return {
    signedUrl,
    publicUrl,
  };
}
