import { NextResponse } from 'next/server';
import { mintVibeInStore } from '../../../../lib/server/state-db.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const result = await mintVibeInStore(body?.payload);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to mint vibe', details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
