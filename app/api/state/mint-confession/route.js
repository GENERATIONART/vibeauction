import { NextResponse } from 'next/server';
import { mintConfessionInStore } from '../../../../lib/server/state-db.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const result = await mintConfessionInStore(body?.payload);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to mint confession', details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
