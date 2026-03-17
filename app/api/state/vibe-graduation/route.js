import { NextResponse } from 'next/server';
import { getGraduationForVibe } from '../../../../lib/server/state-db.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const vibeId = searchParams.get('vibeId') || '';
    const vibeIdAlt = searchParams.get('vibeIdAlt') || null;
    const vibeName = searchParams.get('vibeName') || null;
    const result = await getGraduationForVibe(vibeId, vibeIdAlt, vibeName);
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json(
      { graduation: null, error: 'Failed to load graduation state', details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
