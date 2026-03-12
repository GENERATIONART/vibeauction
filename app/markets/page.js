'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import NavBar from '../components/NavBar';
import { useAuth } from '../state/auth-store';
import { getSupabaseClient } from '../../lib/supabase-client.js';

const TYPE_OPTIONS = [
  { value: 'binary', label: 'Binary Event', helper: 'Yes/No outcome tied to a vibe auction result.' },
  { value: 'price_target', label: 'Price Target', helper: 'Will a vibe settle above/below a target by close?' },
  { value: 'timing', label: 'Timing', helper: 'Will a vibe milestone happen before a specific timestamp?' },
  { value: 'engagement', label: 'Engagement', helper: 'Will vibe bids/watchers cross a threshold?' },
];

const STARTER_MARKETS = [
  {
    type: 'binary',
    category: 'Vibes',
    title: 'Will this vibe sell before auction close?',
    description: 'Resolves YES if this vibe has a winning bid before the close time.',
    yesLabel: 'Sells',
    noLabel: "Doesn't sell",
  },
  {
    type: 'timing',
    category: 'Vibes',
    title: 'Will this vibe hit 50 bids by Friday?',
    description: 'Resolves YES if total bids reach 50 before Friday 6PM ET.',
    yesLabel: 'Hits 50',
    noLabel: "Doesn't hit 50",
  },
  {
    type: 'price_target',
    category: 'Vibes',
    title: 'Will Neon Ghost Hoodie settle above 9,000 AURA?',
    description: 'Resolves YES if final auction settlement is strictly above 9,000 AURA.',
    yesLabel: 'Above 9,000',
    noLabel: '9,000 or lower',
  },
];

const FILTERS = [
  { key: 'all', label: 'All Markets' },
  { key: 'open', label: 'Open' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'cancelled', label: 'Cancelled' },
];

const safeNumber = (value, fallback = 0) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/,/g, '').trim());
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

const toExpiryMs = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    if (value > 1e12) return value;
    if (value > 1e9) return value * 1000;
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

const toLocalDateTimeValue = (dateInput) => {
  const date = new Date(dateInput);
  if (!Number.isFinite(date.getTime())) return '';
  const pad = (value) => String(value).padStart(2, '0');
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const mi = pad(date.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
};

const DEFAULT_FORM = {
  title: '',
  description: '',
  category: 'General',
  type: 'binary',
  yesLabel: 'Yes',
  noLabel: 'No',
  closesAt: toLocalDateTimeValue(Date.now() + 24 * 60 * 60 * 1000),
  resolvesAt: '',
  vibeId: '',
};

const styles = {
  page: {
    minHeight: '100dvh',
    background: '#0D0D0D',
    color: '#FFFFFF',
    fontFamily: "'Inter', sans-serif",
    WebkitFontSmoothing: 'antialiased',
    overflowX: 'hidden',
  },
  container: {
    width: '100%',
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '28px 20px 56px',
    display: 'grid',
    gridTemplateColumns: 'minmax(320px, 420px) minmax(0, 1fr)',
    gap: '20px',
    alignItems: 'start',
  },
  panel: {
    minWidth: 0,
    background: '#111111',
    border: '1px solid #232323',
    borderRadius: '12px',
    padding: '18px',
  },
  title: {
    fontFamily: "'Anton', sans-serif",
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    fontSize: '28px',
    marginBottom: '8px',
    lineHeight: 1.05,
  },
  sub: {
    color: '#8F8F8F',
    fontSize: '13px',
    lineHeight: 1.5,
    marginBottom: '14px',
    overflowWrap: 'anywhere',
  },
  label: {
    display: 'block',
    fontSize: '11px',
    fontWeight: 700,
    color: '#999999',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    minWidth: 0,
    background: '#090909',
    border: '1px solid #2E2E2E',
    borderRadius: '8px',
    padding: '10px 12px',
    color: '#FFFFFF',
    fontSize: '14px',
    fontWeight: 600,
    marginBottom: '10px',
  },
  textarea: {
    width: '100%',
    minHeight: '88px',
    resize: 'vertical',
    background: '#090909',
    border: '1px solid #2E2E2E',
    borderRadius: '8px',
    padding: '10px 12px',
    color: '#FFFFFF',
    fontSize: '14px',
    fontWeight: 500,
    marginBottom: '10px',
  },
  row2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '8px',
  },
  btnPrimary: {
    width: '100%',
    border: 'none',
    background: '#C8FF00',
    color: '#000000',
    padding: '12px',
    borderRadius: '8px',
    fontFamily: "'Anton', sans-serif",
    fontSize: '18px',
    textTransform: 'uppercase',
    cursor: 'pointer',
    letterSpacing: '0.5px',
  },
  btnGhost: {
    border: '1px solid #2E2E2E',
    background: '#121212',
    color: '#FFFFFF',
    padding: '8px 10px',
    borderRadius: '8px',
    fontWeight: 700,
    fontSize: '12px',
    cursor: 'pointer',
  },
  pillRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    marginBottom: '14px',
  },
  pill: {
    border: '1px solid #2E2E2E',
    background: '#101010',
    color: '#AAAAAA',
    padding: '7px 11px',
    borderRadius: '999px',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: '12px',
  },
  marketCard: {
    background: '#121212',
    border: '1px solid #2B2B2B',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '12px',
    overflow: 'hidden',
  },
  marketTitle: {
    fontFamily: "'Anton', sans-serif",
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    fontSize: '24px',
    lineHeight: 1.05,
    marginBottom: '8px',
    overflowWrap: 'anywhere',
  },
  badgeRow: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
    marginBottom: '8px',
  },
  badge: {
    fontSize: '10px',
    fontWeight: 800,
    textTransform: 'uppercase',
    border: '1px solid #333333',
    padding: '2px 8px',
    borderRadius: '999px',
    color: '#BBBBBB',
  },
  probabilityWrap: { margin: '10px 0 12px' },
  probabilityBar: {
    width: '100%',
    height: '10px',
    borderRadius: '999px',
    overflow: 'hidden',
    background: '#262626',
    border: '1px solid #3A3A3A',
  },
  probabilityYes: { height: '100%', background: '#53FF8A' },
  tradeRow: {
    display: 'grid',
    gridTemplateColumns: '1fr auto auto',
    gap: '8px',
    marginTop: '10px',
  },
  yesButton: {
    border: 'none',
    background: '#1A7F45',
    color: '#FFFFFF',
    borderRadius: '8px',
    padding: '10px 12px',
    fontWeight: 800,
    cursor: 'pointer',
  },
  noButton: {
    border: 'none',
    background: '#8B1A3A',
    color: '#FFFFFF',
    borderRadius: '8px',
    padding: '10px 12px',
    fontWeight: 800,
    cursor: 'pointer',
  },
  miniText: {
    fontSize: '12px',
    color: '#9B9B9B',
    overflowWrap: 'anywhere',
  },
  notice: {
    marginTop: '10px',
    borderRadius: '8px',
    padding: '10px',
    fontSize: '12px',
    fontWeight: 700,
  },
};

async function apiRequest(path, { method = 'GET', body } = {}, token = null) {
  const response = await fetch(path, {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: method === 'GET' ? 'no-store' : undefined,
  });

  let payload = {};
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }

  if (!response.ok) {
    throw new Error(payload?.error || `Request failed (${response.status})`);
  }
  return payload;
}

export default function MarketsPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState('all');
  const [markets, setMarkets] = useState([]);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [vibeOptions, setVibeOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tradeInputs, setTradeInputs] = useState({});
  const [openingPriceInputs, setOpeningPriceInputs] = useState({});
  const [actionBusy, setActionBusy] = useState({});
  const [viewportWidth, setViewportWidth] = useState(1200);

  const isTablet = viewportWidth <= 980;
  const isPhone = viewportWidth <= 640;

  useEffect(() => {
    const updateViewport = () => setViewportWidth(window.innerWidth);
    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  useEffect(() => {
    const styleId = 'vibeauction-fonts';
    if (document.getElementById(styleId)) return undefined;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;700;800&display=swap');
      @keyframes skeletonPulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
    `;
    document.head.appendChild(style);

    return () => {
      if (style.parentNode) style.parentNode.removeChild(style);
    };
  }, []);

  const getAuthToken = useCallback(async ({ forceRefresh = false } = {}) => {
    const sb = getSupabaseClient();
    if (!sb) return null;

    let session = null;
    try {
      const sessionData = await sb.auth.getSession();
      session = sessionData?.data?.session ?? null;
    } catch {
      session = null;
    }

    const token = session?.access_token ?? null;
    const expiresAtMs = toExpiryMs(session?.expires_at);
    const now = Date.now();
    const canReuseToken = Boolean(token) && (expiresAtMs === 0 || expiresAtMs > now - 30000);
    const shouldRefresh = forceRefresh || !token || (expiresAtMs > 0 && expiresAtMs - now < 30000);

    if (shouldRefresh) {
      try {
        const { data: refreshed } = await sb.auth.refreshSession();
        const refreshedToken = refreshed?.session?.access_token ?? null;
        if (refreshedToken) return refreshedToken;
      } catch {
        return canReuseToken ? token : null;
      }
    }

    return canReuseToken ? token : null;
  }, []);

  const loadMarkets = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = await getAuthToken();
      const data = await apiRequest(`/api/markets?state=${encodeURIComponent(filter)}&limit=200`, {}, token);
      setMarkets(Array.isArray(data?.markets) ? data.markets : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load markets');
      setMarkets([]);
    } finally {
      setLoading(false);
    }
  }, [filter, getAuthToken]);

  useEffect(() => {
    loadMarkets();
  }, [loadMarkets]);

  useEffect(() => {
    let active = true;
    fetch('/api/auctions/history?status=live&limit=200', { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error('Failed to load vibes'))))
      .then((data) => {
        if (!active) return;
        const auctions = Array.isArray(data?.auctions) ? data.auctions : [];
        const vibes = auctions.map((a) => ({ id: a.id, slug: a.slug, name: a.name, category: a.category }));
        setVibeOptions(vibes);
        if (vibes.length > 0) {
          setForm((previous) => {
            if (previous.vibeId) return previous;
            return { ...previous, vibeId: vibes[0].id || vibes[0].slug || '' };
          });
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!form.vibeId || vibeOptions.length === 0) return;
    const vibe = vibeOptions.find(
      (option) => option.id === form.vibeId || option.slug === form.vibeId,
    );
    if (vibe?.category && vibe.category !== form.category) {
      setForm((previous) => ({ ...previous, category: vibe.category }));
    }
  }, [form.vibeId, form.category, vibeOptions]);

  const marketSummary = useMemo(() => {
    const openCount = markets.filter((market) => market.state === 'open').length;
    const resolvedCount = markets.filter((market) => market.state === 'resolved').length;
    const totalPool = markets.reduce((sum, market) => sum + safeNumber(market.totalPool, 0), 0);
    const avgPool = markets.length > 0 ? Math.round(totalPool / markets.length) : 0;
    return { openCount, resolvedCount, totalPool, avgPool };
  }, [markets]);

  const setFormField = (key, value) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const applyStarter = (starter) => {
    const closesAt = toLocalDateTimeValue(Date.now() + 36 * 60 * 60 * 1000);
    setForm((previous) => ({ ...previous, ...starter, closesAt }));
  };

  const onCreateMarket = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!user) {
      setError('Sign in to create a market.');
      return;
    }
    if (!form.vibeId) {
      setError('Select a vibe for this market.');
      return;
    }

    setCreating(true);
    try {
      const token = await getAuthToken();
      const payload = await apiRequest(
        '/api/markets',
        {
          method: 'POST',
          body: {
            market: {
              ...form,
              closesAt: form.closesAt ? new Date(form.closesAt).toISOString() : null,
              resolvesAt: form.resolvesAt ? new Date(form.resolvesAt).toISOString() : null,
            },
          },
        },
        token,
      );

      if (!payload?.created) {
        if (payload?.reason === 'invalid_close_time') {
          setError('Close time must be in the future.');
        } else if (payload?.reason === 'auth_required') {
          setError('Sign in to create markets.');
        } else {
          setError('Failed to create market.');
        }
        return;
      }

      setSuccess('Market created. First trader now sets opening probability.');
      setForm(() => {
        const nextForm = { ...DEFAULT_FORM };
        if (vibeOptions.length > 0) {
          nextForm.vibeId = vibeOptions[0].id || vibeOptions[0].slug || '';
        }
        return nextForm;
      });
      await loadMarkets();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Failed to create market');
    } finally {
      setCreating(false);
    }
  };

  const setBusy = (marketId, value) => {
    setActionBusy((previous) => ({ ...previous, [marketId]: value }));
  };

  const onTrade = async (market, side) => {
    const marketId = market?.id;
    const stake = safeNumber(tradeInputs[marketId], 0);
    if (stake < 1) {
      setError('Trade stake must be at least 1 AURA.');
      return;
    }
    if (!user) {
      setError('Sign in to trade.');
      return;
    }

    setError('');
    setSuccess('');
    setBusy(marketId, true);

    try {
      const token = await getAuthToken();
      const marketProbability = safeNumber(market?.probabilityYes, Number.NaN);
      const openingPrice = safeNumber(openingPriceInputs[marketId], Number.NaN);
      if (!Number.isFinite(marketProbability) && (!Number.isFinite(openingPrice) || openingPrice <= 0 || openingPrice >= 100)) {
        setError('Opening probability must be between 1% and 99%.');
        return;
      }

      const result = await apiRequest(
        '/api/markets/trade',
        {
          method: 'POST',
          body: {
            trade: {
              marketId,
              side,
              stake,
              ...(Number.isFinite(marketProbability) ? {} : { price: openingPrice }),
            },
          },
        },
        token,
      );

      if (!result?.accepted) {
        if (result?.reason === 'insufficient_balance') {
          setError('Not enough AURA for this trade.');
        } else if (result?.reason === 'price_required_for_first_trade') {
          setError('Set opening probability (1-99%) for first trade.');
        } else if (result?.reason === 'market_closed') {
          setError('Market is closed for new trades.');
        } else {
          setError('Trade failed. Please try again.');
        }
        return;
      }

      setSuccess(`Trade executed: ${side.toUpperCase()} ${stake.toLocaleString()} AURA.`);
      setTradeInputs((previous) => ({ ...previous, [marketId]: '' }));
      setOpeningPriceInputs((previous) => ({ ...previous, [marketId]: '' }));
      await loadMarkets();
    } catch (tradeError) {
      setError(tradeError instanceof Error ? tradeError.message : 'Trade failed');
    } finally {
      setBusy(marketId, false);
    }
  };

  const onResolve = async (marketId, outcome) => {
    if (!user) {
      setError('Sign in to resolve markets.');
      return;
    }

    setError('');
    setSuccess('');
    setBusy(marketId, true);

    try {
      const token = await getAuthToken();
      const result = await apiRequest(
        '/api/markets/resolve',
        {
          method: 'POST',
          body: { resolution: { marketId, outcome } },
        },
        token,
      );

      if (!result?.resolved) {
        if (result?.reason === 'only_creator_can_resolve') {
          setError('Only the market creator can resolve this market.');
        } else if (result?.reason === 'market_still_open') {
          setError('Market must be closed before resolution.');
        } else {
          setError('Resolution failed.');
        }
        return;
      }

      setSuccess(`Market resolved as ${outcome.toUpperCase()}.`);
      await loadMarkets();
    } catch (resolveError) {
      setError(resolveError instanceof Error ? resolveError.message : 'Resolution failed');
    } finally {
      setBusy(marketId, false);
    }
  };

  const onClaim = async (marketId) => {
    if (!user) {
      setError('Sign in to claim AURA rewards.');
      return;
    }

    setError('');
    setSuccess('');
    setBusy(marketId, true);

    try {
      const token = await getAuthToken();
      const result = await apiRequest(
        '/api/markets/claim',
        {
          method: 'POST',
          body: { claim: { marketId } },
        },
        token,
      );

      if (!result?.claimed) {
        if (result?.reason === 'already_claimed') {
          setError('AURA reward already claimed.');
        } else if (result?.reason === 'no_position') {
          setError('No position found on this market.');
        } else if (result?.reason === 'market_not_resolved') {
          setError('Market is not resolved yet.');
        } else {
          setError('Claim failed.');
        }
        return;
      }

      setSuccess(`AURA reward claimed: ${safeNumber(result.amount, 0).toLocaleString()} AURA.`);
      await loadMarkets();
    } catch (claimError) {
      setError(claimError instanceof Error ? claimError.message : 'Claim failed');
    } finally {
      setBusy(marketId, false);
    }
  };

  return (
    <div style={styles.page}>
      <NavBar />

      <div
        style={{
          ...styles.container,
          gridTemplateColumns: isTablet ? '1fr' : styles.container.gridTemplateColumns,
          padding: isPhone ? '16px 12px 34px' : isTablet ? '20px 16px 40px' : styles.container.padding,
          gap: isPhone ? '14px' : styles.container.gap,
        }}
      >
        <section style={{ ...styles.panel, padding: isPhone ? '14px' : styles.panel.padding }}>
          <h1 style={{ ...styles.title, fontSize: isPhone ? '23px' : styles.title.fontSize }}>Prediction Markets</h1>
          <p style={styles.sub}>
            Create vibe-native, AURA-only markets with trader-driven odds.
            Opening probability is set by the first trade and rewards are distributed from the AURA market pool.
          </p>

          <div style={styles.pillRow}>
            {STARTER_MARKETS.map((starter) => (
              <button
                key={starter.title}
                type="button"
                style={styles.btnGhost}
                onClick={() => applyStarter(starter)}
              >
                Use: {starter.type.replace('_', ' ')}
              </button>
            ))}
          </div>

          <form onSubmit={onCreateMarket}>
            <label style={styles.label}>Title</label>
            <input
              style={styles.input}
              value={form.title}
              onChange={(event) => setFormField('title', event.target.value)}
              placeholder="Will this vibe settle above 3,000 AURA?"
            />

            <label style={styles.label}>Description</label>
            <textarea
              style={styles.textarea}
              value={form.description}
              onChange={(event) => setFormField('description', event.target.value)}
              placeholder="Resolution source and exact criteria."
            />

            <label style={styles.label}>Vibe</label>
            <select
              style={{ ...styles.input, appearance: 'none' }}
              value={form.vibeId}
              onChange={(event) => setFormField('vibeId', event.target.value)}
            >
              <option value="">Select a vibe</option>
              {vibeOptions.map((vibe) => (
                <option key={vibe.id} value={vibe.id}>
                  {vibe.name || vibe.slug || 'Unnamed vibe'}
                </option>
              ))}
            </select>
            <div style={{ fontSize: '11px', color: '#666666', marginBottom: '10px', lineHeight: 1.5 }}>
              Markets auto-resolve when the linked auction settles or ends. Oracle: Auction result (checked every 5 min).
            </div>
            <label style={styles.label}>Resolution basis</label>
            <input
              style={{ ...styles.input, color: '#777777', cursor: 'default' }}
              value="Oracle: Linked auction result (vault settlement)"
              readOnly
            />

            <div style={{ ...styles.row2, gridTemplateColumns: isPhone ? '1fr' : styles.row2.gridTemplateColumns }}>
              <div style={{ minWidth: 0 }}>
                <label style={styles.label}>Type</label>
                <select
                  style={styles.input}
                  value={form.type}
                  onChange={(event) => setFormField('type', event.target.value)}
                >
                  {TYPE_OPTIONS.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div style={{ minWidth: 0 }}>
                <label style={styles.label}>Category</label>
                <input
                  style={styles.input}
                  value={form.category}
                  onChange={(event) => setFormField('category', event.target.value)}
                  placeholder="Vibes"
                />
              </div>
            </div>

            <div style={{ ...styles.row2, gridTemplateColumns: isPhone ? '1fr' : styles.row2.gridTemplateColumns }}>
              <div style={{ minWidth: 0 }}>
                <label style={styles.label}>Yes Label</label>
                <input
                  style={styles.input}
                  value={form.yesLabel}
                  onChange={(event) => setFormField('yesLabel', event.target.value)}
                />
              </div>
              <div style={{ minWidth: 0 }}>
                <label style={styles.label}>No Label</label>
                <input
                  style={styles.input}
                  value={form.noLabel}
                  onChange={(event) => setFormField('noLabel', event.target.value)}
                />
              </div>
            </div>

            <div style={{ ...styles.row2, gridTemplateColumns: '1fr' }}>
              <div style={{ minWidth: 0 }}>
                <label style={styles.label}>Close Time</label>
                <input
                  type="datetime-local"
                  style={styles.input}
                  value={form.closesAt}
                  onChange={(event) => setFormField('closesAt', event.target.value)}
                />
              </div>
              <div style={{ minWidth: 0 }}>
                <label style={styles.label}>Resolve Time (optional)</label>
                <input
                  type="datetime-local"
                  style={styles.input}
                  value={form.resolvesAt}
                  onChange={(event) => setFormField('resolvesAt', event.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              style={{ ...styles.btnPrimary, opacity: creating ? 0.7 : 1, fontSize: isPhone ? '16px' : styles.btnPrimary.fontSize }}
              disabled={creating}
            >
              {creating ? 'Creating...' : 'Start Market'}
            </button>
          </form>

          <div style={{ marginTop: '12px', fontSize: '12px', color: '#9A9A9A', lineHeight: 1.5 }}>
            {TYPE_OPTIONS.find((type) => type.value === form.type)?.helper}
          </div>
        </section>

        <section style={{ ...styles.panel, padding: isPhone ? '14px' : styles.panel.padding }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: isPhone ? 'flex-start' : 'center',
              flexWrap: 'wrap',
              gap: '8px',
              flexDirection: isPhone ? 'column' : 'row',
            }}
          >
            <h2 style={{ ...styles.title, fontSize: isPhone ? '21px' : '24px', marginBottom: 0 }}>Live Board</h2>
            <div style={{ fontSize: '12px', color: '#A2A2A2', fontWeight: 700 }}>
              {marketSummary.openCount} open · {marketSummary.resolvedCount} resolved · {marketSummary.totalPool.toLocaleString()} AURA pooled · avg {marketSummary.avgPool.toLocaleString()} AURA/market
            </div>
          </div>

          <div style={{ ...styles.pillRow, marginTop: '12px' }}>
            {FILTERS.map((item) => (
              <button
                key={item.key}
                type="button"
                style={{
                  ...styles.pill,
                  color: filter === item.key ? '#000000' : styles.pill.color,
                  background: filter === item.key ? '#C8FF00' : styles.pill.background,
                  borderColor: filter === item.key ? '#C8FF00' : styles.pill.borderColor,
                }}
                onClick={() => setFilter(item.key)}
              >
                {item.label}
              </button>
            ))}
            <button type="button" style={styles.btnGhost} onClick={loadMarkets}>Refresh</button>
          </div>

          {success && (
            <div
              style={{
                ...styles.notice,
                background: 'rgba(83,255,138,0.16)',
                border: '1px solid rgba(83,255,138,0.35)',
                color: '#A5FFC3',
              }}
            >
              {success}
            </div>
          )}
          {error && (
            <div
              style={{
                ...styles.notice,
                background: 'rgba(255,80,110,0.16)',
                border: '1px solid rgba(255,80,110,0.35)',
                color: '#FFC2CF',
              }}
            >
              {error}
            </div>
          )}

          {loading ? (
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    background: '#181818',
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    animation: 'skeletonPulse 1.6s ease-in-out infinite',
                    animationDelay: `${i * 0.12}s`,
                  }}
                >
                  <div style={{ height: '20px', background: '#222', borderRadius: '4px', width: '70%' }} />
                  <div style={{ height: '12px', background: '#1E1E1E', borderRadius: '4px', width: '45%' }} />
                  <div style={{ height: '10px', background: '#1A1A1A', borderRadius: '99px' }} />
                </div>
              ))}
            </div>
          ) : markets.length === 0 ? (
            <div style={{ marginTop: '16px', color: '#8A8A8A', fontWeight: 700 }}>No markets yet. Start the first one.</div>
          ) : (
            <div style={{ marginTop: '14px' }}>
              {markets.map((market) => {
                const probabilityYesRaw = safeNumber(market.probabilityYes, Number.NaN);
                const hasLiveOdds = Number.isFinite(probabilityYesRaw);
                const probabilityYesPct = hasLiveOdds ? Math.round(probabilityYesRaw * 100) : null;
                const probabilityNoPct = hasLiveOdds ? 100 - probabilityYesPct : null;
                const closesAtMs = new Date(market.closesAt || '').getTime();
                const isClosed = Number.isFinite(closesAtMs) && closesAtMs <= Date.now();
                const canResolve =
                  user &&
                  market.creatorId &&
                  String(user.id) === String(market.creatorId) &&
                  market.state === 'open' &&
                  isClosed;
                const isResolved = market.state === 'resolved' || market.state === 'cancelled';
                const busy = actionBusy[market.id] === true;

                const tradeLayoutStyle = isTablet
                  ? { display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }
                  : {
                      ...styles.tradeRow,
                      gridTemplateColumns: hasLiveOdds ? '1fr auto auto' : '1fr 1fr auto auto',
                    };

                return (
                  <article key={market.id} style={{ ...styles.marketCard, padding: isPhone ? '12px' : styles.marketCard.padding }}>
                    <div style={{ ...styles.marketTitle, fontSize: isPhone ? '20px' : styles.marketTitle.fontSize }}>{market.title}</div>
                    <div style={styles.badgeRow}>
                      <span style={styles.badge}>{market.type.replace('_', ' ')}</span>
                      <span style={styles.badge}>{market.category}</span>
                      <span
                        style={{
                          ...styles.badge,
                          color: market.state === 'open' ? '#A8FF8F' : market.state === 'resolved' ? '#8FC8FF' : '#FFC28F',
                          borderColor: market.state === 'open' ? '#2A5E2A' : market.state === 'resolved' ? '#2A4F6C' : '#6B4A2A',
                        }}
                      >
                        {market.state}
                      </span>
                    </div>
                    {market.state === 'open' && (
                      <div style={{ ...styles.miniText, color: '#666666', marginBottom: '6px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <span>⚡ Oracle: Auction result</span>
                        <span>·</span>
                        <span>Auto-resolves {new Date(market.closesAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    )}
                    <p style={{ ...styles.sub, marginBottom: '10px' }}>{market.description || 'No description provided.'}</p>

                    <div style={styles.probabilityWrap}>
                      {hasLiveOdds ? (
                        <>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              marginBottom: '6px',
                              fontSize: isPhone ? '11px' : '12px',
                              fontWeight: 800,
                            }}
                          >
                            <span style={{ color: '#53FF8A' }}>{market.yesLabel}: {probabilityYesPct}%</span>
                            <span style={{ color: '#FF7998' }}>{market.noLabel}: {probabilityNoPct}%</span>
                          </div>
                          <div style={styles.probabilityBar}>
                            <div style={{ ...styles.probabilityYes, width: `${probabilityYesPct}%` }} />
                          </div>
                        </>
                      ) : (
                        <div style={{ ...styles.miniText, color: '#D2D2D2', marginBottom: '2px' }}>
                          No live odds yet. First trader sets opening probability.
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: isPhone ? '1fr 1fr' : 'repeat(3, minmax(0, 1fr))',
                        gap: '8px',
                        marginBottom: '8px',
                      }}
                    >
                      <div style={styles.miniText}>Pool: {safeNumber(market.totalPool, 0).toLocaleString()} AURA</div>
                      <div style={styles.miniText}>Traders: {safeNumber(market.participants, 0)}</div>
                      <div style={{ ...styles.miniText, gridColumn: isPhone ? '1 / -1' : 'auto' }}>
                        Closes: {new Date(market.closesAt).toLocaleString()}
                      </div>
                    </div>

                    {market.myPosition && (
                      <div style={{ ...styles.miniText, marginBottom: '8px', color: '#C8FFAA' }}>
                        Your exposure: {safeNumber(market.myPosition.totalStake, 0).toLocaleString()} AURA ·
                        YES shares {safeNumber(market.myPosition.yesShares, 0).toLocaleString()} ·
                        NO shares {safeNumber(market.myPosition.noShares, 0).toLocaleString()}
                      </div>
                    )}

                    {market.myClaim && (
                      <div style={{ ...styles.miniText, marginBottom: '8px', color: '#9DD3FF' }}>
                        Claimed: {safeNumber(market.myClaim.amount, 0).toLocaleString()} AURA on{' '}
                        {new Date(market.myClaim.claimedAt).toLocaleString()}
                      </div>
                    )}

                    {market.state === 'open' && !isClosed && (
                      <div style={tradeLayoutStyle}>
                        <input
                          type="number"
                          min={1}
                          step={1}
                          style={{ ...styles.input, marginBottom: 0 }}
                          placeholder="Stake AURA"
                          value={tradeInputs[market.id] ?? ''}
                          onChange={(event) =>
                            setTradeInputs((previous) => ({ ...previous, [market.id]: event.target.value }))
                          }
                        />
                        {!hasLiveOdds && (
                          <input
                            type="number"
                            min={1}
                            max={99}
                            step={1}
                            style={{ ...styles.input, marginBottom: 0 }}
                            placeholder="Opening prob %"
                            value={openingPriceInputs[market.id] ?? ''}
                            onChange={(event) =>
                              setOpeningPriceInputs((previous) => ({ ...previous, [market.id]: event.target.value }))
                            }
                          />
                        )}
                        <button
                          type="button"
                          style={{ ...styles.yesButton, width: isTablet ? '100%' : 'auto' }}
                          disabled={busy}
                          onClick={() => onTrade(market, 'yes')}
                        >
                          Buy YES
                        </button>
                        <button
                          type="button"
                          style={{ ...styles.noButton, width: isTablet ? '100%' : 'auto' }}
                          disabled={busy}
                          onClick={() => onTrade(market, 'no')}
                        >
                          Buy NO
                        </button>
                      </div>
                    )}

                    {isResolved && (
                      <div style={{ marginTop: '10px' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            flexWrap: 'wrap',
                            marginBottom: '6px',
                          }}
                        >
                          <span
                            style={{
                              ...styles.badge,
                              background: 'rgba(83,255,138,0.12)',
                              color: '#A5FFC3',
                              borderColor: 'rgba(83,255,138,0.3)',
                              fontSize: '11px',
                            }}
                          >
                            ✓ AUTO-RESOLVED
                          </span>
                          <span style={{ ...styles.miniText, alignSelf: 'center' }}>
                            Outcome: <strong style={{ color: '#FFFFFF' }}>{(market.resolvedOutcome || market.state).toUpperCase()}</strong>
                          </span>
                        </div>
                        {market.myClaim ? (
                          <div
                            style={{
                              background: 'rgba(83,255,138,0.08)',
                              border: '1px solid rgba(83,255,138,0.2)',
                              borderRadius: '8px',
                              padding: '10px 12px',
                              fontSize: '13px',
                              color: '#A5FFC3',
                              fontWeight: 700,
                            }}
                          >
                            ✓ {safeNumber(market.myClaim.amount, 0).toLocaleString()} AURA paid to your balance
                          </div>
                        ) : market.myPosition ? (
                          <div style={{ ...styles.miniText, color: '#888888' }}>
                            Your position is being processed — check your balance shortly.
                          </div>
                        ) : null}
                      </div>
                    )}

                    {canResolve && (
                      <div
                        style={{
                          marginTop: '8px',
                          padding: '8px 10px',
                          background: 'rgba(200,255,0,0.06)',
                          border: '1px solid rgba(200,255,0,0.2)',
                          borderRadius: '6px',
                          fontSize: '11px',
                          color: '#B8E800',
                          fontWeight: 700,
                        }}
                      >
                        ⚡ Auto-resolve pending — oracle check runs every 5 min. Manual override:
                        <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                          <button type="button" style={{ ...styles.yesButton, fontSize: '12px', padding: '6px 10px' }} disabled={busy} onClick={() => onResolve(market.id, 'yes')}>Resolve YES</button>
                          <button type="button" style={{ ...styles.noButton, fontSize: '12px', padding: '6px 10px' }} disabled={busy} onClick={() => onResolve(market.id, 'no')}>Resolve NO</button>
                          <button type="button" style={{ ...styles.btnGhost, fontSize: '11px' }} disabled={busy} onClick={() => onResolve(market.id, 'cancelled')}>Cancel</button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
