import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
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

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

async function resolveUserIdFromAuthToken(authToken) {
  const token = safeText(authToken);
  if (!token) return null;

  const sb = getSupabaseAdmin();
  if (!sb) return null;

  try {
    const { data } = await sb.auth.getUser(token);
    return data?.user?.id ?? null;
  } catch {
    return null;
  }
}

async function creditAuraToProfile(userId, auraAmount) {
  const sb = getSupabaseAdmin();
  if (!sb || !userId || auraAmount <= 0) return false;

  const fallbackUsername = `user_${String(userId).replace(/-/g, '').slice(0, 12)}`;
  const resolveUsername = async () => {
    try {
      const { data } = await sb.auth.admin.getUserById(userId);
      const raw =
        safeText(data?.user?.user_metadata?.username) ||
        safeText(data?.user?.email?.split('@')?.[0]) ||
        fallbackUsername;
      const cleaned = raw.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30);
      return cleaned || fallbackUsername;
    } catch {
      return fallbackUsername;
    }
  };

  const incrementExistingProfile = async () => {
    const { data: profile, error } = await sb
      .from('profiles')
      .select('aura_balance')
      .eq('id', userId)
      .single();
    if (error || !profile) return false;
    const nextBalance = safeNumber(profile?.aura_balance, 0) + auraAmount;
    const { error: updateError } = await sb
      .from('profiles')
      .update({ aura_balance: nextBalance })
      .eq('id', userId);
    return !updateError;
  };

  const { data: profile, error: profileError } = await sb
    .from('profiles')
    .select('aura_balance')
    .eq('id', userId)
    .single();

  if (profileError) {
    // If the profile row does not exist yet, create it with the credited amount.
    if (profileError.code === 'PGRST116') {
      const preferredUsername = await resolveUsername();
      const suffix = String(Date.now()).slice(-4);
      const uniqueFallback = `${fallbackUsername}_${suffix}`.slice(0, 30);
      const candidateUsernames = [...new Set([preferredUsername, fallbackUsername, uniqueFallback])];

      for (const username of candidateUsernames) {
        const { error: insertError } = await sb
          .from('profiles')
          .insert({
            id: userId,
            username,
            aura_balance: auraAmount,
          });

        if (!insertError) return true;

        if (insertError.code === '23505') {
          // Duplicate key can be either username collision or profile already created concurrently.
          const incremented = await incrementExistingProfile();
          if (incremented) return true;
          continue;
        }

        return false;
      }

      return false;
    }
    return false;
  }

  const currentBalance = safeNumber(profile?.aura_balance, 0);
  const nextBalance = currentBalance + auraAmount;

  const { error: updateError } = await sb
    .from('profiles')
    .update({ aura_balance: nextBalance })
    .eq('id', userId);

  return !updateError;
}

export async function POST(request) {
  try {
    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecret) {
      return NextResponse.json({ error: 'Missing STRIPE_SECRET_KEY' }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const sessionId = safeText(body?.sessionId);
    const authToken = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim() ?? '';

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

    const sessionUserId = safeText(session?.metadata?.user_id) || null;
    const tokenUserId = await resolveUserIdFromAuthToken(authToken);
    if (sessionUserId && tokenUserId && sessionUserId !== tokenUserId) {
      return NextResponse.json({ credited: false, reason: 'user_mismatch' });
    }
    const userId = sessionUserId || tokenUserId;
    if (!userId) {
      return NextResponse.json({ credited: false, reason: 'auth_required' });
    }

    const result = await applyStripeCreditInStore({
      sessionId,
      auraAmount,
      label: `Stripe ${label}`,
    });

    let creditedToProfile = false;
    const sessionProfileCredited = result?.session?.profileCredited === true;
    const shouldAttemptProfileCredit = Boolean(
      userId && !sessionProfileCredited && (result.credited || result.reason === 'already_processed'),
    );

    if (shouldAttemptProfileCredit) {
      creditedToProfile = await creditAuraToProfile(userId, auraAmount);
      if (creditedToProfile) {
        const markResult = await applyStripeCreditInStore({
          sessionId,
          auraAmount,
          label: `Stripe ${label}`,
          markProfileCredited: true,
        });
        if (markResult?.state) {
          result.state = markResult.state;
          result.session = markResult.session || result.session;
        }
      }
    }

    let credited = Boolean(result.credited);
    let reason = result.reason || 'unknown';

    if (shouldAttemptProfileCredit && !creditedToProfile) {
      credited = false;
      reason = 'profile_credit_failed';
    } else if (!result.credited && result.reason === 'already_processed' && creditedToProfile) {
      credited = true;
      reason = 'credited_profile_retry';
    }

    return NextResponse.json({
      credited,
      reason,
      auraAmount,
      creditedToProfile,
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
