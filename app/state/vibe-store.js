'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createDefaultState } from '../../lib/default-store.js';
import { useAuth } from './auth-store.js';
import { getSupabaseClient } from '../../lib/supabase-client.js';

const VibeStoreContext = createContext(null);

const safeNumber = (value, fallback = 0) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/,/g, '').trim());
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

const normalizeKey = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const toTimestampMs = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric;
    const parsed = new Date(value).getTime();
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
};

const toExpiryMs = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    if (value > 1e12) return value; // already ms
    if (value > 1e9) return value * 1000; // epoch seconds
    return 0;
  }
  if (typeof value === 'string') {
    const numeric = Number(value.trim());
    if (Number.isFinite(numeric)) return toExpiryMs(numeric);
    const parsed = new Date(value).getTime();
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
};

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

async function apiRequest(url, options = {}) {
  const method = options.method || 'GET';
  const hasBody = options.body !== undefined;
  const response = await fetch(url, {
    method,
    cache: method === 'GET' ? 'no-store' : undefined,
    headers: { ...(hasBody ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) },
    body: hasBody ? JSON.stringify(options.body) : undefined,
  });

  let payload = {};
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }

  if (!response.ok) {
    const reason = payload?.error || `Request failed (${response.status})`;
    throw new Error(reason);
  }

  return payload;
}

const mapVaultRow = (row) => ({
  id: row.id,
  name: row.name,
  emoji: row.emoji || null,
  category: row.category || 'Vibes',
  rarity: row.rarity || 'common',
  price: row.price || 0,
  wonDate: row.won_date,
  imageUrl: row.image_url ?? null,
  originalAuthor: row.original_author ?? null,
});

const mapSupabaseVibeRow = (row) => ({
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
});

const mergeMintedVibes = (baseList, supabaseList) => {
  const mergedByKey = new Map();

  for (const vibe of Array.isArray(supabaseList) ? supabaseList : []) {
    const key = normalizeKey(vibe?.slug || vibe?.id || vibe?.name || '');
    if (!key) continue;
    mergedByKey.set(key, vibe);
  }

  for (const vibe of Array.isArray(baseList) ? baseList : []) {
    const key = normalizeKey(vibe?.slug || vibe?.id || vibe?.name || '');
    if (!key || mergedByKey.has(key)) continue;
    mergedByKey.set(key, vibe);
  }

  return Array.from(mergedByKey.values()).sort((a, b) => toTimestampMs(b?.createdAt) - toTimestampMs(a?.createdAt));
};

const getMintFailureMessage = (reason) => {
  const normalized = String(reason || '').toLowerCase();
  if (!normalized) return 'Listing failed. Please try again.';
  if (normalized === 'auth_required') return 'Could not verify your sign-in. Refresh and try again.';
  if (normalized === 'auth_invalid_token') return 'Could not verify your sign-in. Refresh and try again. If it keeps failing, sign in again.';
  if (normalized === 'auth_lookup_failed') return 'Sign-in check is temporarily unavailable. Please retry in a moment.';
  if (normalized === 'supabase_unavailable') return 'Minting backend is unavailable. Please try again shortly.';
  if (normalized.includes('jwt') || normalized.includes('token')) {
    return 'Could not verify your sign-in. Refresh and retry. If needed, sign in again.';
  }
  if (normalized.includes('row-level security') || normalized.includes('rls')) {
    return 'Mint permission check failed. Please sign out, sign in again, and retry.';
  }
  if (normalized.includes('insert')) return 'Could not save vibe. Please try again.';
  if (normalized.includes('timeout')) return 'Mint request timed out. Please retry.';
  return `Listing failed (${reason}).`;
};

export function VibeStoreProvider({ children }) {
  const { profile, user, refreshProfile } = useAuth();
  const [store, setStore] = useState(() => createDefaultState());
  const [isHydrating, setIsHydrating] = useState(true);
  const [error, setError] = useState('');
  const [supabaseVaultItems, setSupabaseVaultItems] = useState(null);
  const mintedCacheRef = useRef({ fetchedAt: 0, vibes: null });
  const bidsCacheRef = useRef({ fetchedAt: 0, bids: null });

  const applyState = useCallback((nextState) => {
    setStore(sanitizeState(nextState));
  }, []);

  const fetchMintedVibesFromClientSupabase = useCallback(async ({ force = false } = {}) => {
    const sb = getSupabaseClient();
    if (!sb) return null;

    const now = Date.now();
    const cache = mintedCacheRef.current;
    if (!force && Array.isArray(cache?.vibes) && now - safeNumber(cache?.fetchedAt, 0) < 15000) {
      return cache.vibes;
    }

    const { data, error: fetchError } = await sb.from('vibes').select('*').order('created_at', { ascending: false }).limit(200);
    if (fetchError || !Array.isArray(data)) {
      return Array.isArray(cache?.vibes) ? cache.vibes : null;
    }

    const mapped = data.map(mapSupabaseVibeRow);
    mintedCacheRef.current = { fetchedAt: now, vibes: mapped };
    return mapped;
  }, []);

  const fetchHighestBidsFromClientSupabase = useCallback(async ({ force = false } = {}) => {
    const sb = getSupabaseClient();
    if (!sb) return null;

    const now = Date.now();
    const cache = bidsCacheRef.current;
    if (!force && Array.isArray(cache?.bids) && now - safeNumber(cache?.fetchedAt, 0) < 4000) {
      return cache.bids;
    }

    const { data, error: fetchError } = await sb
      .from('vibe_bids')
      .select('vibe_id, vibe_name, amount, created_at')
      .order('created_at', { ascending: false })
      .limit(500);

    if (fetchError || !Array.isArray(data)) {
      return Array.isArray(cache?.bids) ? cache.bids : null;
    }

    const highestByVibe = new Map();
    for (const row of data) {
      const key = normalizeKey(row?.vibe_id);
      if (!key || highestByVibe.has(key)) continue;
      highestByVibe.set(key, {
        id: row.vibe_id,
        name: row.vibe_name,
        amount: row.amount,
        status: 'HIGHEST',
        updatedAt: row.created_at,
      });
    }

    const mapped = Array.from(highestByVibe.values());
    bidsCacheRef.current = { fetchedAt: now, bids: mapped };
    return mapped;
  }, []);

  const hydrateStateWithClientVibes = useCallback(
    async (nextState, { force = false } = {}) => {
      const [supabaseMintedVibes, supabaseHighestBids] = await Promise.all([
        fetchMintedVibesFromClientSupabase({ force }),
        fetchHighestBidsFromClientSupabase({ force }),
      ]);

      const mergedMintedVibes =
        Array.isArray(supabaseMintedVibes) && supabaseMintedVibes.length > 0
          ? mergeMintedVibes(nextState?.mintedVibes, supabaseMintedVibes)
          : nextState?.mintedVibes;

      let mergedActiveBids = nextState?.activeBids;
      if (Array.isArray(supabaseHighestBids) && supabaseHighestBids.length > 0) {
        const byId = new Map();
        for (const bid of supabaseHighestBids) {
          const key = normalizeKey(bid?.id || bid?.name);
          if (!key || byId.has(key)) continue;
          byId.set(key, bid);
        }
        for (const bid of Array.isArray(nextState?.activeBids) ? nextState.activeBids : []) {
          const key = normalizeKey(bid?.id || bid?.name);
          if (!key || byId.has(key)) continue;
          byId.set(key, bid);
        }
        mergedActiveBids = Array.from(byId.values());
      }

      return sanitizeState({
        ...nextState,
        mintedVibes: mergedMintedVibes,
        activeBids: mergedActiveBids,
      });
    },
    [fetchMintedVibesFromClientSupabase, fetchHighestBidsFromClientSupabase],
  );

  const getAccessToken = useCallback(async ({ forceRefresh = false } = {}) => {
    const sb = getSupabaseClient();
    if (!sb) return null;

    let session = null;
    try {
      const { data: sessionData } = await sb.auth.getSession();
      session = sessionData?.session ?? null;
    } catch {
      session = null;
    }

    let token = session?.access_token ?? null;
    const fallbackToken = token;
    const now = Date.now();
    const expiresAtMs = toExpiryMs(session?.expires_at);
    const canReuseCurrentToken = Boolean(token) && (expiresAtMs === 0 || expiresAtMs > now - 30000);
    const needsRefresh = forceRefresh || !token || (expiresAtMs > 0 && expiresAtMs - now < 30000);

    if (needsRefresh) {
      try {
        const { data: refreshed } = await sb.auth.refreshSession();
        token = refreshed?.session?.access_token ?? null;
        if (token) return token;
      } catch {
        // Keep a still-usable token when refresh fails due transient network/auth service errors.
        return canReuseCurrentToken ? fallbackToken : null;
      }
    }

    return canReuseCurrentToken ? fallbackToken : null;
  }, []);

  useEffect(() => {
    if (!user) {
      setSupabaseVaultItems(null);
      return;
    }
    const sb = getSupabaseClient();
    if (!sb) return;
    sb.from('vault_items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setSupabaseVaultItems(data.map(mapVaultRow));
      });
  }, [user]);

  const refreshState = useCallback(async () => {
    const data = await apiRequest('/api/state');
    const merged = await hydrateStateWithClientVibes(data.state);
    applyState(merged);
    return merged;
  }, [applyState, hydrateStateWithClientVibes]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setIsHydrating(true);
        const data = await apiRequest('/api/state');
        const merged = await hydrateStateWithClientVibes(data.state);
        if (!cancelled) {
          applyState(merged);
          setError('');
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load state');
          setStore((previous) => sanitizeState(previous));
        }
      } finally {
        if (!cancelled) {
          setIsHydrating(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [applyState, hydrateStateWithClientVibes]);

  const placeBid = useCallback(
    async (bid) => {
      try {
        const token = await getAccessToken();
        const data = await apiRequest('/api/state/place-bid', {
          method: 'POST',
          body: { bid },
          ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
        });
        const merged = await hydrateStateWithClientVibes(data.state);
        applyState(merged);
        setError('');
        return {
          accepted: Boolean(data.accepted),
          reason: data.reason || null,
          minimumBid: Number.isFinite(Number(data.minimumBid)) ? Number(data.minimumBid) : null,
        };
      } catch (placeError) {
        setError(placeError instanceof Error ? placeError.message : 'Failed to place bid');
        return {
          accepted: false,
          reason: 'request_failed',
          minimumBid: null,
        };
      }
    },
    [applyState, hydrateStateWithClientVibes, getAccessToken],
  );

  const settleAuction = useCallback(
    async (item) => {
      try {
        const sb = getSupabaseClient();
        const token = await getAccessToken();
        const data = await apiRequest('/api/state/settle-auction', {
          method: 'POST',
          body: { item },
          ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
        });
        if (data?.state) {
          const merged = await hydrateStateWithClientVibes(data.state);
          applyState(merged);
        }
        // Refresh vault from Supabase after a successful settle.
        if (data?.settled && user && sb) {
          sb.from('vault_items')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .then(({ data: rows }) => {
              if (rows) setSupabaseVaultItems(rows.map(mapVaultRow));
            });
        }
        setError('');
        // Refresh AURA balance after a successful deduction.
        if (data?.settled) {
          refreshProfile();
        }
        return {
          settled: Boolean(data.settled),
          reason: data.reason || null,
        };
      } catch (settleError) {
        setError(settleError instanceof Error ? settleError.message : 'Failed to settle auction');
        return {
          settled: false,
          reason: 'request_failed',
        };
      }
    },
    [applyState, user, refreshProfile, hydrateStateWithClientVibes, getAccessToken],
  );

  const loadPrediction = useCallback(async (vibeId) => {
    if (!vibeId) return { prediction: null, stats: { totalPredictions: 0 } };
    try {
      const token = await getAccessToken();
      const data = await apiRequest(`/api/state/prediction?vibeId=${encodeURIComponent(vibeId)}`, {
        ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
      });
      return {
        prediction: data?.prediction || null,
        stats: data?.stats || { totalPredictions: 0 },
      };
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load prediction');
      return { prediction: null, stats: { totalPredictions: 0 } };
    }
  }, [getAccessToken]);

  const submitPrediction = useCallback(
    async (prediction) => {
      try {
        const token = await getAccessToken();
        const data = await apiRequest('/api/state/prediction', {
          method: 'POST',
          body: { prediction },
          ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
        });
        if (data?.accepted) {
          setError('');
        }
        return {
          accepted: Boolean(data?.accepted),
          reason: data?.reason || null,
          prediction: data?.prediction || null,
          stats: data?.stats || { totalPredictions: 0 },
        };
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : 'Failed to submit prediction');
        return {
          accepted: false,
          reason: 'request_failed',
          prediction: null,
          stats: { totalPredictions: 0 },
        };
      }
    },
    [getAccessToken],
  );

  const mintConfession = useCallback(
    async (payload) => {
      try {
        const data = await apiRequest('/api/state/mint-confession', {
          method: 'POST',
          body: { payload },
        });
        const merged = await hydrateStateWithClientVibes(data.state, { force: true });
        applyState(merged);
        setError('');
        return data.mintedConfession || null;
      } catch (mintError) {
        setError(mintError instanceof Error ? mintError.message : 'Failed to mint confession');
        return null;
      }
    },
    [applyState, hydrateStateWithClientVibes],
  );

  const mintVibe = useCallback(
    async (payload) => {
      try {
        const sendMintRequest = async (token) =>
          apiRequest('/api/state/mint-vibe', {
            method: 'POST',
            body: { payload },
            ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
          });

        let token = await getAccessToken();
        let data = await sendMintRequest(token);
        let reason = data?.reason || data?.saveReason || null;

        if (!data?.mintedVibe && ['auth_required', 'auth_invalid_token', 'auth_lookup_failed'].includes(String(reason || ''))) {
          const refreshedToken = await getAccessToken({ forceRefresh: true });
          if (refreshedToken && refreshedToken !== token) {
            token = refreshedToken;
            data = await sendMintRequest(token);
            reason = data?.reason || data?.saveReason || null;
          }
        }

        if (!data?.mintedVibe) {
          const message = getMintFailureMessage(reason);
          setError(message);
          return {
            mintedVibe: null,
            reason,
            message,
          };
        }
        const merged = await hydrateStateWithClientVibes(data.state, { force: true });
        applyState(merged);
        setError('');
        return {
          mintedVibe: data.mintedVibe,
          reason: null,
          message: null,
        };
      } catch (mintError) {
        const message = mintError instanceof Error ? mintError.message : 'Failed to mint vibe';
        setError(message);
        return {
          mintedVibe: null,
          reason: 'request_failed',
          message,
        };
      }
    },
    [applyState, hydrateStateWithClientVibes, getAccessToken],
  );

  const createStripeCheckoutSession = useCallback(async (packId) => {
    const token = await getAccessToken();
    const data = await apiRequest('/api/stripe/create-checkout-session', {
      method: 'POST',
      body: { packId },
      ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
    });
    return data;
  }, [getAccessToken]);

  const confirmStripeSession = useCallback(
    async (sessionId) => {
      const token = await getAccessToken();
      const data = await apiRequest('/api/stripe/confirm', {
        method: 'POST',
        body: { sessionId },
        ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
      });

      if (data?.state) {
        const merged = await hydrateStateWithClientVibes(data.state);
        applyState(merged);
      }

      // Profile balance is sourced from auth store when logged in.
      if (data?.credited) {
        refreshProfile();
      }

      return data;
    },
    [applyState, refreshProfile, hydrateStateWithClientVibes, getAccessToken],
  );

  const clearError = useCallback(() => {
    setError('');
  }, []);

  const value = useMemo(
    () => ({
      balance: profile !== null ? (profile.aura_balance ?? 0) : store.balance,
      activeBids: store.activeBids,
      vaultItems: supabaseVaultItems !== null ? supabaseVaultItems : store.vaultItems,
      walletLog: store.walletLog,
      confessions: store.confessions,
      mintedVibes: store.mintedVibes,
      isHydrating,
      error,
      refreshState,
      clearError,
      placeBid,
      settleAuction,
      loadPrediction,
      submitPrediction,
      mintConfession,
      mintVibe,
      createStripeCheckoutSession,
      confirmStripeSession,
    }),
    [
      store,
      profile,
      supabaseVaultItems,
      isHydrating,
      error,
      refreshState,
      clearError,
      placeBid,
      settleAuction,
      loadPrediction,
      submitPrediction,
      mintConfession,
      mintVibe,
      createStripeCheckoutSession,
      confirmStripeSession,
    ],
  );

  return <VibeStoreContext.Provider value={value}>{children}</VibeStoreContext.Provider>;
}

export function useVibeStore() {
  const context = useContext(VibeStoreContext);
  if (!context) {
    throw new Error('useVibeStore must be used within VibeStoreProvider');
  }
  return context;
}
