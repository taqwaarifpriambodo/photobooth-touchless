import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getFrameTemplateFromRecord, validateFrameRecord } from '@/lib/frameConfig';
import type { FrameTemplate, FrameRecord } from '@/types';

// Selalu ambil data dinamis terbaru dari Supabase
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Ambil data frame aktif (status = 1) HANYA dari Supabase database
    const { data: dbFrames, error: dbError } = await supabase
      .from('frames')
      .select('*')
      .eq('status', 1)
      .order('created_at', { ascending: false });

    // Error handling jika query Supabase gagal (koneksi, auth, tabel tidak ada, dll.)
    if (dbError) {
      console.error('[API Frames] Supabase query error:', dbError);
      return NextResponse.json(
        {
          frames: [],
          error: `Gagal mengambil frame dari Supabase: ${dbError.message}`,
          source: 'supabase',
        },
        { status: 500 }
      );
    }

    // Error handling jika tidak ada frame aktif di database
    if (!dbFrames || dbFrames.length === 0) {
      console.warn('[API Frames] Tidak ada frame dengan status aktif (status = 1) di Supabase');
      return NextResponse.json({
        frames: [],
        message: 'Tidak ada frame aktif yang ditemukan di database Supabase.',
        source: 'supabase',
      });
    }

    console.log(`[API Frames] Memproses ${dbFrames.length} frame aktif dari Supabase...`);

    const validFrames: FrameTemplate[] = [];
    const invalidErrors: string[] = [];

    // 2. Validasi ketat setiap data frame yang didapat dari Supabase
    for (const record of dbFrames as FrameRecord[]) {
      const { data: publicUrlData } = supabase.storage
        .from('frame_image')
        .getPublicUrl(record.filename);

      const publicUrl = publicUrlData?.publicUrl || '';
      const validation = validateFrameRecord(record, publicUrl);

      if (!validation.isValid) {
        const errorMsg = `Frame "${record.frame_name || record.filename || record.id}": ${validation.error}`;
        console.warn(`[API Frames] Skip frame tidak valid -> ${errorMsg}`);
        invalidErrors.push(errorMsg);
        continue;
      }

      validFrames.push(getFrameTemplateFromRecord(record, publicUrl));
    }

    // Error handling jika semua record di database tidak valid
    if (validFrames.length === 0) {
      console.error('[API Frames] Semua frame di Supabase tidak valid:', invalidErrors);
      return NextResponse.json(
        {
          frames: [],
          error:
            'Data frame di Supabase ditemukan tetapi tidak ada yang valid (periksa konfigurasi canvas_width, canvas_height, atau slots).',
          details: invalidErrors,
          source: 'supabase',
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      frames: validFrames,
      source: 'supabase',
      totalActive: dbFrames.length,
      totalValid: validFrames.length,
    });
  } catch (error: unknown) {
    const errorMsg =
      error instanceof Error ? error.message : 'Terjadi kesalahan internal saat memuat frame dari Supabase';
    console.error('[API Frames] Internal error:', error);
    return NextResponse.json(
      {
        frames: [],
        error: errorMsg,
        source: 'supabase',
      },
      { status: 500 }
    );
  }
}
