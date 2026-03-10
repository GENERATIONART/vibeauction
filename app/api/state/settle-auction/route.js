import { NextResponse } from 'next/server';
import { settleAuctionInStore } from '../../../../lib/server/state-db.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const authToken = request.headers.get('authorization')?.replace('Bearer ', '') ?? null;
    console.log('[settle-auction] token present:', Boolean(authToken), 'item:', body?.item?.name);
    const result = await settleAuctionInStore(body?.item, authToken);
    console.log('[settle-auction] result:', JSON.stringify({ settled: result.settled, userId: result.userId }));
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to settle auction', details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
