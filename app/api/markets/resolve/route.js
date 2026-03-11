import { NextResponse } from 'next/server';
import { resolvePredictionMarketInStore } from '../../../../lib/server/prediction-markets-db.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const authToken = request.headers.get('authorization')?.replace('Bearer ', '') ?? null;
    const result = await resolvePredictionMarketInStore(body?.resolution, authToken);
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json(
      {
        resolved: false,
        reason: 'request_failed',
        error: 'Failed to resolve market',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
