# 📸 Touchless Web Photo Booth

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-blue?style=flat-square&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%7C%20DB%20%7C%20Storage-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-Hand%20Landmarker-0097A7?style=flat-square&logo=google)](https://developers.google.com/mediapipe)
[![PRD Version](https://img.shields.io/badge/PRD%20Spec-v2.6-amber?style=flat-square)](./PRD_Photoboot_Touchless.md)

Aplikasi **Web Photo Booth Touchless** modern, higienis, dan ramah pengguna berbasis AI Computer Vision (*Hand Tracking*). Pengunjung dapat mengontrol seluruh antarmuka, memilih frame, mengambil foto, hingga mengunduh hasil jepretan strip foto melalui QR Code **tanpa perlu menyentuh layar atau mouse fisik**.

---

## ✨ Fitur Unggulan

- 🔐 **Operator Authentication Gate (`LoginGate` & `useAuth`):**
  - Gerbang login khusus operator terintegrasi Supabase Auth (`signInWithPassword`) sebelum kamera dan photobooth diaktifkan.
  - Tampilan *dark glassmorphism* dengan kursor mouse konvensional dan validasi form instan.
  - Penanganan pesan error interaktif dengan animasi getar (*shake animation*) yang informatif dan ramah pengguna.
  - Pengecekan status sesi otomatis (*auto session restore*) via token JWT di browser saat halaman di-refresh.
  - Tombol *logout* operator diskrit di pojok kiri atas Halaman Welcome untuk mengunci kembali booth setelah acara selesai.

- 🖐️ **Kontrol Touchless Penuh (AI Computer Vision):**
  - Pelacakan posisi ujung jari telunjuk (*Landmark #8: INDEX_FINGER_TIP*) secara *client-side* via WebAssembly (WASM) tanpa mengirim feed video ke server.
  - Pergerakan kursor ultra-halus dan bebas *jitter* berkat algoritma **Double Exponential Smoothing (Holt's Method)** + **Dead-zone Filter**.
  - **Tracking Persistence (Hysteresis):** Kursor menahan koordinat terakhir selama 18 frame (~300ms) saat telapak tangan terputus sekejap di tepi sudut kamera.
  - Indikator progres visual lingkaran radial (*radial dwell timer*) berdurasi 1.5 detik.

- ✨ **Halaman Welcome & Quick Start Guide:**
  - Menyambut pengunjung dengan greeting ramah dan lencana branding `TOUCHLESS PHOTO BOOTH`.
  - 3 kartu panduan visual: **Gerakkan Kursor ☝️**, **Tahan untuk Memilih ⏱️**, dan **Scan & Download 📲**.
  - Tombol utama touchless "Mulai Sekarang ✨" (dwell timer 1.5s atau klik manual).

- 🎨 **Galeri Frame Dinamis & Mobile-Optimized:**
  - Menampilkan **6 frame per halaman** dalam grid responsif (1 kolom di HP / mode layar sempit, 3 kolom di desktop).
  - Tombol navigasi touchless `❮` Prev & `❯` Next dengan *dwell time* cepat 1.0 detik.
  - **Countdown Timer Otomatis 2 Menit (120 Detik):** Jika tidak ada interaksi dalam 2 menit, sistem otomatis memilih frame pertama dan memulai sesi foto.

- 📸 **Sesi Foto Multi-Shot Dinamis & Garis Bantu Framing:**
  - **Adaptif Dynamic Slots:** Jumlah sesi foto otomatis mengikuti konfigurasi slot pada frame terpilih (`selectedFrame.slots.length`, misal 2 atau 3 jepretan).
  - **Animasi Hitung Mundur 10 Detik:** Hitung mundur besar (10..1) di mana angka **berubah warna menjadi merah menyala saat $\le 3$ detik** (3, 2, 1) sebagai sinyal persiapan pose akhir.
  - **Garis Bantu (*Framing Guide Overlay*):** Kotak panduan kamera dinamis yang menyesuaikan rasio ukuran slot frame per jepretan foto, lengkap dengan sudut bracket amber dan label dimensi.
  - Efek kilat layar penuh (*white flash overlay* ~200ms) dan jeda preview 1.5 detik antar jepretan.

- 🖼️ **Compositing Canvas Real-Time:**
  - Menggabungkan seluruh foto jepretan (Blob) ke koordinat slot canvas (`canvas_width` & `canvas_height` dari Supabase) secara instan di browser dengan crop *object-fit: cover*.
  - Layer frame PNG transparan di-overlay di atas foto sebagai lapisan akhir yang presisi.

- 📲 **QR Code & Signed URL 1 Jam:**
  - Layar hasil menampilkan preview foto strip komposit (foto + frame).
  - Foto diunggah otomatis ke Supabase Storage, dicatat di tabel `photos`, dan dibuatkan **Signed URL** dengan masa berlaku 1 jam (3600 detik).
  - QR Code dinamis dibuat dari Signed URL, dilengkapi lencana peringatan: `⏳ Link unduhan & QR Code berlaku selama 1 Jam`.

- ⏱️ **Auto-Reset Booth:**
  - Sesi layar hasil otomatis kembali ke **Halaman Welcome** dalam 60 detik jika ditinggalkan pengunjung (atau langsung via tombol touchless "Selesai & Kembali ✨").

- 🧹 **Otomatisasi Pembersihan (*Storage & DB Cleansing*):**
  - Supabase `pg_cron` dan fungsi PL/pgSQL `delete_expired_photos()` mengeksekusi penghapusan file fisik di storage dan record metadata berumur $> 1$ jam setiap jam secara otomatis dengan proteksi keamanan penuh (*hardened search_path & revoked public RPC*).

---

## 🛠️ Tech Stack

| Layer | Teknologi | Peran & Alasan Pemilihan |
| :--- | :--- | :--- |
| **Frontend Framework** | [Next.js](https://nextjs.org/) 16 (App Router, React 19, TypeScript) | Performa rendering tinggi, reaktivitas modern, dan struktur routing modular. |
| **Styling & UI** | [Tailwind CSS v4](https://tailwindcss.com/) & [Framer Motion](https://www.framer.com/motion/) | Desain modern amber & dark zinc, animasi fluid, micro-interactions, dan responsivitas mobile. |
| **Computer Vision** | [@mediapipe/tasks-vision](https://developers.google.com/mediapipe) | Pelacakan 21 landmark tangan secara real-time via WebAssembly (WASM). |
| **Media & Canvas API** | HTML5 `getUserMedia` & `<canvas>` | Akses stream webcam real-time (mirrored) dan rendering komposisi foto strip. |
| **Backend & Storage** | [Supabase](https://supabase.com/) (Auth, PostgreSQL, Storage, pg_cron) | Layanan autentikasi operator, penyimpanan gambar frame & hasil jepretan, serta cronjob pembersihan. |
| **QR Code Generator** | `qrcode.react` | Menggenerasi QR Code dinamis dari Supabase Signed URL. |

---

## 🔄 Alur State Machine Aplikasi

```
[ Buka Web ]
     │
     ▼
┌──────────────┐      Login Berhasil
│  State: AUTH ├────────────────────────────┐
└──────┬───────┘                            │
       │ Belum Login                        ▼
       ▼                            ┌──────────────────┐
 [ Form Login ]                     │ State: PERMISSION│ (Jika izin kamera belum aktif)
                                    └────────┬─────────┘
                                             │ Izin Diberikan
                                             ▼
                                    ┌──────────────────┐
                                    │  State: WELCOME  │ ◄────────────────────────┐
                                    └────────┬─────────┘                          │
                                             │ Dwell 1.5s "Mulai Sekarang"        │
                                             ▼                                    │
                                    ┌──────────────────┐                          │
                                    │ FRAME_SELECTION  │ (Timer 2 Menit Auto)     │
                                    └────────┬─────────┘                          │
                                             │ Dwell 1.5s "Mulai Foto"            │
                                             ▼                                    │
                                    ┌──────────────────┐                          │
                                    │ State: MULTI_SHOT│ (Countdown 10s & Guide)  │
                                    └────────┬─────────┘                          │
                                             │ Selesai Semua Jepretan             │
                                             ▼                                    │
                                    ┌──────────────────┐                          │
                                    │  State: RESULT   ├──────────────────────────┘
                                    └──────────────────┘  Auto-Reset 60s / Tombol Selesai
```

---

## 🚀 Panduan Setup & Instalasi

Ikuti langkah-langkah berikut untuk menjalankan proyek di komputer lokal:

### 1. Prasyarat Sistem
- **Node.js**: Versi 22.x LTS direkomendasikan ([Download Node.js](https://nodejs.org/))
- **Webcam / Kamera**: Kamera laptop bawaan atau USB webcam yang berfungsi baik
- **Browser Modern**: Google Chrome, Microsoft Edge, atau browser berbasis Chromium lainnya
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

### 3. Konfigurasi Database, Storage & Cronjob di Supabase

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
-- 5. FUNGSI PEMBERSIH FOTO & CRONJOB (1 Jam Expired - Hardened)
-- ============================================================
SELECT cron.unschedule('auto-delete-expired-photobooth-images');

CREATE OR REPLACE FUNCTION public.delete_expired_photos()
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, storage
AS $$
BEGIN
  -- Bypass trigger storage.protect_delete secara aman
  SET LOCAL session_replication_role = 'replica';

  -- A. Hapus file fisik di storage bucket photobooth_images
  DELETE FROM storage.objects
  WHERE bucket_id = 'photobooth_images'
    AND created_at < NOW() - INTERVAL '1 hours';

  -- B. Hapus record metadata di tabel public.photos
  DELETE FROM public.photos
  WHERE created_at < NOW() - INTERVAL '1 hours';
END;
$$;

-- Cabut hak akses eksekusi publik dari REST API
REVOKE EXECUTE ON FUNCTION public.delete_expired_photos() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_expired_photos() TO postgres, service_role;

-- Jadwalkan cronjob setiap jam (menit ke-0)
SELECT cron.schedule(
  'auto-delete-expired-photobooth-images',
  '0 * * * *',
  $$SELECT public.delete_expired_photos()$$
);
```

4. Upload file gambar PNG frame transparan dari folder `public/frames/` ke Supabase Storage Bucket **`frame_image`**.

---

### 4. Konfigurasi Autentikasi Operator (Supabase Auth)

Untuk mengamankan akses aplikasi photobooth agar hanya dapat dioperasikan oleh operator terdaftar:

1. **Aktifkan Email Provider:**
   - Di [Supabase Dashboard](https://app.supabase.com/), buka menu **Authentication** $\rightarrow$ **Providers**.
   - Pastikan provider **Email** berstatus **Enabled**.
2. **Matikan Konfirmasi Email (Disarankan untuk booth lokal):**
   - Buka **Authentication** $\rightarrow$ **Providers** $\rightarrow$ klik **Email**.
   - Nonaktifkan opsi **"Confirm email"** (agar akun operator yang dibuat dapat langsung digunakan login tanpa verifikasi inbox email).
   - Klik **Save**.
3. **Buat Akun Operator Pertama:**
   - Buka menu **Authentication** $\rightarrow$ **Users**.
   - Klik tombol **Add User** $\rightarrow$ pilih **Create User**.
   - Masukkan **Email** (contoh: `operator@booth.com`) dan **Password**.
   - Klik **Create User**.

---

### 5. Konfigurasi Environment Variables

Buat file bernama `.env.local` di root directory proyek, lalu isi dengan kredensial dari **Supabase Dashboard** $\rightarrow$ **Project Settings** $\rightarrow$ **API**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here
```

---

### 6. Menjalankan Aplikasi

Jalankan development server:

```bash
npm run dev
```

1. Buka browser dan akses [http://localhost:3000](http://localhost:3000).
2. Layar akan menampilkan form **Masuk Operator**. Masukkan email & kata sandi operator yang telah dibuat di Supabase.
3. Setelah login berhasil, aplikasi akan meminta izin akses kamera webcam. Klik **"Allow" / "Izinkan"**.
4. Halaman **Welcome Touchless** siap digunakan oleh pengunjung acara!

---

## 🖐️ Panduan Interaksi Pengunjung (Touchless Guide)

1. **Login Operator:** Operator masuk menggunakan akun terdaftar untuk mengaktifkan antarmuka photobooth.
2. **Arahkan Jari Telunjuk:** Pengunjung berdiri di depan kamera (jarak ideal 1–2 meter) dan mengarahkan jari telunjuk ☝️ untuk menggerakkan kursor di layar.
3. **Tahan Kursor (*Dwell Timer*):** Untuk memilih tombol atau frame, arahkan kursor di atas elemen dan **tahan selama 1.5 detik** sampai lingkaran progres penuh (atau 1.0 detik pada tombol navigasi `❮` `❯`).
4. **Sesi Foto & Framing Guide:**
   - Posisikan wajah & badan di dalam kotak panduan (*framing guide*) di layar.
   - Hitung mundur berjalan selama **10 detik**. Bersiaplah saat angka berubah menjadi **merah menyala (3, 2, 1)**.
   - Layar akan berkedip putih (*flash*) saat foto diambil.
5. **Download Foto:**
   - Scan QR Code di layar menggunakan kamera smartphone Anda.
   - Foto strip langsung terunduh melalui **Signed URL** (berlaku selama **1 jam**).
   - Tekan tombol touchless **"Selesai & Kembali ✨"** atau tunggu 60 detik untuk auto-reset.

---

## 📁 Struktur Direktori

```
photobooth-touchless/
├── public/
│   └── frames/                 # Asset file PNG frame transparan (745x310)
├── src/
│   ├── app/
│   │   ├── api/frames/         # API Route fetching frame aktif dari Supabase
│   │   ├── globals.css         # Styling global Tailwind v4 & Glassmorphism themes
│   │   ├── layout.tsx          # Root Layout Next.js
│   │   └── page.tsx            # Main Coordinator State Machine (Auth, Camera, Booth Flow)
│   ├── components/
│   │   ├── LoginGate.tsx       # Form login operator terintegrasi Supabase Auth & shake alert
│   │   ├── WelcomeScreen.tsx   # Halaman greeting, 3 langkah panduan & tombol logout operator
│   │   ├── FrameSelector.tsx   # Galeri frame (6 item/page, mobile 1 col) & timer 2m auto-start
│   │   ├── FrameCard.tsx       # Kartu frame dengan radial dwell timer responsif
│   │   ├── NavDwellButton.tsx  # Tombol navigasi touchless Prev/Next (dwell 1.0s)
│   │   ├── MultiShotOverlay.tsx# Overlay countdown 10s (red alert <=3s) & framing guide
│   │   ├── ResultView.tsx      # Preview hasil foto strip, QR Code Signed URL & auto-reset 60s
│   │   ├── VirtualCursor.tsx   # Kursor virtual telunjuk real-time dengan smoothing
│   │   ├── CameraView.tsx      # WebCam fullscreen container (mirrored)
│   │   └── PermissionGate.tsx  # UI permintaan izin kamera awal
│   ├── hooks/
│   │   ├── useAuth.ts          # Hook manajemen autentikasi & sesi operator Supabase
│   │   ├── useCamera.ts        # Hook manajemen stream webcam & izin akses
│   │   ├── useHandTracking.ts  # Hook MediaPipe WASM & tracking persistence
│   │   ├── useDwellTimer.ts    # Hook deteksi hover dwell time touchless
│   │   ├── useAutoReset.ts     # Hook countdown timer otomatis (2m frame / 60s result)
│   │   ├── useFrames.ts        # Hook fetching template frame aktif
│   │   └── useMultiShotSession.ts # Hook orkestrasi sesi foto multi-shot & countdown 10s
│   ├── lib/
│   │   ├── coordinates.ts      # Smoothing koordinat kursor (Holt's method & dead-zone)
│   │   ├── photoCompositor.ts  # Engine penggabung foto Blob + Frame PNG Canvas
│   │   ├── storage.ts          # Integrasi upload & Signed URL Supabase Storage
│   │   ├── db.ts               # Integrasi pencatatan database Supabase
│   │   ├── supabase.ts         # Inisialisasi Supabase JS Client
│   │   └── frameConfig.ts      # Koordinat slot & template frame fallback
│   └── types/
│       └── index.ts            # TypeScript interfaces & types (AppState, PhotoSlot, dll.)
├── PRD_Photoboot_Touchless.md  # Dokumen Spesifikasi Produk (PRD) Lengkap v2.6
├── package.json
└── README.md
```

---

## 🔒 Kebijakan Keamanan & Privasi

- **Operator Authentication:** Seluruh akses kamera dan photobooth diproteksi oleh Supabase Auth berbasis token JWT terenkripsi dengan manajemen sesi lokal otomatis.
- **Client-Side AI:** Pelacakan tangan diproses 100% di browser pengguna via WebAssembly (WASM), tidak ada feed video mentah yang dikirim ke server.
- **Row Level Security (RLS):** Seluruh tabel database Supabase diproteksi dengan kebijakan RLS tervalidasi.
- **Signed URL Expiration:** Tautan unduhan QR Code hanya valid selama 60 menit (3600 detik).
- **Auto-Delete Policy:** Foto yang tersimpan di server Supabase Storage dan database otomatis dihapus bersih setelah 1 jam oleh `pg_cron`.
