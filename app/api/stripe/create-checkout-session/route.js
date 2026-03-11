import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const PACKS = {
  starter: { id: 'starter', label: 'Starter Pack', usdCents: 500, aura: 500 },
  booster: { id: 'booster', label: 'Booster Pack', usdCents: 1200, aura: 1300 },
  mega: { id: 'mega', label: 'Mega Pack', usdCents: 2500, aura: 3000 },
};

function resolveAppUrl(request) {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (envUrl) return envUrl.replace(/\/$/, '');

  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000';
  const proto = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

async function resolveUserIdFromAuthHeader(request) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;

  try {
    const sb = createClient(url, anon, { auth: { persistSession: false } });
    const { data } = await sb.auth.getUser(token);
    return data?.user?.id ?? null;
  } catch {
    return null;
  }
}

export async function POST(request) {
  try {
    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecret) {
      return NextResponse.json({ error: 'Missing STRIPE_SECRET_KEY' }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const packId = typeof body?.packId === 'string' ? body.packId : 'starter';
    const pack = PACKS[packId] || PACKS.starter;
    const userId = await resolveUserIdFromAuthHeader(request);

    const appUrl = resolveAppUrl(request);
    const successUrl = `${appUrl}/top-up/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${appUrl}/top-up?canceled=1`;

    const params = new URLSearchParams();
    params.set('mode', 'payment');
    params.set('success_url', successUrl);
    params.set('cancel_url', cancelUrl);
    params.set('line_items[0][price_data][currency]', 'usd');
    params.set('line_items[0][price_data][product_data][name]', `${pack.label} · ${pack.aura} AURA`);
    params.set('line_items[0][price_data][unit_amount]', String(pack.usdCents));
    params.set('line_items[0][quantity]', '1');
    params.set('metadata[aura_amount]', String(pack.aura));
    params.set('metadata[pack_id]', pack.id);
    params.set('metadata[pack_label]', pack.label);
    if (userId) {
      params.set('metadata[user_id]', userId);
    }

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeSecret}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error?.message || 'Stripe session creation failed' },
        { status: 400 },
      );
    }

    return NextResponse.json({
      sessionId: data.id,
      checkoutUrl: data.url,
      pack,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create checkout session', details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
