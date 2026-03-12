'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import NavBar from '../components/NavBar';

const PERIODS = [
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'year', label: 'This Year' },
  { key: 'all', label: 'All Time' },
];

const PLACE_BADGES = ['AURA LEGEND', 'VIBE KING', 'BID LORD'];
const PODIUM_HEIGHTS = [300, 220, 180];

const customStyles = {
  root: {
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
  },
  navLinks: { display: 'flex', gap: '24px' },
  navItem: {
    fontWeight: 700,
    fontSize: '14px',
    color: '#FFFFFF',
    textDecoration: 'none',
    textTransform: 'uppercase',
    cursor: 'pointer',
  },
  navItemActive: {
    fontWeight: 700,
    fontSize: '14px',
    color: '#C8FF00',
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
    borderBottom: '2px solid #000000',
  },
  ticker: {
    display: 'flex',
    gap: '32px',
    whiteSpace: 'nowrap',
    animation: 'scroll 20s linear infinite',
  },
  tickerItem: { fontWeight: 800, fontSize: '14px', textTransform: 'uppercase' },
  container: { maxWidth: '1400px', margin: '0 auto', padding: '64px 24px' },
  pageTitle: {
    fontFamily: "'Anton', sans-serif",
    fontSize: '82px',
    lineHeight: 0.9,
    textTransform: 'uppercase',
    color: '#FFFFFF',
    marginBottom: '32px',
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
  periodRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '48px',
    flexWrap: 'wrap',
  },
  periodBtn: {
    padding: '8px 20px',
    fontWeight: 700,
    fontSize: '13px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    cursor: 'pointer',
    border: '2px solid #2A2A2A',
    background: 'transparent',
    color: '#888888',
    borderRadius: '4px',
    transition: 'all 0.15s',
  },
  periodBtnActive: {
    padding: '8px 20px',
    fontWeight: 700,
    fontSize: '13px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    cursor: 'pointer',
    border: '2px solid #C8FF00',
    background: '#C8FF00',
    color: '#000000',
    borderRadius: '4px',
    transition: 'all 0.15s',
  },
  podiumSection: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: '16px',
    marginBottom: '64px',
  },
  podiumPlace: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '240px',
  },
  podiumBlock: {
    width: '100%',
    background: '#C8FF00',
    color: '#000000',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: '16px',
    fontFamily: "'Anton', sans-serif",
    border: '3px solid #000000',
    boxShadow: '8px 8px 0px rgba(255,255,255,0.08)',
  },
  avatarCircle: {
    width: '100px',
    height: '100px',
    background: '#1A1A1A',
    border: '4px solid #C8FF00',
    borderRadius: '50%',
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '40px',
    boxShadow: '0 0 20px rgba(200, 255, 0, 0.2)',
  },
  avatarCircleFirst: {
    width: '128px',
    height: '128px',
    background: '#1A1A1A',
    border: '5px solid #C8FF00',
    borderRadius: '50%',
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '52px',
    boxShadow: '0 0 30px rgba(200, 255, 0, 0.3)',
  },
  rankNumber: { fontFamily: "'Anton', sans-serif", fontSize: '56px', lineHeight: 1 },
  podiumName: {
    fontFamily: "'Inter', sans-serif",
    fontWeight: 800,
    fontSize: '15px',
    textTransform: 'uppercase',
    marginTop: '-6px',
  },
  podiumAura: { fontFamily: "'Anton', sans-serif", fontSize: '20px', color: '#000000', opacity: 0.7 },
  podiumBadge: {
    background: '#000000',
    color: '#C8FF00',
    padding: '2px 8px',
    fontSize: '10px',
    fontWeight: 800,
    textTransform: 'uppercase',
    border: '1px solid #C8FF00',
    borderRadius: '2px',
    margin: '6px 0 10px',
  },
  boardGrid: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '40px' },
  sectionTitle: {
    fontFamily: "'Anton', sans-serif",
    fontSize: '32px',
    textTransform: 'uppercase',
    color: '#C8FF00',
    marginBottom: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  sectionTitleLine: { flexGrow: 1, height: '2px', background: '#C8FF00', opacity: 0.3 },
  leaderTable: { width: '100%', borderCollapse: 'separate', borderSpacing: '0 10px' },
  leaderCellRank: {
    padding: '15px 20px',
    fontWeight: 700,
    borderRadius: '8px 0 0 8px',
    width: '60px',
    fontFamily: "'Anton', sans-serif",
    fontSize: '24px',
    color: '#C8FF00',
  },
  leaderCellMain: { padding: '15px 20px', fontWeight: 700 },
  leaderCellScore: {
    padding: '15px 20px',
    fontWeight: 700,
    borderRadius: '0 8px 8px 0',
    textAlign: 'right',
    fontFamily: "'Anton', sans-serif",
    fontSize: '20px',
  },
  userInfoCell: { display: 'flex', flexDirection: 'column', gap: '4px' },
  username: { color: '#FFFFFF', fontSize: '16px' },
  userBadges: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  badge: {
    background: '#000000',
    color: '#C8FF00',
    padding: '2px 8px',
    fontSize: '10px',
    fontWeight: 800,
    textTransform: 'uppercase',
    border: '1px solid #C8FF00',
    borderRadius: '2px',
  },
  vibesList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  vibeItem: {
    background: '#1A1A1A',
    padding: '14px 18px',
    borderRadius: '8px',
    borderLeft: '6px solid #C8FF00',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '10px',
    textDecoration: 'none',
    color: 'inherit',
    transition: 'background 0.15s',
  },
  vibeName: {
    fontFamily: "'Anton', sans-serif",
    fontSize: '17px',
    textTransform: 'uppercase',
    lineHeight: 1.2,
    color: '#FFFFFF',
  },
  vibePrice: {
    background: '#C8FF00',
    color: '#000000',
    padding: '4px 10px',
    fontWeight: 800,
    fontSize: '12px',
    borderRadius: '4px',
    whiteSpace: 'nowrap',
  },
  emptyBox: {
    border: '2px dashed #2A2A2A',
    padding: '32px',
    textAlign: 'center',
    color: '#444',
    fontWeight: 700,
    textTransform: 'uppercase',
    fontSize: '13px',
  },
  svgDrip: {
    position: 'absolute',
    top: '-20px',
    right: '-20px',
    width: '200px',
    zIndex: -1,
    opacity: 0.5,
  },
};

const LeaderRow = ({ rank, username, vibesWon, totalSpent, isMobile }) => {
  const [hovered, setHovered] = useState(false);
  const badgeLabel = rank <= 3 ? PLACE_BADGES[rank - 1] : 'TOP BIDDER';
  const profileHref = `/profile/${encodeURIComponent(String(username || '').replace(/^@/, ''))}`;

  return (
    <tr
      style={{
        background: hovered && !isMobile ? '#252525' : '#1A1A1A',
        cursor: 'pointer',
        transition: 'background 0.15s',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => { window.location.href = profileHref; }}
    >
      <td style={{ ...customStyles.leaderCellRank, padding: isMobile ? '12px 10px' : undefined }}>
        {rank}
      </td>
      <td style={{ ...customStyles.leaderCellMain, padding: isMobile ? '12px 10px' : undefined }}>
        <div style={customStyles.userInfoCell}>
          <Link
            href={profileHref}
            style={{ ...customStyles.username, fontSize: isMobile ? '14px' : undefined, textDecoration: 'none' }}
            onClick={(e) => e.stopPropagation()}
          >
            {username}
          </Link>
          <div style={customStyles.userBadges}>
            <span style={customStyles.badge}>{badgeLabel}</span>
            <span style={{ ...customStyles.badge, borderColor: '#555', color: '#888' }}>
              {vibesWon} vibe{vibesWon !== 1 ? 's' : ''} won
            </span>
          </div>
        </div>
      </td>
      <td
        style={{
          ...customStyles.leaderCellScore,
          padding: isMobile ? '12px 10px' : undefined,
          color: rank === 1 ? '#C8FF00' : '#FFFFFF',
        }}
      >
        {totalSpent.toLocaleString()}
      </td>
    </tr>
  );
};

const PodiumPlace = ({ rank, entry, isMobile }) => {
  const height = PODIUM_HEIGHTS[rank - 1];
  const isFirst = rank === 1;
  const avatar = isFirst ? customStyles.avatarCircleFirst : customStyles.avatarCircle;
  const initials = entry.username.replace('@', '').slice(0, 2).toUpperCase();

  return (
    <div
      style={{
        ...customStyles.podiumPlace,
        width: isMobile ? `${isFirst ? 120 : 100}px` : `${isFirst ? 260 : 210}px`,
      }}
    >
      <div style={avatar}>{initials}</div>
      <div
        style={{
          ...customStyles.podiumBlock,
          height: isMobile ? `${Math.round(height * 0.6)}px` : `${height}px`,
        }}
      >
        <span style={{ ...customStyles.rankNumber, fontSize: isMobile ? '36px' : undefined }}>
          {rank}
        </span>
        <span style={{ ...customStyles.podiumName, fontSize: isMobile ? '12px' : undefined }}>
          {entry.username}
        </span>
        <span style={{ ...customStyles.podiumAura, fontSize: isMobile ? '14px' : undefined }}>
          {entry.totalSpent.toLocaleString()}
        </span>
        <span style={customStyles.podiumBadge}>{PLACE_BADGES[rank - 1]}</span>
      </div>
    </div>
  );
};

export default function LeaderboardPage() {
  const [viewportWidth, setViewportWidth] = useState(1200);
  const [period, setPeriod] = useState('all');
  const [topSpenders, setTopSpenders] = useState([]);
  const [topVibes, setTopVibes] = useState([]);
  const [loading, setLoading] = useState(true);

  const isMobile = viewportWidth <= 768;
  const isTablet = viewportWidth <= 1024;
  const isSmallMobile = viewportWidth <= 420;
  const sidePadding = isSmallMobile ? 12 : isMobile ? 16 : isTablet ? 20 : 24;
  const headerHeight = isMobile ? 64 : 60;
  useEffect(() => {
    const updateViewportWidth = () => setViewportWidth(window.innerWidth);
    updateViewportWidth();
    window.addEventListener('resize', updateViewportWidth);

    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;700;800&display=swap');
      @keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
      @keyframes skeletonPulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { background-color: #0D0D0D; overflow-x: hidden; }
    `;
    document.head.appendChild(style);

    return () => {
      window.removeEventListener('resize', updateViewportWidth);
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard?period=${period}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`Request failed (${r.status})`))))
      .then((data) => {
        setTopSpenders(data.topSpenders || []);
        setTopVibes(data.topVibes || []);
      })
      .catch(() => {
        setTopSpenders([]);
        setTopVibes([]);
      })
      .finally(() => setLoading(false));
  }, [period]);

  const podiumOrder =
    topSpenders.length >= 3
      ? [topSpenders[1], topSpenders[0], topSpenders[2]]
      : topSpenders.length === 2
        ? [topSpenders[1], topSpenders[0]]
        : topSpenders.slice(0, 1);

  const podiumRanks = topSpenders.length >= 3 ? [2, 1, 3] : topSpenders.length === 2 ? [2, 1] : [1];

  return (
    <div style={customStyles.root}>
      <NavBar />

      <div style={{ ...customStyles.tickerWrap, padding: isMobile ? '6px 0' : undefined }}>
        <div style={{ ...customStyles.ticker, gap: isMobile ? '18px' : undefined }}>
          {[
            'Bid AURA to climb the leaderboard',
            'Top bidders win legendary status',
            'Collect rare vibes and build your reputation',
            'Bid AURA to climb the leaderboard',
            'Top bidders win legendary status',
            'Collect rare vibes and build your reputation',
          ].map((text, i) => (
            <div
              key={i}
              style={{ ...customStyles.tickerItem, fontSize: isMobile ? '12px' : undefined }}
            >
              {text}
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          ...customStyles.container,
          ...(isMobile ? { padding: '40px 16px 30px' } : isTablet ? { padding: '48px 20px 36px' } : {}),
        }}
      >
        <div style={{ position: 'relative', marginBottom: isMobile ? '28px' : '48px' }}>
          <svg
            style={{
              ...customStyles.svgDrip,
              width: isMobile ? '120px' : undefined,
              right: isMobile ? '-6px' : undefined,
            }}
            viewBox="0 0 200 200"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill="#C8FF00"
              d="M0,0 L200,0 L200,80 C180,80 170,120 150,120 C130,120 130,60 110,60 C90,60 90,140 70,140 C50,140 40,90 20,90 C10,90 0,100 0,100 Z"
            />
          </svg>
          <h1
            style={{
              ...customStyles.pageTitle,
              fontSize: isSmallMobile
                ? 'clamp(36px, 11vw, 42px)'
                : isMobile
                  ? 'clamp(42px, 10vw, 50px)'
                  : isTablet
                    ? 'clamp(52px, 8vw, 62px)'
                    : viewportWidth <= 1440
                      ? '70px'
                      : '82px',
              lineHeight: isSmallMobile ? 0.95 : 0.9,
            }}
          >
            The Aura <br />
            Hall of{' '}
            <span
              style={{
                ...customStyles.highlightTag,
                fontSize: isMobile ? '18px' : isTablet ? '22px' : '26px',
                padding: isMobile ? '3px 10px' : '4px 14px',
                marginLeft: isMobile ? '6px' : '10px',
              }}
            >
              Fame
            </span>
          </h1>
        </div>

        {/* Period toggle */}
        <div style={customStyles.periodRow}>
          {PERIODS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setPeriod(key)}
              style={period === key ? customStyles.periodBtnActive : customStyles.periodBtn}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Podium */}
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '16px', marginBottom: '64px', padding: '20px 0' }}>
            {[180, 240, 160].map((h, i) => (
              <div key={i} style={{ width: isMobile ? '80px' : '180px', height: `${isMobile ? Math.round(h * 0.55) : h}px`, background: '#1A1A1A', borderRadius: '4px', animation: 'skeletonPulse 1.6s ease-in-out infinite', animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        ) : topSpenders.length === 0 ? (
          <section
            style={{
              ...customStyles.podiumSection,
              height: 'auto',
              marginBottom: isMobile ? '36px' : undefined,
            }}
          >
            <div
              style={{
                border: '2px dashed #2A2A2A',
                padding: isMobile ? '40px 20px' : '60px 40px',
                textAlign: 'center',
                color: '#555',
                width: '100%',
              }}
            >
              <div style={{ fontFamily: "'Anton', sans-serif", fontSize: isMobile ? '48px' : '72px', color: '#1A1A1A', marginBottom: '16px' }}>LEAD</div>
              <div style={{ fontFamily: "'Anton', sans-serif", fontSize: isMobile ? '22px' : '28px', textTransform: 'uppercase', color: '#333', marginBottom: '8px' }}>
                No Top Bidders Yet
              </div>
              <div style={{ fontSize: '14px', color: '#444' }}>
                Start bidding to claim your spot on the podium.
              </div>
            </div>
          </section>
        ) : (
          <section
            style={{
              ...customStyles.podiumSection,
              alignItems: 'flex-end',
              marginBottom: isMobile ? '36px' : undefined,
              gap: isMobile ? '8px' : undefined,
            }}
          >
            {podiumOrder.map((entry, i) => (
              <PodiumPlace key={entry.username} rank={podiumRanks[i]} entry={entry} isMobile={isMobile} />
            ))}
          </section>
        )}

        <div
          style={{
            ...customStyles.boardGrid,
            gridTemplateColumns: isTablet ? '1fr' : undefined,
            gap: isMobile ? '22px' : undefined,
          }}
        >
          {/* Top Aura Spenders */}
          <div>
            <h2 style={{ ...customStyles.sectionTitle, fontSize: isMobile ? '26px' : undefined }}>
              Top Aura Spenders
              <span style={customStyles.sectionTitleLine} />
            </h2>
            {loading ? (
              <div style={customStyles.emptyBox}>Loading...</div>
            ) : topSpenders.length === 0 ? (
              <div style={customStyles.emptyBox}>No bidders ranked yet</div>
            ) : (
              <table style={customStyles.leaderTable}>
                <tbody>
                  {topSpenders.map((row, i) => (
                    <LeaderRow
                      key={row.username}
                      rank={i + 1}
                      username={row.username}
                      totalSpent={row.totalSpent}
                      vibesWon={row.vibesWon}
                      isMobile={isMobile}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Top Vibes */}
          <div>
            <h2 style={{ ...customStyles.sectionTitle, fontSize: isMobile ? '26px' : undefined }}>
              Top Vibes
              <span style={customStyles.sectionTitleLine} />
            </h2>
            {loading ? (
              <div style={customStyles.emptyBox}>Loading...</div>
            ) : topVibes.length === 0 ? (
              <div style={customStyles.emptyBox}>No vibes listed yet</div>
            ) : (
              <div style={customStyles.vibesList}>
                {topVibes.map((vibe, idx) => (
                  <Link
                    key={idx}
                    href={`/auction/${vibe.slug}`}
                    style={customStyles.vibeItem}
                  >
                    <span style={customStyles.vibeName}>
                      {vibe.name}
                    </span>
                    <span style={customStyles.vibePrice}>
                      {vibe.price.toLocaleString()} AURA
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
