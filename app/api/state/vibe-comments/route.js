import { NextResponse } from 'next/server';
import { getCommentsForVibe, submitCommentInStore } from '../../../../lib/server/state-db.js';
import { apiError } from '../../../../lib/api-error.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const vibeId = searchParams.get('vibeId') || '';
    const vibeIdAlt = searchParams.get('vibeIdAlt') || null;
    const vibeName = searchParams.get('vibeName') || null;
    const comments = await getCommentsForVibe(vibeId, 24, vibeIdAlt, vibeName);
    const res = NextResponse.json(comments);
    res.headers.set('Cache-Control', 'public, s-maxage=5, stale-while-revalidate=15');
    return res;
  } catch {
    return apiError('Internal server error');
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get('authorization') || '';
    const authToken = authHeader.replace(/^Bearer\s+/i, '').trim() || null;
    const result = await submitCommentInStore(body?.comment, authToken);
    return NextResponse.json(result);
  } catch {
    return apiError('Internal server error');
  }
}
