import { NextResponse } from 'next/server';
import { getGraduationForVibe } from '../../../../lib/server/state-db.js';
import { apiError } from '../../../../lib/api-error.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const vibeId = searchParams.get('vibeId') || '';
    const vibeIdAlt = searchParams.get('vibeIdAlt') || null;
    const vibeName = searchParams.get('vibeName') || null;
    const result = await getGraduationForVibe(vibeId, vibeIdAlt, vibeName);
    const res = NextResponse.json(result);
    res.headers.set('Cache-Control', 'public, s-maxage=15, stale-while-revalidate=60');
    return res;
  } catch {
    return apiError('Internal server error');
  }
}
