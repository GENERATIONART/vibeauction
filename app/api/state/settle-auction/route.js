import { NextResponse } from 'next/server';
import { settleAuctionInStore } from '../../../../lib/server/state-db.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const result = await settleAuctionInStore(body?.item);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to settle auction', details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
