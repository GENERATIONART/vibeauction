import { NextResponse } from 'next/server';
import { getRecentBidsForVibe } from '../../../../lib/server/state-db.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const vibeId = searchParams.get('vibeId');
  const vibeIdAlt = searchParams.get('vibeIdAlt');
  if (!vibeId) {
    return NextResponse.json(
      { bids: [], topBid: null },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  }

  try {
    const { bids, topBid } = await getRecentBidsForVibe(vibeId, 10, vibeIdAlt);
    return NextResponse.json(
      { bids, topBid },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return NextResponse.json(
      { bids: [], topBid: null },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
