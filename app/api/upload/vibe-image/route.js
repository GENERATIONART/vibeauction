import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const maxDuration = 30;

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file || typeof file.arrayBuffer !== 'function') {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type. Use JPEG, PNG, WebP, or GIF.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    if (bytes.byteLength > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10 MB)' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Storage not configured' }, { status: 503 });
    }

    const sb = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    const originalName = typeof file.name === 'string' ? file.name : 'upload';
    const ext = originalName.split('.').pop()?.toLowerCase() || 'jpg';
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: uploadError } = await sb.storage
      .from('vibe-images')
      .upload(filename, bytes, { contentType: file.type, upsert: false });

    if (uploadError) {
      console.error('[upload-vibe-image] storage error:', uploadError.message);
      return NextResponse.json({ error: 'Upload failed: ' + uploadError.message }, { status: 500 });
    }

    const { data: urlData } = sb.storage.from('vibe-images').getPublicUrl(filename);
    return NextResponse.json({ url: urlData.publicUrl });
  } catch (err) {
    console.error('[upload-vibe-image] error:', err?.message ?? err);
    return NextResponse.json({ error: String(err?.message || 'Upload failed') }, { status: 500 });
  }
}
