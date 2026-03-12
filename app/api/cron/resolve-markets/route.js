import { NextResponse } from 'next/server';
import { autoResolvePredictionMarkets } from '../../../../lib/server/prediction-markets-db.js';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request) {
  // Vercel cron sends Authorization: Bearer {CRON_SECRET}
  // External schedulers can use x-cron-secret header
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get('authorization') ?? '';
    const xSecret = request.headers.get('x-cron-secret') ?? '';
    const providedSecret = authHeader.replace('Bearer ', '') || xSecret;
    if (providedSecret !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const result = await autoResolvePredictionMarkets();
    return NextResponse.json({ ok: true, ...result, timestamp: new Date().toISOString() }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: 'Auto-resolve failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
