'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useVibeStore } from '../state/vibe-store';

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
  tickerItem: {
    fontWeight: 800,
    fontSize: '14px',
    textTransform: 'uppercase',
  },
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '40px 24px',
  },
  pageHeader: {
    marginBottom: '60px',
    position: 'relative',
  },
  pageTitle: {
    fontFamily: "'Anton', sans-serif",
    fontSize: '82px',
    lineHeight: 0.9,
    textTransform: 'uppercase',
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
  podiumSection: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: '20px',
    marginBottom: '80px',
    height: '400px',
    position: 'relative',
  },
  podiumPlace: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '280px',
    position: 'relative',
  },
  avatarCircle: {
    width: '120px',
    height: '120px',
    background: '#1A1A1A',
    border: '4px solid #C8FF00',
    borderRadius: '50%',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '48px',
    boxShadow: '0 0 20px rgba(200, 255, 0, 0.2)',
  },
  avatarCircleFirst: {
    width: '150px',
    height: '150px',
    background: '#1A1A1A',
    border: '6px solid #C8FF00',
    borderRadius: '50%',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '64px',
    boxShadow: '0 0 20px rgba(200, 255, 0, 0.2)',
  },
  podiumBlock: {
    width: '100%',
    background: '#C8FF00',
    color: '#000000',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: '20px',
    fontFamily: "'Anton', sans-serif",
    border: '3px solid #000000',
    boxShadow: '8px 8px 0px rgba(255,255,255,0.1)',
  },
  rankNumber: {
    fontFamily: "'Anton', sans-serif",
    fontSize: '64px',
    lineHeight: 1,
  },
  podiumName: {
    fontFamily: "'Inter', sans-serif",
    fontWeight: 800,
    fontSize: '18px',
    textTransform: 'uppercase',
    marginTop: '-10px',
  },
  podiumAura: {
    fontFamily: "'Anton', sans-serif",
    fontSize: '24px',
    color: '#000000',
    opacity: 0.7,
  },
  badge: {
    background: '#000000',
    color: '#C8FF00',
    padding: '2px 8px',
    fontSize: '10px',
    fontWeight: 800,
    textTransform: 'uppercase',
    border: '1px solid #C8FF00',
    borderRadius: '2px',
    marginTop: '8px',
  },
  badgeLegendary: {
    background: '#C8FF00',
    color: '#000000',
    padding: '2px 8px',
    fontSize: '10px',
    fontWeight: 800,
    textTransform: 'uppercase',
    border: '1px solid #C8FF00',
    borderRadius: '2px',
    marginTop: '8px',
  },
  boardGrid: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '40px',
  },
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
  sectionTitleLine: {
    flexGrow: 1,
    height: '2px',
    background: '#C8FF00',
    opacity: 0.3,
  },
  leaderTable: {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: '0 10px',
  },
  leaderRow: {
    background: '#1A1A1A',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  leaderRowHovered: {
    background: '#252525',
    transform: 'scale(1.01)',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  leaderCellRank: {
    padding: '15px 20px',
    fontWeight: 700,
    borderRadius: '8px 0 0 8px',
    width: '60px',
    fontFamily: "'Anton', sans-serif",
    fontSize: '24px',
    color: '#C8FF00',
  },
  leaderCellMain: {
    padding: '15px 20px',
    fontWeight: 700,
  },
  leaderCellScore: {
    padding: '15px 20px',
    fontWeight: 700,
    borderRadius: '0 8px 8px 0',
    textAlign: 'right',
    fontFamily: "'Anton', sans-serif",
    fontSize: '20px',
  },
  userInfoCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  username: {
    color: '#FFFFFF',
    fontSize: '16px',
  },
  userBadges: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },
  contestedList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  contestedItem: {
    background: '#FFFFFF',
    color: '#000000',
    padding: '15px',
    borderRadius: '8px',
    borderLeft: '8px solid #C8FF00',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '10px',
  },
  vibeName: {
    fontFamily: "'Anton', sans-serif",
    fontSize: '18px',
    textTransform: 'uppercase',
    lineHeight: 1.1,
  },
  bidCount: {
    background: '#000000',
    color: '#C8FF00',
    padding: '4px 10px',
    fontWeight: 800,
    fontSize: '12px',
    borderRadius: '4px',
    whiteSpace: 'nowrap',
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

const LeaderRow = ({ rank, username, badgeLabel, score, isMobile }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <tr
      style={hovered && !isMobile ? customStyles.leaderRowHovered : customStyles.leaderRow}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <td style={{ ...customStyles.leaderCellRank, padding: isMobile ? '12px 10px' : customStyles.leaderCellRank.padding }}>
        {rank}
      </td>
      <td style={{ ...customStyles.leaderCellMain, padding: isMobile ? '12px 10px' : customStyles.leaderCellMain.padding }}>
        <div style={customStyles.userInfoCell}>
          <span style={{ ...customStyles.username, fontSize: isMobile ? '14px' : customStyles.username.fontSize }}>{username}</span>
          <div style={customStyles.userBadges}>
            <span style={customStyles.badge}>{badgeLabel}</span>
          </div>
        </div>
      </td>
      <td style={{ ...customStyles.leaderCellScore, padding: isMobile ? '12px 10px' : customStyles.leaderCellScore.padding }}>
        {score}
      </td>
    </tr>
  );
};

const ContestedItem = ({ name, bids, isMobile }) => (
  <div style={{ ...customStyles.contestedItem, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center' }}>
    <span style={{ ...customStyles.vibeName, fontSize: isMobile ? '16px' : customStyles.vibeName.fontSize }}>
      {name.split('<br>').map((part, i, arr) => (
        <React.Fragment key={i}>{part}{i < arr.length - 1 && <br />}</React.Fragment>
      ))}
    </span>
    <span style={customStyles.bidCount}>{bids} Bids</span>
  </div>
);

const Podium = ({ isMobile }) => (
  <section
    style={{
      ...customStyles.podiumSection,
      height: isMobile ? 'auto' : customStyles.podiumSection.height,
      marginBottom: isMobile ? '36px' : customStyles.podiumSection.marginBottom,
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <div style={{
      border: '2px dashed #2A2A2A',
      padding: isMobile ? '40px 20px' : '60px 40px',
      textAlign: 'center',
      color: '#555',
      width: '100%',
    }}>
      <div style={{ fontFamily: "'Anton', sans-serif", fontSize: isMobile ? '48px' : '72px', color: '#1A1A1A', marginBottom: '16px' }}>🏆</div>
      <div style={{ fontFamily: "'Anton', sans-serif", fontSize: isMobile ? '22px' : '28px', textTransform: 'uppercase', color: '#333', marginBottom: '8px' }}>
        No Top Bidders Yet
      </div>
      <div style={{ fontSize: '14px', color: '#444' }}>
        Start bidding to claim your spot on the podium.
      </div>
    </div>
  </section>
);

export default function LeaderboardPage() {
  const { balance } = useVibeStore();
  const pathname = usePathname();
  const [navHover, setNavHover] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(1200);

  const isMobile = viewportWidth <= 768;
  const isTablet = viewportWidth <= 1024;
  const balanceDisplay = Number.isFinite(balance) ? balance.toLocaleString() : '0';

  const navItems = [
    { label: 'Browse Vibes', href: '/' },
    { label: 'Vibes', href: '/vibes' },
    { label: 'Sell a Feeling', href: '/mint' },
    { label: 'Leaderboard', href: '/leaderboard' },
    { label: 'Vibe Vault', href: '/vault' },
    { label: 'Top Up', href: '/top-up' },
  ];

  const leaderRows = [];
  const contestedItems = [];

  useEffect(() => {
    const updateViewportWidth = () => setViewportWidth(window.innerWidth);
    updateViewportWidth();
    window.addEventListener('resize', updateViewportWidth);

    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;700;800&display=swap');

      @keyframes scroll {
        0% { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }

      @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }

      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      body {
        background-color: #0D0D0D;
        overflow-x: hidden;
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

  return (
    <div style={customStyles.root}>
      <header
        style={{
          ...customStyles.header,
          height: isMobile ? '64px' : customStyles.header.height,
          padding: isMobile ? '0 14px' : customStyles.header.padding,
        }}
      >
        <Link href="/" style={{ ...customStyles.logo, fontSize: isMobile ? '20px' : customStyles.logo.fontSize }}>
          Vibe Auction
        </Link>

        {!isMobile && (
          <nav style={customStyles.navLinks}>
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const itemStyle = isActive || navHover === item.label ? customStyles.navItemActive : customStyles.navItem;

              if (item.href.startsWith('/')) {
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    style={itemStyle}
                    onMouseEnter={() => setNavHover(item.label)}
                    onMouseLeave={() => setNavHover('')}
                  >
                    {item.label}
                  </Link>
                );
              }

              return (
                <span
                  key={item.label}
                  style={itemStyle}
                  onMouseEnter={() => setNavHover(item.label)}
                  onMouseLeave={() => setNavHover('')}
                >
                  {item.label}
                </span>
              );
            })}
          </nav>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              ...customStyles.userBalance,
              padding: isMobile ? '4px 10px' : customStyles.userBalance.padding,
              fontSize: isMobile ? '12px' : customStyles.userBalance.fontSize,
            }}
          >
            <span>{balanceDisplay}</span> AURA
          </div>

          {isMobile && (
            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '6px',
                border: '2px solid #C8FF00',
                background: '#0D0D0D',
                color: '#C8FF00',
                fontSize: '20px',
                lineHeight: 1,
                cursor: 'pointer',
              }}
              aria-label="Toggle navigation menu"
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
            padding: '10px 14px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {navItems.map((item) => {
            const buttonStyle = {
              textAlign: 'left',
              width: '100%',
              border: item.href === '/leaderboard' ? '2px solid #C8FF00' : '1px solid #2A2A2A',
              background: item.href === '/leaderboard' ? '#1A1A1A' : '#121212',
              color: item.href === '/leaderboard' ? '#C8FF00' : '#FFFFFF',
              padding: '10px 12px',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '13px',
              textTransform: 'uppercase',
              letterSpacing: '0.3px',
              cursor: 'pointer',
            };

            if (item.href.startsWith('/')) {
              return (
                <Link key={item.label} href={item.href} style={buttonStyle} onClick={() => setMobileMenuOpen(false)}>
                  {item.label}
                </Link>
              );
            }

            return (
              <button key={item.label} type="button" style={buttonStyle} onClick={() => setMobileMenuOpen(false)}>
                {item.label}
              </button>
            );
          })}
        </nav>
      )}

      <div style={{ ...customStyles.tickerWrap, padding: isMobile ? '6px 0' : customStyles.tickerWrap.padding }}>
        <div style={{ ...customStyles.ticker, gap: isMobile ? '18px' : customStyles.ticker.gap }}>
          {['⚡ Bid AURA to climb the leaderboard', '🏆 Top bidders win legendary status', '💫 Collect rare vibes — build your reputation', '⚡ Bid AURA to climb the leaderboard', '🏆 Top bidders win legendary status', '💫 Collect rare vibes — build your reputation'].map((text, i) => (
            <div key={i} style={{ ...customStyles.tickerItem, fontSize: isMobile ? '12px' : customStyles.tickerItem.fontSize }}>
              {text}
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          ...customStyles.container,
          padding: isMobile ? '24px 16px 30px' : (isTablet ? '28px 20px 36px' : customStyles.container.padding),
        }}
      >
        <div style={{ ...customStyles.pageHeader, marginBottom: isMobile ? '28px' : customStyles.pageHeader.marginBottom }}>
          <svg
            style={{
              ...customStyles.svgDrip,
              width: isMobile ? '120px' : customStyles.svgDrip.width,
              right: isMobile ? '-6px' : customStyles.svgDrip.right,
            }}
            viewBox="0 0 200 200"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path fill="#C8FF00" d="M0,0 L200,0 L200,80 C180,80 170,120 150,120 C130,120 130,60 110,60 C90,60 90,140 70,140 C50,140 40,90 20,90 C10,90 0,100 0,100 Z" />
          </svg>
          <h1
            style={{
              ...customStyles.pageTitle,
              fontSize: isMobile ? '46px' : (isTablet ? '64px' : customStyles.pageTitle.fontSize),
            }}
          >
            The Aura <br />
            Hall of{' '}
            <span
              style={{
                ...customStyles.highlightTag,
                fontSize: isMobile ? '14px' : customStyles.highlightTag.fontSize,
                marginLeft: isMobile ? 0 : customStyles.highlightTag.marginLeft,
                marginTop: isMobile ? '8px' : 0,
                display: isMobile ? 'inline-flex' : customStyles.highlightTag.display,
              }}
            >
              Fame
            </span>
          </h1>
        </div>

        <Podium isMobile={isMobile} />

        <div
          style={{
            ...customStyles.boardGrid,
            gridTemplateColumns: isTablet ? '1fr' : customStyles.boardGrid.gridTemplateColumns,
            gap: isMobile ? '22px' : customStyles.boardGrid.gap,
          }}
        >
          <div>
            <h2 style={{ ...customStyles.sectionTitle, fontSize: isMobile ? '26px' : customStyles.sectionTitle.fontSize }}>
              Top Aura Spenders
              <span style={customStyles.sectionTitleLine} />
            </h2>
            {leaderRows.length === 0 ? (
              <div style={{ border: '2px dashed #2A2A2A', padding: '32px', textAlign: 'center', color: '#444', fontWeight: 700, textTransform: 'uppercase', fontSize: '13px' }}>
                No bidders ranked yet
              </div>
            ) : (
              <table style={customStyles.leaderTable}>
                <tbody>
                  {leaderRows.map((row) => (
                    <LeaderRow key={row.rank} {...row} isMobile={isMobile} />
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div>
            <h2 style={{ ...customStyles.sectionTitle, fontSize: isMobile ? '26px' : customStyles.sectionTitle.fontSize }}>
              Most Contested
              <span style={customStyles.sectionTitleLine} />
            </h2>
            {contestedItems.length === 0 ? (
              <div style={{ border: '2px dashed #2A2A2A', padding: '32px', textAlign: 'center', color: '#444', fontWeight: 700, textTransform: 'uppercase', fontSize: '13px' }}>
                No contested vibes yet
              </div>
            ) : (
              <div style={customStyles.contestedList}>
                {contestedItems.map((item, idx) => (
                  <ContestedItem key={idx} name={item.name} bids={item.bids} isMobile={isMobile} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
