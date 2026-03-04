import { NextResponse } from 'next/server';
import { getState } from '../../../lib/server/state-db.js';

export async function GET() {
  try {
    const result = await getState();
    return NextResponse.json({ state: result.state });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load state', details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
