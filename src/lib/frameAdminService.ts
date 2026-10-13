import { supabase } from '@/lib/supabase';
import { getFrameTemplateFromRecord } from '@/lib/frameConfig';
import type { FrameTemplate, FrameRecord, PhotoSlot } from '@/types';

export interface CreateFrameParams {
  name: string;
  file: File;
  canvasWidth: number;
  canvasHeight: number;
  slots: PhotoSlot[];
}

/**
 * Mengambil SELURUH frame (baik aktif status=1 maupun nonaktif status=0) untuk halaman admin.
 */
export async function fetchAllAdminFrames(): Promise<FrameTemplate[]> {
  const { data: dbFrames, error: dbError } = await supabase
    .from('frames')
    .select('*')
    .order('created_at', { ascending: false });

  if (dbError) {
    console.error('[frameAdminService] Gagal fetch frames:', dbError);
    throw new Error(`Gagal mengambil data frame dari Supabase: ${dbError.message}`);
  }

  if (!dbFrames || dbFrames.length === 0) {
    return [];
  }

  const frames: FrameTemplate[] = [];

  for (const record of dbFrames as FrameRecord[]) {
    const { data: publicUrlData } = supabase.storage
      .from('frame_image')
      .getPublicUrl(record.filename);

    const publicUrl = publicUrlData?.publicUrl || '';
    try {
      frames.push(getFrameTemplateFromRecord(record, publicUrl));
    } catch (err) {
      // Jika ada record lama yang kolomnya tidak lengkap di DB, tetap tampilkan dengan toleransi di admin
      console.warn(`[frameAdminService] Skip validasi ketat untuk record ID ${record.id}:`, err);
      frames.push({
        id: record.id,
        name: record.frame_name || 'Frame Tanpa Nama',
        file: record.filename,
        publicUrl,
        status: record.status ?? 0,
        canvasWidth: record.canvas_width || 745,
        canvasHeight: record.canvas_height || 310,
        slots: Array.isArray(record.slots) ? record.slots : [],
      });
    }
  }

  return frames;
}

/**
 * Mengubah status aktif / nonaktif (1 atau 0) pada frame.
 */
export async function updateFrameStatus(id: string, status: number): Promise<void> {
  const { error } = await supabase
    .from('frames')
    .update({ status })
    .eq('id', id);

  if (error) {
    console.error('[frameAdminService] Gagal update status frame:', error);
    if (error.message.includes('permission') || error.message.includes('policy') || error.code === '42501') {
      throw new Error(
        'Akses ditolak: Anda tidak memiliki izin untuk mengubah status frame. Pastikan Anda login dengan email admin dan SQL policy update sudah dijalankan di Supabase.'
      );
    }
    throw new Error(`Gagal mengubah status frame: ${error.message}`);
  }
}

/**
 * Mengunggah file PNG ke bucket storage `frame_image`, lalu menyimpan metadata ke tabel `frames`.
 * Memiliki mekanisme rollback: jika insert DB gagal, file yang sudah terunggah akan dihapus.
 */
export async function createFrame(params: CreateFrameParams): Promise<FrameTemplate> {
  const { name, file, canvasWidth, canvasHeight, slots } = params;

  // Buat nama file unik dan aman untuk URL
  const cleanSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 30);
  const timestamp = Date.now();
  const filename = `frame_${timestamp}_${cleanSlug || 'custom'}.png`;

  // 1. Upload file PNG ke storage bucket `frame_image`
  const { error: uploadError } = await supabase.storage
    .from('frame_image')
    .upload(filename, file, {
      contentType: 'image/png',
      upsert: false,
    });

  if (uploadError) {
    console.error('[frameAdminService] Gagal upload file frame:', uploadError);
    if (uploadError.message.includes('permission') || uploadError.message.includes('policy')) {
      throw new Error(
        'Akses ditolak saat upload file ke storage bucket `frame_image`. Pastikan akun admin sudah memiliki policy storage INSERT di Supabase.'
      );
    }
    if (uploadError.message.includes('exceeded the maximum allowed size')) {
      throw new Error(
        'File frame melebihi batas ukuran maksimal bucket `frame_image` di Supabase. Silakan kompresi file PNG Anda atau naikkan batas `File size limit` bucket pada dashboard Supabase.'
      );
    }
    throw new Error(`Gagal mengunggah file frame ke Supabase Storage: ${uploadError.message}`);
  }

  // 2. Insert record ke tabel `frames`
  const { data: insertedData, error: insertError } = await supabase
    .from('frames')
    .insert([
      {
        frame_name: name.trim(),
        filename,
        canvas_width: canvasWidth,
        canvas_height: canvasHeight,
        slots: slots,
        status: 1, // Default aktif saat baru ditambah
      },
    ])
    .select()
    .single();

  if (insertError) {
    console.error('[frameAdminService] Gagal insert record frames, memulai rollback file:', insertError);

    // Rollback: Hapus file PNG yang sempat terupload agar tidak ada file sampah
    await supabase.storage.from('frame_image').remove([filename]);

    if (insertError.message.includes('permission') || insertError.message.includes('policy')) {
      throw new Error(
        'Akses ditolak saat menyimpan data ke tabel `frames`. Pastikan policy INSERT untuk authenticated admin sudah dijalankan di Supabase.'
      );
    }
    throw new Error(`Gagal menyimpan data frame ke tabel Supabase: ${insertError.message}`);
  }

  // Dapatkan URL publik untuk file yang baru dibuat
  const { data: publicUrlData } = supabase.storage
    .from('frame_image')
    .getPublicUrl(filename);

  const publicUrl = publicUrlData?.publicUrl || '';

  return {
    id: insertedData.id,
    name: insertedData.frame_name,
    file: insertedData.filename,
    publicUrl,
    status: insertedData.status,
    canvasWidth: insertedData.canvas_width,
    canvasHeight: insertedData.canvas_height,
    slots: insertedData.slots,
  };
}

/**
 * Ekstraksi nama file bersih di dalam storage bucket frame_image
 * Menangani URL lengkap Supabase, prefix folder, maupun filename biasa.
 */
export function extractCleanStorageFilename(fileOrUrl: string, bucketName = 'frame_image'): string {
  if (!fileOrUrl) return '';
  let str = fileOrUrl.trim();

  // Jika berupa URL lengkap (http:// atau https://)
  if (str.startsWith('http://') || str.startsWith('https://')) {
    try {
      const url = new URL(str);
      const pathname = decodeURIComponent(url.pathname);
      const marker = `/${bucketName}/`;
      const idx = pathname.indexOf(marker);
      if (idx !== -1) {
        return pathname.slice(idx + marker.length).replace(/^\/+/, '');
      }
      const parts = pathname.split('/');
      return parts[parts.length - 1];
    } catch {
      // fallback jika URL gagal diparsing
    }
  }

  // Bersihkan query string atau hash
  str = str.split('?')[0].split('#')[0];

  // Bersihkan prefix nama bucket atau public path
  str = str.replace(new RegExp(`^/?(${bucketName}|public|frames)/`, 'i'), '');
  str = str.replace(/^\/+/, '');

  return decodeURIComponent(str);
}

/**
 * Mengecek apakah file fisik benar-benar ada di public storage Supabase
 */
export async function checkStorageFileExists(filename: string, bucketName = 'frame_image'): Promise<boolean> {
  if (!filename) return false;
  try {
    const { data } = supabase.storage.from(bucketName).getPublicUrl(filename);
    if (!data?.publicUrl) return false;
    const res = await fetch(data.publicUrl, { method: 'HEAD' });
    return res.status === 200;
  } catch {
    return false;
  }
}

/**
 * Menghapus frame dari database dan storage:
 * 1. Hapus file fisik dari storage bucket `frame_image` terlebih dahulu
 * 2. Hapus record dari tabel `frames`
 */
export async function deleteFrame(frame: { id?: string; file: string }): Promise<void> {
  if (!frame.id) {
    throw new Error('ID frame tidak valid untuk dihapus.');
  }

  // 1. Bersihkan path file storage
  const cleanFilename = extractCleanStorageFilename(frame.file);
  const rawFilename = frame.file ? frame.file.replace(/^\/+/, '') : '';
  const pathsToDelete = Array.from(new Set([cleanFilename, rawFilename].filter(Boolean)));

  console.log('[frameAdminService] Menghapus file dari bucket frame_image:', pathsToDelete);

  // 2. Cek apakah file fisik memang ada di Supabase Storage bucket frame_image
  const fileExistsInStorage = cleanFilename
    ? await checkStorageFileExists(cleanFilename)
    : false;

  if (fileExistsInStorage && pathsToDelete.length > 0) {
    const { data: removedFiles, error: storageError } = await supabase.storage
      .from('frame_image')
      .remove(pathsToDelete);

    if (storageError) {
      console.error('[frameAdminService] Gagal menghapus file dari storage:', storageError);
      throw new Error(
        `Gagal menghapus file "${cleanFilename}" dari Supabase Storage: ${storageError.message}. ` +
        `Pastikan policy DELETE untuk storage.objects pada bucket frame_image sudah diaktifkan di Supabase SQL Editor.`
      );
    }

    // PENTING: Supabase Storage API mengembalikan data: [] jika ditolak oleh RLS Policy Postgres
    if (!removedFiles || removedFiles.length === 0) {
      console.error('[frameAdminService] Storage remove mengembalikan data kosong. Kemungkinan ditolak oleh RLS storage.objects.');
      throw new Error(
        `File fisik "${cleanFilename}" ada di Supabase Storage tetapi tidak berhasil dihapus (izin DELETE ditolak oleh RLS). ` +
        `Data di database sengaja tidak dihapus agar tetap sinkron. ` +
        `Silakan jalankan script SQL policy DELETE terbaru untuk bucket frame_image di Supabase SQL Editor.`
      );
    }

    console.log('[frameAdminService] ✅ Hasil hapus storage berhasil:', removedFiles);
  } else if (pathsToDelete.length > 0) {
    // Jika file tidak terdeteksi di storage (misal frame bawaan lokal atau file sudah tidak ada),
    // coba remove secara best-effort tanpa membatalkan penghapusan row database
    try {
      await supabase.storage.from('frame_image').remove(pathsToDelete);
    } catch (e) {
      console.warn('[frameAdminService] Best-effort storage remove skip:', e);
    }
  }

  // 3. Hapus record dari tabel database frames
  const { error: dbError } = await supabase
    .from('frames')
    .delete()
    .eq('id', frame.id);

  if (dbError) {
    console.error('[frameAdminService] Gagal menghapus record frame dari database:', dbError);
    if (dbError.message.includes('permission') || dbError.message.includes('policy')) {
      throw new Error(
        'Akses ditolak saat menghapus frame dari database. Pastikan policy DELETE untuk tabel frames sudah aktif di Supabase.'
      );
    }
    throw new Error(`Gagal menghapus data frame dari database: ${dbError.message}`);
  }

  console.log('[frameAdminService] ✅ Frame dan file storage berhasil dihapus permanen.');
}

