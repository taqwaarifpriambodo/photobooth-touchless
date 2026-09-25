# 📸 Touchless Web Photo Booth

Aplikasi **Web Photo Booth Touchless** interaktif dan higienis berbasis AI Computer Vision (*Hand Tracking*). Pengunjung dapat mengontrol seluruh antarmuka, memilih frame, mengambil foto, hingga mengunduh hasil jepretan strip foto melalui QR Code **tanpa perlu menyentuh layar atau mouse fisik**.

---

## ✨ Fitur Unggulan

- 🖐️ **Kontrol Touchless Penuh:** Navigasi kursor virtual menggunakan telunjuk (*MediaPipe Hand Landmarker*) dengan *Double Exponential Smoothing* & *Dwell Timer* (1.5 detik).
- ✨ **Halaman Welcome & Quick Start Guide:** Menyambut pengunjung dengan panduan visual 3 langkah mudah sebelum mulai.
- 🎨 **Galeri Frame Dinamis:** Menampilkan 6 frame per halaman dalam grid 3x2, tombol navigasi `❮` `❯`, serta auto-start timer 2 menit.
- 📸 **Sesi Foto Multi-Shot Dinamis:**
  - Jumlah jepretan otomatis mengikuti jumlah slot frame (misal 2 atau 3 foto).
  - Countdown **10 detik** per jepretan dengan indikator **angka merah menyala pada $\le 3$ detik terakhir**.
  - **Garis Bantu (*Framing Guide Overlay*)** yang rasionya presisi dengan ukuran slot frame agar objek tidak terpotong.
- 🖼️ **Compositing Canvas Real-Time:** Menggabungkan seluruh jepretan ke slot frame secara instan di sisi klien (*HTML5 Canvas*).
- 📲 **QR Code & Signed URL 1 Jam:** Pengunjung langsung scan QR Code untuk mengunduh foto strip dengan masa berlaku link 1 jam.
- ⏱️ **Auto-Reset Booth:** Layar otomatis kembali ke Halaman Welcome setelah 60 detik di layar hasil.
- 🧹 **Otomatisasi Pembersihan (*Storage & DB Cleansing*):** Supabase `pg_cron` secara otomatis menghapus file foto dan record database yang berumur $> 1$ jam untuk efisiensi penyimpanan & privasi.

---

## 🛠️ Tech Stack

- **Frontend:** [Next.js](https://nextjs.org/) 16 (App Router, React 19, TypeScript)
- **Computer Vision:** [@mediapipe/tasks-vision](https://developers.google.com/mediapipe) (Hand Landmarker via WebAssembly)
- **Styling & Animasi:** [Tailwind CSS v4](https://tailwindcss.com/) & [Framer Motion](https://www.framer.com/motion/)
- **Backend & Database:** [Supabase](https://supabase.com/) (PostgreSQL, Storage Buckets, Row Level Security, pg_cron)
- **QR Code:** `qrcode.react`

---

## 🚀 Panduan Setup & Instalasi

Ikuti langkah-langkah berikut untuk menjalankan proyek di komputer lokal:

### 1. Prasyarat Sistem
- **Node.js**: Versi 18.18+ atau Node.js 20+ ([Download Node.js](https://nodejs.org/))
- **Webcam / Kamera**: Laptop camera atau USB webcam yang berfungsi normal
- **Browser Modern**: Google Chrome, Microsoft Edge, atau browser Chromium lainnya
- **Akun Supabase**: Akun gratis di [supabase.com](https://supabase.com/)

---

### 2. Clone Repository & Install Dependencies

```bash
# Clone repository
git clone https://github.com/username/photobooth-touchless.git
cd photobooth-touchless

# Install dependencies
npm install
```

---

### 3. Konfigurasi Database & Storage di Supabase

1. Buka [Supabase Dashboard](https://app.supabase.com/) dan buat project baru.
2. Buka menu **Storage** $\rightarrow$ **New Bucket**:
   - Buat bucket bernama **`frame_image`** (Centang *Public bucket*).
   - Buat bucket bernama **`photobooth_images`** (Centang *Public bucket*).
3. Buka menu **SQL Editor** $\rightarrow$ klik **New Query**, lalu salin dan jalankan seluruh script SQL berikut:

```sql
-- ============================================================
-- 1. AKTIFKAN EKSTENSI PG_CRON
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================================
-- 2. TABEL FRAMES & ROW LEVEL SECURITY (RLS)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.frames (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  frame_name TEXT NOT NULL,
  filename TEXT NOT NULL,
  canvas_width INTEGER DEFAULT 745,
  canvas_height INTEGER DEFAULT 310,
  slots JSONB DEFAULT '[
    {"x": 55, "y": 55, "width": 195, "height": 200},
    {"x": 275, "y": 55, "width": 195, "height": 200},
    {"x": 495, "y": 55, "width": 195, "height": 200}
  ]'::jsonb,
  status SMALLINT DEFAULT 1 CHECK (status IN (0, 1)),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.frames ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public frames are viewable by everyone"
ON public.frames FOR SELECT TO public USING (true);

-- Insert Template Frame Awal
INSERT INTO public.frames (frame_name, filename, canvas_width, canvas_height, slots, status)
VALUES
  ('Bunga Vintage', 'frame_01_bunga.png', 745, 310, '[{"x":55,"y":55,"width":195,"height":200},{"x":275,"y":55,"width":195,"height":200},{"x":495,"y":55,"width":195,"height":200}]'::jsonb, 1),
  ('Biru Minimalis', 'frame_02_biru.png', 745, 310, '[{"x":55,"y":55,"width":195,"height":200},{"x":275,"y":55,"width":195,"height":200},{"x":495,"y":55,"width":195,"height":200}]'::jsonb, 1),
  ('Kayu Klasik', 'frame_03_kayu.png', 745, 310, '[{"x":55,"y":55,"width":195,"height":200},{"x":275,"y":55,"width":195,"height":200},{"x":495,"y":55,"width":195,"height":200}]'::jsonb, 1),
  ('Hitam Emas', 'frame_05_hitam_emas.png', 745, 310, '[{"x":55,"y":55,"width":195,"height":200},{"x":275,"y":55,"width":195,"height":200},{"x":495,"y":55,"width":195,"height":200}]'::jsonb, 1),
  ('Lavender Aesthetic', 'frame_06_lavender.png', 745, 310, '[{"x":55,"y":55,"width":195,"height":200},{"x":275,"y":55,"width":195,"height":200},{"x":495,"y":55,"width":195,"height":200}]'::jsonb, 1)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 3. TABEL PHOTOS & ROW LEVEL SECURITY (RLS)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  frame_used TEXT,
  photo_count INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert to photos"
ON public.photos FOR INSERT TO public
WITH CHECK (image_url IS NOT NULL AND length(image_url) > 5);

CREATE POLICY "Allow public select on photos"
ON public.photos FOR SELECT TO public USING (true);

-- ============================================================
-- 4. STORAGE POLICIES (Bucket: photobooth_images)
-- ============================================================
CREATE POLICY "Allow public insert photobooth_images"
ON storage.objects FOR INSERT TO public
WITH CHECK (bucket_id = 'photobooth_images');

CREATE POLICY "Allow public select photobooth_images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'photobooth_images');

-- ============================================================
-- 5. FUNGSI PEMBERSIH FOTO & CRONJOB (1 Jam Expired)
-- ============================================================
CREATE OR REPLACE FUNCTION public.delete_expired_photos()
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, storage
AS $$
BEGIN
  -- Bypass trigger storage.protect_delete secara aman
  SET LOCAL session_replication_role = 'replica';

  -- Hapus file fisik di storage bucket photobooth_images
  DELETE FROM storage.objects
  WHERE bucket_id = 'photobooth_images'
    AND created_at < NOW() - INTERVAL '1 hours';

  -- Hapus metadata di tabel public.photos
  DELETE FROM public.photos
  WHERE created_at < NOW() - INTERVAL '1 hours';
END;
$$;

-- Cabut akses eksekusi publik dari REST API
REVOKE EXECUTE ON FUNCTION public.delete_expired_photos() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_expired_photos() TO postgres, service_role;

-- Jadwalkan cronjob setiap jam
SELECT cron.schedule(
  'auto-delete-expired-photobooth-images',
  '0 * * * *',
  $$SELECT public.delete_expired_photos()$$
);
```

4. Upload file gambar PNG frame transparan dari folder `public/frames/` ke Supabase Storage Bucket **`frame_image`**.

---

### 4. Konfigurasi Environment Variables

Buat file bernama `.env.local` di root directory proyek, lalu isi dengan kredensial dari **Supabase Dashboard** $\rightarrow$ **Project Settings** $\rightarrow$ **API**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here
```

---

### 5. Menjalankan Aplikasi

Jalankan development server:

```bash
npm run dev
```

Buka browser dan akses [http://localhost:3000](http://localhost:3000). Saat diminta izin webcam, klik **"Allow" / "Izinkan"**.

---

## 🖐️ Cara Penggunaan (Touchless Guide)

1. **Arahkan Jari Telunjuk:** Berdiri di depan kamera (jarak ideal 1–2 meter) dan tunjuk ke arah kamera dengan jari telunjuk ☝️ untuk menggerakkan kursor di layar.
2. **Tahan Kursor (*Dwell Timer*):** Untuk memilih frame atau menekan tombol, posisikan kursor di atas elemen dan **tahan selama 1.5 detik** sampai lingkaran progres penuh.
3. **Sesi Foto:**
   - Amati garis bantu di layar agar posisi tubuh & wajah pas di dalam slot.
   - Hitung mundur berjalan selama **10 detik**. Bersiaplah saat angka berubah menjadi **merah (3, 2, 1)**.
   - Layar akan berkedip putih (*flash*) saat foto diambil.
4. **Download Foto:**
   - Scan QR Code di layar menggunakan kamera smartphone Anda.
   - File foto strip langsung terunduh. Link QR Code berlaku selama **1 jam**.
   - Tekan tombol **"Selesai & Kembali ✨"** atau tunggu 60 detik untuk auto-reset.

---

## 📁 Struktur Direktori

```
photobooth-touchless/
├── public/
│   └── frames/                 # Asset file PNG frame transparan lokal (745x310)
├── src/
│   ├── app/
│   │   ├── api/frames/         # API Route untuk memuat template frame dari Supabase
│   │   ├── globals.css         # Styling global Tailwind v4 & tema warna
│   │   ├── layout.tsx          # Root Layout Next.js
│   │   └── page.tsx            # Main State Machine & Coordinator
│   ├── components/
│   │   ├── WelcomeScreen.tsx   # Halaman greeting & quick start guide
│   │   ├── FrameSelector.tsx   # Galeri 6 frame/page & timer 2 menit
│   │   ├── FrameCard.tsx       # Kartu frame dengan radial dwell timer
│   │   ├── NavDwellButton.tsx  # Tombol navigasi touchless Prev/Next
│   │   ├── MultiShotOverlay.tsx# Overlay countdown 10s & garis bantu framing
│   │   ├── ResultView.tsx      # Preview hasil, QR Code & auto-reset 60s
│   │   ├── VirtualCursor.tsx   # Kursor virtual telunjuk real-time
│   │   ├── CameraView.tsx      # WebCam fullscreen container (mirrored)
│   │   └── PermissionGate.tsx  # UI permintaan izin kamera awal
│   ├── hooks/
│   │   ├── useCamera.ts        # Hook manajemen stream webcam
│   │   ├── useHandTracking.ts  # Hook MediaPipe WASM & smoothing koordinat
│   │   ├── useDwellTimer.ts    # Hook deteksi hover dwell time touchless
│   │   ├── useAutoReset.ts     # Hook countdown timer otomatis
│   │   ├── useFrames.ts        # Hook fetching frame dari API
│   │   └── useMultiShotSession.ts # Hook orkestrasi sesi foto & countdown 10s
│   ├── lib/
│   │   ├── photoCompositor.ts  # Engine penggabung foto Blob + Frame PNG Canvas
│   │   ├── storage.ts          # Integrasi upload & Signed URL Supabase Storage
│   │   ├── db.ts               # Integrasi pencatatan database Supabase
│   │   └── frameConfig.ts      # Definisi koordinat slot & template frame fallback
│   └── types/
│       └── index.ts            # TypeScript interfaces & types
├── PRD_Photoboot_Touchless.md  # Dokumen Spesifikasi Produk (PRD) Lengkap
├── package.json
└── README.md
```

---

## 🔒 Kebijakan Keamanan & Privasi

- **Client-Side AI:** Pelacakan tangan diproses 100% di browser pengguna via WebAssembly (WASM), tidak ada video mentah yang dikirim ke server.
- **Row Level Security (RLS):** Seluruh tabel database Supabase diproteksi dengan RLS tervalidasi.
- **Auto-Delete Policy:** Foto yang tersimpan di server Supabase Storage dan database otomatis dihapus bersih setelah 1 jam oleh `pg_cron`.
