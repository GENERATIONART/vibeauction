import { NextResponse } from 'next/server';
import { getFeedVibes } from '../../../../lib/server/state-db.js';
import { apiError } from '../../../../lib/api-error.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const followingOnly = searchParams.get('following') === '1';
    const limit = Number(searchParams.get('limit')) || 30;
    const offset = Number(searchParams.get('offset')) || 0;
    const authHeader = request.headers.get('authorization') || '';
    const authToken = authHeader.replace(/^Bearer\s+/i, '').trim() || null;

    const result = await getFeedVibes({ limit, offset, followingOnly, viewerToken: authToken });
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return apiError('Internal server error');
  }
}
