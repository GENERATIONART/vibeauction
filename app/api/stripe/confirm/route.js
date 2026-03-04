import { NextResponse } from 'next/server';
import { applyStripeCreditInStore } from '../../../../lib/server/state-db.js';

const PACKS = {
  starter: { id: 'starter', label: 'Starter Pack', aura: 500 },
  booster: { id: 'booster', label: 'Booster Pack', aura: 1300 },
  mega: { id: 'mega', label: 'Mega Pack', aura: 3000 },
};

const safeText = (value) => (typeof value === 'string' ? value.trim() : '');

const safeNumber = (value, fallback = 0) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/,/g, '').trim());
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

export async function POST(request) {
  try {
    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecret) {
      return NextResponse.json({ error: 'Missing STRIPE_SECRET_KEY' }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const sessionId = safeText(body?.sessionId);

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    }

    const stripeResponse = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${stripeSecret}`,
        },
      },
    );

    const session = await stripeResponse.json();

    if (!stripeResponse.ok) {
      return NextResponse.json(
        {
          error: session?.error?.message || 'Failed to load Stripe session',
        },
        { status: 400 },
      );
    }

    const paymentStatus = safeText(session?.payment_status) || 'unknown';
    if (paymentStatus !== 'paid') {
      return NextResponse.json({
        credited: false,
        reason: 'not_paid',
        paymentStatus,
      });
    }

    const packId = safeText(session?.metadata?.pack_id);
    const packFromId = PACKS[packId] || null;
    const auraAmount = Math.max(
      0,
      safeNumber(session?.metadata?.aura_amount, packFromId?.aura || 0),
    );

    if (auraAmount <= 0) {
      return NextResponse.json(
        {
          error: 'Missing aura amount in Stripe session metadata',
        },
        { status: 400 },
      );
    }

    const label = safeText(session?.metadata?.pack_label) || packFromId?.label || 'Top Up';

    const result = await applyStripeCreditInStore({
      sessionId,
      auraAmount,
      label: `Stripe ${label}`,
    });

    return NextResponse.json({
      credited: Boolean(result.credited),
      reason: result.reason || 'unknown',
      auraAmount,
      paymentStatus,
      state: result.state,
      sessionId,
      packId,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to confirm Stripe session',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
