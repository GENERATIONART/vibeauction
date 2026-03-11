import { NextResponse } from 'next/server';
import { mintVibeInStore } from '../../../../lib/server/state-db.js';

// Extend timeout to 30s to accommodate AI image generation (~3-6s for Flux Schnell)
export const maxDuration = 30;

export async function POST(request) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get('authorization') || '';
    const authToken = authHeader.replace(/^Bearer\s+/i, '').trim() || null;
    const result = await mintVibeInStore(body?.payload, authToken);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to mint vibe', details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
