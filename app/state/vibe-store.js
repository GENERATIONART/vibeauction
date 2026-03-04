'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { createDefaultState } from '../../lib/default-store.js';

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
    headers: hasBody ? { 'Content-Type': 'application/json' } : undefined,
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

export function VibeStoreProvider({ children }) {
  const [store, setStore] = useState(() => createDefaultState());
  const [isHydrating, setIsHydrating] = useState(true);
  const [error, setError] = useState('');

  const applyState = useCallback((nextState) => {
    setStore(sanitizeState(nextState));
  }, []);

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
        const data = await apiRequest('/api/state/place-bid', {
          method: 'POST',
          body: { bid },
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
        const data = await apiRequest('/api/state/settle-auction', {
          method: 'POST',
          body: { item },
        });
        applyState(data.state);
        setError('');
        return Boolean(data.settled);
      } catch (settleError) {
        setError(settleError instanceof Error ? settleError.message : 'Failed to settle auction');
        return false;
      }
    },
    [applyState],
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
      balance: store.balance,
      activeBids: store.activeBids,
      vaultItems: store.vaultItems,
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
