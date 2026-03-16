import { NextResponse } from 'next/server';
import { getCommentsForVibe, submitCommentInStore } from '../../../../lib/server/state-db.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const vibeId = searchParams.get('vibeId') || '';
    const vibeIdAlt = searchParams.get('vibeIdAlt') || null;
    const vibeName = searchParams.get('vibeName') || null;
    const comments = await getCommentsForVibe(vibeId, 24, vibeIdAlt, vibeName);
    return NextResponse.json(comments, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load vibe comments', details: error instanceof Error ? error.message : String(error), comments: [] },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get('authorization') || '';
    const authToken = authHeader.replace(/^Bearer\s+/i, '').trim() || null;
    const result = await submitCommentInStore(body?.comment, authToken);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to post vibe comment', details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
