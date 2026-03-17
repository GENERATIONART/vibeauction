import { NextResponse } from 'next/server';
import { getGraduationBoard } from '../../../../lib/server/state-db.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get('limit') || 6);
    const result = await getGraduationBoard(limit);
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json(
      {
        board: [],
        summary: { breakoutCount: 0, graduatedCount: 0, qualifyingCount: 0 },
        error: 'Failed to load graduation board',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
