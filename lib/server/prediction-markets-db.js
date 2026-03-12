import { createClient } from '@supabase/supabase-js';

const MARKET_TYPES = new Set(['binary', 'price_target', 'timing', 'engagement']);
const MARKET_STATES = new Set(['open', 'resolved', 'cancelled', 'all']);
const SIDES = new Set(['yes', 'no']);

const normalize = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const safeText = (value, maxLen = 2000) =>
  typeof value === 'string' ? value.trim().slice(0, maxLen) : '';

const AUTH_TOKEN_MAX_LEN = 12000;

const safeNumber = (value, fallback = 0) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/,/g, '').trim());
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const roundMoney = (value) => Math.round((safeNumber(value, 0) + Number.EPSILON) * 100) / 100;

const toIsoTimestamp = (value) => {
  const timestamp = new Date(value || '').getTime();
  if (!Number.isFinite(timestamp)) return null;
  return new Date(timestamp).toISOString();
};

const parseProbability = (value, fallback = null) => {
  const raw = safeNumber(value, Number.NaN);
  if (!Number.isFinite(raw)) return fallback;
  if (raw > 1) {
    const pct = raw / 100;
    if (pct <= 0 || pct >= 1) return fallback;
    return pct;
  }
  if (raw <= 0 || raw >= 1) return fallback;
  return raw;
};

const computeYesProbability = (row) => {
  const yesPool = safeNumber(row?.yes_pool, 0);
  const noPool = safeNumber(row?.no_pool, 0);
  if (yesPool > 0 && noPool > 0) {
    return clamp(yesPool / (yesPool + noPool), 0.01, 0.99);
  }
  const initial = parseProbability(row?.initial_probability, null);
  return Number.isFinite(initial) ? clamp(initial, 0.01, 0.99) : null;
};

const calcSharesForStake = ({ side, stake, probabilityYes }) => {
  const yesProb = clamp(safeNumber(probabilityYes, 0.5), 0.01, 0.99);
  const price = side === 'yes' ? yesProb : 1 - yesProb;
  const shares = safeNumber(stake, 0) / clamp(price, 0.01, 0.99);
  return {
    price: roundMoney(price),
    shares: roundMoney(shares),
  };
};

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

async function getUserIdFromToken(sb, authToken) {
  const token = safeText(authToken, AUTH_TOKEN_MAX_LEN);
  if (!sb || !token) return null;
  const { data } = await sb.auth.getUser(token);
  return data?.user?.id ?? null;
}

async function adjustProfileAuraBalance(sb, userId, delta) {
  if (!sb || !userId) return { ok: false, reason: 'missing_user' };
  const amount = roundMoney(delta);
  if (amount === 0) return { ok: true, newBalance: null };

  const { data: profile, error: profileError } = await sb
    .from('profiles')
    .select('aura_balance')
    .eq('id', userId)
    .single();

  if (profileError || !profile) return { ok: false, reason: 'profile_not_found' };

  const current = safeNumber(profile.aura_balance, 0);
  const next = roundMoney(current + amount);
  if (next < 0) return { ok: false, reason: 'insufficient_balance' };

  const { error: updateError } = await sb
    .from('profiles')
    .update({ aura_balance: next })
    .eq('id', userId);

  if (updateError) return { ok: false, reason: 'balance_update_failed' };
  return { ok: true, newBalance: next };
}

const mapMarketRow = ({ row, creatorHandle, participants, myPosition, myClaim, vibe }) => {
  const probabilityYes = computeYesProbability(row);
  const probabilityNo = Number.isFinite(probabilityYes) ? roundMoney(1 - probabilityYes) : null;
  const yesPool = roundMoney(row?.yes_pool);
  const noPool = roundMoney(row?.no_pool);
  const totalPool = roundMoney(yesPool + noPool);
  const vibeInfo = vibe || {};
  const vibeId = row?.vibe_id ?? null;
  return {
    id: row.id,
    type: row.market_type || 'binary',
    title: row.title,
    description: row.description || '',
    category: row.category || 'General',
    state: row.state || 'open',
    yesLabel: row.outcome_yes_label || 'Yes',
    noLabel: row.outcome_no_label || 'No',
    probabilityYes,
    probabilityNo,
    initialProbability: parseProbability(row.initial_probability, null),
    seedLiquidity: roundMoney(row.seed_liquidity),
    yesPool,
    noPool,
    totalPool,
    totalVolume: roundMoney(row.total_volume),
    closesAt: row.closes_at,
    resolvesAt: row.resolves_at ?? null,
    resolvedOutcome: row.resolved_outcome ?? null,
    resolvedAt: row.resolved_at ?? null,
    creatorId: row.creator_id,
    creatorHandle: creatorHandle || 'anonymous',
    createdAt: row.created_at,
    participants: participants || 0,
    myPosition: myPosition || null,
    myClaim: myClaim || null,
    vibeId,
    vibeSlug: vibeInfo.slug ?? null,
    vibeName: vibeInfo.name ?? null,
    vibeImageUrl: vibeInfo.image_url ?? null,
    vibeCategory: vibeInfo.category ?? null,
  };
};

async function fetchVibesByIds(sb, ids = []) {
  if (!sb || !Array.isArray(ids) || ids.length === 0) return new Map();
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  if (uniqueIds.length === 0) return new Map();
  const { data, error } = await sb
    .from('vibes')
    .select('id, slug, name, category, image_url')
    .in('id', uniqueIds);
  if (error || !Array.isArray(data)) return new Map();
  return new Map(data.map((row) => [row.id, row]));
}

export async function listPredictionMarkets({
  state = 'all',
  authToken = null,
  limit = 100,
  marketId = null,
  vibeId = null,
} = {}) {
  const sb = getSupabaseAdmin();
  if (!sb) return { markets: [] };

  const normalizedState = safeText(state, 30).toLowerCase() || 'all';
  const normalizedMarketId = normalize(marketId);
  const cappedLimit = clamp(Math.round(safeNumber(limit, 100)), 1, 200);

  let query = sb.from('prediction_markets').select('*');

  if (normalizedMarketId) {
    query = query.eq('id', normalizedMarketId).limit(1);
  } else {
    query = query.order('created_at', { ascending: false }).limit(cappedLimit);
  }

  if (MARKET_STATES.has(normalizedState) && normalizedState !== 'all') {
    query = query.eq('state', normalizedState);
  }

  const normalizedVibeId = normalize(vibeId);
  if (normalizedVibeId) {
    query = query.eq('vibe_id', normalizedVibeId);
  }

  const { data: marketRows, error: marketError } = await query;
  if (marketError || !Array.isArray(marketRows) || marketRows.length === 0) {
    return { markets: [] };
  }

  const userId = await getUserIdFromToken(sb, authToken);
  const marketIds = marketRows.map((row) => row.id);
  const creatorIds = [...new Set(marketRows.map((row) => row.creator_id).filter(Boolean))];
  const vibeIds = [...new Set(marketRows.map((row) => row.vibe_id).filter(Boolean))];

  const [profileRowsResult, positionRowsResult, myPositionsResult, myClaimsResult] = await Promise.all([
    creatorIds.length > 0
      ? sb.from('profiles').select('id, username').in('id', creatorIds)
      : Promise.resolve({ data: [] }),
    sb.from('prediction_market_positions').select('market_id, user_id').in('market_id', marketIds),
    userId
      ? sb
          .from('prediction_market_positions')
          .select('market_id, side, stake, shares')
          .eq('user_id', userId)
          .in('market_id', marketIds)
      : Promise.resolve({ data: [] }),
    userId
      ? sb
          .from('prediction_market_claims')
          .select('market_id, amount, created_at')
          .eq('user_id', userId)
          .in('market_id', marketIds)
      : Promise.resolve({ data: [] }),
  ]);

  const profileMap = {};
  for (const row of profileRowsResult?.data || []) {
    profileMap[row.id] = row.username ? `@${row.username}` : 'anonymous';
  }

  const participantsByMarket = new Map();
  for (const row of positionRowsResult?.data || []) {
    if (!participantsByMarket.has(row.market_id)) {
      participantsByMarket.set(row.market_id, new Set());
    }
    participantsByMarket.get(row.market_id).add(row.user_id);
  }

  const myPositionByMarket = new Map();
  for (const row of myPositionsResult?.data || []) {
    const current = myPositionByMarket.get(row.market_id) || {
      yesShares: 0,
      noShares: 0,
      totalStake: 0,
      positionsCount: 0,
    };
    if (row.side === 'yes') current.yesShares += safeNumber(row.shares, 0);
    if (row.side === 'no') current.noShares += safeNumber(row.shares, 0);
    current.totalStake += safeNumber(row.stake, 0);
    current.positionsCount += 1;
    myPositionByMarket.set(row.market_id, current);
  }

  const myClaimByMarket = new Map();
  for (const row of myClaimsResult?.data || []) {
    myClaimByMarket.set(row.market_id, {
      amount: roundMoney(row.amount),
      claimedAt: row.created_at,
    });
  }

  const vibeMap = await fetchVibesByIds(sb, vibeIds);

  const markets = marketRows.map((row) =>
    mapMarketRow({
      row,
      creatorHandle: profileMap[row.creator_id],
      participants: participantsByMarket.get(row.id)?.size || 0,
      myPosition: myPositionByMarket.has(row.id)
        ? {
            ...myPositionByMarket.get(row.id),
            yesShares: roundMoney(myPositionByMarket.get(row.id).yesShares),
            noShares: roundMoney(myPositionByMarket.get(row.id).noShares),
            totalStake: roundMoney(myPositionByMarket.get(row.id).totalStake),
          }
        : null,
      myClaim: myClaimByMarket.get(row.id) || null,
      vibe: vibeMap.get(row.vibe_id) || null,
    }),
  );

  return { markets };
}

export async function listPredictionLeaderboard({ limit = 16 } = {}) {
  const sb = getSupabaseAdmin();
  if (!sb) return { leaderboard: [] };
  const cappedLimit = clamp(Math.round(safeNumber(limit, 16)), 1, 100);
  const { data, error } = await sb
    .from('profiles')
    .select('id, username, prediction_points')
    .order('prediction_points', { ascending: false })
    .order('username', { ascending: true })
    .limit(cappedLimit);
  if (error || !Array.isArray(data)) return { leaderboard: [] };
  return {
    leaderboard: (data || []).map((row, index) => ({
      rank: index + 1,
      username: row.username ? `@${row.username}` : 'Anonymous',
      points: roundMoney(row.prediction_points ?? 0),
    })),
  };
}

export async function createPredictionMarketInStore(payload, authToken = null) {
  const sb = getSupabaseAdmin();
  if (!sb) return { created: false, reason: 'markets_unavailable' };

  const userId = await getUserIdFromToken(sb, authToken);
  if (!userId) return { created: false, reason: 'auth_required' };

  const title = safeText(payload?.title, 140);
  const description = safeText(payload?.description, 1500);
  const category = safeText(payload?.category, 60) || 'General';
  const marketType = safeText(payload?.type, 40).toLowerCase() || 'binary';
  const yesLabel = safeText(payload?.yesLabel, 40) || 'Yes';
  const noLabel = safeText(payload?.noLabel, 40) || 'No';
  const closesAt = toIsoTimestamp(payload?.closesAt);
  const resolvesAt = toIsoTimestamp(payload?.resolvesAt);
  const now = Date.now();

  if (!title || !closesAt) {
    return { created: false, reason: 'invalid_payload' };
  }
  if (!MARKET_TYPES.has(marketType)) {
    return { created: false, reason: 'invalid_market_type' };
  }
  if (new Date(closesAt).getTime() <= now) {
    return { created: false, reason: 'invalid_close_time' };
  }
  if (resolvesAt && new Date(resolvesAt).getTime() < new Date(closesAt).getTime()) {
    return { created: false, reason: 'invalid_resolve_time' };
  }

  const vibeId = normalize(payload?.vibeId || payload?.vibe_id);
  if (!vibeId) {
    return { created: false, reason: 'vibe_required' };
  }
  const { data: vibeRow } = await sb
    .from('vibes')
    .select('id')
    .eq('id', vibeId)
    .maybeSingle();
  if (!vibeRow?.id) {
    return { created: false, reason: 'vibe_not_found' };
  }
  const { data: existingVibeMarket } = await sb
    .from('prediction_markets')
    .select('id')
    .eq('vibe_id', vibeId)
    .eq('state', 'open')
    .maybeSingle();
  if (existingVibeMarket?.id) {
    const { markets } = await listPredictionMarkets({ authToken, state: 'open', marketId: existingVibeMarket.id });
    return { created: false, reason: 'vibe_market_exists', market: markets[0] || null };
  }

  const requestedId = normalize(payload?.id);
  const marketId = requestedId || normalize(`${title}-${Date.now()}`) || `market-${Date.now()}`;
  if (requestedId) {
    const { data: existingRow } = await sb
      .from('prediction_markets')
      .select('id')
      .eq('id', marketId)
      .maybeSingle();
    if (existingRow?.id) {
      const { markets } = await listPredictionMarkets({ authToken, state: 'all', marketId });
      return { created: false, reason: 'market_exists', market: markets[0] || null };
    }
  }

  const nowIso = new Date().toISOString();
  const { error: insertError } = await sb.from('prediction_markets').insert({
    id: marketId,
    creator_id: userId,
    market_type: marketType,
    title,
    description,
    category,
    outcome_yes_label: yesLabel,
    outcome_no_label: noLabel,
    closes_at: closesAt,
    resolves_at: resolvesAt,
    vibe_id: vibeId,
    initial_probability: null,
    seed_liquidity: 0,
    yes_pool: 0,
    no_pool: 0,
    total_volume: 0,
    state: 'open',
    created_at: nowIso,
    updated_at: nowIso,
  });

  if (insertError) {
    const message = String(insertError?.message || '');
    if (requestedId && message.toLowerCase().includes('duplicate')) {
      const { markets } = await listPredictionMarkets({ authToken, state: 'all', marketId });
      return { created: false, reason: 'market_exists', market: markets[0] || null };
    }
    return { created: false, reason: 'market_create_failed' };
  }

  const { markets } = await listPredictionMarkets({ state: 'all', authToken, limit: 200, vibeId });
  const market = markets.find((entry) => entry.id === marketId) || null;
  return { created: true, market };
}

export async function placePredictionTradeInStore(payload, authToken = null) {
  const sb = getSupabaseAdmin();
  if (!sb) return { accepted: false, reason: 'markets_unavailable' };

  const userId = await getUserIdFromToken(sb, authToken);
  if (!userId) return { accepted: false, reason: 'auth_required' };

  const marketId = normalize(payload?.marketId);
  const side = safeText(payload?.side, 10).toLowerCase();
  const stake = roundMoney(Math.abs(safeNumber(payload?.stake, 0)));
  const openingProbability = parseProbability(payload?.price, null);
  if (!marketId || !SIDES.has(side) || stake < 1) {
    return { accepted: false, reason: 'invalid_payload' };
  }

  const { data: marketRow } = await sb
    .from('prediction_markets')
    .select('*')
    .eq('id', marketId)
    .single();
  if (!marketRow) return { accepted: false, reason: 'market_not_found' };
  if (marketRow.state !== 'open') return { accepted: false, reason: 'market_closed' };

  const now = Date.now();
  const closeTime = new Date(marketRow.closes_at || '').getTime();
  if (Number.isFinite(closeTime) && closeTime <= now) {
    return { accepted: false, reason: 'market_closed' };
  }

  const currentProbabilityYes = computeYesProbability(marketRow);
  let executionProbabilityYes = currentProbabilityYes;
  if (!Number.isFinite(executionProbabilityYes)) {
    if (!Number.isFinite(openingProbability)) {
      return { accepted: false, reason: 'price_required_for_first_trade' };
    }
    executionProbabilityYes = openingProbability;
  }

  const { price, shares } = calcSharesForStake({ side, stake, probabilityYes: executionProbabilityYes });
  const debit = await adjustProfileAuraBalance(sb, userId, -stake);
  if (!debit.ok) {
    return { accepted: false, reason: debit.reason || 'insufficient_balance' };
  }

  const positionId = `pos-${marketId}-${userId}-${Date.now()}`;
  const nowIso = new Date(now).toISOString();
  const { error: insertPositionError } = await sb.from('prediction_market_positions').insert({
    id: positionId,
    market_id: marketId,
    user_id: userId,
    side,
    stake,
    shares,
    entry_probability: executionProbabilityYes,
    created_at: nowIso,
  });

  if (insertPositionError) {
    await adjustProfileAuraBalance(sb, userId, stake);
    return { accepted: false, reason: 'trade_record_failed' };
  }

  const nextYesPool = side === 'yes' ? roundMoney(safeNumber(marketRow.yes_pool, 0) + stake) : roundMoney(marketRow.yes_pool);
  const nextNoPool = side === 'no' ? roundMoney(safeNumber(marketRow.no_pool, 0) + stake) : roundMoney(marketRow.no_pool);
  const nextTotalVolume = roundMoney(safeNumber(marketRow.total_volume, 0) + stake);
  const nextInitialProbability =
    Number.isFinite(parseProbability(marketRow.initial_probability, null))
      ? parseProbability(marketRow.initial_probability, null)
      : executionProbabilityYes;

  const { error: updateMarketError } = await sb
    .from('prediction_markets')
    .update({
      yes_pool: nextYesPool,
      no_pool: nextNoPool,
      total_volume: nextTotalVolume,
      initial_probability: nextInitialProbability,
      updated_at: nowIso,
    })
    .eq('id', marketId)
    .eq('state', 'open');

  if (updateMarketError) {
    await sb.from('prediction_market_positions').delete().eq('id', positionId);
    await adjustProfileAuraBalance(sb, userId, stake);
    return { accepted: false, reason: 'market_update_failed' };
  }

  const { markets } = await listPredictionMarkets({ authToken, state: 'all', limit: 200 });
  const market = markets.find((entry) => entry.id === marketId) || null;
  return {
    accepted: true,
    trade: { side, stake, shares, price },
    market,
  };
}

export async function resolvePredictionMarketInStore(payload, authToken = null) {
  const sb = getSupabaseAdmin();
  if (!sb) return { resolved: false, reason: 'markets_unavailable' };

  const userId = await getUserIdFromToken(sb, authToken);
  if (!userId) return { resolved: false, reason: 'auth_required' };

  const marketId = normalize(payload?.marketId);
  const outcome = safeText(payload?.outcome, 20).toLowerCase();
  if (!marketId || !['yes', 'no', 'cancelled'].includes(outcome)) {
    return { resolved: false, reason: 'invalid_payload' };
  }

  const { data: marketRow } = await sb
    .from('prediction_markets')
    .select('*')
    .eq('id', marketId)
    .single();
  if (!marketRow) return { resolved: false, reason: 'market_not_found' };
  if (marketRow.state !== 'open') return { resolved: false, reason: 'already_resolved' };
  if (String(marketRow.creator_id) !== String(userId)) return { resolved: false, reason: 'only_creator_can_resolve' };

  const now = Date.now();
  const closeTime = new Date(marketRow.closes_at || '').getTime();
  if (Number.isFinite(closeTime) && closeTime > now) {
    return { resolved: false, reason: 'market_still_open' };
  }

  const nowIso = new Date(now).toISOString();
  const { error: resolveError } = await sb
    .from('prediction_markets')
    .update({
      state: outcome === 'cancelled' ? 'cancelled' : 'resolved',
      resolved_outcome: outcome,
      resolved_by: userId,
      resolved_at: nowIso,
      updated_at: nowIso,
    })
    .eq('id', marketId)
    .eq('state', 'open');

  if (resolveError) return { resolved: false, reason: 'resolve_failed' };

  const { markets } = await listPredictionMarkets({ authToken, state: 'all', limit: 200 });
  const market = markets.find((entry) => entry.id === marketId) || null;
  return { resolved: true, market };
}

export async function claimPredictionPayoutInStore(payload, authToken = null) {
  const sb = getSupabaseAdmin();
  if (!sb) return { claimed: false, reason: 'markets_unavailable' };

  const userId = await getUserIdFromToken(sb, authToken);
  if (!userId) return { claimed: false, reason: 'auth_required' };

  const marketId = normalize(payload?.marketId);
  if (!marketId) return { claimed: false, reason: 'invalid_payload' };

  const { data: marketRow } = await sb
    .from('prediction_markets')
    .select('*')
    .eq('id', marketId)
    .single();

  if (!marketRow) return { claimed: false, reason: 'market_not_found' };
  if (!['resolved', 'cancelled'].includes(marketRow.state)) {
    return { claimed: false, reason: 'market_not_resolved' };
  }

  const { data: existingClaim } = await sb
    .from('prediction_market_claims')
    .select('id, amount')
    .eq('market_id', marketId)
    .eq('user_id', userId)
    .maybeSingle();
  if (existingClaim) {
    return { claimed: false, reason: 'already_claimed', amount: roundMoney(existingClaim.amount) };
  }

  const { data: myPositions } = await sb
    .from('prediction_market_positions')
    .select('side, stake, shares')
    .eq('market_id', marketId)
    .eq('user_id', userId);

  if (!Array.isArray(myPositions) || myPositions.length === 0) {
    return { claimed: false, reason: 'no_position' };
  }

  const totalPool = roundMoney(safeNumber(marketRow.yes_pool, 0) + safeNumber(marketRow.no_pool, 0));
  let payout = 0;

  if (marketRow.state === 'cancelled' || marketRow.resolved_outcome === 'cancelled') {
    payout = roundMoney(myPositions.reduce((sum, row) => sum + safeNumber(row.stake, 0), 0));
  } else {
    const winningSide = marketRow.resolved_outcome === 'yes' ? 'yes' : 'no';
    const myWinningShares = roundMoney(
      myPositions
        .filter((row) => row.side === winningSide)
        .reduce((sum, row) => sum + safeNumber(row.shares, 0), 0),
    );
    if (myWinningShares <= 0) {
      payout = 0;
    } else {
      const { data: allWinningPositions } = await sb
        .from('prediction_market_positions')
        .select('shares')
        .eq('market_id', marketId)
        .eq('side', winningSide);
      const totalWinningShares = roundMoney(
        (allWinningPositions || []).reduce((sum, row) => sum + safeNumber(row.shares, 0), 0),
      );
      payout = totalWinningShares > 0 ? roundMoney((myWinningShares / totalWinningShares) * totalPool) : 0;
    }
  }

  const claimId = `claim-${marketId}-${userId}`;
  const nowIso = new Date().toISOString();
  const { error: claimInsertError } = await sb.from('prediction_market_claims').insert({
    id: claimId,
    market_id: marketId,
    user_id: userId,
    amount: payout,
    created_at: nowIso,
  });
  if (claimInsertError) return { claimed: false, reason: 'already_claimed' };

  if (payout > 0) {
    const credit = await adjustProfileAuraBalance(sb, userId, payout);
    if (!credit.ok) {
      await sb.from('prediction_market_claims').delete().eq('id', claimId);
      return { claimed: false, reason: 'payout_failed' };
    }
  }

  return { claimed: true, amount: payout };
}
