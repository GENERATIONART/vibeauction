import { NextResponse } from 'next/server';
import {
  createPredictionMarketInStore,
  listPredictionMarkets,
} from '../../../lib/server/prediction-markets-db.js';
import { apiError } from '../../../lib/api-error.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state') || 'all';
    const marketId = searchParams.get('marketId') || null;
    const vibeId = searchParams.get('vibeId') || null;
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || 20)));
    const authToken = request.headers.get('authorization')?.replace('Bearer ', '') ?? null;
    const payload = await listPredictionMarkets({ state, limit, authToken, marketId, vibeId });
    return NextResponse.json(payload, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return apiError('Internal server error');
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const authToken = request.headers.get('authorization')?.replace('Bearer ', '') ?? null;
    const result = await createPredictionMarketInStore(body?.market, authToken);
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return apiError('Internal server error');
  }
}
