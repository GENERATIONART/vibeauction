import { NextResponse } from 'next/server';
import { releaseAgentInStore } from '../../../../lib/server/agent-db.js';
import { resolveActor } from '../../../../lib/server/agent-auth.js';
import { getSupabaseAdmin } from '../../../../lib/server/supabase-admin.js';
import { apiError } from '../../../../lib/api-error.js';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const authToken = authHeader.replace(/^Bearer\s+/i, '').trim() || null;
    if (!authToken) return apiError('Sign in required', 401);

    const sb = getSupabaseAdmin();
    const actor = await resolveActor(sb, authToken);
    if (!actor || actor.actorType !== 'human') return apiError('Sign in required', 401);

    const body = await request.json();
    const result = await releaseAgentInStore(body?.agentId, actor.userId);
    return NextResponse.json(result, { status: result.released ? 200 : 400 });
  } catch {
    return apiError('Internal server error');
  }
}
