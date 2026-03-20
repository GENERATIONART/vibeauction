import { NextResponse } from 'next/server';
import { getVibeSocialForVibe, submitReactionInStore } from '../../../../lib/server/state-db.js';
import { apiError } from '../../../../lib/api-error.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const vibeId = searchParams.get('vibeId') || '';
    const vibeIdAlt = searchParams.get('vibeIdAlt') || null;
    const vibeName = searchParams.get('vibeName') || null;
    const authHeader = request.headers.get('authorization') || '';
    const authToken = authHeader.replace(/^Bearer\s+/i, '').trim() || null;
    const social = await getVibeSocialForVibe(vibeId, authToken, vibeIdAlt, vibeName);
    return NextResponse.json({ social }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return apiError('Internal server error');
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get('authorization') || '';
    const authToken = authHeader.replace(/^Bearer\s+/i, '').trim() || null;
    const result = await submitReactionInStore(body?.reaction, authToken);
    return NextResponse.json(result);
  } catch {
    return apiError('Internal server error');
  }
}
