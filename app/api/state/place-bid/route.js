import { NextResponse } from 'next/server';
import { placeBidInStore } from '../../../../lib/server/state-db.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const result = await placeBidInStore(body?.bid);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to place bid', details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
