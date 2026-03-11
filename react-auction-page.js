'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useVibeStore } from './app/state/vibe-store';
import { useAuth } from './app/state/auth-store';
import NavBar from './app/components/NavBar';
import {
  defaultAuctionSlug,
  getAuctionItemBySlug,
  getCategoryTag,
} from './lib/auction-items.js';

const normalize = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const normalizeHandle = (value) => normalize(String(value || '').replace(/^@/, ''));

const looksLikeUuid = (value) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || '').trim(),
  );

const safeBid = (value, fallback = 100) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/,/g, '').trim());
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

const parseTimer = (timer) => {
  if (typeof timer !== 'string') return { hours: 0, mins: 12, secs: 30 };

  let hours = 0;
  let mins = 0;
  let secs = 0;

  const dayMatch = timer.match(/(\d+)\s*d/i);
  const hourMatch = timer.match(/(\d+)\s*h/i);
  const minMatch = timer.match(/(\d+)\s*m/i);
  const secMatch = timer.match(/(\d+)\s*s/i);

  if (dayMatch) hours += Number(dayMatch[1]) * 24;
  if (hourMatch) hours += Number(hourMatch[1]);
  if (minMatch) mins = Number(minMatch[1]);
  if (secMatch) secs = Number(secMatch[1]);

  if (!dayMatch && !hourMatch && !minMatch && !secMatch) {
    return { hours: 0, mins: 12, secs: 30 };
  }

  return { hours, mins, secs };
};

const splitTitle = (title) => {
  const clean = String(title || '').trim();
  if (!clean) return ['Unknown', 'Vibe'];

  const words = clean.split(/\s+/);
  if (words.length < 4) return [clean, null];

  const midpoint = Math.ceil(words.length / 2);
  return [words.slice(0, midpoint).join(' '), words.slice(midpoint).join(' ')];
};

const makeInitialBidHistory = () => [];

const resolveTopBid = (apiTopBid, bidRows) => {
  const apiAmount = safeBid(apiTopBid?.amount, Number.NaN);
  if (Number.isFinite(apiAmount)) {
    return { ...apiTopBid, amount: apiAmount };
  }

  let winner = null;
  for (const row of Array.isArray(bidRows) ? bidRows : []) {
    const amount = safeBid(row?.amount, Number.NaN);
    if (!Number.isFinite(amount)) continue;
    if (
      !winner ||
      amount > winner.amount ||
      (amount === winner.amount && String(row?.createdAt || '') > String(winner.createdAt || ''))
    ) {
      winner = { ...row, amount };
    }
  }
  return winner;
};

const getTimerFromVibe = (vibe) => {
  if (vibe?.endTime) {
    const remaining = new Date(vibe.endTime).getTime() - Date.now();
    if (remaining <= 0) return { hours: 0, mins: 0, secs: 0 };
    const totalSecs = Math.floor(remaining / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return { hours, mins, secs };
  }
  return parseTimer(vibe?.timer);
};

const formatPredictionClock = (timestamp) => {
  const value = new Date(timestamp || '').getTime();
  if (!Number.isFinite(value)) return 'Unknown';
  return new Date(value).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

const customStyles = {
  body: {
    backgroundColor: '#0D0D0D',
    color: '#FFFFFF',
    fontFamily: "'Inter', sans-serif",
    WebkitFontSmoothing: 'antialiased',
    overflowX: 'hidden',
    minHeight: '100dvh',
    position: 'relative',
  },
  header: {
    background: '#000000',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    borderBottom: '2px solid #C8FF00',
  },
  logo: {
    fontFamily: "'Anton', sans-serif",
    fontSize: '24px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: '#C8FF00',
    textDecoration: 'none',
  },
  navLinks: {
    display: 'flex',
    gap: '24px',
  },
  navItem: {
    fontWeight: 700,
    fontSize: '14px',
    color: '#FFFFFF',
    textDecoration: 'none',
    textTransform: 'uppercase',
    cursor: 'pointer',
  },
  userBalance: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    background: '#C8FF00',
    color: '#000000',
    padding: '4px 12px',
    borderRadius: '99px',
    fontWeight: 700,
    fontSize: '13px',
  },
  breadcrumb: {
    padding: '16px 32px',
    fontSize: '12px',
    textTransform: 'uppercase',
    fontWeight: 700,
    color: '#666666',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  breadcrumbAccent: {
    color: '#C8FF00',
  },
  detailLayout: {
    display: 'grid',
    gridTemplateColumns: '1fr 400px',
    gap: '32px',
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 32px 64px',
    position: 'relative',
    zIndex: 2,
  },
  vibeHeroCard: {
    background: '#FFFFFF',
    border: '3px solid #C8FF00',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '12px 12px 0px rgba(200, 255, 0, 0.2)',
  },
  heroVisual: {
    height: '480px',
    background: '#F0F0F0',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottom: '3px solid #000000',
    overflow: 'hidden',
  },
  patternDots: {
    backgroundImage: 'radial-gradient(#000000 1px, transparent 1px)',
    backgroundSize: '16px 16px',
    opacity: 0.1,
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  heroEmoji: {
    fontSize: '180px',
    zIndex: 1,
    filter: 'drop-shadow(10px 10px 0px rgba(0,0,0,0.1))',
  },
  heroInfo: {
    padding: '32px',
    color: '#000000',
  },
  tagRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
    flexWrap: 'wrap',
  },
  vibeTag: {
    background: '#000000',
    color: '#C8FF00',
    padding: '4px 10px',
    fontWeight: 800,
    fontSize: '12px',
    textTransform: 'uppercase',
    transform: 'rotate(-1deg)',
    fontFamily: "'Inter', sans-serif",
  },
  vibeTagHot: {
    background: '#FF0055',
    color: '#FFFFFF',
    padding: '4px 10px',
    fontWeight: 800,
    fontSize: '12px',
    textTransform: 'uppercase',
    transform: 'rotate(-1deg)',
    fontFamily: "'Inter', sans-serif",
  },
  heroTitleMain: {
    fontFamily: "'Anton', sans-serif",
    fontSize: '64px',
    lineHeight: 1,
    textTransform: 'uppercase',
    marginBottom: '16px',
    color: '#000000',
  },
  vibeDescription: {
    fontSize: '18px',
    lineHeight: 1.5,
    color: '#444444',
    maxWidth: '600px',
  },
  sidebarPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  auctionPanel: {
    background: '#1A1A1A',
    border: '2px solid #C8FF00',
    padding: '24px',
    borderRadius: '8px',
  },
  panelLabel: {
    fontSize: '12px',
    textTransform: 'uppercase',
    color: '#888888',
    fontWeight: 700,
    letterSpacing: '1px',
    marginBottom: '4px',
  },
  panelValueLarge: {
    fontFamily: "'Anton', sans-serif",
    fontSize: '48px',
    color: '#C8FF00',
    lineHeight: 1,
    marginBottom: '24px',
  },
  timerGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
    marginBottom: '24px',
  },
  timerBox: {
    background: '#000000',
    padding: '8px',
    textAlign: 'center',
    border: '1px solid #333333',
  },
  timerNum: {
    display: 'block',
    fontFamily: "'Anton', sans-serif",
    fontSize: '24px',
    color: '#FFFFFF',
  },
  timerUnit: {
    fontSize: '10px',
    textTransform: 'uppercase',
    color: '#666666',
    fontWeight: 700,
  },
  bidControls: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  incrementRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '8px',
  },
  btnPrimaryBid: {
    background: '#C8FF00',
    color: '#000000',
    border: 'none',
    padding: '18px',
    fontFamily: "'Anton', sans-serif",
    fontSize: '24px',
    textTransform: 'uppercase',
    cursor: 'pointer',
    width: '100%',
    boxShadow: '0 4px 0 #88AA00',
    transition: 'all 0.1s',
  },
  btnWatch: {
    background: 'transparent',
    color: '#FFFFFF',
    border: '2px solid #333333',
    padding: '12px',
    fontWeight: 700,
    textTransform: 'uppercase',
    fontSize: '14px',
    cursor: 'pointer',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontFamily: "'Inter', sans-serif",
  },
  historyPanel: {
    background: '#111111',
    borderRadius: '8px',
    padding: '24px',
    border: '1px solid #222222',
  },
  historyTitle: {
    fontFamily: "'Anton', sans-serif",
    fontSize: '18px',
    textTransform: 'uppercase',
    marginBottom: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  liveDot: {
    width: '8px',
    height: '8px',
    background: '#FF0055',
    borderRadius: '50%',
    display: 'inline-block',
    marginRight: '6px',
  },
  historyList: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  historyItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '13px',
    paddingBottom: '8px',
    borderBottom: '1px solid #222222',
    gap: '8px',
  },
  historyUser: {
    fontWeight: 700,
    color: '#C8FF00',
  },
  historyTime: {
    color: '#555555',
    fontSize: '11px',
  },
  historyAmt: {
    fontFamily: "'Anton', sans-serif",
    fontSize: '16px',
  },
  predictionPanel: {
    background: '#121212',
    border: '1px solid #2B2B2B',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '12px',
    overflow: 'hidden',
  },
  predictionTitle: {
    fontFamily: "'Anton', sans-serif",
    fontSize: '24px',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    lineHeight: 1.05,
    marginBottom: '8px',
    color: '#FFFFFF',
  },
  predictionHelp: {
    fontSize: '13px',
    color: '#8F8F8F',
    lineHeight: 1.5,
    marginBottom: '8px',
    overflowWrap: 'anywhere',
  },
  predictionBadgeRow: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
    marginBottom: '10px',
  },
  predictionBadge: {
    fontSize: '10px',
    fontWeight: 800,
    textTransform: 'uppercase',
    border: '1px solid #333333',
    padding: '2px 8px',
    borderRadius: '999px',
    color: '#BBBBBB',
  },
  predictionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '8px',
    marginBottom: '10px',
  },
  predictionInputWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    minWidth: 0,
  },
  predictionLabel: {
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    fontWeight: 700,
    color: '#999999',
  },
  predictionInput: {
    width: '100%',
    minWidth: 0,
    background: '#090909',
    color: '#FFFFFF',
    border: '1px solid #2E2E2E',
    borderRadius: '8px',
    padding: '10px 12px',
    fontSize: '14px',
    fontWeight: 600,
    fontFamily: "'Inter', sans-serif",
  },
  predictionButton: {
    width: '100%',
    background: '#C8FF00',
    color: '#000000',
    border: 'none',
    borderRadius: '8px',
    padding: '12px',
    fontFamily: "'Anton', sans-serif",
    fontWeight: 400,
    textTransform: 'uppercase',
    fontSize: '18px',
    letterSpacing: '0.5px',
    cursor: 'pointer',
    marginTop: '2px',
  },
  predictionStats: {
    marginTop: '10px',
    fontSize: '12px',
    color: '#9B9B9B',
    fontWeight: 700,
    overflowWrap: 'anywhere',
  },
  predictionSuccess: {
    marginTop: '10px',
    background: 'rgba(83,255,138,0.16)',
    border: '1px solid rgba(83,255,138,0.35)',
    color: '#A5FFC3',
    fontWeight: 700,
    fontSize: '12px',
    padding: '10px',
    borderRadius: '8px',
  },
  predictionError: {
    marginTop: '10px',
    background: 'rgba(255, 90, 120, 0.16)',
    border: '1px solid rgba(255, 110, 138, 0.42)',
    color: '#FFC2CC',
    fontWeight: 700,
    fontSize: '12px',
    padding: '10px',
    borderRadius: '8px',
  },
  predictionResolved: {
    marginTop: '6px',
    background: '#101010',
    border: '1px solid #333333',
    borderRadius: '8px',
    padding: '12px',
  },
  predictionResolvedTitle: {
    fontSize: '12px',
    textTransform: 'uppercase',
    color: '#BBBBBB',
    fontWeight: 800,
    marginBottom: '8px',
    letterSpacing: '0.5px',
  },
  svgDrip: {
    position: 'fixed',
    bottom: '-50px',
    left: '-50px',
    width: '400px',
    zIndex: 1,
    opacity: 0.15,
    transform: 'rotate(180deg)',
    pointerEvents: 'none',
  },
};

const LiveDot = () => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible((value) => !value);
    }, 750);
    return () => clearInterval(interval);
  }, []);

  return (
    <span
      style={{
        ...customStyles.liveDot,
        opacity: visible ? 1 : 0.3,
        transition: 'opacity 0.3s',
      }}
    />
  );
};

const IncrementButton = ({ label, onClick }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'transparent',
        border: hovered ? '1px solid #C8FF00' : '1px solid #444444',
        color: hovered ? '#C8FF00' : '#FFFFFF',
        padding: '10px',
        fontWeight: 700,
        cursor: 'pointer',
        transition: 'all 0.2s',
        fontFamily: "'Inter', sans-serif",
        fontSize: '14px',
      }}
      type="button"
    >
      {label}
    </button>
  );
};

const WatchButton = ({ isWatching, onClick }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...customStyles.btnWatch,
        borderColor: isWatching ? '#C8FF00' : hovered ? '#666666' : '#333333',
        color: isWatching ? '#C8FF00' : '#FFFFFF',
      }}
      type="button"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
      {isWatching ? 'Watching This Vibe' : 'Watch This Vibe'}
    </button>
  );
};

const BidHistory = ({ bids }) => (
  <div style={customStyles.historyPanel}>
    <div style={customStyles.historyTitle}>
      <span>
        <LiveDot /> Live Bids
      </span>
      <span style={{ fontSize: '11px', color: '#555555' }}>{bids.length} Total</span>
    </div>
    {bids.length === 0 && (
      <div style={{ padding: '24px 16px', textAlign: 'center', color: '#444', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>
        No bids yet — be the first
      </div>
    )}
    <ul style={customStyles.historyList}>
      {bids.map((bid, index) => (
        <li
          key={bid.id}
          style={{
            ...customStyles.historyItem,
            borderBottom: index === bids.length - 1 ? 'none' : '1px solid #222222',
          }}
        >
          <div>
            <span
              style={{
                ...customStyles.historyUser,
                color: index === 0 ? '#C8FF00' : '#888888',
              }}
            >
              {bid.user}
            </span>
            <div style={customStyles.historyTime}>{bid.time}</div>
          </div>
          <span
            style={{
              ...customStyles.historyAmt,
              color: index === 0 ? '#FFFFFF' : '#666666',
            }}
          >
            {bid.amount.toLocaleString()}
          </span>
        </li>
      ))}
    </ul>
  </div>
);

const Timer = ({ hours, mins, secs }) => (
  <div style={customStyles.timerGrid}>
    {[
      { val: String(hours).padStart(2, '0'), unit: 'Hours' },
      { val: String(mins).padStart(2, '0'), unit: 'Mins' },
      { val: String(secs).padStart(2, '0'), unit: 'Secs' },
    ].map(({ val, unit }) => (
      <div key={unit} style={customStyles.timerBox}>
        <span style={customStyles.timerNum}>{val}</span>
        <span style={customStyles.timerUnit}>{unit}</span>
      </div>
    ))}
  </div>
);

const App = ({ vibe }) => {
  const { balance, activeBids, placeBid, settleAuction, refreshState, loadPrediction, submitPrediction } = useVibeStore();
  const { profile, user } = useAuth();
  const router = useRouter();
  const selectedVibe = vibe || getAuctionItemBySlug(defaultAuctionSlug);
  const baseBid = safeBid(selectedVibe?.bid, 100);
  const buyNowPrice = selectedVibe?.buyNowPrice ?? null;

  const listedByRaw = selectedVibe?.listedBy || null;
  const authorRaw = selectedVibe?.author || null;
  const listedByHandle = listedByRaw && !looksLikeUuid(listedByRaw) ? String(listedByRaw) : null;
  const authorHandle = authorRaw ? String(authorRaw) : null;
  const viewerHandle = profile?.username ? `@${profile.username}` : null;
  const viewerUserId = user?.id || null;
  const isOwnVibe = Boolean(
    (viewerHandle && [authorHandle, listedByHandle].some((handle) => normalizeHandle(handle) === normalizeHandle(viewerHandle))) ||
      (viewerUserId && listedByRaw && String(viewerUserId) === String(listedByRaw)),
  );
  const categoryTag = getCategoryTag(selectedVibe?.category);
  const [titleLineOne, titleLineTwo] = splitTitle(selectedVibe?.title);
  const primaryListedByHandle = listedByHandle || authorHandle;
  const showOriginalAuthorLine =
    Boolean(listedByHandle && authorHandle) &&
    listedByHandle.replace(/^@/, '').toLowerCase() !== authorHandle.replace(/^@/, '').toLowerCase();

  const [viewportWidth, setViewportWidth] = useState(1200);

  const [currentBid, setCurrentBid] = useState(baseBid);
  const [isWatching, setIsWatching] = useState(false);
  const [bidPressed, setBidPressed] = useState(false);
  const [placingBid, setPlacingBid] = useState(false);
  const [showBidSuccess, setShowBidSuccess] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
  const [showBuySuccess, setShowBuySuccess] = useState(false);
  const [showBuyConfirm, setShowBuyConfirm] = useState(false);
  const [increment, setIncrement] = useState(0);
  const [timer, setTimer] = useState(() => getTimerFromVibe(selectedVibe));
  const [error, setError] = useState('');
  const [bids, setBids] = useState(() => makeInitialBidHistory(baseBid));
  const [topBid, setTopBid] = useState(null);
  const [predictionPriceInput, setPredictionPriceInput] = useState(String(baseBid));
  const [predictionMinutesInput, setPredictionMinutesInput] = useState('30');
  const [predictionSaving, setPredictionSaving] = useState(false);
  const [predictionData, setPredictionData] = useState(null);
  const [predictionStats, setPredictionStats] = useState({ totalPredictions: 0 });
  const [predictionError, setPredictionError] = useState('');
  const [predictionSuccess, setPredictionSuccess] = useState('');

  const isMobile = viewportWidth <= 768;
  const isTablet = viewportWidth <= 1120;
  useEffect(() => {
    const storedBid = activeBids.find(
      (entry) => normalize(entry?.id || entry?.name) === normalize(selectedVibe?.slug),
    );
    if (storedBid?.amount && Number.isFinite(storedBid.amount)) {
      setCurrentBid(storedBid.amount);
    }
  }, [activeBids, selectedVibe?.slug]);

  useEffect(() => {
    setCurrentBid(baseBid);
    setIncrement(0);
    setTimer(getTimerFromVibe(selectedVibe));
    setBids([]);
    setTopBid(null);
    setError('');
    setShowBidSuccess(false);
    setPredictionPriceInput(String(baseBid));
    setPredictionMinutesInput('30');
    setPredictionData(null);
    setPredictionStats({ totalPredictions: 0 });
    setPredictionError('');
    setPredictionSuccess('');
  }, [selectedVibe?.slug, selectedVibe?.timer, selectedVibe?.endTime, baseBid]);

  const loadBidHistory = useCallback(async () => {
    const vibeId = selectedVibe?.slug;
    if (!vibeId) return;

    try {
      const response = await fetch(`/api/auction/bids?vibeId=${encodeURIComponent(vibeId)}`, { cache: 'no-store' });
      const payload = await response.json();
      const incomingBids = Array.isArray(payload?.bids) ? payload.bids : [];
      setBids(incomingBids);

      const resolvedTop = resolveTopBid(payload?.topBid, incomingBids);
      setTopBid(resolvedTop);

      const topAmount = safeBid(resolvedTop?.amount, Number.NaN);
      if (Number.isFinite(topAmount)) {
        setCurrentBid((previous) => Math.max(previous, topAmount));
      }
    } catch {
      // Keep the existing UI state when bid-history refresh fails.
    }
  }, [selectedVibe?.slug]);

  const loadPredictionState = useCallback(async () => {
    const vibeId = selectedVibe?.slug;
    if (!vibeId) return;
    const payload = await loadPrediction(vibeId);
    setPredictionData(payload?.prediction || null);
    setPredictionStats(payload?.stats || { totalPredictions: 0 });
  }, [selectedVibe?.slug, loadPrediction]);

  useEffect(() => {
    const syncAuctionData = async () => {
      try {
        await refreshState();
      } catch {
        // Ignore state refresh errors and keep current state.
      }
      await loadBidHistory();
      await loadPredictionState();
    };

    syncAuctionData();

    const onFocus = () => {
      if (document.visibilityState === 'visible') {
        syncAuctionData();
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncAuctionData();
      }
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);

    const pollId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        syncAuctionData();
      }
    }, 15000);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.clearInterval(pollId);
    };
  }, [loadBidHistory, loadPredictionState, refreshState]);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;700;800&display=swap');
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { overflow-x: hidden; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    const updateViewportWidth = () => setViewportWidth(window.innerWidth);
    updateViewportWidth();
    window.addEventListener('resize', updateViewportWidth);
    return () => window.removeEventListener('resize', updateViewportWidth);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((previous) => {
        const { hours, mins, secs } = previous;
        if (secs > 0) return { hours, mins, secs: secs - 1 };
        if (mins > 0) return { hours, mins: mins - 1, secs: 59 };
        if (hours > 0) return { hours: hours - 1, mins: 59, secs: 59 };
        return { hours: 0, mins: 0, secs: 0 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const addIncrement = (amount) => {
    setIncrement((previous) => previous + amount);
    setError('');
  };

  const auctionEnded = timer.hours === 0 && timer.mins === 0 && timer.secs === 0;

  const vibeNormId = normalize(selectedVibe?.slug || selectedVibe?.title || '');
  const topBidUser = topBid?.user || null;
  const topBidUserId = topBid?.userId || null;
  const userIsHighestBidder = Boolean(
    auctionEnded &&
      ((viewerUserId && topBidUserId && String(viewerUserId) === String(topBidUserId)) ||
        (viewerHandle && topBidUser && normalizeHandle(topBidUser) === normalizeHandle(viewerHandle))),
  );
  const viewerPlacedBid = Boolean(
    (viewerUserId && bids.some((bid) => bid?.userId && String(bid.userId) === String(viewerUserId))) ||
      (viewerHandle &&
        (bids.some((bid) => normalizeHandle(bid?.user) === normalizeHandle(viewerHandle)) ||
          (topBidUser && normalizeHandle(topBidUser) === normalizeHandle(viewerHandle)))),
  );

  const onSubmitPrediction = async () => {
    setPredictionError('');
    setPredictionSuccess('');

    if (!user) {
      setPredictionError('Sign in to submit predictions.');
      return;
    }
    if (auctionEnded) {
      setPredictionError('Predictions are closed for ended auctions.');
      return;
    }

    const predictedPrice = Math.round(safeBid(predictionPriceInput, Number.NaN));
    const predictedMinutes = Math.round(safeBid(predictionMinutesInput, Number.NaN));
    if (!Number.isFinite(predictedPrice) || predictedPrice <= 0) {
      setPredictionError('Enter a valid predicted final price.');
      return;
    }
    if (!Number.isFinite(predictedMinutes) || predictedMinutes <= 0 || predictedMinutes > 10080) {
      setPredictionError('Winner timing must be between 1 and 10,080 minutes.');
      return;
    }

    const predictedWinnerTime = new Date(Date.now() + predictedMinutes * 60 * 1000).toISOString();
    setPredictionSaving(true);
    const result = await submitPrediction({
      vibeId: selectedVibe?.slug || defaultAuctionSlug,
      vibeName: selectedVibe?.title || 'Unknown Vibe',
      predictedPrice,
      predictedWinnerTime,
    });
    setPredictionSaving(false);

    if (!result?.accepted) {
      if (result?.reason === 'auth_required') {
        setPredictionError('Sign in to submit predictions.');
      } else if (result?.reason === 'vibe_not_found') {
        setPredictionError('This vibe is no longer available.');
      } else if (result?.reason === 'auction_ended') {
        setPredictionError('This auction already ended. Predictions are closed.');
      } else if (result?.reason === 'invalid_prediction_time') {
        setPredictionError('Pick a winner timing in the near future.');
      } else if (result?.reason === 'prediction_unavailable') {
        setPredictionError('Prediction game is unavailable in this environment.');
      } else {
        setPredictionError('Could not save prediction. Try again.');
      }
      return;
    }

    setPredictionData(result?.prediction || null);
    setPredictionStats(result?.stats || { totalPredictions: 0 });
    setPredictionSuccess('Prediction locked in. You can update it before the auction ends.');
  };

  const onClaimWin = useCallback(async () => {
    const winningAmount = safeBid(topBid?.amount, currentBid);
    const params = new URLSearchParams({
      id: vibeNormId,
      name: selectedVibe?.title || 'Unknown Vibe',
      emoji: selectedVibe?.emoji || '✨',
      amount: String(winningAmount),
      slug: selectedVibe?.slug || vibeNormId,
      category: selectedVibe?.category || 'Vibes',
    });
    router.push(`/won?${params.toString()}`);
  }, [vibeNormId, selectedVibe, currentBid, topBid, router]);

  const onPlaceBid = async () => {
    if (placingBid || auctionEnded) return;
    const bidAmount = currentBid + (increment > 0 ? increment : 50);

    if (balance < bidAmount) {
      setError(`Insufficient balance for ${bidAmount.toLocaleString()} AURA bid.`);
      setShowBidSuccess(false);
      return;
    }

    setBidPressed(true);
    setTimeout(() => setBidPressed(false), 180);
    setPlacingBid(true);

    const bidResult = await placeBid({
      id: selectedVibe?.slug || defaultAuctionSlug,
      name: selectedVibe?.title || 'Unknown Vibe',
      emoji: selectedVibe?.emoji || '✨',
      amount: bidAmount,
    });

    setPlacingBid(false);

    if (!bidResult?.accepted) {
      if (bidResult?.reason === 'bid_too_low') {
        const minBid = Number(bidResult?.minimumBid);
        setError(
          Number.isFinite(minBid)
            ? `Bid too low. Minimum is ${minBid.toLocaleString()} AURA.`
            : 'Bid too low. Another bidder is ahead.',
        );
        await loadBidHistory();
      } else if (bidResult?.reason === 'auth_required') {
        setError('Sign in to place bids.');
      } else if (bidResult?.reason === 'insufficient_balance') {
        setError('Not enough AURA balance for this bid.');
      } else if (bidResult?.reason === 'self_bid_blocked') {
        setError('You cannot bid on your own listing.');
      } else if (bidResult?.reason === 'vibe_not_found') {
        setError('This vibe is no longer available.');
      } else {
        setError('Failed to place bid. Try again.');
      }
      setShowBidSuccess(false);
      return;
    }

    setCurrentBid(bidAmount);
    const clientBid = {
      id: Date.now(),
      userId: viewerUserId || null,
      user: viewerHandle || '@You',
      time: 'just now',
      amount: bidAmount,
      createdAt: new Date().toISOString(),
    };
    setBids((previous) => [
      clientBid,
      ...previous,
    ]);
    setTopBid((previous) => {
      const prevAmount = safeBid(previous?.amount, Number.NaN);
      if (!Number.isFinite(prevAmount) || bidAmount >= prevAmount) {
        return clientBid;
      }
      return previous;
    });
    setIncrement(0);
    setError('');
    setShowBidSuccess(true);
    setTimeout(() => setShowBidSuccess(false), 1800);
  };

  const onBuyNow = async () => {
    if (buyingNow || !buyNowPrice) return;
    if (balance < buyNowPrice) {
      setError(`Insufficient balance. Need ${buyNowPrice.toLocaleString()} AURA.`);
      setShowBuyConfirm(false);
      return;
    }
    setShowBuyConfirm(false);
    setBuyingNow(true);
    setError('');
    const settled = await settleAuction({
      id: selectedVibe?.slug || defaultAuctionSlug,
      name: selectedVibe?.title || 'Unknown Vibe',
      emoji: selectedVibe?.emoji || '✨',
      category: selectedVibe?.category || 'Vibes',
      price: buyNowPrice,
      rarity: 'rare',
      imageUrl: selectedVibe?.imageUrl ?? null,
      author: selectedVibe?.author ?? null,
      directPurchase: true,
    });
    setBuyingNow(false);
    if (!settled?.settled) {
      if (settled?.reason === 'auth_required') {
        setError('Sign in to purchase vibes.');
      } else if (settled?.reason === 'insufficient_balance') {
        setError('Insufficient balance for this purchase.');
      } else if (settled?.reason === 'already_owned') {
        setError('This vibe is no longer available.');
      } else if (settled?.reason === 'buy_now_unavailable') {
        setError('Buy Now is no longer available for this vibe.');
      } else if (settled?.reason === 'auction_not_ended') {
        setError('This auction has not ended yet.');
      } else if (settled?.reason === 'invalid_settlement_amount') {
        setError('Purchase amount is invalid. Please refresh and try again.');
      } else if (settled?.reason === 'balance_update_failed') {
        setError('Purchase could not be finalized. Please try again.');
      } else {
        setError('Purchase failed. Try again.');
      }
      await loadBidHistory();
      return;
    }
    setShowBuySuccess(true);
  };

  const displayBid = currentBid + increment;
  const predictionPoints = Number.isFinite(profile?.prediction_points) ? profile.prediction_points : 0;
  const savedPredictedPrice = safeBid(predictionData?.predictedPrice, Number.NaN);
  const savedPointsAwarded = safeBid(predictionData?.pointsAwarded, 0);

  return (
    <div style={customStyles.body}>
      <NavBar />

      <div
        style={{
          ...customStyles.breadcrumb,
          padding: isMobile ? '14px 16px' : customStyles.breadcrumb.padding,
          fontSize: isMobile ? '11px' : customStyles.breadcrumb.fontSize,
        }}
      >
        Browse / {selectedVibe?.category || 'Vibes'} /{' '}
        <span style={customStyles.breadcrumbAccent}>{selectedVibe?.title || 'Unknown Vibe'}</span>
      </div>

      <div
        style={{
          ...customStyles.detailLayout,
          gridTemplateColumns: isTablet ? '1fr' : customStyles.detailLayout.gridTemplateColumns,
          gap: isMobile ? '18px' : customStyles.detailLayout.gap,
          padding: isMobile ? '0 16px 30px' : customStyles.detailLayout.padding,
        }}
      >
        <div>
          <div style={customStyles.vibeHeroCard}>
            <div style={{ ...customStyles.heroVisual, height: isMobile ? '290px' : customStyles.heroVisual.height }}>
              <div style={customStyles.patternDots} />
              {selectedVibe?.imageUrl ? (
                <img
                  src={selectedVibe.imageUrl}
                  alt={selectedVibe.title || 'Vibe'}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 }}
                />
              ) : (
                <div style={{ ...customStyles.heroEmoji, fontSize: isMobile ? '118px' : customStyles.heroEmoji.fontSize }}>
                  {selectedVibe?.emoji || '✨'}
                </div>
              )}
            </div>

            <div style={{ ...customStyles.heroInfo, padding: isMobile ? '18px 16px' : customStyles.heroInfo.padding }}>
              <div style={customStyles.tagRow}>
                <span style={customStyles.vibeTag}>{categoryTag}</span>
                {selectedVibe?.badge && <span style={customStyles.vibeTagHot}>{selectedVibe.badge} Listing</span>}
              </div>

              <h1
                style={{
                  ...customStyles.heroTitleMain,
                  fontSize: isMobile ? '42px' : customStyles.heroTitleMain.fontSize,
                }}
              >
                {titleLineOne}
                {titleLineTwo && (
                  <>
                    <br />
                    {titleLineTwo}
                  </>
                )}
              </h1>

              <p style={{ ...customStyles.vibeDescription, fontSize: isMobile ? '15px' : customStyles.vibeDescription.fontSize }}>
                {selectedVibe?.description || 'This vibe is live and currently accepting bids.'}
              </p>

              {(authorHandle || primaryListedByHandle) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #2A2A2A' }}>
                  {primaryListedByHandle && (
                    <div style={{ fontSize: '13px', color: '#888888', fontWeight: 600 }}>
                      <span style={{ color: '#555555', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px', marginRight: '6px' }}>Listed by</span>
                      <span style={{ color: '#C8FF00' }}>
                        {primaryListedByHandle.startsWith('@') ? primaryListedByHandle : `@${primaryListedByHandle}`}
                      </span>
                    </div>
                  )}
                  {showOriginalAuthorLine && (
                    <div style={{ fontSize: '13px', color: '#888888', fontWeight: 600 }}>
                      <span style={{ color: '#555555', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px', marginRight: '6px' }}>Original vibe by</span>
                      <span style={{ color: '#AAAAAA' }}>
                        {authorHandle.startsWith('@') ? authorHandle : `@${authorHandle}`}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <aside style={customStyles.sidebarPanel}>
          <div style={{ ...customStyles.auctionPanel, padding: isMobile ? '18px 16px' : customStyles.auctionPanel.padding }}>
            <div style={customStyles.panelLabel}>Current Bid</div>
            <div
              style={{
                ...customStyles.panelValueLarge,
                fontSize: isMobile ? '42px' : customStyles.panelValueLarge.fontSize,
              }}
            >
              {displayBid.toLocaleString()} AURA
            </div>

            <div style={customStyles.panelLabel}>Auction Ends In</div>
            <Timer hours={timer.hours} mins={timer.mins} secs={timer.secs} />

            {showBidSuccess && (
              <div
                style={{
                  background: '#C8FF00',
                  color: '#000000',
                  padding: '10px',
                  fontWeight: 800,
                  fontSize: '13px',
                  textAlign: 'center',
                  marginBottom: '12px',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                ✓ Bid placed successfully
              </div>
            )}

            {error && (
              <div
                style={{
                  background: 'rgba(255, 80, 80, 0.16)',
                  color: '#FFB3B3',
                  border: '1px solid rgba(255, 80, 80, 0.38)',
                  padding: '10px',
                  fontWeight: 700,
                  fontSize: '13px',
                  textAlign: 'center',
                  marginBottom: '12px',
                }}
              >
                {error}
              </div>
            )}

            {isOwnVibe ? (
              <div
                style={{
                  background: '#1A1A0A',
                  border: '2px solid #555500',
                  padding: '16px',
                  textAlign: 'center',
                  color: '#AAAA00',
                  fontWeight: 700,
                  fontSize: '13px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                This is your listing — you can't bid on your own vibe
              </div>
            ) : auctionEnded ? (
              userIsHighestBidder ? (
                <div style={{ background: '#0A1A0A', border: '2px solid #C8FF00', borderRadius: '8px', padding: '24px', textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Anton', sans-serif", fontSize: '28px', color: '#C8FF00', letterSpacing: '1px', marginBottom: '6px' }}>🏆 YOU WON!</div>
                  <div style={{ fontSize: '13px', color: '#AAAAAA', marginBottom: '18px' }}>
                    Winning bid: <strong style={{ color: '#C8FF00' }}>{currentBid.toLocaleString()} AURA</strong>
                  </div>
                  <button
                    onClick={onClaimWin}
                    style={{ background: '#C8FF00', color: '#000000', border: 'none', padding: '14px 28px', fontFamily: "'Anton', sans-serif", fontSize: '18px', textTransform: 'uppercase', cursor: 'pointer', width: '100%' }}
                  >
                    Claim Your Vibe →
                  </button>
                </div>
              ) : (
                <div style={{ background: '#1A0A0A', border: '2px solid #FF0055', borderRadius: '8px', padding: '20px', textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Anton', sans-serif", fontSize: '22px', color: '#FF0055', letterSpacing: '1px' }}>AUCTION ENDED</div>
                  <div style={{ fontSize: '13px', color: '#888888', marginTop: '6px' }}>
                    This auction has closed. {viewerPlacedBid ? 'You were outbid.' : 'Check your Vault if you won.'}
                  </div>
                </div>
              )
            ) : (
              <div style={customStyles.bidControls}>
                <div style={customStyles.incrementRow}>
                  <IncrementButton label="+50" onClick={() => addIncrement(50)} />
                  <IncrementButton label="+100" onClick={() => addIncrement(100)} />
                  <IncrementButton label="+500" onClick={() => addIncrement(500)} />
                </div>

                <button
                  onClick={onPlaceBid}
                  style={{
                    ...customStyles.btnPrimaryBid,
                    transform: bidPressed ? 'translateY(2px)' : 'none',
                    boxShadow: bidPressed ? '0 2px 0 #88AA00' : '0 4px 0 #88AA00',
                    fontSize: isMobile ? '20px' : customStyles.btnPrimaryBid.fontSize,
                    padding: isMobile ? '15px' : customStyles.btnPrimaryBid.padding,
                    opacity: placingBid ? 0.7 : 1,
                    cursor: placingBid ? 'not-allowed' : customStyles.btnPrimaryBid.cursor,
                  }}
                  type="button"
                  disabled={placingBid}
                >
                  {placingBid ? 'Placing Bid...' : 'Place Bid Now'}
                </button>

                <WatchButton isWatching={isWatching} onClick={() => setIsWatching((watching) => !watching)} />
              </div>
            )}
          </div>

          {buyNowPrice && !isOwnVibe && (
            <div
              style={{
                background: '#111111',
                border: '2px solid #FF0055',
                borderRadius: '8px',
                padding: isMobile ? '18px 16px' : '24px',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#888888', marginBottom: '6px' }}>
                Skip the Auction
              </div>
              <div style={{ fontFamily: "'Anton', sans-serif", fontSize: isMobile ? '32px' : '40px', color: '#FF0055', lineHeight: 1, marginBottom: '16px' }}>
                {buyNowPrice.toLocaleString()} AURA
              </div>

              {showBuySuccess ? (
                <div style={{ background: '#FF0055', color: '#FFFFFF', padding: '14px', fontWeight: 800, fontSize: '14px', textAlign: 'center', fontFamily: "'Inter', sans-serif" }}>
                  ✓ It's yours! Check your Vault.
                </div>
              ) : showBuyConfirm ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ background: '#1A0A10', border: '1px solid #FF0055', padding: '14px', textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: '#FF8888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                      Confirm Purchase
                    </div>
                    <div style={{ fontFamily: "'Anton', sans-serif", fontSize: isMobile ? '20px' : '24px', color: '#FFFFFF', lineHeight: 1.1, marginBottom: '4px' }}>
                      {selectedVibe?.title}
                    </div>
                    <div style={{ fontFamily: "'Anton', sans-serif", fontSize: isMobile ? '28px' : '34px', color: '#FF0055' }}>
                      {buyNowPrice.toLocaleString()} AURA
                    </div>
                    <div style={{ fontSize: '11px', color: '#555', marginTop: '6px', fontWeight: 700 }}>
                      Balance after: {(balance - buyNowPrice).toLocaleString()} AURA
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={onBuyNow}
                      disabled={buyingNow}
                      style={{
                        flex: 1,
                        background: buyingNow ? '#880033' : '#FF0055',
                        color: '#FFFFFF',
                        border: 'none',
                        padding: '13px',
                        fontFamily: "'Anton', sans-serif",
                        fontSize: isMobile ? '16px' : '18px',
                        textTransform: 'uppercase',
                        cursor: buyingNow ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {buyingNow ? 'Processing...' : 'Confirm'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowBuyConfirm(false)}
                      style={{
                        flex: 1,
                        background: 'transparent',
                        color: '#888888',
                        border: '2px solid #333333',
                        padding: '13px',
                        fontFamily: "'Anton', sans-serif",
                        fontSize: isMobile ? '16px' : '18px',
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowBuyConfirm(true)}
                  style={{
                    width: '100%',
                    background: '#FF0055',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: isMobile ? '14px' : '16px',
                    fontFamily: "'Anton', sans-serif",
                    fontSize: isMobile ? '18px' : '20px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                >
                  Buy It Now
                </button>
              )}

              {!showBuySuccess && !showBuyConfirm && (
                <div style={{ fontSize: '11px', color: '#555555', marginTop: '10px', textAlign: 'center', fontWeight: 700 }}>
                  Instant purchase · No auction wait
                </div>
              )}
            </div>
          )}

          <div style={{ ...customStyles.predictionPanel, padding: isMobile ? '12px' : customStyles.predictionPanel.padding }}>
            <div style={{ ...customStyles.predictionTitle, fontSize: isMobile ? '20px' : customStyles.predictionTitle.fontSize }}>
              Prediction Side-Game
            </div>
            <div style={customStyles.predictionHelp}>
              Guess the final price and when the winning bid lands. You earn points only, no AURA payout.
            </div>

            <div style={customStyles.predictionBadgeRow}>
              <span style={customStyles.predictionBadge}>Side-Game</span>
              <span style={customStyles.predictionBadge}>Points Only</span>
              <span
                style={{
                  ...customStyles.predictionBadge,
                  color: predictionData?.resolved ? '#8FC8FF' : '#A8FF8F',
                  borderColor: predictionData?.resolved ? '#2A4F6C' : '#2A5E2A',
                }}
              >
                {predictionData?.resolved ? 'resolved' : 'open'}
              </span>
            </div>

            <div
              style={{
                ...customStyles.predictionStats,
                marginTop: 0,
                marginBottom: '10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: '#D2D2D2',
              }}
            >
              <span>Your prediction points</span>
              <span style={{ color: '#C8FF00' }}>{predictionPoints.toLocaleString()}</span>
            </div>

            {!predictionData?.resolved && (
              <>
                <div
                  style={{
                    ...customStyles.predictionGrid,
                    gridTemplateColumns: isMobile ? '1fr' : customStyles.predictionGrid.gridTemplateColumns,
                  }}
                >
                  <label style={customStyles.predictionInputWrap}>
                    <span style={customStyles.predictionLabel}>Final Price Guess (AURA)</span>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={predictionPriceInput}
                      onChange={(event) => {
                        setPredictionPriceInput(event.target.value);
                        setPredictionError('');
                        setPredictionSuccess('');
                      }}
                      style={customStyles.predictionInput}
                    />
                  </label>

                  <label style={customStyles.predictionInputWrap}>
                    <span style={customStyles.predictionLabel}>Winner Timing (minutes from now)</span>
                    <input
                      type="number"
                      min={1}
                      max={10080}
                      step={1}
                      value={predictionMinutesInput}
                      onChange={(event) => {
                        setPredictionMinutesInput(event.target.value);
                        setPredictionError('');
                        setPredictionSuccess('');
                      }}
                      style={customStyles.predictionInput}
                    />
                  </label>
                </div>

                <button
                  type="button"
                  onClick={onSubmitPrediction}
                  disabled={predictionSaving || auctionEnded || !user}
                  style={{
                    ...customStyles.predictionButton,
                    opacity: predictionSaving || auctionEnded || !user ? 0.6 : 1,
                    cursor: predictionSaving || auctionEnded || !user ? 'not-allowed' : customStyles.predictionButton.cursor,
                  }}
                >
                  {predictionSaving ? 'Saving Prediction...' : predictionData ? 'Update Prediction' : 'Lock Prediction'}
                </button>

                {predictionData && (
                  <div style={customStyles.predictionSuccess}>
                    Current pick: {Number.isFinite(savedPredictedPrice) ? `${savedPredictedPrice.toLocaleString()} AURA` : '—'} at{' '}
                    {formatPredictionClock(predictionData.predictedWinnerTime)}
                  </div>
                )}
              </>
            )}

            {predictionData?.resolved && (
              <div style={customStyles.predictionResolved}>
                <div style={customStyles.predictionResolvedTitle}>Round Scored</div>
                <div style={{ fontFamily: "'Anton', sans-serif", fontSize: '30px', color: '#C8FF00', lineHeight: 1, marginBottom: '8px' }}>
                  +{savedPointsAwarded.toLocaleString()} pts
                </div>
                <div style={{ fontSize: '12px', color: '#D0D0D0', lineHeight: 1.6 }}>
                  Price: {Number.isFinite(savedPredictedPrice) ? savedPredictedPrice.toLocaleString() : '—'} guess vs{' '}
                  {Number.isFinite(safeBid(predictionData.actualFinalPrice, Number.NaN))
                    ? safeBid(predictionData.actualFinalPrice, 0).toLocaleString()
                    : '—'} final
                </div>
                <div style={{ fontSize: '12px', color: '#D0D0D0', lineHeight: 1.6 }}>
                  Timing: {formatPredictionClock(predictionData.predictedWinnerTime)} guess vs{' '}
                  {formatPredictionClock(predictionData.actualWinnerTime)} winner
                </div>
              </div>
            )}

            {!user && (
              <div style={customStyles.predictionStats}>
                Sign in to join this side-game.
              </div>
            )}
            <div style={customStyles.predictionStats}>
              {safeBid(predictionStats?.totalPredictions, 0).toLocaleString()} predictions placed on this vibe
            </div>

            {predictionSuccess && <div style={customStyles.predictionSuccess}>{predictionSuccess}</div>}
            {predictionError && <div style={customStyles.predictionError}>{predictionError}</div>}
          </div>

          <BidHistory bids={bids} />
        </aside>
      </div>

      <svg style={customStyles.svgDrip} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <path
          fill="#C8FF00"
          d="M0,0 L200,0 L200,80 C180,80 170,120 150,120 C130,120 130,60 110,60 C90,60 90,140 70,140 C50,140 40,90 20,90 C10,90 0,100 0,100 Z"
        />
      </svg>
    </div>
  );
};

export default App;
