import { supabase } from './supabase';

export interface UploadPhotoResult {
  signedUrl: string;
  publicUrl: string;
}

/**
 * Kompresi otomatis Blob gambar menggunakan HTMLCanvas jika melebihi ukuran target (default 1.2 MB).
 * Menjaga kualitas foto tetap tajam sambil memastikan ukuran file aman di bawah batas
 * `file_size_limit` bucket Supabase Storage (biasanya 1MB - 2MB).
 */
async function optimizePhotoForUpload(
  blob: Blob,
  maxSizeBytes: number = 1.2 * 1024 * 1024
): Promise<Blob> {
  // Jika ukuran sudah kecil dan formatnya JPEG, langsung gunakan
  if (blob.size <= maxSizeBytes && blob.type === 'image/jpeg') {
    return blob;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');

      let { width, height } = img;
      // Batasi dimensi maksimal ke 2400px (sangat tinggi untuk cetak foto, tapi hemat memori)
      const MAX_DIM = 2400;
      if (width > MAX_DIM || height > MAX_DIM) {
        if (width > height) {
          height = Math.round((height * MAX_DIM) / width);
          width = MAX_DIM;
        } else {
          width = Math.round((width * MAX_DIM) / height);
          height = MAX_DIM;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(blob);
        return;
      }

      // Background solid putih (menghindari artefak hitam pada JPEG)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      // Coba kompresi bertahap mulai dari kualitas 0.88 ke bawah
      const compressWithQuality = (quality: number) => {
        canvas.toBlob(
          (compressedBlob) => {
            if (!compressedBlob) {
              resolve(blob);
              return;
            }

            console.log(
              `[Storage] Optimasi foto (${width}×${height}, q=${quality}): ${(
                compressedBlob.size / 1024
              ).toFixed(1)} KB (asli: ${(blob.size / 1024).toFixed(1)} KB)`
            );

            if (compressedBlob.size <= maxSizeBytes || quality <= 0.65) {
              resolve(compressedBlob);
            } else {
              // Jika masih melebihi, kurangi kualitas 10%
              compressWithQuality(quality - 0.1);
            }
          },
          'image/jpeg',
          quality
        );
      };

      compressWithQuality(0.88);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(blob); // fallback ke blob asli jika gagal load
    };

    img.src = url;
  });
}

/**
 * Mengunggah Blob foto strip komposit ke Supabase Storage Bucket `photobooth_images`
 * dan mengembalikan Signed URL dengan batas waktu aktif 1 jam (3600 detik) untuk QR Code.
 */
export async function uploadPhotoStrip(blob: Blob): Promise<UploadPhotoResult> {
  // 1. Optimasi ukuran foto agar tidak melebihi batas bucket Supabase
  let uploadBlob = await optimizePhotoForUpload(blob, 1.2 * 1024 * 1024);

  const isJpeg = uploadBlob.type.includes('jpeg') || uploadBlob.type.includes('jpg');
  const ext = isJpeg ? 'jpg' : 'png';
  const filename = `strip_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
  const filePath = `strips/${filename}`;

  console.log(
    `[Storage] Uploading photo strip (${(uploadBlob.size / 1024).toFixed(
      1
    )} KB) to Supabase bucket photobooth_images...`
  );

  let uploadResult = await supabase.storage
    .from('photobooth_images')
    .upload(filePath, uploadBlob, {
      contentType: uploadBlob.type || 'image/jpeg',
      upsert: false,
    });

  // Jika masih error "exceeded the maximum allowed size", coba kompresi darurat ke ~500 KB
  if (
    uploadResult.error &&
    uploadResult.error.message.includes('exceeded the maximum allowed size')
  ) {
    console.warn(
      '[Storage] File masih melebihi batas bucket, melakukan kompresi darurat ke ukuran lebih kecil...'
    );
    uploadBlob = await optimizePhotoForUpload(uploadBlob, 600 * 1024); // 600 KB
    uploadResult = await supabase.storage
      .from('photobooth_images')
      .upload(filePath, uploadBlob, {
        contentType: 'image/jpeg',
        upsert: true,
      });
  }

  if (uploadResult.error) {
    console.error('[Storage] Upload error:', uploadResult.error);
    if (uploadResult.error.message.includes('exceeded the maximum allowed size')) {
      throw new Error(
        'Ukuran file foto melebihi batas maksimal bucket `photobooth_images` di Supabase. Silakan periksa atau naikkan `File size limit` bucket pada dashboard Supabase.'
      );
    }
    throw new Error(`Gagal mengunggah foto ke storage: ${uploadResult.error.message}`);
  }

  // 2. Generate Signed URL aktif selama 1 jam (3600 detik)
  const { data: signedData } = await supabase.storage
    .from('photobooth_images')
    .createSignedUrl(filePath, 3600);

  // 3. Dapatkan Public URL dasar untuk record database
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
