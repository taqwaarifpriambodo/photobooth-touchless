# Product Requirements Document (PRD)

# Touchless Web Photo Booth

**Versi Document:** 2.5  
**Status:** Complete / Production Ready (10s Countdown & Security Hardened)  
**Frontend Framework:** Next.js (App Router, React 19)  
**Backend & Database:** Supabase (PostgreSQL, Storage, pg_cron)  
**AI Computer Vision:** MediaPipe Hand Landmarker  
**Styling & UI:** Tailwind CSS v4 & Framer Motion (Clean Amber/Zinc Aesthetic)

---

## 1. Tujuan Produk

Menciptakan aplikasi _web-based photo booth_ yang interaktif, higienis, dan ramah pengguna melalui antarmuka _touchless_ (tanpa sentuhan fisik). Aplikasi memanfaatkan kamera webcam dan pelacakan tangan berbasis AI (_hand tracking_) untuk menggantikan fungsi klik mouse atau sentuhan layar.

---

## 2. Target Pengguna & Kasus Penggunaan

- **Target Pengguna:** Pengunjung acara (_event/exhibition_), pengguna _pop-up booth_, atau pengguna umum yang ingin mengambil foto secara mandiri.
- **Skenario Penggunaan:**
  1. Pengunjung berdiri di depan layar photo booth. Kamera aktif secara otomatis jika izin kamera sudah pernah diberikan.
  2. Layar menampilkan **Halaman Welcome** berisi salam pembuka (*greeting*), 3 langkah panduan cepat (*quick start guide*), dan tombol touchless "Mulai Sekarang ✨".
  3. Pengunjung mengarahkan jari telunjuk ke kamera untuk menggerakkan kursor virtual, lalu menahan kursor di tombol "Mulai Sekarang ✨" selama 1.5 detik (*dwell time*).
  4. Pengunjung memilih salah satu frame dari galeri paginasi (**6 frame per halaman** dalam grid 3x2 yang responsif dengan tombol navigasi touchless `❮` `❯`).
  5. Halaman pemilihan frame dilengkapi **timer otomatis 2 menit (120 detik)**. Jika pengunjung tidak menekan tombol dalam 2 menit, sistem otomatis memulai sesi foto dengan frame default.
  6. Pengunjung mengonfirmasi pilihan dengan menahan kursor (_dwell time_ 1.5 detik) di tombol "Mulai Foto (Nx Take)".
  7. Sesi foto otomatis berlangsung dinamis sesuai jumlah slot frame (misal 2 atau 3 jepretan) dengan panduan garis bantu (*framing guide*), **animasi hitung mundur 10 detik (angka berubah warna merah saat $\le 3$ detik)**, dan efek kilat layar (_flash_).
  8. Sistem menggabungkan seluruh foto hasil jepretan secara real-time ke dalam slot frame pilihan.
  9. Layar menampilkan preview hasil foto, QR Code dengan Signed URL berdurasi 1 jam, serta indikator peringatan waktu unduh.
  10. Pengunjung memindai QR Code menggunakan smartphone untuk mengunduh foto strip sebelum link kedaluwarsa. Layar otomatis _reset_ kembali ke **Halaman Welcome** dalam 60 detik (atau langsung klik tombol touchless "Selesai & Kembali ✨").

---

## 3. Tech Stack Utama

| Layer                    | Teknologi                             | Peran & Alasan Pemilihan                                                                               |
| ------------------------ | ------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Frontend Framework**   | Next.js (App Router, React 19)        | Manajemen _state_ UI, performa rendering tinggi, fleksibilitas integrasi React components.             |
| **Styling & UI**         | Tailwind CSS v4 + Framer Motion       | Desain modern bernuansa solid amber & dark zinc, tanpa gradient mencolok, animasi fluid dan responsif.  |
| **Computer Vision**      | MediaPipe Hand Landmarker             | Pelacakan 21 titik _landmark_ tangan secara _client-side_ via WebAssembly (WASM).                      |
| **Media & Canvas API**   | HTML5 `getUserMedia` & `<canvas>`     | Mengakses _stream_ webcam real-time (mirrored) dan memproses gabungan foto + frame.                    |
| **Backend & Storage**    | Supabase (Database, Storage, pg_cron) | Storage Bucket `frame_image` & `photobooth_images`, tabel `frames` & `photos`, serta cronjob otomatis. |
| **QR Generation & Auth** | `qrcode.react` + Supabase Signed URL  | Menggenerasi QR Code dinamis berbasis Signed URL dengan masa berlaku 1 jam (3600 detik).               |

---

## 4. Alur Pengguna (User Flow)

1. **Inisiasi & Akses Kamera Otomatis:**
   - Pengguna membuka aplikasi di browser.
   - Aplikasi memeriksa izin kamera via Browser Permissions API: jika sudah pernah diizinkan, kamera langsung aktif dan langsung membuka Halaman Welcome.
2. **Halaman Welcome & Quick Start Guide:**
   - Menyambut pengunjung dengan greeting ramah dan lencana branding `TOUCHLESS PHOTO BOOTH`.
   - Menampilkan 3 kartu panduan visual:
     1. **Gerakkan Kursor ☝️:** Mengarahkan jari telunjuk ke arah kamera.
     2. **Tahan untuk Memilih ⏱️:** Menahan kursor selama 1.5 detik (*dwell timer*) pada elemen yang dituju.
     3. **Scan & Download 📲:** Berpose di depan kamera lalu memindai QR Code dengan HP.
   - Tombol utama touchless "Mulai Sekarang ✨" dengan dwell time 1.5 detik (atau klik langsung) untuk beralih ke pemilihan frame.
3. **Navigasi Touchless & Virtual Cursor:**
   - MediaPipe melacak posisi ujung jari telunjuk (Landmark #8: `INDEX_FINGER_TIP`).
   - Kursor virtual diatur dengan _Double Exponential Smoothing (Holt's Method)_ + _Dead-zone Filter_ untuk pergerakan mulus tanpa jitter.
   - _Tracking Persistence (Hysteresis)_ menahan kursor selama 18 frame (~300ms) jika tangan terputus sekejap di pinggir kamera.
4. **Pemilihan Frame Dinamis (6 Frame Per Page & Timer 2 Menit):**
   - Layar memuat daftar frame aktif (`status = 1`) dari tabel Supabase `frames` & Storage Bucket `frame_image`.
   - Menampilkan **6 frame per halaman** dalam grid 3x2 yang rapi dan responsif, lengkap dengan tombol navigasi touchless (`❮` Prev & `❯` Next) berdurasi dwell 1 detik.
   - Dilengkapi **countdown timer 2 menit (120 detik)**: jika pengguna tidak memilih atau menekan tombol mulai dalam 2 menit, sistem otomatis memulai sesi dengan frame default.
   - Pengguna menahan kursor (_dwell time_ 1.5 detik) di atas frame atau tombol "Mulai Foto (Nx Take)".
5. **Sesi Foto Multi-Shot Dinamis & Garis Bantu Framing:**
   - Sesi foto berlangsung otomatis sesuai jumlah slot pada frame (`selectedFrame.slots.length`, misal 2 atau 3 foto):
     a. Teks status "FOTO N DARI Total" dan indikator progress bar di sudut layar.
     b. **Garis Bantu Framing (Framing Guide Box)** dengan rasio `width` dan `height` yang persis sama dengan slot aktif saat itu (misal `195x200px`) ditampilkan di tengah layar, lengkap dengan corner brackets amber dan label `Area Foto (Width×Height px)`.
     c. **Animasi hitung mundur 10 detik** (10, 9, 8... 1) berukuran besar di tengah kotak garis bantu, di mana angka **berubah warna menjadi merah menyala saat $\le 3$ detik** (3, 2, 1) sebagai sinyal persiapan pose akhir.
     d. Efek kilat layar penuh (_white flash overlay_ ~200ms) saat foto diambil via HTML5 Canvas (mirrored).
     e. Jeda preview singkat (1.5 detik) antar jepretan sebelum beralih ke slot berikutnya.
6. **Pemrosesan & Komposisi Real-Time:**
   - Canvas menggabungkan seluruh foto Blob ke posisi slot (`slots` JSONB) pada canvas sesuai dimensi `canvas_width` & `canvas_height` dari database Supabase.
   - Gambar frame PNG dari Supabase Storage ditimpa sebagai layer paling atas.
7. **Layar Hasil & Akses QR Code (Signed URL 1 Jam):**
   - Layar menampilkan _preview_ foto strip komposit (gabungan foto + frame).
   - Sistem mengunggah foto ke Supabase Storage (`upsert: false`), menyimpan record di database `photos`, dan membuat **Signed URL** dengan waktu kedaluwarsa 1 jam (3600s).
   - QR Code di-generate dari Signed URL dan dilengkapi lencana peringatan: `⏳ Link unduhan & QR Code berlaku selama 1 Jam`.
   - Pengguna dapat memindai QR Code untuk mengunduh foto atau memilih tombol touchless "Selesai & Kembali ✨" untuk kembali ke Halaman Welcome.
8. **Auto Reset & Cleansing Policy:**
   - Sesi layar otomatis _reset_ kembali ke **Halaman Welcome** setelah 60 detik tanpa aktivitas di layar hasil.
   - File fisik foto di Supabase Storage dan record metadata di database dihapus secara otomatis setelah 1 jam oleh Supabase `pg_cron`.

---

## 5. Rancangan Database, Storage & Security Hardening (Supabase)

### 5.1 Storage Buckets & Policies (`storage.objects`)

1. **`frame_image`**: Public Bucket untuk menyimpan file gambar PNG transparan frame (e.g. `frame_01_bunga.png`).
2. **`photobooth_images`**: Bucket untuk menyimpan file hasil akhir foto strip pengguna.

```sql
-- Storage Policies untuk Bucket photobooth_images
CREATE POLICY "Allow public insert photobooth_images"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'photobooth_images');

CREATE POLICY "Allow public select photobooth_images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'photobooth_images');
```

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

-- Aktifkan RLS & Kebijakan SELECT Publik Tunggal
ALTER TABLE public.frames ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public frames are viewable by everyone"
ON public.frames
FOR SELECT
TO public
USING (true);
```

> **Catatan Dynamic Slots:** Jumlah elemen dalam array `slots` menentukan jumlah jepretan foto secara otomatis. Jika array berisi 2 slot, sesi foto akan otomatis mengambil 2 foto; jika 3 slot, mengambil 3 foto.

### 5.3 Schema Tabel `photos` & RLS

```sql
CREATE TABLE IF NOT EXISTS public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  frame_used TEXT,
  photo_count INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aktifkan RLS & Kebijakan INSERT / SELECT
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert to photos"
ON public.photos
FOR INSERT
TO public
WITH CHECK (
  image_url IS NOT NULL 
  AND length(image_url) > 5
);

CREATE POLICY "Allow public select on photos"
ON public.photos
FOR SELECT
TO public
USING (true);
```

### 5.4 Otomatisasi Hapus Foto & Pembersihan Storage (`pg_cron`)

Untuk efisiensi penyimpanan dan perlindungan privasi pengguna, file foto dan record database dibatasi masa simpan maksimal 1 jam. Supabase `pg_cron` dan fungsi PL/pgSQL dieksekusi secara berkala setiap jam dengan proteksi keamanan penuh (*hardened search_path & revoked public RPC*):

```sql
-- 1. Aktifkan ekstensi pg_cron (jika belum)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Hapus jadwal cronjob lama agar tidak terjadi duplikasi/konflik
SELECT cron.unschedule('auto-delete-expired-photobooth-images');

-- 3. Fungsi pembersih foto dengan search_path terkunci dan bypass trigger aman
CREATE OR REPLACE FUNCTION public.delete_expired_photos()
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, storage
AS $$
BEGIN
  -- Bypass trigger proteksi hapus (storage.protect_delete) secara aman
  SET LOCAL session_replication_role = 'replica';

  -- A. Hapus file fisik di Supabase Storage bucket 'photobooth_images'
  DELETE FROM storage.objects
  WHERE bucket_id = 'photobooth_images'
    AND created_at < NOW() - INTERVAL '1 hours';

  -- B. Hapus record metadata di tabel 'public.photos'
  DELETE FROM public.photos
  WHERE created_at < NOW() - INTERVAL '1 hours';
END;
$$;

-- 4. Cabut hak akses eksekusi publik (anon/authenticated) agar tidak bisa dipanggil via HTTP REST API
REVOKE EXECUTE ON FUNCTION public.delete_expired_photos() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_expired_photos() TO postgres, service_role;

-- 5. Jadwalkan kembali cronjob (Berjalan otomatis setiap 1 jam via user internal postgres)
SELECT cron.schedule(
  'auto-delete-expired-photobooth-images',
  '0 * * * *', -- Berjalan setiap jam (menit ke-0)
  $$SELECT public.delete_expired_photos()$$
);
```

---

## 6. Spesifikasi Teknikal & Algoritma Interaksi

### 6.1 State Machine Aplikasi

| State Name          | Komponen Tampilan    | Deskripsi Perilaku                                                      |
| ------------------- | -------------------- | ----------------------------------------------------------------------- |
| `PERMISSION`        | `PermissionGate`     | Meminta izin akses webcam jika belum diizinkan oleh browser.            |
| `WELCOME`           | `WelcomeScreen`      | Halaman default awal & tujuan reset: greeting, 3 langkah panduan & CTA. |
| `FRAME_SELECTION`   | `FrameSelector`      | Galeri frame (6 item/page), countdown 2 menit auto-start.               |
| `MULTI_SHOT`        | `MultiShotOverlay`   | Pengambilan foto dinamis (countdown, framing guide, white flash).       |
| `RESULT`            | `ResultView`         | Preview hasil foto strip, QR Code Signed URL 1 jam, auto-reset 60s.     |

### 6.2 Pemetaan Koordinat & Smoothing Kursor

- Landmark #8 (`INDEX_FINGER_TIP`) dikonversi ke koordinat layar dengan efek cermin:
  $$X_{screen} = (1 - x_{landmark}) \times Width_{screen}$$
  $$Y_{screen} = y_{landmark} \times Height_{screen}$$
- Koordinat di-clamp 10px dari batas layar agar kursor tidak hilang saat menjangkau tombol di pinggir.
- _Double Exponential Smoothing (Holt's Method)_ diterapkan untuk eliminasi jitter tanpa lag:
  $$S_t = \alpha \cdot Y_t + (1 - \alpha)(S_{t-1} + T_{t-1})$$

### 6.3 Grid Galeri Frame (6 Item/Page) & Navigasi Touchless

- **Layout Galeri:** 6 frame per halaman dalam grid 3 kolom x 2 baris (`grid-cols-2 sm:grid-cols-3`).
- **Dwell Time Main CTA / Frame Card:** 1.5 detik (1500ms) dengan indikator lingkaran SVG radial progress.
- **Dwell Time Navigasi (❮ / ❯):** 1.0 detik (1000ms) untuk pemindahan halaman galeri frame secara cepat.
- **Tracking Persistence:** Kursor menahan lokasi terakhir selama 18 frame (~300ms) jika telapak tangan terpotong di pinggir kamera.

### 6.4 Auto-Start Timer 2 Menit & Auto-Reset

- **Pilih Frame Auto-Start (120 Detik):** Hook `useAutoReset` berdurasi 120 detik pada `FrameSelector`. Jika tidak ada interaksi sebelum waktu habis, sistem otomatis memilih frame pertama/aktif dan langsung berpindah ke sesi `MULTI_SHOT`.
- **Hasil Foto Auto-Reset (60 Detik):** Hook `useAutoReset` berdurasi 60 detik pada `ResultView` untuk me-reset booth kembali ke **Halaman Welcome** jika pengunjung meninggalkan layar hasil.

### 6.5 Pengambilan Foto, Countdown 10 Detik & Dynamic Slots

- **Sesi Multi-Shot Adaptif:** Jumlah sesi foto dihitung dari `selectedFrame.slots.length` (fallback ke 3).
- **Hitung Mundur 10 Detik & Visual Alert Merah:** Setiap jepretan foto didahului animasi hitung mundur selama 10 detik (10..1). Saat waktu tersisa $\le 3$ detik (3, 2, 1), warna angka otomatis berubah dari putih menjadi **merah menyala** (`text-red-500`) dengan efek *drop-shadow glow* merah untuk memberi sinyal visual persiapan pose akhir.
- **Garis Bantu Framing Dinamis:** Kotak panduan kamera (*framing guide*) menyesuaikan rasio dimensi `slots[currentShot - 1]` secara real-time pada setiap jepretan, memastikan subjek terbingkai presisi tanpa terpotong.
- **Compositing Canvas Real-Time:** Foto diletakkan tepat pada koordinat (`x`, `y`, `width`, `height`) masing-masing slot dengan crop *object-fit: cover*, lalu di-overlay oleh gambar PNG frame.

### 6.6 Keamanan QR Code & Masa Berlaku Signed URL

- **Signed URL Expiration:** Menggunakan method `supabase.storage.from('photobooth_images').createSignedUrl(path, 3600)` sehingga tautan unduhan QR Code hanya valid selama 60 menit (3600 detik).
- **UI Alert Badge:** Menampilkan lencana warna amber pada halaman hasil (`ResultView`): `⏳ Link unduhan & QR Code berlaku selama 1 Jam`.
