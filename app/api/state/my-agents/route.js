import { NextResponse } from 'next/server';
import { listMyAgents } from '../../../../lib/server/agent-db.js';
import { resolveActor } from '../../../../lib/server/agent-auth.js';
import { getSupabaseAdmin } from '../../../../lib/server/supabase-admin.js';
import { apiError } from '../../../../lib/api-error.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const authToken = authHeader.replace(/^Bearer\s+/i, '').trim() || null;
    if (!authToken) return apiError('Sign in required', 401);

    const sb = getSupabaseAdmin();
    const actor = await resolveActor(sb, authToken);
    if (!actor || actor.actorType !== 'human') return apiError('Sign in required', 401);

    const agents = await listMyAgents(actor.userId);
    return NextResponse.json({ agents }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return apiError('Internal server error');
  }
}
