import { NextResponse } from 'next/server';
import { placePredictionTradeInStore } from '../../../../lib/server/prediction-markets-db.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const authToken = request.headers.get('authorization')?.replace('Bearer ', '') ?? null;
    const result = await placePredictionTradeInStore(body?.trade, authToken);
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json(
      {
        accepted: false,
        reason: 'request_failed',
        error: 'Failed to place trade',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
