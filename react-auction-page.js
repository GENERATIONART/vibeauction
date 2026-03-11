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
  const { balance, activeBids, placeBid, settleAuction } = useVibeStore();
  const { profile } = useAuth();
  const router = useRouter();
  const selectedVibe = vibe || getAuctionItemBySlug(defaultAuctionSlug);
  const baseBid = safeBid(selectedVibe?.bid, 100);
  const buyNowPrice = selectedVibe?.buyNowPrice ?? null;

  const isOwnVibe = Boolean(
    profile?.username &&
      selectedVibe?.author &&
      profile.username.toLowerCase() === selectedVibe.author.replace(/^@/, '').toLowerCase(),
  );
  const categoryTag = getCategoryTag(selectedVibe?.category);
  const [titleLineOne, titleLineTwo] = splitTitle(selectedVibe?.title);

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
    setError('');
    setShowBidSuccess(false);

    // Load existing bid history from Supabase
    const vibeId = selectedVibe?.slug;
    if (vibeId) {
      fetch(`/api/auction/bids?vibeId=${encodeURIComponent(vibeId)}`)
        .then((r) => r.json())
        .then(({ bids }) => { if (Array.isArray(bids) && bids.length > 0) setBids(bids); })
        .catch(() => {});
    }
  }, [selectedVibe?.slug, selectedVibe?.timer, selectedVibe?.endTime, baseBid]);

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

  // Check if the current user has the highest bid on this vibe
  const vibeNormId = normalize(selectedVibe?.slug || selectedVibe?.title || '');
  const userActiveBid = activeBids.find(
    (b) => normalize(b.id || b.name) === vibeNormId,
  );
  const userIsHighestBidder = Boolean(userActiveBid && currentBid === userActiveBid.amount);

  const onClaimWin = useCallback(async () => {
    const params = new URLSearchParams({
      id: vibeNormId,
      name: selectedVibe?.title || 'Unknown Vibe',
      emoji: selectedVibe?.emoji || '✨',
      amount: String(currentBid),
      slug: selectedVibe?.slug || vibeNormId,
      category: selectedVibe?.category || 'Vibes',
    });
    router.push(`/won?${params.toString()}`);
  }, [vibeNormId, selectedVibe, currentBid, router]);

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

    const accepted = await placeBid({
      id: selectedVibe?.slug || defaultAuctionSlug,
      name: selectedVibe?.title || 'Unknown Vibe',
      emoji: selectedVibe?.emoji || '✨',
      amount: bidAmount,
    });

    setPlacingBid(false);

    if (!accepted) {
      setError('Failed to place bid. Try again.');
      setShowBidSuccess(false);
      return;
    }

    setCurrentBid(bidAmount);
    setBids((previous) => [
      { id: Date.now(), user: '@You', time: 'just now', amount: bidAmount },
      ...previous,
    ]);
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
    });
    setBuyingNow(false);
    if (!settled) {
      setError('Purchase failed. Try again.');
      return;
    }
    setShowBuySuccess(true);
  };

  const displayBid = currentBid + increment;

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

              {(selectedVibe?.author || selectedVibe?.listedBy) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #2A2A2A' }}>
                  {selectedVibe?.listedBy && (
                    <div style={{ fontSize: '13px', color: '#888888', fontWeight: 600 }}>
                      <span style={{ color: '#555555', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px', marginRight: '6px' }}>Listed by</span>
                      <span style={{ color: '#C8FF00' }}>
                        {String(selectedVibe.listedBy).startsWith('@') ? selectedVibe.listedBy : `@${selectedVibe.listedBy}`}
                      </span>
                    </div>
                  )}
                  {selectedVibe?.author && selectedVibe.author !== selectedVibe.listedBy && (
                    <div style={{ fontSize: '13px', color: '#888888', fontWeight: 600 }}>
                      <span style={{ color: '#555555', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px', marginRight: '6px' }}>Original vibe by</span>
                      <span style={{ color: '#AAAAAA' }}>
                        {String(selectedVibe.author).startsWith('@') ? selectedVibe.author : `@${selectedVibe.author}`}
                      </span>
                    </div>
                  )}
                  {selectedVibe?.author && !selectedVibe?.listedBy && (
                    <div style={{ fontSize: '13px', color: '#888888', fontWeight: 600 }}>
                      <span style={{ color: '#555555', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px', marginRight: '6px' }}>Vibe by</span>
                      <span style={{ color: '#C8FF00' }}>
                        {String(selectedVibe.author).startsWith('@') ? selectedVibe.author : `@${selectedVibe.author}`}
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
                  <div style={{ fontSize: '13px', color: '#888888', marginTop: '6px' }}>This auction has closed. {userActiveBid ? 'You were outbid.' : 'Check your Vault if you won.'}</div>
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
