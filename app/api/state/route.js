import { NextResponse } from 'next/server';
import { getState } from '../../../lib/server/state-db.js';
import { apiError } from '../../../lib/api-error.js';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await getState();
    return NextResponse.json({ state: result.state }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return apiError('Internal server error');
  }
}
