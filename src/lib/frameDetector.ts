import type { PhotoSlot } from '@/types';

export interface FrameDetectionResult {
  canvasWidth: number;
  canvasHeight: number;
  slots: PhotoSlot[];
  warnings: string[];
  previewUrl: string;
}

/**
 * Deteksi dimensi canvas dan area transparan (slot foto) dari file PNG frame.
 * Ukuran canvas bersifat 100% dinamis (mengikuti ukuran asli naturalWidth & naturalHeight dari PNG).
 */
export async function detectFrameLayout(file: File): Promise<FrameDetectionResult> {
  if (!file.type.includes('png')) {
    throw new Error('File harus berformat PNG dengan area transparan untuk slot foto.');
  }

  const previewUrl = URL.createObjectURL(file);

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Gagal membaca gambar PNG. File mungkin rusak.'));
    image.src = previewUrl;
  });

  const canvasWidth = img.naturalWidth;
  const canvasHeight = img.naturalHeight;

  if (!canvasWidth || !canvasHeight) {
    throw new Error('Gagal membaca dimensi gambar PNG.');
  }

  const warnings: string[] = [];

  // Peringatan jika dimensi terlalu kecil atau tidak lazim
  if (canvasWidth < 200 || canvasHeight < 200) {
    warnings.push(
      `Ukuran frame sangat kecil (${canvasWidth}x${canvasHeight} px). Disarankan minimal 600 px untuk kualitas cetak/foto yang baik.`
    );
  }

  if (canvasWidth > 6000 || canvasHeight > 6000) {
    warnings.push(
      `Ukuran frame sangat besar (${canvasWidth}x${canvasHeight} px). Proses rendering mungkin memerlukan memori lebih tinggi.`
    );
  }

  // Siapkan canvas offscreen untuk membaca piksel transparansi (alpha channel)
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) {
    throw new Error('Gagal membuat 2D context canvas untuk analisis transparansi.');
  }

  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
  const data = imageData.data;

  // Optimasi kecepatan: downsample jika gambar sangat besar (skala max ~600 px)
  const maxDim = Math.max(canvasWidth, canvasHeight);
  const scale = Math.max(1, Math.floor(maxDim / 600));
  const sw = Math.floor(canvasWidth / scale);
  const sh = Math.floor(canvasHeight / scale);

  // Buat grid biner: 1 jika transparan (alpha < 35), 0 jika opaque/berisi grafis
  const isTransparent = new Uint8Array(sw * sh);
  for (let sy = 0; sy < sh; sy++) {
    for (let sx = 0; sx < sw; sx++) {
      const origX = Math.min(canvasWidth - 1, sx * scale + Math.floor(scale / 2));
      const origY = Math.min(canvasHeight - 1, sy * scale + Math.floor(scale / 2));
      const alpha = data[(origY * canvasWidth + origX) * 4 + 3];
      if (alpha < 35) {
        isTransparent[sy * sw + sx] = 1;
      }
    }
  }

  // Connected Component Labeling menggunakan BFS untuk menemukan lubang transparan
  const visited = new Uint8Array(sw * sh);
  interface Component {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    pixelCount: number;
  }
  const components: Component[] = [];

  for (let sy = 0; sy < sh; sy++) {
    for (let sx = 0; sx < sw; sx++) {
      const idx = sy * sw + sx;
      if (!isTransparent[idx] || visited[idx]) continue;

      const queue = [idx];
      visited[idx] = 1;
      let minX = sx;
      let maxX = sx;
      let minY = sy;
      let maxY = sy;
      let pixelCount = 0;

      let qHead = 0;
      while (qHead < queue.length) {
        const curr = queue[qHead++];
        pixelCount++;
        const cx = curr % sw;
        const cy = Math.floor(curr / sw);

        if (cx < minX) minX = cx;
        if (cx > maxX) maxX = cx;
        if (cy < minY) minY = cy;
        if (cy > maxY) maxY = cy;

        // Cek 4 tetangga (atas, bawah, kiri, kanan)
        const neighbors = [
          cy > 0 ? curr - sw : -1,
          cy < sh - 1 ? curr + sw : -1,
          cx > 0 ? curr - 1 : -1,
          cx < sw - 1 ? curr + 1 : -1,
        ];

        for (const n of neighbors) {
          if (n >= 0 && isTransparent[n] && !visited[n]) {
            visited[n] = 1;
            queue.push(n);
          }
        }
      }

      const boxW = (maxX - minX + 1) * scale;
      const boxH = (maxY - minY + 1) * scale;
      const totalCanvasArea = canvasWidth * canvasHeight;
      const compArea = boxW * boxH;

      // Filter noise: abaikan jika dimensi < 40 px atau luas < 1% canvas
      if (boxW >= 40 && boxH >= 40 && compArea >= totalCanvasArea * 0.008) {
        // Abaikan jika area transparan menempel di seluruh pinggir luar canvas (background transparan kosong)
        const touchesLeft = minX <= 1;
        const touchesRight = maxX >= sw - 2;
        const touchesTop = minY <= 1;
        const touchesBottom = maxY >= sh - 2;
        const isOuterCanvasPadding =
          touchesLeft && touchesRight && touchesTop && touchesBottom && compArea > totalCanvasArea * 0.65;

        if (!isOuterCanvasPadding) {
          components.push({
            minX: minX * scale,
            maxX: Math.min(canvasWidth, (maxX + 1) * scale),
            minY: minY * scale,
            maxY: Math.min(canvasHeight, (maxY + 1) * scale),
            pixelCount,
          });
        }
      }
    }
  }

  // Konversi bounding box menjadi PhotoSlot berkoordinat piksel asli
  const slots: PhotoSlot[] = components.map((c) => ({
    x: Math.max(0, Math.round(c.minX)),
    y: Math.max(0, Math.round(c.minY)),
    width: Math.min(canvasWidth - Math.round(c.minX), Math.round(c.maxX - c.minX)),
    height: Math.min(canvasHeight - Math.round(c.minY), Math.round(c.maxY - c.minY)),
  }));

  // Urutkan slot: dari atas ke bawah, lalu dari kiri ke kanan
  slots.sort((a, b) => {
    const isSameRow = Math.abs(a.y - b.y) < canvasHeight * 0.12;
    if (isSameRow) {
      return a.x - b.x;
    }
    return a.y - b.y;
  });

  if (slots.length === 0) {
    warnings.push(
      'Tidak terdeteksi area transparan pada file PNG ini. Pastikan frame memiliki area berlubang (alpha = 0) untuk tempat foto, atau atur slot secara manual.'
    );
  }

  return {
    canvasWidth,
    canvasHeight,
    slots,
    warnings,
    previewUrl,
  };
}
