import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { createDefaultState } from '../default-store.js';
import { generateVibeImage } from './generate-image.js';
import {
  sendOutbidEmail,
  sendNewBidOnYourVibeEmail,
  sendAuctionWonEmail,
  sendVibeListedEmail,
} from '../email.js';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'vibe-store.json');

let stateQueue = Promise.resolve();

const normalize = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const safeText = (value, maxLen = 1000) =>
  typeof value === 'string' ? value.trim().slice(0, maxLen) : '';

const safeNumber = (value, fallback = 0) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/,/g, '').trim());
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const toIsoTimestamp = (value) => {
  const timestamp = new Date(value || '').getTime();
  if (!Number.isFinite(timestamp)) return null;
  return new Date(timestamp).toISOString();
};

const formatWonDate = (date) => {
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'short' });
  return `${day} ${month}`;
};

const mapPredictionRow = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    vibeId: row.vibe_id,
    vibeName: row.vibe_name || null,
    predictedPrice: safeNumber(row.predicted_price, 0),
    predictedWinnerTime: row.predicted_winner_time ?? null,
    createdAt: row.created_at ?? null,
    resolved: row.resolved === true,
    resolvedAt: row.resolved_at ?? null,
    actualFinalPrice: row.actual_final_price !== null ? safeNumber(row.actual_final_price, 0) : null,
    actualWinnerTime: row.actual_winner_time ?? null,
    pointsAwarded: safeNumber(row.points_awarded, 0),
  };
};

const scorePrediction = ({ predictedPrice, finalPrice, predictedWinnerTimeMs, actualWinnerTimeMs }) => {
  const finalAmount = Math.max(1, safeNumber(finalPrice, 1));
  const predictedAmount = Math.max(1, safeNumber(predictedPrice, 1));
  const priceErrorPct = Math.abs(predictedAmount - finalAmount) / finalAmount;
  const timingDiffMinutes = Math.abs(predictedWinnerTimeMs - actualWinnerTimeMs) / (60 * 1000);

  const priceScore = clamp(Math.round(70 - priceErrorPct * 100), 0, 70);
  const timingScore = clamp(Math.round(40 - timingDiffMinutes / 2), 0, 40);
  const precisionBonus = priceErrorPct <= 0.05 && timingDiffMinutes <= 10 ? 25 : 0;
  const participationBonus = 5;

  return priceScore + timingScore + precisionBonus + participationBonus;
};

async function resolvePredictionsForAuction({ vibeId, finalPrice, actualWinnerTime }) {
  const sb = getSupabaseAdmin();
  const normalizedId = normalize(vibeId);
  const settlementAmount = safeNumber(finalPrice, 0);
  const actualWinnerIso = toIsoTimestamp(actualWinnerTime);

  if (!sb || !normalizedId || settlementAmount <= 0 || !actualWinnerIso) {
    return { resolved: 0 };
  }

  const { data: predictionRows, error: predictionError } = await sb
    .from('auction_predictions')
    .select('id, user_id, predicted_price, predicted_winner_time')
    .eq('vibe_id', normalizedId)
    .eq('resolved', false);

  if (predictionError || !Array.isArray(predictionRows) || predictionRows.length === 0) {
    return { resolved: 0 };
  }

  const actualWinnerTimeMs = new Date(actualWinnerIso).getTime();
  const pointsByUserId = new Map();
  const nowIso = new Date().toISOString();
  const updates = [];

  for (const row of predictionRows) {
    const predictedWinnerTimeMs = new Date(row.predicted_winner_time || '').getTime();
    if (!Number.isFinite(predictedWinnerTimeMs)) continue;

    const points = scorePrediction({
      predictedPrice: row.predicted_price,
      finalPrice: settlementAmount,
      predictedWinnerTimeMs,
      actualWinnerTimeMs,
    });

    updates.push({
      id: row.id,
      points,
    });

    if (row.user_id) {
      pointsByUserId.set(row.user_id, (pointsByUserId.get(row.user_id) || 0) + points);
    }
  }

  if (updates.length === 0) return { resolved: 0 };

  await Promise.all(
    updates.map((update) =>
      sb
        .from('auction_predictions')
        .update({
          resolved: true,
          resolved_at: nowIso,
          actual_final_price: settlementAmount,
          actual_winner_time: actualWinnerIso,
          points_awarded: update.points,
          updated_at: nowIso,
        })
        .eq('id', update.id)
        .eq('resolved', false),
    ),
  );

  const userIds = Array.from(pointsByUserId.keys());
  if (userIds.length > 0) {
    const { data: profiles } = await sb
      .from('profiles')
      .select('id, prediction_points')
      .in('id', userIds);
    const currentPointsByUser = new Map((profiles || []).map((row) => [row.id, safeNumber(row.prediction_points, 0)]));

    await Promise.all(
      userIds.map((userId) =>
        sb
          .from('profiles')
          .update({
            prediction_points:
              safeNumber(currentPointsByUser.get(userId), 0) + safeNumber(pointsByUserId.get(userId), 0),
          })
          .eq('id', userId),
      ),
    );
  }

  return { resolved: updates.length };
}

// ─── Duration helpers ────────────────────────────────────────────────────────

function parseDurationMs(duration) {
  if (typeof duration !== 'string') return 24 * 60 * 60 * 1000;
  let ms = 0;
  const dayMatch = duration.match(/(\d+)\s*d/i);
  const hourMatch = duration.match(/(\d+)\s*h/i);
  const minMatch = duration.match(/(\d+)\s*m/i);
  if (dayMatch) ms += Number(dayMatch[1]) * 24 * 60 * 60 * 1000;
  if (hourMatch) ms += Number(hourMatch[1]) * 60 * 60 * 1000;
  if (minMatch) ms += Number(minMatch[1]) * 60 * 1000;
  if (ms === 0) ms = 24 * 60 * 60 * 1000; // default 24h
  return ms;
}

// ─── Supabase helpers ────────────────────────────────────────────────────────

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

async function fetchVibesFromSupabase() {
  const sb = getSupabaseAdmin();
  if (!sb) return null;
  const { data, error } = await sb
    .from('vibes')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) return null;
  return data.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    emoji: row.emoji,
    manifesto: row.manifesto,
    duration: row.duration,
    startingPrice: row.starting_price,
    buyNowPrice: row.buy_now_price ?? null,
    imageUrl: row.image_url ?? null,
    isAnonymous: row.is_anonymous,
    author: row.author,
    listedBy: row.listed_by ?? row.author,
    createdAt: row.created_at,
    endTime: row.end_time ?? null,
  }));
}

async function fetchVibeBySlugFromSupabase(slug) {
  const sb = getSupabaseAdmin();
  if (!sb) return null;
  const { data, error } = await sb
    .from('vibes')
    .select('*')
    .eq('slug', slug)
    .single();
  if (error || !data) return null;
  return {
    id: data.id,
    slug: data.slug,
    name: data.name,
    category: data.category,
    emoji: data.emoji,
    manifesto: data.manifesto,
    duration: data.duration,
    startingPrice: data.starting_price,
    buyNowPrice: data.buy_now_price ?? null,
    imageUrl: data.image_url ?? null,
    isAnonymous: data.is_anonymous,
    author: data.author,
    listedBy: data.listed_by ?? data.author,
    createdAt: data.created_at,
    endTime: data.end_time ?? null,
  };
}

export async function getRecentBidsForVibe(vibeId, limit = 10) {
  const sb = getSupabaseAdmin();
  if (!sb || !vibeId) return { bids: [], topBid: null };

  const [{ data: recentRows, error: recentError }, { data: topRows, error: topError }] = await Promise.all([
    sb
      .from('vibe_bids')
      .select('amount, user_id, created_at')
      .eq('vibe_id', vibeId)
      .order('created_at', { ascending: false })
      .limit(limit),
    sb
      .from('vibe_bids')
      .select('amount, user_id, created_at')
      .eq('vibe_id', vibeId)
      .order('amount', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1),
  ]);

  if (recentError || topError) return { bids: [], topBid: null };

  const recent = Array.isArray(recentRows) ? recentRows : [];
  const top = topRows?.[0] ?? null;

  // Resolve usernames for all users that appear in either recent history or top bid.
  const userIds = [...new Set([...recent.map((r) => r.user_id), top?.user_id].filter(Boolean))];
  const usernameMap = {};
  if (userIds.length > 0) {
    const { data: profiles } = await sb
      .from('profiles')
      .select('id, username')
      .in('id', userIds);
    for (const p of profiles || []) usernameMap[p.id] = p.username;
  }

  const mapBidRow = (row) => ({
    id: `${row.user_id}-${row.created_at}`,
    userId: row.user_id ?? null,
    user: usernameMap[row.user_id] ? `@${usernameMap[row.user_id]}` : 'Anonymous',
    amount: row.amount,
    createdAt: row.created_at,
    time: new Date(row.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  });

  return {
    bids: recent.map(mapBidRow),
    topBid: top ? mapBidRow(top) : null,
  };
}

export async function getPredictionForVibe(vibeId, authToken = null) {
  const normalizedId = normalize(vibeId);
  const sb = getSupabaseAdmin();
  if (!sb || !normalizedId) return { prediction: null, stats: { totalPredictions: 0 } };

  let userId = null;
  if (authToken) {
    const { data: userData } = await sb.auth.getUser(authToken);
    userId = userData?.user?.id ?? null;
  }

  const [{ count }, userPredictionResponse] = await Promise.all([
    sb
      .from('auction_predictions')
      .select('id', { count: 'exact', head: true })
      .eq('vibe_id', normalizedId),
    userId
      ? sb
          .from('auction_predictions')
          .select('*')
          .eq('vibe_id', normalizedId)
          .eq('user_id', userId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return {
    prediction: mapPredictionRow(userPredictionResponse?.data || null),
    stats: {
      totalPredictions: count ?? 0,
    },
  };
}

export async function submitPredictionInStore(prediction, authToken = null) {
  const normalizedId = normalize(prediction?.vibeId || prediction?.id || prediction?.slug || prediction?.name);
  const predictedPrice = Math.round(safeNumber(prediction?.predictedPrice, 0));
  const predictedWinnerIso = toIsoTimestamp(prediction?.predictedWinnerTime);
  const now = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  if (!normalizedId || predictedPrice <= 0 || !predictedWinnerIso) {
    return { accepted: false, reason: 'invalid_prediction_payload' };
  }

  const predictedWinnerTs = new Date(predictedWinnerIso).getTime();
  if (!Number.isFinite(predictedWinnerTs) || predictedWinnerTs <= now || predictedWinnerTs > now + sevenDaysMs) {
    return { accepted: false, reason: 'invalid_prediction_time' };
  }

  const sb = getSupabaseAdmin();
  if (!sb) {
    return { accepted: false, reason: 'prediction_unavailable' };
  }

  const token = safeText(authToken, 6000);
  if (!token) {
    return { accepted: false, reason: 'auth_required' };
  }

  const { data: userData } = await sb.auth.getUser(token);
  const userId = userData?.user?.id ?? null;
  if (!userId) {
    return { accepted: false, reason: 'auth_required' };
  }

  const { data: vibeRow } = await sb
    .from('vibes')
    .select('name, end_time')
    .eq('slug', normalizedId)
    .single();
  if (!vibeRow) {
    return { accepted: false, reason: 'vibe_not_found' };
  }

  if (vibeRow?.end_time) {
    const endTimeMs = new Date(vibeRow.end_time).getTime();
    if (Number.isFinite(endTimeMs) && endTimeMs <= now) {
      return { accepted: false, reason: 'auction_ended' };
    }
  }

  const vibeName = safeText(prediction?.vibeName || prediction?.name, 140) || vibeRow?.name || 'Unknown Vibe';
  const nowIso = new Date(now).toISOString();
  const id = `pred-${normalizedId}-${userId}`;

  const { error: upsertError } = await sb.from('auction_predictions').upsert(
    {
      id,
      user_id: userId,
      vibe_id: normalizedId,
      vibe_name: vibeName,
      predicted_price: predictedPrice,
      predicted_winner_time: predictedWinnerIso,
      updated_at: nowIso,
      resolved: false,
      resolved_at: null,
      actual_final_price: null,
      actual_winner_time: null,
      points_awarded: 0,
    },
    { onConflict: 'user_id,vibe_id' },
  );

  if (upsertError) {
    return { accepted: false, reason: 'prediction_persist_failed' };
  }

  const [{ data: savedPrediction }, { count }] = await Promise.all([
    sb
      .from('auction_predictions')
      .select('*')
      .eq('vibe_id', normalizedId)
      .eq('user_id', userId)
      .maybeSingle(),
    sb
      .from('auction_predictions')
      .select('id', { count: 'exact', head: true })
      .eq('vibe_id', normalizedId),
  ]);

  return {
    accepted: true,
    prediction: mapPredictionRow(savedPrediction),
    stats: {
      totalPredictions: count ?? 0,
    },
  };
}

async function fetchHighestBidsFromSupabase() {
  const sb = getSupabaseAdmin();
  if (!sb) return null;
  const { data, error } = await sb
    .from('vibe_bids')
    .select('vibe_id, vibe_name, amount')
    .order('amount', { ascending: false });
  if (error || !data) return null;

  // Keep only the highest bid per vibe
  const highestByVibe = new Map();
  for (const row of data) {
    if (!highestByVibe.has(row.vibe_id)) {
      highestByVibe.set(row.vibe_id, {
        id: row.vibe_id,
        name: row.vibe_name,
        amount: row.amount,
        status: 'HIGHEST',
      });
    }
  }
  return Array.from(highestByVibe.values());
}

async function fetchVaultItemsFromSupabase(userId) {
  const sb = getSupabaseAdmin();
  if (!sb || !userId) return null;
  const { data, error } = await sb
    .from('vault_items')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) return null;
  return data.map((row) => ({
    id: row.id,
    name: row.name,
    emoji: row.emoji || '✨',
    category: row.category || 'Vibes',
    rarity: row.rarity || 'common',
    price: row.price || 0,
    wonDate: row.won_date,
    imageUrl: row.image_url ?? null,
  }));
}

async function insertVaultItemToSupabase(userId, item) {
  const sb = getSupabaseAdmin();
  if (!sb || !userId) return { inserted: false, reason: 'missing_supabase_or_user' };
  const { error } = await sb.from('vault_items').insert({
    id: item.id,
    user_id: userId,
    name: item.name,
    emoji: item.emoji,
    category: item.category,
    rarity: item.rarity,
    price: item.price,
    won_date: item.wonDate,
    image_url: item.imageUrl ?? null,
    original_author: item.originalAuthor ?? null,
  });

  if (!error) return { inserted: true, reason: 'inserted' };
  if (error.code === '23505') return { inserted: false, reason: 'already_owned' };
  return { inserted: false, reason: 'vault_insert_failed' };
}

async function removeVaultItemFromSupabase(itemId) {
  const sb = getSupabaseAdmin();
  if (!sb || !itemId) return false;
  const { error } = await sb.from('vault_items').delete().eq('id', itemId);
  return !error;
}

async function deductAuraFromProfile(userId, amount) {
  const sb = getSupabaseAdmin();
  const deduction = Math.max(0, Math.abs(safeNumber(amount)));
  if (!sb || !userId) return false;
  if (deduction === 0) return true;

  const { data: profile, error: profileError } = await sb
    .from('profiles')
    .select('aura_balance')
    .eq('id', userId)
    .single();
  if (profileError) return false;

  const current = safeNumber(profile?.aura_balance, 0);
  if (current < deduction) return false;

  const newBalance = current - deduction;
  const { error } = await sb.from('profiles').update({ aura_balance: newBalance }).eq('id', userId);
  return !error;
}

async function insertVibeToSupabase(vibe) {
  const sb = getSupabaseAdmin();
  if (!sb) return { saved: false, reason: 'supabase_unavailable' };
  const endTime = vibe.endTime
    ? new Date(vibe.endTime).toISOString()
    : new Date(Date.now() + parseDurationMs(vibe.duration)).toISOString();
  const createdAt = vibe.createdAt
    ? new Date(vibe.createdAt).toISOString()
    : new Date().toISOString();

  const { error } = await sb.from('vibes').insert({
    id: vibe.id,
    slug: vibe.slug,
    name: vibe.name,
    category: vibe.category,
    emoji: vibe.emoji,
    manifesto: vibe.manifesto,
    duration: vibe.duration,
    starting_price: vibe.startingPrice,
    buy_now_price: vibe.buyNowPrice ?? null,
    image_url: vibe.imageUrl ?? null,
    is_anonymous: vibe.isAnonymous,
    author: vibe.author,
    listed_by: vibe.listedBy ?? vibe.author,
    created_at: createdAt,
    end_time: endTime,
  });
  if (error) {
    console.error('[state-db] insertVibeToSupabase failed:', error.message || error);
    return { saved: false, reason: error.message || 'insert_failed' };
  }
  return { saved: true, reason: 'inserted' };
}

// ─── File-system helpers (local fallback) ───────────────────────────────────

async function tryReadFile() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function tryWriteFile(state) {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(state, null, 2), 'utf8');
    return true;
  } catch {
    return false;
  }
}

function sanitizeState(input) {
  const defaults = createDefaultState();
  if (!input || typeof input !== 'object') return defaults;
  return {
    ...defaults,
    ...input,
    balance: safeNumber(input.balance, defaults.balance),
    activeBids: Array.isArray(input.activeBids) ? input.activeBids : defaults.activeBids,
    vaultItems: Array.isArray(input.vaultItems) ? input.vaultItems : defaults.vaultItems,
    walletLog: Array.isArray(input.walletLog) ? input.walletLog : defaults.walletLog,
    confessions: Array.isArray(input.confessions) ? input.confessions : defaults.confessions,
    mintedVibes: Array.isArray(input.mintedVibes) ? input.mintedVibes : defaults.mintedVibes,
    processedStripeSessions:
      input.processedStripeSessions && typeof input.processedStripeSessions === 'object'
        ? input.processedStripeSessions
        : defaults.processedStripeSessions,
  };
}

// ─── Core state read/write (file-based for non-vibe state) ──────────────────

async function readNonVibeState() {
  const raw = await tryReadFile();
  if (!raw) return createDefaultState();
  return sanitizeState(raw);
}

async function writeNonVibeState(state) {
  await tryWriteFile(sanitizeState(state));
}

function queueStateTask(task) {
  const run = stateQueue.then(task, task);
  stateQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

// ─── Public API ─────────────────────────────────────────────────────────────

export function getState() {
  return queueStateTask(async () => {
    const [fileState, supabaseVibes, supabaseBids] = await Promise.all([
      readNonVibeState(),
      fetchVibesFromSupabase(),
      fetchHighestBidsFromSupabase(),
    ]);

    const fileMintedVibes = Array.isArray(fileState.mintedVibes) ? fileState.mintedVibes : [];
    const mergedMintedBySlug = new Map();

    // Prefer Supabase rows as source of truth, but keep local file-only entries as fallback.
    if (Array.isArray(supabaseVibes)) {
      for (const vibe of supabaseVibes) {
        const key = normalize(vibe?.slug || vibe?.id || vibe?.name || '');
        if (!key) continue;
        mergedMintedBySlug.set(key, vibe);
      }
    }

    for (const vibe of fileMintedVibes) {
      const key = normalize(vibe?.slug || vibe?.id || vibe?.name || '');
      if (!key || mergedMintedBySlug.has(key)) continue;
      mergedMintedBySlug.set(key, vibe);
    }

    const mintedVibes = Array.from(mergedMintedBySlug.values()).sort(
      (a, b) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime(),
    );

    // Merge Supabase highest bids with file-based activeBids (Supabase wins on conflict)
    let activeBids = Array.isArray(fileState.activeBids) ? fileState.activeBids : [];
    if (supabaseBids && supabaseBids.length > 0) {
      const supabaseIds = new Set(supabaseBids.map((b) => b.id));
      const fileOnly = activeBids.filter((b) => !supabaseIds.has(normalize(b.id || b.name)));
      activeBids = [...supabaseBids, ...fileOnly];
    }

    const state = sanitizeState({ ...fileState, mintedVibes, activeBids });
    return { state };
  });
}

function updateState(mutator) {
  return queueStateTask(async () => {
    const raw = await tryReadFile();
    const current = raw ? sanitizeState(raw) : createDefaultState();
    const workingState = structuredClone(current);
    const result = (await mutator(workingState)) || {};
    const nextState = sanitizeState(result.state || workingState);
    await tryWriteFile(nextState);
    return { ...result, state: nextState };
  });
}

export async function placeBidInStore(bid, authToken) {
  const normalizedId = normalize(bid?.id || bid?.name);
  const amount = safeNumber(bid?.amount);

  // Record bid in Supabase + fire email notifications
  let bidderId = null;
  let minimumBid = null;
  let requiresAuth = false;
  let vibeRow = null;
  let listerId = null;
  let bidFailureReason = null;
  if (normalizedId && amount > 0) {
    const sb = getSupabaseAdmin();
    if (sb) {
      requiresAuth = true;
      const { data: vibeData } = await sb
        .from('vibes')
        .select('slug, emoji, listed_by, author, starting_price')
        .eq('slug', normalizedId)
        .single();
      vibeRow = vibeData ?? null;
      if (!vibeRow) {
        bidFailureReason = 'vibe_not_found';
      }

      let prevHighest = null;
      if (!bidFailureReason) {
        // Highest-bid guard: bids must strictly increase.
        const { data: prevBids } = await sb
          .from('vibe_bids')
          .select('user_id, amount')
          .eq('vibe_id', normalizedId)
          .order('amount', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(1);
        prevHighest = prevBids?.[0];
      }

      const highestAmount = safeNumber(prevHighest?.amount, 0);
      const startingPrice = safeNumber(vibeRow?.starting_price, 0);
      const minimumRequired = Math.max(1, startingPrice, highestAmount > 0 ? highestAmount + 1 : startingPrice);
      if (amount < minimumRequired) {
        minimumBid = minimumRequired;
      }

      if (authToken) {
        const { data: userData } = await sb.auth.getUser(authToken);
        bidderId = userData?.user?.id ?? null;
        if (bidderId && minimumBid === null && !bidFailureReason) {
          listerId = vibeRow?.listed_by ?? null;
          if (listerId && String(listerId) === String(bidderId)) {
            bidFailureReason = 'self_bid_blocked';
          }

          if (!bidFailureReason) {
            // Server-side balance guard prevents spoofed UI requests from overbidding available funds.
            const { data: profileData } = await sb
              .from('profiles')
              .select('aura_balance')
              .eq('id', bidderId)
              .single();
            const bidderBalance = safeNumber(profileData?.aura_balance, 0);
            if (bidderBalance < amount) {
              bidFailureReason = 'insufficient_balance';
            }
          }
        }

        if (bidderId && minimumBid === null && !bidFailureReason) {
          // Get bidder's username for display
          const { data: bidderProfile } = await sb.from('profiles').select('username').eq('id', bidderId).single();
          const bidderHandle = bidderProfile?.username ? `@${bidderProfile.username}` : null;

          // Insert new bid record
          const { error: insertError } = await sb.from('vibe_bids').insert({
            id: `bid-${normalizedId}-${Date.now()}`,
            user_id: bidderId,
            vibe_id: normalizedId,
            vibe_name: bid?.name || 'Unknown Vibe',
            amount,
          });
          if (insertError) {
            bidFailureReason = 'bid_persist_failed';
          }

          if (!bidFailureReason) {
            // Get vibe info for emails (slug, emoji, listed_by)
            const vibeSlug = vibeRow?.slug ?? normalizedId;
            const vibeEmoji = vibeRow?.emoji ?? bid?.emoji ?? '✨';

            // Fire emails non-blocking
            const emailBase = { vibeName: bid?.name || 'Unknown Vibe', vibeEmoji, vibeSlug };

            // Outbid email — only if prev highest bidder exists and isn't the same person
            if (prevHighest?.user_id && prevHighest.user_id !== bidderId) {
              sendOutbidEmail({ toUserId: prevHighest.user_id, ...emailBase, newAmount: amount }).catch(() => {});
            }

            // New bid on your vibe — notify the lister (if different from bidder)
            if (listerId && listerId !== bidderId) {
              sendNewBidOnYourVibeEmail({ toUserId: listerId, ...emailBase, bidAmount: amount, bidderHandle }).catch(() => {});
            }
          }
        }
      }
    }
  }

  return updateState((state) => {
    if (!normalizedId || amount <= 0) return { state, accepted: false };
    if (requiresAuth && !bidderId) {
      return { state, accepted: false, reason: 'auth_required' };
    }
    if (bidFailureReason) {
      return { state, accepted: false, reason: bidFailureReason };
    }

    const existingIndex = state.activeBids.findIndex(
      (entry) => normalize(entry.id || entry.name) === normalizedId,
    );
    const localHighest = existingIndex >= 0 ? safeNumber(state.activeBids[existingIndex]?.amount, 0) : 0;
    const serverHighest = minimumBid ? minimumBid - 1 : 0;
    const highestBid = Math.max(localHighest, serverHighest);

    if (amount <= highestBid) {
      return {
        state,
        accepted: false,
        reason: 'bid_too_low',
        minimumBid: highestBid + 1,
      };
    }

    const nextEntry = {
      id: normalizedId,
      emoji: bid?.emoji || '✨',
      name: bid?.name || 'Unknown Vibe',
      amount,
      status: 'HIGHEST',
      updatedAt: Date.now(),
    };

    if (existingIndex === -1) {
      state.activeBids = [nextEntry, ...state.activeBids];
    } else {
      state.activeBids[existingIndex] = { ...state.activeBids[existingIndex], ...nextEntry };
    }

    return { state, accepted: true };
  });
}

export async function settleAuctionInStore(item, authToken) {
  const normalizedId = normalize(item?.id || item?.name);
  if (!normalizedId) return { settled: false };
  const isDirectPurchase = item?.directPurchase === true;
  const sb = getSupabaseAdmin();
  const supabaseEnabled = Boolean(sb);

  const now = Date.now();
  const wonDate = item?.wonDate || formatWonDate(new Date(now));
  const rarity = item?.rarity || 'epic';
  let settlementPrice = safeNumber(item?.price);
  let vibeName = item?.name || 'Unknown Vibe';
  let vibeEmoji = item?.emoji || '✨';
  let vibeCategory = item?.category || 'Social';
  let vibeImageUrl = item?.imageUrl ?? null;
  let vibeAuthor = item?.author ?? null;
  let winningBidTimeIso = new Date(now).toISOString();

  // If logged-in user: persist to Supabase
  let userId = null;
  if (authToken && sb) {
    const { data } = await sb.auth.getUser(authToken);
    userId = data?.user?.id ?? null;
  }

  // When Supabase is configured, settlement must be authenticated to prevent anonymous claims.
  if (supabaseEnabled && !userId) {
    return { settled: false, reason: 'auth_required' };
  }

  if (userId) {
    let topBidAmount = null;
    // For auction claims (not instant buy-now), only the current highest bidder can settle.
    if (sb) {
      const { data: vibeData } = await sb
        .from('vibes')
        .select('name, emoji, category, image_url, author, buy_now_price, end_time')
        .eq('slug', normalizedId)
        .single();
      const vibeRow = vibeData ?? null;

      if (vibeRow?.name) vibeName = vibeRow.name;
      if (vibeRow?.emoji) vibeEmoji = vibeRow.emoji;
      if (vibeRow?.category) vibeCategory = vibeRow.category;
      if (vibeRow?.image_url) vibeImageUrl = vibeRow.image_url;
      if (vibeRow?.author) vibeAuthor = vibeRow.author;

      if (isDirectPurchase) {
        const buyNowAmount = safeNumber(vibeRow?.buy_now_price, 0);
        if (buyNowAmount <= 0) {
          return { settled: false, reason: 'buy_now_unavailable' };
        }
        settlementPrice = buyNowAmount;
      } else {
        // If we have an end_time in DB, enforce that claims can only happen after auction end.
        if (vibeRow?.end_time) {
          const endTimestamp = new Date(vibeRow.end_time).getTime();
          if (Number.isFinite(endTimestamp) && endTimestamp > now) {
            return { settled: false, reason: 'auction_not_ended' };
          }
        }
      }
    }

    if (!isDirectPurchase && sb) {
      if (sb) {
        const { data: topBids } = await sb
          .from('vibe_bids')
          .select('user_id, amount, created_at')
          .eq('vibe_id', normalizedId)
          .order('amount', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(1);

        const highestBidderId = topBids?.[0]?.user_id ?? null;
        if (!highestBidderId) {
          return { settled: false, reason: 'no_winning_bid' };
        }
        if (highestBidderId !== userId) {
          return { settled: false, reason: 'not_highest_bidder' };
        }
        topBidAmount = safeNumber(topBids?.[0]?.amount, 0);
        if (topBids?.[0]?.created_at) {
          winningBidTimeIso = new Date(topBids[0].created_at).toISOString();
        }
      }
      settlementPrice = topBidAmount > 0 ? topBidAmount : settlementPrice;
    }

    const vaultItem = {
      id: `vault-${normalizedId}`,
      name: vibeName,
      emoji: vibeEmoji,
      category: vibeCategory,
      rarity,
      wonDate,
      price: settlementPrice,
      imageUrl: vibeImageUrl,
      originalAuthor: vibeAuthor ?? null,
    };

    if (settlementPrice <= 0) {
      return { settled: false, reason: 'invalid_settlement_amount' };
    }

    // Balance guard: never allow settling a paid auction without enough AURA.
    if (settlementPrice > 0) {
      if (sb) {
        const { data: profile } = await sb
          .from('profiles')
          .select('aura_balance')
          .eq('id', userId)
          .single();
        const currentBalance = safeNumber(profile?.aura_balance, 0);
        if (currentBalance < Math.abs(settlementPrice)) {
          return { settled: false, reason: 'insufficient_balance' };
        }
      }
    }

    const insertResult = await insertVaultItemToSupabase(userId, vaultItem);
    if (!insertResult.inserted) {
      return { settled: false, reason: insertResult.reason || 'vault_insert_failed' };
    }

    const deducted = await deductAuraFromProfile(userId, settlementPrice);
    if (!deducted) {
      // Best-effort rollback to avoid keeping ownership without payment.
      await removeVaultItemFromSupabase(vaultItem.id);
      return { settled: false, reason: 'balance_update_failed' };
    }

    // Send "you won" email non-blocking
    sendAuctionWonEmail({
      toUserId: userId,
      vibeName,
      vibeEmoji,
      vibeSlug: normalizedId,
      finalAmount: settlementPrice,
    }).catch(() => {});

    // Predictions are side-game only: never block settlement if scoring fails.
    try {
      await resolvePredictionsForAuction({
        vibeId: normalizedId,
        finalPrice: settlementPrice,
        actualWinnerTime: winningBidTimeIso,
      });
    } catch {
      // Ignore prediction scoring failures.
    }

    // Remove from active bids in file state too
    return updateState((state) => {
      state.activeBids = state.activeBids.filter(
        (entry) => normalize(entry.id || entry.name) !== normalizedId,
      );
      return { state, settled: true };
    });
  }

  // Anonymous fallback: file-based state only (ephemeral on Vercel)
  const vaultItem = {
    id: `vault-${normalizedId}`,
    name: vibeName,
    emoji: vibeEmoji,
    category: vibeCategory,
    rarity,
    wonDate,
    price: settlementPrice,
    imageUrl: vibeImageUrl,
    originalAuthor: vibeAuthor ?? null,
  };
  return updateState((state) => {
    const alreadyOwned = state.vaultItems.some(
      (v) => normalize(v.id || v.name) === normalizedId,
    );
    if (alreadyOwned) return { state, settled: false };

    const spend = Math.abs(settlementPrice);
    const currentBalance = safeNumber(state.balance);
    if (spend > 0 && currentBalance < spend) {
      return { state, settled: false, reason: 'insufficient_balance' };
    }

    const nextWalletEntry = {
      id: `tx-won-${normalizedId}-${now}`,
      label: `WON: "${vaultItem.name}"`,
      amount: -Math.abs(settlementPrice),
      createdAt: now,
    };

    state.balance = currentBalance - spend;
    state.vaultItems = [vaultItem, ...state.vaultItems];
    state.activeBids = state.activeBids.filter(
      (entry) => normalize(entry.id || entry.name) !== normalizedId,
    );
    state.walletLog = [nextWalletEntry, ...state.walletLog];

    return { state, settled: true };
  });
}

export function mintConfessionInStore(payload) {
  return updateState((state) => {
    const confession = safeText(payload?.confession || payload?.text);
    if (!confession) return { state, mintedConfession: null };

    const titleInput = safeText(payload?.title);
    const isAnonymous = payload?.isAnonymous !== false;
    const alias = safeText(payload?.alias || payload?.author);
    const now = Date.now();
    const derivedTitle = confession.split(/\s+/).slice(0, 6).join(' ');
    const title = titleInput || derivedTitle || 'Untitled Confession';
    const normalizedId = normalize(`${title}-${now}`) || `confession-${now}`;
    const author = isAnonymous ? 'Anonymous' : alias || '@VibeMinter';

    const mintedConfession = {
      id: `conf-${normalizedId}`,
      title,
      confession,
      isAnonymous,
      author,
      createdAt: now,
    };

    state.confessions = [mintedConfession, ...state.confessions].slice(0, 100);
    return { state, mintedConfession };
  });
}

export async function mintVibeInStore(payload, authToken = null) {
  const nameInput = safeText(payload?.name || payload?.title, 100);
  const category = safeText(payload?.category, 50) || 'Feelings';
  const emoji = safeText(payload?.emoji, 10) || '✨';
  const manifesto = safeText(payload?.manifesto || payload?.description || payload?.details, 2000);
  const duration = safeText(payload?.duration, 50) || '24 Hours';
  const startingPrice = Math.max(0, safeNumber(payload?.startingPrice || payload?.price));
  const rawBuyNow = safeNumber(payload?.buyNowPrice);
  const buyNowPrice = rawBuyNow > 0 ? rawBuyNow : null;
  const now = Date.now();
  const name = nameInput || 'Untitled Vibe';
  const normalizedId = normalize(`${name}-${category}-${now}`) || `vibe-${now}`;
  const sb = getSupabaseAdmin();

  let author = safeText(payload?.author || payload?.alias) || null;
  let listedBy = safeText(payload?.listedBy || payload?.author || payload?.alias) || null;
  if (sb) {
    const token = safeText(authToken);
    if (!token) {
      const { state } = await getState();
      return { state, mintedVibe: null, reason: 'auth_required' };
    }

    const { data: userData } = await sb.auth.getUser(token);
    const userId = userData?.user?.id ?? null;
    if (!userId) {
      const { state } = await getState();
      return { state, mintedVibe: null, reason: 'auth_required' };
    }

    listedBy = userId;
    const { data: profileData } = await sb
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .single();
    if (profileData?.username) {
      author = profileData.username;
    }
  }

  // Generate AI image (non-blocking — null if key missing or call fails)
  const imageUrl = await generateVibeImage({ name, category, manifesto });

  const mintedVibe = {
    id: `mint-${normalizedId}`,
    slug: normalizedId,
    name,
    category,
    emoji,
    manifesto,
    duration,
    startingPrice,
    buyNowPrice,
    imageUrl,
    isAnonymous: payload?.isAnonymous === true,
    author,
    listedBy,
    createdAt: now,
  };

  // Write to Supabase (primary on Vercel)
  const saveResult = await insertVibeToSupabase(mintedVibe);
  const savedToSupabase = Boolean(saveResult?.saved);

  // Also try writing to file (works locally, silently fails on Vercel)
  const fileState = (await tryReadFile()) || createDefaultState();
  const sanitized = sanitizeState(fileState);
  sanitized.mintedVibes = [mintedVibe, ...sanitized.mintedVibes].slice(0, 100);
  await tryWriteFile(sanitized);

  // Return state with the new vibe included
  const mintedVibes = savedToSupabase
    ? await fetchVibesFromSupabase().then((v) => v || sanitized.mintedVibes)
    : sanitized.mintedVibes;

  const state = sanitizeState({ ...sanitized, mintedVibes });

  // Send "vibe listed" confirmation email non-blocking
  if (authToken) {
    const sb = getSupabaseAdmin();
    if (sb) {
      sb.auth.getUser(authToken).then(({ data }) => {
        const userId = data?.user?.id;
        if (userId) {
          sendVibeListedEmail({
            toUserId: userId,
            vibeName: mintedVibe.name,
            vibeEmoji: mintedVibe.emoji,
            vibeSlug: mintedVibe.slug,
            startingPrice: mintedVibe.startingPrice,
          }).catch(() => {});
        }
      }).catch(() => {});
    }
  }

  return { state, mintedVibe, savedToSupabase, saveReason: saveResult?.reason || null };
}

export async function getMintedVibeBySlug(slug) {
  // Try Supabase first
  const fromSupabase = await fetchVibeBySlugFromSupabase(slug);
  if (fromSupabase) return fromSupabase;

  // Fall back to file
  const { state } = await getState();
  return (state.mintedVibes ?? []).find((v) => v.slug === slug) ?? null;
}

export function applyStripeCreditInStore({ sessionId, auraAmount, label, markProfileCredited = false }) {
  return updateState((state) => {
    const cleanSessionId = safeText(sessionId);
    const amount = Math.max(0, safeNumber(auraAmount));

    if (!cleanSessionId || amount <= 0) return { state, credited: false, reason: 'invalid_payload' };

    if (!state.processedStripeSessions || typeof state.processedStripeSessions !== 'object') {
      state.processedStripeSessions = {};
    }

    const existingSession = state.processedStripeSessions[cleanSessionId];
    if (existingSession) {
      if (markProfileCredited && existingSession.profileCredited !== true) {
        state.processedStripeSessions[cleanSessionId] = {
          ...existingSession,
          profileCredited: true,
        };
        return {
          state,
          credited: false,
          reason: 'profile_credit_marked',
          session: state.processedStripeSessions[cleanSessionId],
        };
      }

      return {
        state,
        credited: false,
        reason: 'already_processed',
        session: existingSession,
      };
    }

    const now = Date.now();
    const walletEntry = {
      id: `tx-stripe-${cleanSessionId}`,
      label: safeText(label) || 'Stripe Top Up',
      amount,
      createdAt: now,
    };

    state.balance = safeNumber(state.balance) + amount;
    state.walletLog = [walletEntry, ...state.walletLog];
    const session = { auraAmount: amount, creditedAt: now, profileCredited: markProfileCredited === true };
    state.processedStripeSessions[cleanSessionId] = session;

    return { state, credited: true, reason: 'credited', session };
  });
}
