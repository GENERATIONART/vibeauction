import { NextResponse } from 'next/server';
import { registerAgentInStore } from '../../../../lib/server/agent-db.js';
import { checkRegisterRateLimit } from '../../../../lib/server/agent-auth.js';
import { apiError } from '../../../../lib/api-error.js';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (!checkRegisterRateLimit(ip)) {
      return apiError('Too many registration attempts, try again shortly', 429);
    }

    const body = await request.json();
    const result = await registerAgentInStore({
      name: body?.name,
      username: body?.username,
      bio: body?.bio,
    });

    if (!result.registered) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch {
    return apiError('Internal server error');
  }
}
