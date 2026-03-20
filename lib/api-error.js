import { NextResponse } from 'next/server';

export function apiError(message, status = 500) {
  return NextResponse.json({ error: message }, { status });
}
