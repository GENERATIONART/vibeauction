import { NextResponse } from 'next/server';
import { getPredictionForVibe, submitPredictionInStore } from '../../../../lib/server/state-db.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const vibeId = searchParams.get('vibeId');
    const authToken = request.headers.get('authorization')?.replace('Bearer ', '') ?? null;

    if (!vibeId) {
      return NextResponse.json(
        { prediction: null, stats: { totalPredictions: 0 } },
        { headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const payload = await getPredictionForVibe(vibeId, authToken);
    return NextResponse.json(payload, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to load prediction',
        details: error instanceof Error ? error.message : String(error),
        prediction: null,
        stats: { totalPredictions: 0 },
      },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const authToken = request.headers.get('authorization')?.replace('Bearer ', '') ?? null;
    const result = await submitPredictionInStore(body?.prediction, authToken);
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json(
      {
        accepted: false,
        reason: 'prediction_request_failed',
        error: 'Failed to submit prediction',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
