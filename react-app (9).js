'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useVibeStore } from './app/state/vibe-store';
import { useAuth } from './app/state/auth-store';

const normalize = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

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
  cardEmoji: {
    fontSize: '64px',
    zIndex: 1,
    filter: 'drop-shadow(3px 3px 0px rgba(0,0,0,0.1))',
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

const sortOptions = ['Ending Soon', 'Most Absurd', 'Highest Aura', 'Newest'];

const staticTickerItems = [
  '⚡ The world\'s first auction house for things that don\'t exist',
  '💫 Mint your feelings — tokenize your vibes',
  '🔥 Place bids in AURA and own what doesn\'t exist',
  '✨ New vibes minted by the community every day',
  '⚡ The world\'s first auction house for things that don\'t exist',
  '💫 Mint your feelings — tokenize your vibes',
];

const AuctionCard = ({ item, bidDisplay, onOpenAuction, isMobile, isSmallMobile }) => {
  const [hovered, setHovered] = useState(false);
  const [btnHovered, setBtnHovered] = useState(false);

  return (
    <article
      style={{
        ...customStyles.card,
        transform: hovered && !isMobile ? 'translate(-2px, -2px)' : 'none',
        boxShadow: hovered && !isMobile ? '8px 8px 0px #C8FF00' : '6px 6px 0px rgba(200, 255, 0, 0.3)',
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
        <div style={{ ...customStyles.cardEmoji, fontSize: isMobile ? '52px' : '64px' }}>{item.emoji}</div>
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
  const [activeSort, setActiveSort] = useState('');
  const [navHover, setNavHover] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(0);

  const { balance, activeBids, mintedVibes } = useVibeStore();
  const { user, signOut } = useAuth();
  const userHandle = user?.user_metadata?.username || user?.email?.split('@')[0] || null;
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { label: 'Browse Vibes', href: '/' },
    { label: 'Vibes', href: '/vibes' },
    { label: 'Sell a Feeling', href: '/mint' },
    { label: 'Leaderboard', href: '/leaderboard' },
    { label: 'Vibe Vault', href: '/vault' },
    { label: 'Top Up', href: '/top-up' },
  ];

  const isMobile = viewportWidth <= 768;
  const isTablet = viewportWidth <= 1024;
  const isSmallMobile = viewportWidth <= 420;
  const sidePadding = isSmallMobile ? 12 : isMobile ? 16 : isTablet ? 20 : 24;
  const headerHeight = isMobile ? 64 : 60;
  const balanceDisplay = Number.isFinite(balance) ? balance.toLocaleString() : '0';

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
    if (!isMobile && mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  }, [isMobile, mobileMenuOpen]);

  const bidLookup = useMemo(() => {
    const lookup = {};
    activeBids.forEach((entry) => {
      const key = normalize(entry.id || entry.name);
      if (key) lookup[key] = entry.amount;
    });
    return lookup;
  }, [activeBids]);

  const liveVibes = useMemo(() =>
    (Array.isArray(mintedVibes) ? mintedVibes : []).map((v) => ({
      id: v.id || v.slug,
      slug: v.slug || v.id,
      emoji: v.emoji || '✨',
      title: v.name || 'Untitled Vibe',
      bid: v.startingPrice || 0,
      timer: 'Live',
      badge: 'Live',
      category: v.category || 'Vibes',
    })),
    [mintedVibes]
  );

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

  const tickerItems = useMemo(() => {
    if (liveVibes.length > 0) {
      const items = liveVibes.map((v) => `NEW LISTING: "${v.title}" starting at ${Number(v.bid).toLocaleString()} AURA`);
      return [...items, ...items];
    }
    return staticTickerItems;
  }, [liveVibes]);

  const getBidDisplay = (item) => {
    const key = normalize(item.slug || item.title);
    const live = bidLookup[key];
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
    <div style={customStyles.body}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        html, body { overflow-x: hidden; max-width: 100%; }
      `}</style>
      <header
        style={{
          ...customStyles.header,
          height: headerHeight,
          padding: `0 ${sidePadding}px`,
        }}
      >
        <span
          style={{
            ...customStyles.logo,
            fontSize: isSmallMobile ? '17px' : isMobile ? '20px' : '24px',
            maxWidth: isMobile ? '45%' : 'none',
          }}
        >
          Vibe Auction
        </span>
        {!isMobile && (
          <nav className="va-desktop-nav" style={customStyles.navLinks}>
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  style={{
                    ...customStyles.navItem,
                    color: isActive || navHover === item.label ? '#C8FF00' : '#FFFFFF',
                  }}
                  onMouseEnter={() => setNavHover(item.label)}
                  onMouseLeave={() => setNavHover('')}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: isSmallMobile ? '6px' : '8px', minWidth: 0 }}>
          {!isMobile && user && (
            <>
              <Link
                href={`/profile/${userHandle}`}
                style={{
                  ...customStyles.navItem,
                  color: '#C8FF00',
                  fontSize: '13px',
                  whiteSpace: 'nowrap',
                }}
              >
                @{userHandle}
              </Link>
              <button
                type="button"
                onClick={() => signOut()}
                style={{
                  background: 'transparent',
                  border: '1px solid #444',
                  color: '#AAAAAA',
                  fontSize: '12px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Sign Out
              </button>
            </>
          )}
          {!isMobile && !user && (
            <>
              <Link
                href="/login"
                style={{
                  ...customStyles.navItem,
                  color: pathname === '/login' ? '#C8FF00' : '#FFFFFF',
                  fontSize: '13px',
                }}
              >
                Login
              </Link>
              <Link
                href="/signup"
                style={{
                  background: '#C8FF00',
                  color: '#000000',
                  padding: '5px 12px',
                  borderRadius: '4px',
                  fontWeight: 700,
                  fontSize: '13px',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                Sign Up
              </Link>
            </>
          )}
          <div
            style={{
              ...customStyles.userBalance,
              padding: isSmallMobile ? '4px 8px' : isMobile ? '4px 10px' : '4px 12px',
              fontSize: isSmallMobile ? '11px' : isMobile ? '12px' : '13px',
              minWidth: 0,
              whiteSpace: 'nowrap',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <span>{balanceDisplay} AURA</span>
          </div>
          {isMobile && (
            <button
              type="button"
              className="va-hamburger"
              onClick={() => setMobileMenuOpen((open) => !open)}
              style={{
                width: isSmallMobile ? '34px' : '38px',
                height: isSmallMobile ? '34px' : '38px',
                borderRadius: '6px',
                border: '2px solid #C8FF00',
                background: '#0D0D0D',
                color: '#C8FF00',
                fontSize: isSmallMobile ? '18px' : '20px',
                lineHeight: 1,
                cursor: 'pointer',
              }}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          )}
        </div>
      </header>

      {isMobile && mobileMenuOpen && (
        <nav
          style={{
            background: '#000000',
            borderBottom: '2px solid #C8FF00',
            padding: `10px ${sidePadding}px 14px`,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                style={{
                  textAlign: 'left',
                  width: '100%',
                  border: isActive ? '2px solid #C8FF00' : '1px solid #2A2A2A',
                  background: isActive ? '#1A1A1A' : '#121212',
                  color: isActive ? '#C8FF00' : '#FFFFFF',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: isSmallMobile ? '12px' : '13px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px',
                  textDecoration: 'none',
                }}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}
          {!user && (
            <>
              <Link
                href="/login"
                style={{
                  textAlign: 'left',
                  width: '100%',
                  border: pathname === '/login' ? '2px solid #C8FF00' : '1px solid #2A2A2A',
                  background: pathname === '/login' ? '#1A1A1A' : '#121212',
                  color: pathname === '/login' ? '#C8FF00' : '#FFFFFF',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: isSmallMobile ? '12px' : '13px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px',
                  textDecoration: 'none',
                }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                href="/signup"
                style={{
                  textAlign: 'left',
                  width: '100%',
                  border: '2px solid #C8FF00',
                  background: '#C8FF00',
                  color: '#000000',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: isSmallMobile ? '12px' : '13px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px',
                  textDecoration: 'none',
                }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign Up
              </Link>
            </>
          )}
          {user && (
            <>
              <Link
                href={`/profile/${userHandle}`}
                style={{
                  textAlign: 'left',
                  width: '100%',
                  border: '2px solid #C8FF00',
                  background: '#1A1A1A',
                  color: '#C8FF00',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: isSmallMobile ? '12px' : '13px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px',
                  textDecoration: 'none',
                }}
                onClick={() => setMobileMenuOpen(false)}
              >
                @{userHandle}
              </Link>
              <button
                type="button"
                onClick={() => { signOut(); setMobileMenuOpen(false); }}
                style={{
                  textAlign: 'left',
                  width: '100%',
                  border: '1px solid #444',
                  background: '#121212',
                  color: '#AAAAAA',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: isSmallMobile ? '12px' : '13px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px',
                  cursor: 'pointer',
                }}
              >
                Sign Out
              </button>
            </>
          )}
        </nav>
      )}

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
                    onClick={() => setActiveSort(isActive ? '' : option)}
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
          {filteredItems.length === 0 ? (
            <div style={{
              gridColumn: '1 / -1',
              border: '2px dashed #2A2A2A',
              padding: isMobile ? '40px 20px' : '64px 32px',
              textAlign: 'center',
              color: '#555',
            }}>
              <div style={{ fontSize: isMobile ? '48px' : '64px', marginBottom: '16px' }}>⚡</div>
              <div style={{ fontFamily: "'Anton', sans-serif", fontSize: isMobile ? '24px' : '32px', textTransform: 'uppercase', color: '#444', marginBottom: '8px' }}>
                No Vibes Listed Yet
              </div>
              <div style={{ fontSize: '14px', color: '#555', marginBottom: '24px' }}>
                Be the first to mint and auction a vibe.
              </div>
              <Link href="/mint" style={{ background: '#C8FF00', color: '#000', padding: '12px 24px', fontWeight: 800, fontSize: '14px', textTransform: 'uppercase', textDecoration: 'none' }}>
                Sell a Feeling →
              </Link>
            </div>
          ) : (
            filteredItems.map((item) => (
              <AuctionCard
                key={item.id}
                item={item}
                bidDisplay={getBidDisplay(item)}
                onOpenAuction={handleOpenAuction}
                isMobile={isMobile}
                isSmallMobile={isSmallMobile}
              />
            ))
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
