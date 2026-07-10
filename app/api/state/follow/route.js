import { NextResponse } from 'next/server';
import { followInStore, unfollowInStore } from '../../../../lib/server/state-db.js';
import { apiError } from '../../../../lib/api-error.js';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get('authorization') || '';
    const authToken = authHeader.replace(/^Bearer\s+/i, '').trim() || null;
    const result = await followInStore(body?.userId, authToken);
    return NextResponse.json(result, { status: result.accepted ? 200 : 400 });
  } catch {
    return apiError('Internal server error');
  }
}

export async function DELETE(request) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get('authorization') || '';
    const authToken = authHeader.replace(/^Bearer\s+/i, '').trim() || null;
    const result = await unfollowInStore(body?.userId, authToken);
    return NextResponse.json(result, { status: result.accepted ? 200 : 400 });
  } catch {
    return apiError('Internal server error');
  }
}
