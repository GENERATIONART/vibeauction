import { NextResponse } from 'next/server';
import { getAgentSelf } from '../../../../lib/server/agent-db.js';
import { apiError } from '../../../../lib/api-error.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const authToken = authHeader.replace(/^Bearer\s+/i, '').trim() || null;
    if (!authToken) return apiError('Missing bearer token', 401);

    const agent = await getAgentSelf(authToken);
    if (!agent) return apiError('Invalid agent credentials', 401);

    return NextResponse.json({ agent }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return apiError('Internal server error');
  }
}
