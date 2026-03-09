import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { createDefaultState } from '../default-store.js';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'vibe-store.json');

let stateQueue = Promise.resolve();

const normalize = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const safeText = (value) => (typeof value === 'string' ? value.trim() : '');

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
    isAnonymous: row.is_anonymous,
    author: row.author,
    createdAt: row.created_at,
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
    isAnonymous: data.is_anonymous,
    author: data.author,
    createdAt: data.created_at,
  };
}

async function insertVibeToSupabase(vibe) {
  const sb = getSupabaseAdmin();
  if (!sb) return false;
  const { error } = await sb.from('vibes').insert({
    id: vibe.id,
    slug: vibe.slug,
    name: vibe.name,
    category: vibe.category,
    emoji: vibe.emoji,
    manifesto: vibe.manifesto,
    duration: vibe.duration,
    starting_price: vibe.startingPrice,
    is_anonymous: vibe.isAnonymous,
    author: vibe.author,
    created_at: vibe.createdAt,
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
    const [fileState, supabaseVibes] = await Promise.all([
      readNonVibeState(),
      fetchVibesFromSupabase(),
    ]);

    // Use Supabase vibes if available, otherwise fall back to file
    const mintedVibes =
      supabaseVibes !== null
        ? supabaseVibes
        : (Array.isArray(fileState.mintedVibes) ? fileState.mintedVibes : []);

    const state = sanitizeState({ ...fileState, mintedVibes });
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

export function placeBidInStore(bid) {
  return updateState((state) => {
    const normalizedId = normalize(bid?.id || bid?.name);
    const amount = safeNumber(bid?.amount);
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

export function settleAuctionInStore(item) {
  return updateState((state) => {
    const normalizedId = normalize(item?.id || item?.name);
    if (!normalizedId) return { state, settled: false };

    const alreadyOwned = state.vaultItems.some(
      (vaultItem) => normalize(vaultItem.id || vaultItem.name) === normalizedId,
    );
    if (alreadyOwned) return { state, settled: false };

    const price = safeNumber(item?.price);
    const now = Date.now();
    const wonDate = item?.wonDate || formatWonDate(new Date(now));
    const category = item?.category || 'Social';
    const rarity = item?.rarity || 'epic';

    const nextVaultItem = {
      id: normalizedId,
      emoji: item?.emoji || '✨',
      name: item?.name || 'Unknown Vibe',
      rarity,
      category,
      wonDate,
      price,
    };

    const nextWalletEntry = {
      id: `tx-won-${normalizedId}-${now}`,
      label: `WON: "${nextVaultItem.name}"`,
      amount: -Math.abs(price),
      createdAt: now,
    };

    state.balance = safeNumber(state.balance) - Math.abs(price);
    state.vaultItems = [nextVaultItem, ...state.vaultItems];
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
  const nameInput = safeText(payload?.name || payload?.title);
  const category = safeText(payload?.category) || 'Feelings';
  const emoji = safeText(payload?.emoji) || '✨';
  const manifesto = safeText(payload?.manifesto || payload?.description || payload?.details);
  const duration = safeText(payload?.duration) || '24 Hours';
  const startingPrice = Math.max(0, safeNumber(payload?.startingPrice || payload?.price));
  const now = Date.now();
  const name = nameInput || 'Untitled Vibe';
  const normalizedId = normalize(`${name}-${category}-${now}`) || `vibe-${now}`;

  const mintedVibe = {
    id: `mint-${normalizedId}`,
    slug: normalizedId,
    name,
    category,
    emoji,
    manifesto,
    duration,
    startingPrice,
    isAnonymous: payload?.isAnonymous === true,
    author: safeText(payload?.author || payload?.alias) || null,
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
