import { NextResponse } from 'next/server';
import { getClaimPreview } from '../../../../lib/server/agent-db.js';
import { apiError } from '../../../../lib/api-error.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token') || '';
    const preview = await getClaimPreview(token);
    if (!preview) return apiError('Claim link not found', 404);
    return NextResponse.json({ preview }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return apiError('Internal server error');
  }
}
