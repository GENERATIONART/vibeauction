import { NextResponse } from 'next/server';
import { placeBidInStore } from '../../../../lib/server/state-db.js';
import { apiError } from '../../../../lib/api-error.js';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object' || !body.bid || typeof body.bid !== 'object') {
      return apiError('Invalid request body', 400);
    }
    const authToken = request.headers.get('authorization')?.replace('Bearer ', '') ?? null;
    const result = await placeBidInStore(body.bid, authToken);
    return NextResponse.json(result);
  } catch {
    return apiError('Internal server error');
  }
}
