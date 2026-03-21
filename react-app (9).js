'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useVibeStore } from './app/state/vibe-store';
import NavBar from './app/components/NavBar';
import VibeOrPassHero from './app/components/VibeOrPassHero';
import { HOME_TICKER_ITEMS } from './lib/brand.js';

const HOME_BATCH_SIZE = 12;

const normalize = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const parseCountdownToMs = (timerText) => {
  if (typeof timerText !== 'string') return Number.MAX_SAFE_INTEGER;
  const dayMatch = timerText.match(/(\d+)\s*d/i);
  const hourMatch = timerText.match(/(\d+)\s*h/i);
  const minMatch = timerText.match(/(\d+)\s*m/i);
  const secMatch = timerText.match(/(\d+)\s*s/i);

  if (!dayMatch && !hourMatch && !minMatch && !secMatch) return Number.MAX_SAFE_INTEGER;

  let ms = 0;
  if (dayMatch) ms += Number(dayMatch[1]) * 24 * 60 * 60 * 1000;
  if (hourMatch) ms += Number(hourMatch[1]) * 60 * 60 * 1000;
  if (minMatch) ms += Number(minMatch[1]) * 60 * 1000;
  if (secMatch) ms += Number(secMatch[1]) * 1000;
  return ms;
};

const safeNumber = (value, fallback = 0) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/,/g, '').trim());
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

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

const getItemKeys = (item) => {
  const keys = [];
  const seen = new Set();
  [item?.slug, item?.id, item?.title].forEach((value) => {
    const key = normalize(value);
    if (!key || seen.has(key)) return;
    seen.add(key);
    keys.push(key);
  });
  return keys;
};

const formatAura = (value) => `${Number(value || 0).toLocaleString()} AURA`;

const customStyles = {
  body: {
    backgroundColor: '#0D0D0D',
    color: '#FFFFFF',
    fontFamily: "'Inter', sans-serif",
    WebkitFontSmoothing: 'antialiased',
    overflowX: 'hidden',
    minHeight: '100dvh',
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
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
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
  tickerWrap: {
    background: '#C8FF00',
    color: '#000000',
    padding: '8px 0',
    overflow: 'hidden',
    marginBottom: '24px',
    borderBottom: '2px solid #000000',
  },
  tickerItem: {
    fontWeight: 800,
    fontSize: '14px',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  },
  hero: {
    position: 'relative',
    padding: '40px 24px 40px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  heroGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) minmax(320px, 420px)',
    gap: '24px',
    alignItems: 'end',
  },
  heroTitle: {
    fontFamily: "'Anton', sans-serif",
    fontSize: '82px',
    lineHeight: 0.9,
    textTransform: 'uppercase',
    marginBottom: '16px',
    maxWidth: '800px',
    color: '#FFFFFF',
  },
  highlightTag: {
    display: 'inline-block',
    background: '#C8FF00',
    color: '#000000',
    padding: '4px 12px',
    fontFamily: "'Inter', sans-serif",
    fontWeight: 800,
    fontSize: '20px',
    transform: 'rotate(-2deg)',
    marginLeft: '10px',
    verticalAlign: 'middle',
    boxShadow: '4px 4px 0px rgba(200, 255, 0, 0.2)',
  },
  heroPulse: {
    background: 'linear-gradient(165deg, rgba(22,22,22,0.95) 0%, rgba(12,12,12,0.95) 100%)',
    border: '1px solid #2E2E2E',
    borderRadius: '12px',
    padding: '16px',
    minHeight: '172px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    boxShadow: '6px 6px 0px rgba(0, 0, 0, 0.4)',
  },
  pulseHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
  },
  pulseTitle: {
    fontFamily: "'Anton', sans-serif",
    fontSize: '28px',
    lineHeight: 1,
    letterSpacing: '0.4px',
    textTransform: 'uppercase',
    color: '#FFFFFF',
  },
  pulseTag: {
    background: '#C8FF00',
    color: '#000000',
    border: '1px solid #000000',
    padding: '4px 8px',
    fontSize: '10px',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  pulseStatsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '8px',
  },
  pulseStat: {
    background: '#0B0B0B',
    border: '1px solid #242424',
    borderRadius: '8px',
    padding: '8px 10px',
    minWidth: 0,
  },
  pulseStatLabel: {
    color: '#8C8C8C',
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    fontWeight: 700,
    marginBottom: '2px',
  },
  pulseStatValue: {
    color: '#FFFFFF',
    fontWeight: 800,
    fontSize: '16px',
    lineHeight: 1.2,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  pulseLatest: {
    borderTop: '1px solid #232323',
    paddingTop: '10px',
    minWidth: 0,
  },
  pulseLatestLabel: {
    color: '#8C8C8C',
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    fontWeight: 700,
    marginBottom: '4px',
  },
  pulseLatestValue: {
    color: '#C8FF00',
    fontWeight: 800,
    fontSize: '14px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  layoutGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(220px, 240px) minmax(0, 1fr)',
    gap: '32px',
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 24px 32px',
  },
  filters: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  filterGroupTitle: {
    fontFamily: "'Anton', sans-serif",
    fontSize: '24px',
    textTransform: 'uppercase',
    marginBottom: '8px',
    color: '#C8FF00',
  },
  filterList: {
    listStyle: 'none',
    padding: '0',
    margin: '0',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  auctionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    alignItems: 'start',
    gap: '24px',
  },
  card: {
    background: '#FFFFFF',
    borderRadius: '8px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    border: '2px solid #C8FF00',
    boxShadow: '6px 6px 0px rgba(200, 255, 0, 0.3)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    position: 'relative',
    cursor: 'pointer',
    width: '100%',
    minWidth: 0,
  },
  cardImageArea: {
    height: '160px',
    background: '#F0F0F0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderBottom: '2px solid #000000',
  },
  patternDots: {
    backgroundImage: 'radial-gradient(#000000 1px, transparent 1px)',
    backgroundSize: '10px 10px',
    opacity: 0.1,
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  cardFallback: {
    fontSize: '13px',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    border: '2px solid #222222',
    padding: '8px 12px',
    background: 'rgba(255,255,255,0.6)',
    zIndex: 1,
  },
  liveBadge: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    background: '#000000',
    color: '#C8FF00',
    fontWeight: 800,
    fontSize: '10px',
    textTransform: 'uppercase',
    padding: '4px 8px',
    border: '1px solid #C8FF00',
    transform: 'rotate(2deg)',
    zIndex: 2,
  },
  cardContent: {
    padding: '16px',
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    color: '#000000',
  },
  cardTitle: {
    fontFamily: "'Anton', sans-serif",
    fontSize: '22px',
    lineHeight: 1.1,
    marginBottom: '8px',
    textTransform: 'uppercase',
    overflowWrap: 'anywhere',
  },
  cardMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: '8px',
    marginTop: 'auto',
    borderTop: '1px solid #DDDDDD',
    paddingTop: '8px',
  },
  bidInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  bidLabel: {
    fontSize: '10px',
    textTransform: 'uppercase',
    fontWeight: 700,
    color: '#888888',
    letterSpacing: '0.5px',
  },
  bidAmount: {
    fontFamily: "'Anton', sans-serif",
    fontSize: '20px',
    color: '#000000',
  },
  timer: {
    fontFamily: "'Inter', sans-serif",
    fontVariantNumeric: 'tabular-nums',
    fontWeight: 700,
    fontSize: '14px',
    color: '#666666',
  },
  cardActions: {
    padding: '8px 16px 16px',
  },
  btnBid: {
    width: '100%',
    background: '#000000',
    color: '#C8FF00',
    border: 'none',
    padding: '12px',
    fontFamily: "'Anton', sans-serif",
    fontSize: '18px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};

const sortOptions = ['Trending', 'Ending Soon', 'Most Absurd', 'Highest Aura', 'Newest'];

const staticTickerItems = HOME_TICKER_ITEMS;

const AuctionCard = ({ item, bidDisplay, onOpenAuction, isMobile, isSmallMobile, shakeToken = 0 }) => {
  const [hovered, setHovered] = useState(false);
  const [btnHovered, setBtnHovered] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [item.imageUrl]);

  useEffect(() => {
    if (!shakeToken) return;
    setIsShaking(false);
    const frameId = window.requestAnimationFrame(() => setIsShaking(true));
    const timeoutId = window.setTimeout(() => setIsShaking(false), 620);
    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
    };
  }, [shakeToken]);

  return (
    <article
      style={{
        ...customStyles.card,
        transform: hovered && !isMobile && !isShaking ? 'translate(-2px, -2px)' : 'none',
        boxShadow: hovered && !isMobile ? '8px 8px 0px #C8FF00' : '6px 6px 0px rgba(200, 255, 0, 0.3)',
        animation: isShaking ? 'va-bid-shake 620ms cubic-bezier(0.36, 0.07, 0.19, 0.97) both' : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onOpenAuction(item)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpenAuction(item);
        }
      }}
    >
      {item.badge && <div style={customStyles.liveBadge}>{item.badge}</div>}
      <div style={{ ...customStyles.cardImageArea, height: isMobile ? '140px' : '160px' }}>
        <div style={customStyles.patternDots}></div>
        {item.imageUrl && !imageFailed ? (
          <img
            src={item.imageUrl}
            alt={item.title}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 }}
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div style={{ ...customStyles.cardFallback, fontSize: isMobile ? '12px' : customStyles.cardFallback.fontSize }}>
            Image Pending
          </div>
        )}
      </div>
      <div style={{ ...customStyles.cardContent, padding: isMobile ? '14px' : '16px' }}>
        <h2 style={{ ...customStyles.cardTitle, fontSize: isSmallMobile ? '18px' : isMobile ? '20px' : '22px' }}>
          {item.title}
        </h2>
        <div
          style={{
            ...customStyles.cardMeta,
            flexDirection: isSmallMobile ? 'column' : 'row',
            alignItems: isSmallMobile ? 'flex-start' : customStyles.cardMeta.alignItems,
          }}
        >
          <div style={customStyles.bidInfo}>
            <span style={customStyles.bidLabel}>Current Bid</span>
            <span style={customStyles.bidAmount}>{bidDisplay}</span>
          </div>
          <span
            style={{
              ...customStyles.timer,
              fontSize: isMobile ? '13px' : '14px',
              alignSelf: isSmallMobile ? 'flex-start' : 'auto',
            }}
          >
            {item.timer}
          </span>
        </div>
      </div>
      <div
        style={{
          ...customStyles.cardActions,
          padding: isSmallMobile ? '8px 12px 12px' : isMobile ? '8px 14px 14px' : '8px 16px 16px',
        }}
      >
        <button
          style={{
            ...customStyles.btnBid,
            fontSize: isMobile ? '16px' : '18px',
            padding: isMobile ? '11px' : '12px',
            background: btnHovered ? '#C8FF00' : '#000000',
            color: btnHovered ? '#000000' : '#C8FF00',
          }}
          onMouseEnter={() => setBtnHovered(true)}
          onMouseLeave={() => setBtnHovered(false)}
          onClick={(event) => {
            event.stopPropagation();
            onOpenAuction(item);
          }}
          type="button"
        >
          Open Auction
        </button>
      </div>
    </article>
  );
};

const ROTATING_TAGLINES = [
  'No refunds. No regrets.',
  'Your therapist will have questions.',
  'Bidding is cheaper than therapy.',
  'Finally, a use for your crypto.',
  "The internet's lost and found.",
  'Collect what you cannot explain.',
  'Rare artifacts from the feed.',
];

const App = () => {
  const [activeCategory, setActiveCategory] = useState('All Vibes');
  const [activeSort, setActiveSort] = useState('Trending');
  const [liveAuctions, setLiveAuctions] = useState([]);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [syncNow, setSyncNow] = useState(Date.now());
  const [visibleCount, setVisibleCount] = useState(HOME_BATCH_SIZE);
  const [loadMoreTrigger, setLoadMoreTrigger] = useState(null);
  const [shakeTokensById, setShakeTokensById] = useState({});
  const [bumpedAtById, setBumpedAtById] = useState({});
  const [screenShakeToken, setScreenShakeToken] = useState(0);
  const [isScreenShaking, setIsScreenShaking] = useState(false);
  const [taglineIndex, setTaglineIndex] = useState(0);
  const [taglineFading, setTaglineFading] = useState(false);
  const prevBidActivityRef = useRef(null);
  const bidBaselineReadyRef = useRef(false);
  const latestBidSeenRef = useRef(0);

  // Rotating tagline cycle
  useEffect(() => {
    const id = setInterval(() => {
      setTaglineFading(true);
      setTimeout(() => {
        setTaglineIndex((i) => (i + 1) % ROTATING_TAGLINES.length);
        setTaglineFading(false);
      }, 400);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  const { balance, activeBids, refreshState } = useVibeStore();
  const router = useRouter();

  const isMobile = viewportWidth <= 768;
  const isTablet = viewportWidth <= 1024;
  const isSmallMobile = viewportWidth <= 420;
  const sidePadding = isSmallMobile ? 12 : isMobile ? 16 : isTablet ? 20 : 24;

  useEffect(() => {
    const updateViewportWidth = () => setViewportWidth(window.innerWidth);
    updateViewportWidth();
    window.addEventListener('resize', updateViewportWidth);

    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;700;800&display=swap');
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { background-color: #0D0D0D; overflow-x: hidden; }
      @keyframes scroll {
        0% { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }
      @keyframes va-bid-shake {
        10%, 90% { transform: translateX(-1px); }
        20%, 80% { transform: translateX(2px); }
        30%, 50%, 70% { transform: translateX(-4px); }
        40%, 60% { transform: translateX(4px); }
      }
      @keyframes va-screen-shake {
        10%, 90% { transform: translateX(-1px); }
        20%, 80% { transform: translateX(2px); }
        30%, 50%, 70% { transform: translateX(-5px); }
        40%, 60% { transform: translateX(5px); }
      }
      .ticker-anim {
        display: flex;
        gap: 32px;
        animation: scroll 20s linear infinite;
        white-space: nowrap;
      }
      .va-scroll-row {
        scrollbar-width: thin;
        scrollbar-color: rgba(200, 255, 0, 0.5) transparent;
      }
      .va-scroll-row::-webkit-scrollbar { height: 6px; }
      .va-scroll-row::-webkit-scrollbar-track { background: transparent; }
      .va-scroll-row::-webkit-scrollbar-thumb { background: rgba(200, 255, 0, 0.5); border-radius: 99px; }
      @keyframes va-hero-glow {
        0%, 100% { opacity: 0.25; transform: scale(1); }
        50% { opacity: 0.45; transform: scale(1.08); }
      }
      @keyframes va-hero-line {
        0% { transform: scaleX(0); opacity: 0; }
        50% { transform: scaleX(1); opacity: 1; }
        100% { transform: scaleX(0); opacity: 0; }
      }
      @keyframes va-tagline-in {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes va-pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      @keyframes va-stat-count {
        from { opacity: 0; transform: translateY(6px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .va-stat-pill {
        display: flex; flex-direction: column; gap: 2px;
        padding: 10px 16px; background: rgba(200, 255, 0, 0.04);
        border: 1px solid #1F1F1F; animation: va-stat-count 0.5s ease both;
      }
      .va-stat-pill:hover { border-color: #C8FF00; background: rgba(200, 255, 0, 0.08); }
      @media (max-width: 768px) {
        .ticker-anim { gap: 20px; animation-duration: 28s; }
        .va-hero-cta { padding: 12px 20px; font-size: 13px; }
      }
      @media (max-width: 420px) {
        .ticker-anim { gap: 14px; animation-duration: 34s; }
        .va-hero-cta { padding: 11px 16px; font-size: 12px; }
      }
    `;
    document.head.appendChild(style);

    return () => {
      window.removeEventListener('resize', updateViewportWidth);
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    const syncLatestVibes = async () => {
      try {
        const response = await fetch('/api/auctions/history?status=live&sort=newest&page=1&pageSize=250', {
          cache: 'no-store',
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error || 'Failed to load live auctions');
        }

        setLiveAuctions(Array.isArray(payload?.auctions) ? payload.auctions : []);
        setLastSyncedAt(Date.now());
      } catch {
        // Keep current UI state when background refresh fails.
      }
    };

    syncLatestVibes();

    const onFocus = () => {
      if (document.visibilityState === 'visible') syncLatestVibes();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') syncLatestVibes();
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);

    const pollId = window.setInterval(() => {
      if (document.visibilityState === 'visible') syncLatestVibes();
    }, 30000);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.clearInterval(pollId);
    };
  }, []);

  useEffect(() => {
    const clockId = window.setInterval(() => setSyncNow(Date.now()), 1000);
    return () => window.clearInterval(clockId);
  }, []);

  const bidActivityLookup = useMemo(() => {
    const lookup = {};
    activeBids.forEach((entry) => {
      const key = normalize(entry.id || entry.name);
      if (!key) return;
      const amount = Number(entry.amount);
      const updatedAtMs = toTimestampMs(entry.updatedAt || entry.createdAt);
      const previous = lookup[key];
      if (!previous || updatedAtMs >= previous.updatedAtMs || amount > previous.amount) {
        lookup[key] = {
          amount: Number.isFinite(amount) ? amount : 0,
          updatedAtMs,
        };
      }
    });
    return lookup;
  }, [activeBids]);

  const latestBidActivity = useMemo(() => {
    let latestKey = '';
    let latestUpdatedAt = 0;
    Object.entries(bidActivityLookup).forEach(([key, value]) => {
      const updatedAtMs = safeNumber(value?.updatedAtMs, 0);
      if (updatedAtMs > latestUpdatedAt) {
        latestUpdatedAt = updatedAtMs;
        latestKey = key;
      }
    });
    return { key: latestKey, updatedAtMs: latestUpdatedAt };
  }, [bidActivityLookup]);

  useEffect(() => {
    const previous = prevBidActivityRef.current;
    if (!bidBaselineReadyRef.current) {
      // Wait until we have real bid data before locking in the baseline.
      // If we baseline against an empty lookup, every subsequent entry looks
      // like a "new bid" and all timestamps collapse to Date.now(), destroying
      // the real bid-time ordering.
      if (Object.keys(bidActivityLookup).length === 0) return;
      prevBidActivityRef.current = bidActivityLookup;
      bidBaselineReadyRef.current = true;
      latestBidSeenRef.current = safeNumber(latestBidActivity.updatedAtMs, 0);
      const initialBumps = {};
      for (const [key, value] of Object.entries(bidActivityLookup)) {
        if (safeNumber(value?.updatedAtMs, 0) > 0) {
          initialBumps[key] = value.updatedAtMs;
        }
      }
      if (Object.keys(initialBumps).length > 0) {
        setBumpedAtById(initialBumps);
      }
      return;
    }

    const bumpedKeys = [];
    for (const [key, next] of Object.entries(bidActivityLookup)) {
      const prev = previous[key];
      const nextAmount = Number(next?.amount || 0);
      const prevAmount = Number(prev?.amount || 0);
      const nextUpdatedAt = Number(next?.updatedAtMs || 0);
      const prevUpdatedAt = Number(prev?.updatedAtMs || 0);
      const isNewBidSignal = !prev ? nextAmount > 0 : nextAmount > prevAmount || nextUpdatedAt > prevUpdatedAt;
      if (isNewBidSignal && nextAmount > 0) bumpedKeys.push(key);
    }

    const latestUpdatedAt = safeNumber(latestBidActivity.updatedAtMs, 0);
    const hasGlobalNewBid = latestUpdatedAt > safeNumber(latestBidSeenRef.current, 0);
    if (hasGlobalNewBid && latestBidActivity.key && !bumpedKeys.includes(latestBidActivity.key)) {
      bumpedKeys.push(latestBidActivity.key);
    }

    if (bumpedKeys.length > 0) {
      const eventAtBase = Math.max(Date.now(), latestUpdatedAt);
      setShakeTokensById((previousTokens) => {
        const nextTokens = { ...previousTokens };
        for (const key of bumpedKeys) {
          nextTokens[key] = safeNumber(nextTokens[key], 0) + 1;
        }
        return nextTokens;
      });
      setBumpedAtById((previousBumps) => {
        const nextBumps = { ...previousBumps };
        bumpedKeys.forEach((key, index) => {
          nextBumps[key] = eventAtBase + index;
        });
        return nextBumps;
      });
      setScreenShakeToken((token) => token + 1);
    }

    prevBidActivityRef.current = bidActivityLookup;
    latestBidSeenRef.current = Math.max(safeNumber(latestBidSeenRef.current, 0), latestUpdatedAt);
  }, [bidActivityLookup, latestBidActivity]);

  useEffect(() => {
    if (!screenShakeToken) return;
    setIsScreenShaking(false);
    const frameId = window.requestAnimationFrame(() => setIsScreenShaking(true));
    const timeoutId = window.setTimeout(() => setIsScreenShaking(false), 520);
    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
    };
  }, [screenShakeToken]);

  const liveVibes = useMemo(() => {
    const minted = (Array.isArray(liveAuctions) ? liveAuctions : [])
      .filter((v) => v?.slug || v?.id)
      .map((v) => ({
      id: v.id || v.slug,
      slug: v.slug || v.id,
      title: v.name || 'Untitled Vibe',
      bid: v.startingPrice || 0,
      timer: 'Live',
      badge: 'Live',
      category: v.category || 'Vibes',
      imageUrl: v.imageUrl ?? null,
      createdAtMs: v.createdAt ? new Date(v.createdAt).getTime() : 0,
      endTimeMs: v.endTime
        ? new Date(v.endTime).getTime()
        : (() => {
            const fallbackDuration = Number.MAX_SAFE_INTEGER;
            return fallbackDuration;
          })(),
      absurdityScore: String(v.name || '').length,
    }));

    const byKey = new Map();
    minted.forEach((item) => {
      const key = normalize(item.slug || item.title);
      if (!key) return;
      byKey.set(key, item);
    });

    return Array.from(byKey.values());
  }, [liveAuctions]);

  const categories = useMemo(() => {
    const catMap = {};
    liveVibes.forEach((v) => {
      catMap[v.category] = (catMap[v.category] || 0) + 1;
    });
    return [
      { label: 'All Vibes', count: liveVibes.length },
      ...Object.entries(catMap).map(([label, count]) => ({ label, count })),
    ];
  }, [liveVibes]);

  const filteredItems = useMemo(() =>
    activeCategory === 'All Vibes'
      ? liveVibes
      : liveVibes.filter((item) => item.category === activeCategory),
    [liveVibes, activeCategory]
  );

  const sortedItems = useMemo(() => {
    const resolveLiveBid = (item) => {
      for (const key of getItemKeys(item)) {
        const live = bidActivityLookup[key]?.amount;
        if (Number.isFinite(live)) return live;
      }
      const fallback = Number(item.bid);
      return Number.isFinite(fallback) ? fallback : 0;
    };

    const resolveRecentActivity = (item) => {
      let latest = 0;
      for (const key of getItemKeys(item)) {
        const clientBump = safeNumber(bumpedAtById[key], 0);
        const serverBidAt = safeNumber(bidActivityLookup[key]?.updatedAtMs, 0);
        latest = Math.max(latest, clientBump, serverBidAt);
      }
      return latest;
    };

    const compareByRecentActivity = (a, b) => resolveRecentActivity(b) - resolveRecentActivity(a);

    const items = [...filteredItems];
    if (activeSort === 'Trending') {
      items.sort((a, b) => {
        const activityDiff = compareByRecentActivity(a, b);
        if (activityDiff !== 0) return activityDiff;
        return (b.createdAtMs || 0) - (a.createdAtMs || 0);
      });
      return items;
    }
    if (activeSort === 'Highest Aura') {
      items.sort((a, b) => {
        const bidDiff = resolveLiveBid(b) - resolveLiveBid(a);
        if (bidDiff !== 0) return bidDiff;
        const activityDiff = compareByRecentActivity(a, b);
        if (activityDiff !== 0) return activityDiff;
        return (b.createdAtMs || 0) - (a.createdAtMs || 0);
      });
      return items;
    }
    if (activeSort === 'Ending Soon') {
      items.sort((a, b) => {
        const aEnd = Number.isFinite(a.endTimeMs) ? a.endTimeMs : Number.MAX_SAFE_INTEGER;
        const bEnd = Number.isFinite(b.endTimeMs) ? b.endTimeMs : Number.MAX_SAFE_INTEGER;
        const endingDiff = aEnd - bEnd;
        if (endingDiff !== 0) return endingDiff;
        const activityDiff = compareByRecentActivity(a, b);
        if (activityDiff !== 0) return activityDiff;
        return (b.createdAtMs || 0) - (a.createdAtMs || 0);
      });
      return items;
    }
    if (activeSort === 'Newest') {
      items.sort((a, b) => {
        const createdDiff = (b.createdAtMs || 0) - (a.createdAtMs || 0);
        if (createdDiff !== 0) return createdDiff;
        const activityDiff = compareByRecentActivity(a, b);
        if (activityDiff !== 0) return activityDiff;
        return resolveLiveBid(b) - resolveLiveBid(a);
      });
      return items;
    }
    if (activeSort === 'Most Absurd') {
      items.sort((a, b) => {
        const absurdityDiff = (b.absurdityScore || 0) - (a.absurdityScore || 0);
        if (absurdityDiff !== 0) return absurdityDiff;
        const activityDiff = compareByRecentActivity(a, b);
        if (activityDiff !== 0) return activityDiff;
        return (b.createdAtMs || 0) - (a.createdAtMs || 0);
      });
      return items;
    }
    items.sort((a, b) => {
      const activityDiff = compareByRecentActivity(a, b);
      if (activityDiff !== 0) return activityDiff;
      return resolveLiveBid(b) - resolveLiveBid(a);
    });
    return items;
  }, [filteredItems, activeSort, bidActivityLookup, bumpedAtById]);

  const visibleItems = useMemo(() => sortedItems.slice(0, visibleCount), [sortedItems, visibleCount]);
  const hasMoreItems = visibleCount < sortedItems.length;
  const marketStats = useMemo(() => {
    const totalVolume = liveVibes.reduce((sum, item) => sum + Number(item.bid || 0), 0);
    const categoryLeaders = categories.filter((entry) => entry.label !== 'All Vibes');
    const dominantCategory = [...categoryLeaders].sort((a, b) => b.count - a.count)[0] || null;
    return {
      totalLive: liveVibes.length,
      totalVolume,
      totalBids: activeBids.length,
      dominantCategory: dominantCategory?.label || 'Open',
    };
  }, [liveVibes, categories, activeBids.length]);

  useEffect(() => {
    setVisibleCount(HOME_BATCH_SIZE);
  }, [activeCategory, activeSort]);

  useEffect(() => {
    setVisibleCount((previous) =>
      Math.min(
        Math.max(HOME_BATCH_SIZE, previous),
        sortedItems.length > 0 ? sortedItems.length : HOME_BATCH_SIZE,
      ),
    );
  }, [sortedItems.length]);

  useEffect(() => {
    if (!loadMoreTrigger || !hasMoreItems) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting) return;
        setVisibleCount((previous) => Math.min(previous + HOME_BATCH_SIZE, sortedItems.length));
      },
      { rootMargin: '240px 0px' },
    );

    observer.observe(loadMoreTrigger);
    return () => observer.disconnect();
  }, [loadMoreTrigger, hasMoreItems, sortedItems.length]);

  const secondsSinceSync = Number.isFinite(lastSyncedAt)
    ? Math.max(0, Math.floor((syncNow - lastSyncedAt) / 1000))
    : null;

  const tickerItems = useMemo(() => {
    if (liveVibes.length > 0) {
      const items = liveVibes.map((v) => `NEW LISTING: "${v.title}" starting at ${Number(v.bid).toLocaleString()} AURA`);
      return [...items, ...items];
    }
    return staticTickerItems;
  }, [liveVibes]);

  const getBidDisplay = (item) => {
    for (const key of getItemKeys(item)) {
      const live = bidActivityLookup[key]?.amount;
      if (Number.isFinite(live)) return live.toLocaleString();
    }
    const fallback = Number(item.bid);
    return Number.isFinite(fallback) ? fallback.toLocaleString() : '0';
  };

  const filterOptionStyle = (isActive) => ({
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: isSmallMobile ? '13px' : isMobile ? '14px' : '15px',
    padding: isTablet ? (isSmallMobile ? '7px 10px' : '8px 12px') : '6px 10px',
    borderRadius: isTablet ? '999px' : '4px',
    transition: 'all 0.2s',
    display: isTablet ? 'inline-flex' : 'flex',
    alignItems: 'center',
    justifyContent: isTablet ? 'flex-start' : 'space-between',
    gap: '6px',
    whiteSpace: 'nowrap',
    color: isActive ? '#000000' : isTablet ? '#FFFFFF' : '#999999',
    background: isActive ? '#C8FF00' : isTablet ? '#1A1A1A' : 'transparent',
    border: isTablet ? (isActive ? '2px solid #C8FF00' : '1px solid #333333') : 'none',
    transform: isActive ? 'rotate(-1deg)' : 'none',
    flex: isTablet ? '0 0 auto' : '1 1 auto',
    maxWidth: '100%',
    scrollSnapAlign: isTablet ? 'start' : 'none',
  });

  const handleOpenAuction = (item) => {
    if (!item) return;
    router.push(`/auction/${item.slug}`);
  };

  return (
    <div
      style={{
        ...customStyles.body,
        animation: isScreenShaking ? 'va-screen-shake 520ms cubic-bezier(0.36, 0.07, 0.19, 0.97) both' : 'none',
      }}
    >
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        html, body { overflow-x: hidden; max-width: 100%; }
      `}</style>
      <NavBar />

      <div style={{ ...customStyles.tickerWrap, marginBottom: isMobile ? '4px' : '6px' }}>
        <div className="ticker-anim">
          {tickerItems.map((text, index) => (
            <div
              key={index}
              style={{ ...customStyles.tickerItem, fontSize: isSmallMobile ? '11px' : isMobile ? '12px' : '14px' }}
            >
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* ─── HERO ─── */}
      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          maxWidth: '100%',
          borderBottom: '1px solid #1A1A1A',
        }}
      >
        {/* Background glow orb */}
        <div
          style={{
            position: 'absolute',
            top: isMobile ? '-60px' : '-80px',
            right: isMobile ? '-100px' : '-40px',
            width: isMobile ? '360px' : '600px',
            height: isMobile ? '360px' : '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(200,255,0,0.12) 0%, rgba(200,255,0,0.03) 50%, transparent 70%)',
            animation: 'va-hero-glow 6s ease-in-out infinite',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
        {/* Dot noise overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(rgba(200,255,0,0.08) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        <div
          style={{
            position: 'relative',
            zIndex: 1,
            maxWidth: '1400px',
            margin: '0 auto',
            padding: isMobile
              ? `32px ${sidePadding}px 28px`
              : `56px ${sidePadding}px 0`,
            display: 'grid',
            gridTemplateColumns: isMobile || isTablet ? '1fr' : 'minmax(0, 1fr) 420px',
            gap: isMobile ? '24px' : '40px',
            alignItems: 'stretch',
          }}
        >
          {/* ── Left column: text ── */}
          <div style={{ paddingBottom: isMobile ? 0 : 40 }}>
            {/* Eyebrow */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: isMobile ? '14px' : '18px',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#C8FF00',
                  display: 'inline-block',
                  animation: 'va-pulse-dot 2s ease-in-out infinite',
                }}
              />
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                  color: '#C8FF00',
                }}
              >
                {marketStats.totalLive > 0
                  ? `${marketStats.totalLive} live listing${marketStats.totalLive !== 1 ? 's' : ''} right now`
                  : 'The market is warming up'}
              </span>
            </div>

            {/* Title */}
            <h1
              style={{
                fontFamily: "'Anton', sans-serif",
                fontSize: isMobile ? '48px' : isTablet ? '68px' : '82px',
                lineHeight: 0.92,
                textTransform: 'uppercase',
                maxWidth: '700px',
                margin: 0,
                color: '#FFF',
              }}
            >
              Collect{' '}
              <span
                style={{
                  color: '#C8FF00',
                  display: 'inline',
                  textShadow: '0 0 40px rgba(200,255,0,0.25)',
                }}
              >
                Internet
              </span>
              <br />
              Slop
              <span
                style={{
                  display: 'inline-block',
                  background: '#C8FF00',
                  color: '#000',
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 800,
                  fontSize: isMobile ? '14px' : '16px',
                  padding: isMobile ? '4px 10px' : '5px 12px',
                  marginLeft: isMobile ? '8px' : '12px',
                  transform: 'rotate(-2deg) translateY(-6px)',
                  verticalAlign: 'middle',
                  boxShadow: '4px 4px 0px rgba(0,0,0,0.3)',
                  letterSpacing: '0.5px',
                }}
              >
                Since 2026
              </span>
            </h1>

            {/* Animated accent line */}
            <div
              style={{
                width: isMobile ? '80px' : '120px',
                height: '3px',
                background: '#C8FF00',
                margin: isMobile ? '16px 0' : '20px 0',
                transformOrigin: 'left',
                animation: 'va-hero-line 4s ease-in-out infinite',
              }}
            />

            {/* Subtitle */}
            <p
              style={{
                maxWidth: '520px',
                fontSize: isMobile ? '16px' : '17px',
                lineHeight: 1.6,
                color: '#B0B0B0',
                fontWeight: 500,
                margin: 0,
              }}
            >
              Bid on listed vibes, discover strange market objects, and build a vault
              of rare, internet-native artifacts.
            </p>

            {/* Rotating tagline */}
            <div
              style={{
                marginTop: '10px',
                height: '24px',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <span
                key={taglineIndex}
                style={{
                  display: 'inline-block',
                  fontSize: isMobile ? '13px' : '15px',
                  fontWeight: 700,
                  color: '#555',
                  fontStyle: 'italic',
                  animation: taglineFading
                    ? 'none'
                    : 'va-tagline-in 0.4s ease both',
                  opacity: taglineFading ? 0 : 1,
                  transition: 'opacity 0.35s ease',
                }}
              >
                {ROTATING_TAGLINES[taglineIndex]}
              </span>
            </div>

            {/* Market stats strip */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile
                  ? 'repeat(2, 1fr)'
                  : 'repeat(4, auto)',
                gap: isMobile ? '8px' : '12px',
                marginTop: isMobile ? '24px' : '32px',
                maxWidth: '560px',
              }}
            >
              {[
                { label: 'Live Listings', value: marketStats.totalLive },
                { label: 'Total Volume', value: `${marketStats.totalVolume.toLocaleString()} AURA` },
                { label: 'Active Bids', value: marketStats.totalBids },
                { label: 'Hot Category', value: marketStats.dominantCategory },
              ].map((stat, i) => (
                <div
                  key={stat.label}
                  className="va-stat-pill"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <span
                    style={{
                      fontSize: '9px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '1.2px',
                      color: '#666',
                    }}
                  >
                    {stat.label}
                  </span>
                  <span
                    style={{
                      fontFamily: "'Anton', sans-serif",
                      fontSize: isMobile ? '16px' : '18px',
                      color: '#FFF',
                      lineHeight: 1.1,
                    }}
                  >
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Sync status */}
            <div
              style={{
                marginTop: '14px',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.4px',
                color: '#3A3A3A',
              }}
            >
              {secondsSinceSync === null
                ? 'Syncing market gallery…'
                : `Gallery synced ${secondsSinceSync}s ago`}
            </div>
          </div>

          {/* ── Right column: Vibe or Pass widget ── */}
          {!isMobile && !isTablet && (
            <VibeOrPassHero />
          )}
        </div>
      </section>

      <div
        className="va-layout-grid"
        style={{
          ...customStyles.layoutGrid,
          gridTemplateColumns: isTablet ? '1fr' : customStyles.layoutGrid.gridTemplateColumns,
          gap: isMobile ? '16px' : isTablet ? '22px' : customStyles.layoutGrid.gap,
          marginTop: 0,
          padding: isMobile ? `0 ${sidePadding}px 24px` : isTablet ? `0 ${sidePadding}px 28px` : customStyles.layoutGrid.padding,
        }}
      >
        <aside style={{ ...customStyles.filters, gap: isMobile ? '10px' : customStyles.filters.gap, minWidth: 0 }}>
          <div>
            {!isMobile && (
              <h3 style={{ ...customStyles.filterGroupTitle, fontSize: isTablet ? '20px' : customStyles.filterGroupTitle.fontSize }}>
                Category
              </h3>
            )}
            <ul
              className={`va-filter-list${isTablet ? ' va-scroll-row' : ''}`}
              style={{
                ...customStyles.filterList,
                flexDirection: isTablet ? 'row' : customStyles.filterList.flexDirection,
                overflowX: isTablet ? 'auto' : 'visible',
                gap: isTablet ? '8px' : customStyles.filterList.gap,
                paddingBottom: isTablet ? '4px' : 0,
                scrollSnapType: isTablet ? 'x proximity' : 'none',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {categories.map((category) => {
                const isActive = activeCategory === category.label;
                return (
                  <li
                    key={category.label}
                    onClick={() => setActiveCategory(category.label)}
                    style={filterOptionStyle(isActive)}
                  >
                    {category.label} <span>{category.count}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div style={{ marginTop: isTablet ? 0 : '32px' }}>
            {!isMobile && (
              <h3 style={{ ...customStyles.filterGroupTitle, fontSize: isTablet ? '20px' : customStyles.filterGroupTitle.fontSize }}>
                Sort By
              </h3>
            )}
            <ul
              className={`va-filter-list${isTablet ? ' va-scroll-row' : ''}`}
              style={{
                ...customStyles.filterList,
                flexDirection: isTablet ? 'row' : customStyles.filterList.flexDirection,
                overflowX: isTablet ? 'auto' : 'visible',
                gap: isTablet ? '8px' : customStyles.filterList.gap,
                paddingBottom: isTablet ? '4px' : 0,
                scrollSnapType: isTablet ? 'x proximity' : 'none',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {sortOptions.map((option) => {
                const isActive = activeSort === option;
                return (
                  <li
                    key={option}
                    onClick={() => setActiveSort(option)}
                    style={filterOptionStyle(isActive)}
                  >
                    {option}
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>

        <main
          className="va-auction-grid"
          style={{
            ...customStyles.auctionGrid,
            gridTemplateColumns: isMobile
              ? '1fr'
              : isTablet
                ? 'repeat(2, minmax(0, 1fr))'
                : customStyles.auctionGrid.gridTemplateColumns,
            gap: isMobile ? '14px' : isTablet ? '16px' : customStyles.auctionGrid.gap,
            width: '100%',
            minWidth: 0,
          }}
        >
          {sortedItems.length === 0 ? (
            <div style={{
              gridColumn: '1 / -1',
              border: '2px dashed #2A2A2A',
              padding: isMobile ? '40px 20px' : '64px 32px',
              textAlign: 'center',
              color: '#555',
            }}>
              <div style={{ fontFamily: "'Anton', sans-serif", fontSize: isMobile ? '40px' : '48px', marginBottom: '16px', color: '#2A2A2A' }}>
                VIBE
              </div>
              <div style={{ fontFamily: "'Anton', sans-serif", fontSize: isMobile ? '24px' : '32px', textTransform: 'uppercase', color: '#444', marginBottom: '8px' }}>
                No Collectible Vibes Yet
              </div>
              <div style={{ fontSize: '14px', color: '#555', marginBottom: '24px' }}>
                Start the catalog. Create the first collectible vibe in this market.
              </div>
              <Link href="/mint" style={{ background: '#C8FF00', color: '#000', padding: '12px 24px', fontWeight: 800, fontSize: '14px', textTransform: 'uppercase', textDecoration: 'none' }}>
                Create Vibe →
              </Link>
            </div>
          ) : (
            visibleItems.map((item) => (
              <AuctionCard
                key={item.id}
                item={item}
                bidDisplay={getBidDisplay(item)}
                onOpenAuction={handleOpenAuction}
                isMobile={isMobile}
                isSmallMobile={isSmallMobile}
                shakeToken={getItemKeys(item).reduce((max, key) => Math.max(max, safeNumber(shakeTokensById[key], 0)), 0)}
              />
            ))
          )}
          {hasMoreItems && (
            <div
              ref={setLoadMoreTrigger}
              style={{
                gridColumn: '1 / -1',
                color: '#787878',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                textAlign: 'center',
                padding: isMobile ? '6px 0 2px' : '8px 0 4px',
              }}
            >
              Loading more collectibles...
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
