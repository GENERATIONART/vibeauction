'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
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
  emoji: row.emoji || '✨',
  category: row.category || 'Vibes',
  rarity: row.rarity || 'common',
  price: row.price || 0,
  wonDate: row.won_date,
  imageUrl: row.image_url ?? null,
  originalAuthor: row.original_author ?? null,
});

export function VibeStoreProvider({ children }) {
  const { profile, user } = useAuth();
  const [store, setStore] = useState(() => createDefaultState());
  const [isHydrating, setIsHydrating] = useState(true);
  const [error, setError] = useState('');
  const [supabaseVaultItems, setSupabaseVaultItems] = useState(null);

  const applyState = useCallback((nextState) => {
    setStore(sanitizeState(nextState));
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
    applyState(data.state);
    return data.state;
  }, [applyState]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setIsHydrating(true);
        const data = await apiRequest('/api/state');
        if (!cancelled) {
          applyState(data.state);
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
  }, [applyState]);

  const placeBid = useCallback(
    async (bid) => {
      try {
        const sb = getSupabaseClient();
        const sessionData = sb ? (await sb.auth.getSession()) : null;
        const token = sessionData?.data?.session?.access_token ?? null;
        const data = await apiRequest('/api/state/place-bid', {
          method: 'POST',
          body: { bid },
          ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
        });
        applyState(data.state);
        setError('');
        return Boolean(data.accepted);
      } catch (placeError) {
        setError(placeError instanceof Error ? placeError.message : 'Failed to place bid');
        return false;
      }
    },
    [applyState],
  );

  const settleAuction = useCallback(
    async (item) => {
      try {
        const sb = getSupabaseClient();
        const sessionData = sb ? (await sb.auth.getSession()) : null;
        const token = sessionData?.data?.session?.access_token ?? null;
        const data = await apiRequest('/api/state/settle-auction', {
          method: 'POST',
          body: { item },
          ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
        });
        applyState(data.state);
        // Refresh vault from Supabase after settle
        if (user && sb) {
          sb.from('vault_items')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .then(({ data: rows }) => {
              if (rows) setSupabaseVaultItems(rows.map(mapVaultRow));
            });
        }
        setError('');
        return Boolean(data.settled);
      } catch (settleError) {
        setError(settleError instanceof Error ? settleError.message : 'Failed to settle auction');
        return false;
      }
    },
    [applyState, user],
  );

  const mintConfession = useCallback(
    async (payload) => {
      try {
        const data = await apiRequest('/api/state/mint-confession', {
          method: 'POST',
          body: { payload },
        });
        applyState(data.state);
        setError('');
        return data.mintedConfession || null;
      } catch (mintError) {
        setError(mintError instanceof Error ? mintError.message : 'Failed to mint confession');
        return null;
      }
    },
    [applyState],
  );

  const mintVibe = useCallback(
    async (payload) => {
      try {
        const data = await apiRequest('/api/state/mint-vibe', {
          method: 'POST',
          body: { payload },
        });
        applyState(data.state);
        setError('');
        return data.mintedVibe || null;
      } catch (mintError) {
        setError(mintError instanceof Error ? mintError.message : 'Failed to mint vibe');
        return null;
      }
    },
    [applyState],
  );

  const createStripeCheckoutSession = useCallback(async (packId) => {
    const data = await apiRequest('/api/stripe/create-checkout-session', {
      method: 'POST',
      body: { packId },
    });
    return data;
  }, []);

  const confirmStripeSession = useCallback(
    async (sessionId) => {
      const data = await apiRequest('/api/stripe/confirm', {
        method: 'POST',
        body: { sessionId },
      });

      if (data?.state) {
        applyState(data.state);
      }

      return data;
    },
    [applyState],
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
