import { NextResponse } from 'next/server';
import { claimPredictionPayoutInStore } from '../../../../lib/server/prediction-markets-db.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const authToken = request.headers.get('authorization')?.replace('Bearer ', '') ?? null;
    const result = await claimPredictionPayoutInStore(body?.claim, authToken);
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json(
      {
        claimed: false,
        reason: 'request_failed',
        error: 'Failed to claim payout',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
