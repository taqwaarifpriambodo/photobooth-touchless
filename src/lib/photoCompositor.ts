import type { FrameTemplate } from '@/types';

/**
 * Capture frame tunggal dari elemen <video> ke Blob (JPEG)
 * dengan efek cermin horizontal (mirrored) agar sesuai dengan preview kamera.
 */
export async function captureVideoFrame(
  video: HTMLVideoElement,
  quality: number = 0.95
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth || 1280;
  canvas.height = video.videoHeight || 720;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Gagal mendapatkan 2D Context pada canvas');
  }

  // Efek cermin (horizontal flip)
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);

  // Draw video frame
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Gagal mengonversi canvas ke Blob'));
        }
      },
      'image/jpeg',
      quality
    );
  });
}

/**
 * Helper untuk memuat Blob atau Image URL menjadi HTMLImageElement
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

/**
 * Menggabungkan 3 Blob foto ke dalam canvas frame (745x310 px).
 * - Foto ditaruh di slot masing-masing dengan crop cover (object-fit: cover)
 * - PNG frame transparan ditaruh di layer paling atas (overlay)
 * - Hasil diexport ke Blob PNG/JPEG beresolusi tinggi.
 */
export async function compositePhotosWithFrame(
  photos: Blob[],
  frameTemplate: FrameTemplate
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = frameTemplate.canvasWidth;
  canvas.height = frameTemplate.canvasHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Gagal membuat context 2D canvas compositing');
  }

  // Clear canvas background (putih/transparan)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 1. Load dan gambar 3 foto ke slot masing-masing
  for (let i = 0; i < Math.min(photos.length, frameTemplate.slots.length); i++) {
    const photoBlob = photos[i];
    const slot = frameTemplate.slots[i];

    const photoUrl = URL.createObjectURL(photoBlob);
    try {
      const img = await loadImage(photoUrl);

      // Hitung object-fit: cover crop
      const scale = Math.max(slot.width / img.width, slot.height / img.height);
      const srcWidth = slot.width / scale;
      const srcHeight = slot.height / scale;
      const srcX = (img.width - srcWidth) / 2;
      const srcY = (img.height - srcHeight) / 2;

      ctx.drawImage(
        img,
        srcX,
        srcY,
        srcWidth,
        srcHeight,
        slot.x,
        slot.y,
        slot.width,
        slot.height
      );
    } finally {
      URL.revokeObjectURL(photoUrl);
    }
  }

  // 2. Load dan gambar PNG Frame di atas foto (Layer paling atas)
  const frameSrc = frameTemplate.publicUrl || `/frames/${frameTemplate.file}`;
  const frameImg = await loadImage(frameSrc);

  ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);

  // 3. Export canvas ke Blob PNG
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Gagal merender hasil komposisi frame'));
        }
      },
      'image/png',
      1.0
    );
  });
}
