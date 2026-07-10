import { NextResponse } from 'next/server';
import { sendMessageInStore, getConversationInStore } from '../../../../lib/server/state-db.js';
import { apiError } from '../../../../lib/api-error.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const withUserId = searchParams.get('with') || '';
    const authHeader = request.headers.get('authorization') || '';
    const authToken = authHeader.replace(/^Bearer\s+/i, '').trim() || null;
    const result = await getConversationInStore(withUserId, authToken);
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return apiError('Internal server error');
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get('authorization') || '';
    const authToken = authHeader.replace(/^Bearer\s+/i, '').trim() || null;
    const result = await sendMessageInStore(body?.recipientId, body?.body, authToken);
    return NextResponse.json(result, { status: result.accepted ? 200 : 400 });
  } catch {
    return apiError('Internal server error');
  }
}
