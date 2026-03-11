import { NextResponse } from 'next/server';
import {
  createPredictionMarketInStore,
  listPredictionMarkets,
} from '../../../lib/server/prediction-markets-db.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state') || 'all';
    const marketId = searchParams.get('marketId') || null;
    const limit = Number(searchParams.get('limit') || 100);
    const authToken = request.headers.get('authorization')?.replace('Bearer ', '') ?? null;
    const payload = await listPredictionMarkets({ state, limit, authToken, marketId });
    return NextResponse.json(payload, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json(
      {
        markets: [],
        error: 'Failed to load markets',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const authToken = request.headers.get('authorization')?.replace('Bearer ', '') ?? null;
    const result = await createPredictionMarketInStore(body?.market, authToken);
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json(
      {
        created: false,
        reason: 'request_failed',
        error: 'Failed to create market',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
