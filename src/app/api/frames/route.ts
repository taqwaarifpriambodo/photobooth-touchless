import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { supabase } from '@/lib/supabase';
import { getFrameTemplateFromRecord, getFrameTemplateForFile } from '@/lib/frameConfig';
import type { FrameTemplate, FrameRecord } from '@/types';

export async function GET() {
  try {
    // 1. Coba ambil data frame aktif (status = 1) dari tabel Supabase `frames`
    const { data: dbFrames, error: dbError } = await supabase
      .from('frames')
      .select('*')
      .eq('status', 1)
      .order('created_at', { ascending: false });

    if (!dbError && dbFrames && dbFrames.length > 0) {
      console.log(`[API Frames] Loaded ${dbFrames.length} active frames from Supabase database`);

      const frames: FrameTemplate[] = dbFrames.map((record: FrameRecord) => {
        const { data: publicUrlData } = supabase.storage
          .from('frame_image')
          .getPublicUrl(record.filename);

        const publicUrl = publicUrlData?.publicUrl || `/frames/${record.filename}`;
        return getFrameTemplateFromRecord(record, publicUrl);
      });

      return NextResponse.json({ frames, source: 'supabase' });
    }

    console.log('[API Frames] Table empty or not setup yet. Falling back to public/frames/ directory...');
  } catch (error) {
    console.error('[API Frames] Supabase fetch error, using local fallback:', error);
  }

  // 2. Fallback jika Supabase `frames` belum disetup atau kosong
  try {
    const framesDir = path.join(process.cwd(), 'public', 'frames');

    if (!fs.existsSync(framesDir)) {
      return NextResponse.json({ frames: [] });
    }

    const files = fs.readdirSync(framesDir);
    const pngFiles = files.filter((f) => f.toLowerCase().endsWith('.png'));

    const frames: FrameTemplate[] = pngFiles.map((fileName) =>
      getFrameTemplateForFile(fileName)
    );

    return NextResponse.json({ frames, source: 'local' });
  } catch (err) {
    console.error('[API Frames] Local fallback error:', err);
    return NextResponse.json({ frames: [] }, { status: 500 });
  }
}
