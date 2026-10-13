# Product Requirements Document (PRD)

# Touchless Web Photo Booth

**Versi Document:** 3.0  
**Status:** Complete / Production Ready (Frame Admin Management & Dynamic Sizing)  
**Frontend Framework:** Next.js (App Router, React 19)  
**Backend & Database:** Supabase (Auth, PostgreSQL, Storage, pg_cron)  
**AI Computer Vision:** MediaPipe Hand Landmarker  
**Styling & UI:** Tailwind CSS v4 & Framer Motion (Clean Amber/Zinc Aesthetic)

---

## 1. Tujuan Produk

Menciptakan aplikasi _web-based photo booth_ yang interaktif, higienis, dan ramah pengguna melalui antarmuka _touchless_ (tanpa sentuhan fisik). Aplikasi memanfaatkan kamera webcam dan pelacakan tangan berbasis AI (_hand tracking_) untuk menggantikan fungsi klik mouse atau sentuhan layar pada alur pengunjung, serta menyediakan antarmuka khusus Administrator (`/admin/frames`) untuk mengelola katalog frame secara dinamis tanpa batasan ukuran statis.

---

## 2. Target Pengguna & Kasus Penggunaan

- **Target Pengguna:**
  1. **Pengunjung Acara (*Booth Visitors*):** Pengguna umum yang berinteraksi secara mandiri dan higienis tanpa menyentuh layar.
  2. **Operator Acara (*Booth Operators*):** Pengguna dengan akun login Supabase Auth untuk membuka dan mengunci sesi booth photobooth di lokasi acara.
  3. **Administrator Frame (*Booth Administrator*):** Akun khusus (`NEXT_PUBLIC_ADMIN_EMAIL`) yang memiliki kewenangan penuh untuk menambah, menguji coba, mengaktifkan/menonaktifkan, dan menghapus template frame di `/admin/frames`.

- **Skenario Penggunaan Pengunjung (Touchless Flow):**
  1. Pengunjung berdiri di depan layar photo booth. Kamera aktif otomatis setelah operator login dan memberi izin kamera.
  2. Layar menampilkan **Halaman Welcome** berisi greeting, 3 langkah panduan cepat (*quick start guide*), dan tombol touchless "Mulai Sekarang ✨".
  3. Pengunjung mengarahkan jari telunjuk ke kamera untuk menggerakkan kursor virtual, lalu menahan kursor di tombol "Mulai Sekarang ✨" selama 1.5 detik (*dwell time*).
  4. Pengunjung memilih salah satu frame dari galeri paginasi (**6 frame per halaman** dalam grid responsif dengan tombol navigasi touchless `❮` `❯`).
  5. Halaman pemilihan frame dilengkapi **timer otomatis 2 menit (120 detik)**: jika pengunjung tidak memilih frame dalam 2 menit, sistem otomatis memulai sesi dengan frame default.
  6. Sesi foto otomatis berlangsung dinamis sesuai jumlah slot pada frame terpilih (misal 2, 3, atau 4 jepretan) dengan panduan garis bantu (*framing guide* adaptif), **animasi hitung mundur 10 detik (angka berubah merah menyala saat $\le 3$ detik)**, dan efek kilat layar (*white flash*).
  7. Sistem menggabungkan seluruh foto hasil jepretan secara real-time ke dalam slot frame pilihan sesuai dimensi kanvas aslinya.
  8. Layar menampilkan preview hasil foto komposit, QR Code dengan Signed URL berdurasi 1 jam, serta indikator peringatan waktu unduh.
  9. Pengunjung memindai QR Code menggunakan smartphone untuk mengunduh foto strip. Layar otomatis *reset* kembali ke **Halaman Welcome** dalam 60 detik (atau langsung via tombol touchless "Selesai & Kembali ✨").

- **Skenario Penggunaan Administrator (Frame Management Flow):**
  1. Administrator login menggunakan email admin yang terkonfigurasi di `NEXT_PUBLIC_ADMIN_EMAIL`.
  2. Tombol **🎨 Kelola Frame** muncul secara eksklusif di Halaman Welcome bagi akun admin.
  3. Di halaman `/admin/frames`, admin melihat daftar seluruh template frame (aktif & nonaktif) dengan filter dan status.
  4. Admin dapat mengunggah frame PNG transparan baru dengan dimensi kanvas bebas/dinamis (tidak terbatas pada rasio tertentu).
  5. Sistem secara otomatis mendeteksi koordinat dan dimensi area transparan (*hole detection* via Alpha pixel scanning) sebagai slot foto awal.
  6. Admin dapat menguji coba hasil akhir komposisi secara instan menggunakan foto dari file lokal atau jepretan webcam (1 jepretan otomatis mengisi semua slot preview) lengkap dengan fitur Zoom In/Out.
  7. Admin dapat mengaktifkan/menonaktifkan frame atau menghapus frame secara permanen (membersihkan database dan file fisik di bucket Supabase Storage).

---

## 3. Tech Stack Utama

| Layer | Teknologi | Peran & Alasan Pemilihan |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js (App Router, React 19, TS) | Manajemen state UI, performa rendering tinggi, fleksibilitas routing, dan integrasi modular. |
| **Styling & UI** | Tailwind CSS v4 + Framer Motion | Desain modern solid amber & dark zinc, glassmorphism, animasi fluid, dan layout responsif. |
| **Computer Vision** | MediaPipe Hand Landmarker | Pelacakan 21 titik *landmark* tangan secara *client-side* via WebAssembly (WASM). |
| **Media & Canvas API** | HTML5 `getUserMedia` & `<canvas>` | Mengakses webcam (mirrored), deteksi piksel transparan frame, dan perakitan foto komposit real-time. |
| **Backend & Storage** | Supabase (Auth, Postgres, Storage, pg_cron) | Otentikasi operator/admin, tabel `frames` & `photos`, bucket `frame_image` & `photobooth_images`, serta pembersihan cronjob. |
| **QR Generation** | `qrcode.react` + Signed URL | Menggenerasi QR Code dinamis berbasis Signed URL dengan masa berlaku 1 jam (3600s). |

---

## 4. Alur Pengguna & Fitur Aplikasi

### 4.1 Alur Pengunjung (Touchless Booth Experience)
1. **Inisiasi & Akses Kamera Otomatis:** Kamera aktif setelah login operator tanpa permintaan izin berulang jika sudah diizinkan browser.
2. **Halaman Welcome & Quick Start Guide:** Menyambut pengunjung dengan kartu panduan interaksi dan tombol CTA touchless.
3. **Navigasi Touchless Virtual Cursor:** MediaPipe mendeteksi ujung telunjuk (Landmark #8), dihaluskan dengan *Holt's Double Exponential Smoothing* + *Dead-zone Filter* dan *Tracking Persistence (Hysteresis)* 18 frame.
4. **Pemilihan Frame Dinamis (6 Item/Page):** Grid responsif dengan dwell button navigasi 1.0s dan timer auto-start 120s.
5. **Multi-Shot Sesi Foto & Framing Guide Adaptif:** Hitung mundur 10 detik (angka merah menyala pada detik 3, 2, 1) dengan kotak garis bantu proporsional terhadap ukuran slot frame aktif.
6. **Real-time Canvas Compositing:** Penggabungan foto jepretan ke slot frame dan overlay frame PNG transparan di canvas browser.
7. **Layar Hasil & QR Code Signed URL:** QR Code berlaku 1 jam dengan tombol "Selesai & Kembali ✨" dan auto-reset 60s.

### 4.2 Alur Operator & Administrator
1. **Operator Gate (`LoginGate`):** Gerbang login Supabase Auth di awal aplikasi dengan handling getar (*shake alert*) dan auto-restore token JWT.
2. **Admin Guard (`AdminGuard`):** Proteksi halaman `/admin/frames` dan tombol "Kelola Frame" di Halaman Welcome yang secara ketat memverifikasi kesesuaian email terhadap `NEXT_PUBLIC_ADMIN_EMAIL`.
3. **Katalog & Filter Frame:** Manajemen status aktif (1) / nonaktif (0) dengan filter tabs ("Semua", "Aktif", "Nonaktif") dan pencarian real-time.
4. **Deteksi Slot Transparan Otomatis (`FrameDetector`):** Algoritma pemindaian kanal alpha (`alpha === 0`) pada ImageData canvas untuk mendeteksi lubang foto secara otomatis saat file frame PNG diunggah.
5. **Dukungan Dimensi Kanvas Dinamis:** Ukuran frame bebas (e.g. 745x310, 1080x1920, 1200x1800, dll.) dengan thumbnail rasio terjaga (*aspect-ratio container & object-contain*).
6. **Uji Coba Komposisi Instan (`FrameTester`):**
   - Mode Upload Gambar Komputer: Pratinjau langsung komposisi foto pada slot.
   - Mode Webcam Mandiri: 1 kali take foto otomatis menduplikasi ke seluruh slot untuk pengetesan cepat.
   - Fitur Zoom In / Out & Pan pada preview frame dan hasil komposit.
7. **Penghapusan Bersih Transaksional:** Memvalidasi keberadaan file fisik di storage, menghapus file dari bucket `frame_image`, kemudian menghapus record database `frames`. Jika RLS menolak penghapusan storage, database tidak akan dihapus sembarangan demi konsistensi data.

---

## 5. Rancangan Database, Storage & Keamanan (Supabase)

### 5.1 Storage Buckets & Policies (`storage.objects`)

1. **`frame_image`**: Bucket publik untuk menyimpan file gambar PNG frame transparan.
2. **`photobooth_images`**: Bucket publik untuk menyimpan file foto strip komposit hasil jepretan pengunjung.

```sql
-- Storage Policies: Bucket photobooth_images
CREATE POLICY "Allow public insert photobooth_images"
ON storage.objects FOR INSERT TO public
WITH CHECK (bucket_id = 'photobooth_images');

-- Storage Policies: Bucket frame_image (Public Select, Authenticated Insert & Delete)
DROP POLICY IF EXISTS "Public frame_image are viewable by everyone" ON storage.objects;
CREATE POLICY "Public frame_image are viewable by everyone"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'frame_image');

DROP POLICY IF EXISTS "Admin can upload frame_image" ON storage.objects;
CREATE POLICY "Admin can upload frame_image"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'frame_image');

DROP POLICY IF EXISTS "Admin can delete frame_image" ON storage.objects;
CREATE POLICY "Admin can delete frame_image"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'frame_image');
```

> **Catatan Keamanan Storage Daemon:** Daemon storage Supabase (`storage-api`) mengevaluasi role `authenticated` tanpa meneruskan klaim custom email ke `auth.jwt()`. Oleh karena itu, otorisasi bucket menggunakan role `authenticated` dengan pengamanan email ketat di level aplikasi (`AdminGuard`).

### 5.2 Schema Tabel `frames` & RLS

```sql
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

-- Publik (pengunjung booth) boleh melihat daftar frame
CREATE POLICY "Public frames are viewable by everyone"
ON public.frames FOR SELECT TO public USING (true);

-- Admin terautentikasi boleh menambah, mengubah status, dan menghapus frame
DROP POLICY IF EXISTS "Admin can insert frames" ON public.frames;
CREATE POLICY "Admin can insert frames"
ON public.frames FOR INSERT TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Admin can update frames" ON public.frames;
CREATE POLICY "Admin can update frames"
ON public.frames FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Admin can delete frames" ON public.frames;
CREATE POLICY "Admin can delete frames"
ON public.frames FOR DELETE TO authenticated
USING (true);
```

### 5.3 Schema Tabel `photos` & RLS

```sql
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
```

### 5.4 Otomatisasi Pembersihan Foto (`pg_cron`)

Foto strip pengunjung dibatasi masa simpan maksimal 1 jam:

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.unschedule('auto-delete-expired-photobooth-images');

CREATE OR REPLACE FUNCTION public.delete_expired_photos()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
BEGIN
  SET LOCAL session_replication_role = 'replica';

  DELETE FROM storage.objects
  WHERE bucket_id = 'photobooth_images'
    AND created_at < NOW() - INTERVAL '1 hours';

  DELETE FROM public.photos
  WHERE created_at < NOW() - INTERVAL '1 hours';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.delete_expired_photos() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_expired_photos() TO postgres, service_role;

SELECT cron.schedule(
  'auto-delete-expired-photobooth-images',
  '0 * * * *',
  $$SELECT public.delete_expired_photos()$$
);
```

---

## 6. Spesifikasi Lingkungan (*Environment Variables*)

Semua kredensial dan konfigurasi hak akses tersentralisasi di `.env.local` tanpa ada *hardcoding* di file skrip:

```env
# URL & Kunci Akses Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here

# Email Administrator Tunggal Pengelola Frame (/admin/frames)
NEXT_PUBLIC_ADMIN_EMAIL=admin@booth.com
```

---

## 7. Arsitektur Komponen & State Machine

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
*Jalur Khusus Admin:* Halaman Welcome $\rightarrow$ Tombol `🎨 Kelola Frame` $\rightarrow$ Halaman `/admin/frames` (CRUD Frame, Auto-detect slot, Live tester).
