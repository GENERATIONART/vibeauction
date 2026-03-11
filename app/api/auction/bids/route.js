import { NextResponse } from 'next/server';
import { getRecentBidsForVibe } from '../../../../lib/server/state-db.js';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const vibeId = searchParams.get('vibeId');
  if (!vibeId) return NextResponse.json({ bids: [] });

  try {
    const bids = await getRecentBidsForVibe(vibeId);
    return NextResponse.json({ bids });
  } catch {
    return NextResponse.json({ bids: [] });
  }
}
