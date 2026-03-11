import { NextResponse } from 'next/server';
import { getState } from '../../../lib/server/state-db.js';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await getState();
    return NextResponse.json({ state: result.state }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load state', details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
