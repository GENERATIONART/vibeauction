import fs from 'node:fs/promises';
import path from 'node:path';
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

async function ensureDataFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(DATA_FILE);
  } catch {
    const initialState = createDefaultState();
    await fs.writeFile(DATA_FILE, JSON.stringify(initialState, null, 2), 'utf8');
  }
}

function sanitizeState(input) {
  const defaults = createDefaultState();

  if (!input || typeof input !== 'object') {
    return defaults;
  }

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

async function readStateFromDisk() {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, 'utf8');

  try {
    const parsed = JSON.parse(raw);
    return sanitizeState(parsed);
  } catch {
    const reset = createDefaultState();
    await fs.writeFile(DATA_FILE, JSON.stringify(reset, null, 2), 'utf8');
    return reset;
  }
}

async function writeStateToDisk(nextState) {
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(nextState, null, 2), 'utf8');
}

function queueStateTask(task) {
  const run = stateQueue.then(task, task);
  stateQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export function getState() {
  return queueStateTask(async () => {
    const state = await readStateFromDisk();
    return { state };
  });
}

function updateState(mutator) {
  return queueStateTask(async () => {
    const state = await readStateFromDisk();
    const workingState = structuredClone(state);
    const result = (await mutator(workingState)) || {};
    const nextState = sanitizeState(result.state || workingState);
    await writeStateToDisk(nextState);
    return {
      ...result,
      state: nextState,
    };
  });
}

export function placeBidInStore(bid) {
  return updateState((state) => {
    const normalizedId = normalize(bid?.id || bid?.name);
    const amount = safeNumber(bid?.amount);
    if (!normalizedId || amount <= 0) {
      return { state, accepted: false };
    }

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
      state.activeBids[existingIndex] = {
        ...state.activeBids[existingIndex],
        ...nextEntry,
      };
    }

    return { state, accepted: true };
  });
}

export function settleAuctionInStore(item) {
  return updateState((state) => {
    const normalizedId = normalize(item?.id || item?.name);
    if (!normalizedId) {
      return { state, settled: false };
    }

    const alreadyOwned = state.vaultItems.some(
      (vaultItem) => normalize(vaultItem.id || vaultItem.name) === normalizedId,
    );

    if (alreadyOwned) {
      return { state, settled: false };
    }

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
    if (!confession) {
      return { state, mintedConfession: null };
    }

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

export function mintVibeInStore(payload) {
  return updateState((state) => {
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

    state.mintedVibes = [mintedVibe, ...state.mintedVibes].slice(0, 100);

    return { state, mintedVibe };
  });
}

export function applyStripeCreditInStore({ sessionId, auraAmount, label }) {
  return updateState((state) => {
    const cleanSessionId = safeText(sessionId);
    const amount = Math.max(0, safeNumber(auraAmount));

    if (!cleanSessionId || amount <= 0) {
      return { state, credited: false, reason: 'invalid_payload' };
    }

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
    state.processedStripeSessions[cleanSessionId] = {
      auraAmount: amount,
      creditedAt: now,
    };

    return { state, credited: true, reason: 'credited' };
  });
}
