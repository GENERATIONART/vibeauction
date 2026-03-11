'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useVibeStore } from './app/state/vibe-store';
import NavBar from './app/components/NavBar';
import { auctionItems } from './lib/auction-items';

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
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))',
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

const staticTickerItems = [
  'The world\'s first auction house for things that don\'t exist',
  'Mint your feelings and tokenize your vibes',
  'Place bids in AURA and own what does not exist',
  'New vibes minted by the community every day',
  'The world\'s first auction house for things that don\'t exist',
  'Mint your feelings and tokenize your vibes',
];

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

const App = () => {
  const [activeCategory, setActiveCategory] = useState('All Vibes');
  const [activeSort, setActiveSort] = useState('Trending');
  const [viewportWidth, setViewportWidth] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [syncNow, setSyncNow] = useState(Date.now());
  const [surprisePressed, setSurprisePressed] = useState(false);
  const [visibleCount, setVisibleCount] = useState(HOME_BATCH_SIZE);
  const [loadMoreTrigger, setLoadMoreTrigger] = useState(null);
  const [shakeTokensById, setShakeTokensById] = useState({});
  const [bumpedAtById, setBumpedAtById] = useState({});
  const [screenShakeToken, setScreenShakeToken] = useState(0);
  const [isScreenShaking, setIsScreenShaking] = useState(false);
  const prevBidActivityRef = useRef(null);
  const bidBaselineReadyRef = useRef(false);
  const latestBidSeenRef = useRef(0);

  const { balance, activeBids, mintedVibes, refreshState } = useVibeStore();
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
      @media (max-width: 768px) {
        .ticker-anim { gap: 20px; animation-duration: 28s; }
      }
      @media (max-width: 420px) {
        .ticker-anim { gap: 14px; animation-duration: 34s; }
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
        await refreshState();
        setLastSyncedAt(Date.now());
      } catch {
        // Keep current UI state when background refresh fails.
      }
    };

    syncLatestVibes();

    const onFocus = () => {
      syncLatestVibes();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncLatestVibes();
      }
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);

    const pollId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        syncLatestVibes();
      }
    }, 5000);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.clearInterval(pollId);
    };
  }, [refreshState]);

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
      prevBidActivityRef.current = bidActivityLookup;
      bidBaselineReadyRef.current = true;
      latestBidSeenRef.current = safeNumber(latestBidActivity.updatedAtMs, 0);
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
    const minted = (Array.isArray(mintedVibes) ? mintedVibes : []).map((v) => ({
      id: v.id || v.slug,
      slug: v.slug || v.id,
      title: v.name || 'Untitled Vibe',
      bid: v.startingPrice || 0,
      timer: 'Live',
      badge: 'Live',
      category: v.category || 'Vibes',
      imageUrl: v.imageUrl ?? null,
      createdAtMs: v.createdAt ? new Date(v.createdAt).getTime() : 0,
      endingSoonMs: v.endTime
        ? Math.max(0, new Date(v.endTime).getTime() - Date.now())
        : parseCountdownToMs(v.duration),
      absurdityScore: String(v.name || '').length + String(v.manifesto || '').length,
    }));

    const byKey = new Map();
    minted.forEach((item) => {
      const key = normalize(item.slug || item.title);
      if (!key) return;
      byKey.set(key, item);
    });

    // Ensure any vibe with live bid activity appears in feed and can bubble to the top-left.
    activeBids.forEach((entry) => {
      const key = normalize(entry.id || entry.name);
      if (!key || byKey.has(key)) return;
      const updatedAtMs = toTimestampMs(entry.updatedAt || entry.createdAt);
      byKey.set(key, {
        id: entry.id || key,
        slug: entry.id || key,
        title: entry.name || 'Untitled Vibe',
        bid: safeNumber(entry.amount, 0),
        timer: 'Live',
        badge: 'Live',
        category: 'Vibes',
        imageUrl: null,
        createdAtMs: updatedAtMs,
        endingSoonMs: Number.MAX_SAFE_INTEGER,
        absurdityScore: String(entry.name || '').length,
      });
    });

    const merged = Array.from(byKey.values());
    if (merged.length > 0) {
      return merged;
    }
    return auctionItems.map((item) => ({
      id: String(item.id),
      slug: item.slug,
      title: item.title,
      bid: item.bid || 0,
      timer: item.timer || 'Live',
      badge: item.badge || 'Live',
      category: item.category || 'Vibes',
      imageUrl: null,
      createdAtMs: Number(item.id) || 0,
      endingSoonMs: parseCountdownToMs(item.timer),
      absurdityScore: String(item.title || '').length + String(item.description || '').length,
    }));
  }, [mintedVibes, activeBids]);

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
      const key = normalize(item.slug || item.title);
      const live = bidActivityLookup[key]?.amount;
      if (Number.isFinite(live)) return live;
      const fallback = Number(item.bid);
      return Number.isFinite(fallback) ? fallback : 0;
    };

    const resolveRecentActivity = (item) => {
      const key = normalize(item.slug || item.title);
      const clientBump = safeNumber(bumpedAtById[key], 0);
      const serverBidAt = safeNumber(bidActivityLookup[key]?.updatedAtMs, 0);
      return Math.max(clientBump, serverBidAt);
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
        const activityDiff = compareByRecentActivity(a, b);
        if (activityDiff !== 0) return activityDiff;
        return resolveLiveBid(b) - resolveLiveBid(a);
      });
      return items;
    }
    if (activeSort === 'Ending Soon') {
      items.sort((a, b) => {
        const activityDiff = compareByRecentActivity(a, b);
        if (activityDiff !== 0) return activityDiff;
        return (a.endingSoonMs || Number.MAX_SAFE_INTEGER) - (b.endingSoonMs || Number.MAX_SAFE_INTEGER);
      });
      return items;
    }
    if (activeSort === 'Newest') {
      items.sort((a, b) => {
        const activityDiff = compareByRecentActivity(a, b);
        if (activityDiff !== 0) return activityDiff;
        return (b.createdAtMs || 0) - (a.createdAtMs || 0);
      });
      return items;
    }
    if (activeSort === 'Most Absurd') {
      items.sort((a, b) => {
        const activityDiff = compareByRecentActivity(a, b);
        if (activityDiff !== 0) return activityDiff;
        return (b.absurdityScore || 0) - (a.absurdityScore || 0);
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

  const handleSurpriseMe = () => {
    const pool = sortedItems.length > 0 ? sortedItems : liveVibes;
    if (pool.length === 0) return;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (!pick?.slug) return;
    setSurprisePressed(true);
    setTimeout(() => setSurprisePressed(false), 140);
    router.push(`/auction/${pick.slug}`);
  };

  const tickerItems = useMemo(() => {
    if (liveVibes.length > 0) {
      const items = liveVibes.map((v) => `NEW LISTING: "${v.title}" starting at ${Number(v.bid).toLocaleString()} AURA`);
      return [...items, ...items];
    }
    return staticTickerItems;
  }, [liveVibes]);

  const getBidDisplay = (item) => {
    const key = normalize(item.slug || item.title);
    const live = bidActivityLookup[key]?.amount;
    if (Number.isFinite(live)) return live.toLocaleString();
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

      <div style={{ ...customStyles.tickerWrap, marginBottom: isMobile ? '10px' : '14px' }}>
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

      <section
        style={{
          ...customStyles.hero,
          padding: isMobile ? `20px ${sidePadding}px 16px` : isTablet ? `24px ${sidePadding}px 24px` : '32px 24px 32px',
        }}
      >
        <h1
          className="va-hero-title"
          style={{
            ...customStyles.heroTitle,
            fontSize: isSmallMobile
              ? 'clamp(36px, 11vw, 42px)'
              : isMobile
                ? 'clamp(42px, 10vw, 50px)'
                : isTablet
                  ? 'clamp(52px, 8vw, 62px)'
                  : viewportWidth <= 1440
                    ? '70px'
                    : customStyles.heroTitle.fontSize,
            lineHeight: isSmallMobile ? 0.95 : customStyles.heroTitle.lineHeight,
            maxWidth: isMobile ? '100%' : customStyles.heroTitle.maxWidth,
          }}
        >
          {isSmallMobile ? (
            <>Browse Auction </>
          ) : (
            <>
              Browse <br />
              Auction{' '}
            </>
          )}
          <span
            style={{
              ...customStyles.highlightTag,
              fontSize: isSmallMobile ? '12px' : isMobile ? '14px' : customStyles.highlightTag.fontSize,
              marginLeft: isMobile ? 0 : customStyles.highlightTag.marginLeft,
              marginTop: isMobile ? '8px' : 0,
              display: isMobile ? 'inline-flex' : customStyles.highlightTag.display,
              padding: isSmallMobile ? '3px 8px' : isMobile ? '3px 10px' : customStyles.highlightTag.padding,
            }}
          >
            VIBES
          </span>
        </h1>

        <div
          style={{
            marginTop: isMobile ? '12px' : '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            onClick={handleSurpriseMe}
            style={{
              background: '#C8FF00',
              color: '#000000',
              border: '2px solid #000000',
              fontWeight: 900,
              textTransform: 'uppercase',
              fontSize: isMobile ? '12px' : '13px',
              letterSpacing: '0.5px',
              padding: isMobile ? '9px 12px' : '10px 14px',
              cursor: 'pointer',
              boxShadow: surprisePressed ? '1px 1px 0 #000000' : '3px 3px 0 #000000',
              transform: surprisePressed ? 'translate(2px, 2px)' : 'none',
            }}
          >
            Surprise Me
          </button>
          <div
            style={{
              border: '1px solid #2D2D2D',
              background: '#121212',
              color: '#A9A9A9',
              fontSize: isMobile ? '11px' : '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              padding: isMobile ? '8px 10px' : '8px 12px',
              letterSpacing: '0.3px',
            }}
          >
            {secondsSinceSync === null ? 'Syncing live feed...' : `Live feed synced ${secondsSinceSync}s ago`}
          </div>
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
                No Vibes Listed Yet
              </div>
              <div style={{ fontSize: '14px', color: '#555', marginBottom: '24px' }}>
                Be the first to drop and auction a vibe.
              </div>
              <Link href="/mint" style={{ background: '#C8FF00', color: '#000', padding: '12px 24px', fontWeight: 800, fontSize: '14px', textTransform: 'uppercase', textDecoration: 'none' }}>
                Drop Vibe →
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
                shakeToken={shakeTokensById[normalize(item.slug || item.title)] || 0}
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
              Loading more vibes...
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
