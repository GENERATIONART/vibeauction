import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { createDefaultState } from '../default-store.js';
import { generateVibeImage } from './generate-image.js';

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

const formatWonDate = (date) => {
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'short' });
  return `${day} ${month}`;
};

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
  if (!sb || !vibeId) return [];
  const { data, error } = await sb
    .from('vibe_bids')
    .select('amount, user_id, created_at')
    .eq('vibe_id', vibeId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error || !data) return [];

  // Resolve usernames for bidders
  const userIds = [...new Set(data.map((r) => r.user_id).filter(Boolean))];
  let usernameMap = {};
  if (userIds.length > 0) {
    const { data: profiles } = await sb
      .from('profiles')
      .select('id, username')
      .in('id', userIds);
    for (const p of profiles || []) usernameMap[p.id] = p.username;
  }

  return data.map((row) => ({
    id: `${row.user_id}-${row.created_at}`,
    user: usernameMap[row.user_id] ? `@${usernameMap[row.user_id]}` : 'Anonymous',
    amount: row.amount,
    time: new Date(row.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  }));
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
  if (!sb || !userId) return false;
  const { error } = await sb.from('vault_items').upsert({
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
  }, { onConflict: 'id', ignoreDuplicates: true });
  return !error;
}

async function deductAuraFromProfile(userId, amount) {
  const sb = getSupabaseAdmin();
  if (!sb || !userId) return false;
  const { data: profile } = await sb.from('profiles').select('aura_balance').eq('id', userId).single();
  const current = profile?.aura_balance ?? 0;
  const newBalance = Math.max(0, current - Math.abs(amount));
  const { error } = await sb.from('profiles').update({ aura_balance: newBalance }).eq('id', userId);
  return !error;
}

async function insertVibeToSupabase(vibe) {
  const sb = getSupabaseAdmin();
  if (!sb) return false;
  const endTime = vibe.endTime
    ? new Date(vibe.endTime).toISOString()
    : new Date(Date.now() + parseDurationMs(vibe.duration)).toISOString();

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
    created_at: vibe.createdAt,
    end_time: endTime,
  });
  return !error;
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
  return sanitizeState({ ...raw, mintedVibes: [] });
}

async function writeNonVibeState(state) {
  await tryWriteFile({ ...state, mintedVibes: [] });
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

    // Use Supabase vibes if available, otherwise fall back to file
    const mintedVibes =
      supabaseVibes !== null
        ? supabaseVibes
        : (Array.isArray(fileState.mintedVibes) ? fileState.mintedVibes : []);

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

  // Record bid in Supabase for leaderboard tracking
  if (normalizedId && amount > 0 && authToken) {
    const sb = getSupabaseAdmin();
    if (sb) {
      const { data: userData } = await sb.auth.getUser(authToken);
      const userId = userData?.user?.id ?? null;
      if (userId) {
        await sb.from('vibe_bids').insert({
          id: `bid-${normalizedId}-${Date.now()}`,
          user_id: userId,
          vibe_id: normalizedId,
          vibe_name: bid?.name || 'Unknown Vibe',
          amount,
        });
      }
    }
  }

  return updateState((state) => {
    if (!normalizedId || amount <= 0) return { state, accepted: false };

    const existingIndex = state.activeBids.findIndex(
      (entry) => normalize(entry.id || entry.name) === normalizedId,
    );

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

  const price = safeNumber(item?.price);
  const now = Date.now();
  const wonDate = item?.wonDate || formatWonDate(new Date(now));
  const category = item?.category || 'Social';
  const rarity = item?.rarity || 'epic';

  const vaultItem = {
    id: `vault-${normalizedId}`,
    name: item?.name || 'Unknown Vibe',
    emoji: item?.emoji || '✨',
    category,
    rarity,
    wonDate,
    price,
    imageUrl: item?.imageUrl ?? null,
    originalAuthor: item?.author ?? null,
  };

  // If logged-in user: persist to Supabase
  let userId = null;
  if (authToken) {
    const sb = getSupabaseAdmin();
    if (sb) {
      const { data, error: authError } = await sb.auth.getUser(authToken);
      userId = data?.user?.id ?? null;
      if (authError) console.error('[settle] getUser error:', authError.message);
      console.log('[settle] resolved userId:', userId);
    } else {
      console.warn('[settle] no supabase admin client — check env vars');
    }
  } else {
    console.log('[settle] no auth token — anonymous fallback');
  }

  if (userId) {
    const inserted = await insertVaultItemToSupabase(userId, vaultItem);
    console.log('[settle] vault insert result:', inserted, 'item id:', vaultItem.id);
    await deductAuraFromProfile(userId, price);
    // Remove from active bids in file state too
    return updateState((state) => {
      state.activeBids = state.activeBids.filter(
        (entry) => normalize(entry.id || entry.name) !== normalizedId,
      );
      return { state, settled: true };
    });
  }

  // Anonymous fallback: file-based state only (ephemeral on Vercel)
  return updateState((state) => {
    const alreadyOwned = state.vaultItems.some(
      (v) => normalize(v.id || v.name) === normalizedId,
    );
    if (alreadyOwned) return { state, settled: false };

    const nextWalletEntry = {
      id: `tx-won-${normalizedId}-${now}`,
      label: `WON: "${vaultItem.name}"`,
      amount: -Math.abs(price),
      createdAt: now,
    };

    state.balance = safeNumber(state.balance) - Math.abs(price);
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

export async function mintVibeInStore(payload) {
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
    author: safeText(payload?.author || payload?.alias) || null,
    listedBy: safeText(payload?.listedBy || payload?.author || payload?.alias) || null,
    createdAt: now,
  };

  // Write to Supabase (primary on Vercel)
  const savedToSupabase = await insertVibeToSupabase(mintedVibe);

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
  return { state, mintedVibe };
}

export async function getMintedVibeBySlug(slug) {
  // Try Supabase first
  const fromSupabase = await fetchVibeBySlugFromSupabase(slug);
  if (fromSupabase) return fromSupabase;

  // Fall back to file
  const { state } = await getState();
  return (state.mintedVibes ?? []).find((v) => v.slug === slug) ?? null;
}

export function applyStripeCreditInStore({ sessionId, auraAmount, label }) {
  return updateState((state) => {
    const cleanSessionId = safeText(sessionId);
    const amount = Math.max(0, safeNumber(auraAmount));

    if (!cleanSessionId || amount <= 0) return { state, credited: false, reason: 'invalid_payload' };

    if (!state.processedStripeSessions || typeof state.processedStripeSessions !== 'object') {
      state.processedStripeSessions = {};
    }

    if (state.processedStripeSessions[cleanSessionId]) {
      return { state, credited: false, reason: 'already_processed' };
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
    state.processedStripeSessions[cleanSessionId] = { auraAmount: amount, creditedAt: now };

    return { state, credited: true, reason: 'credited' };
  });
}
