'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useVibeStore } from '../state/vibe-store';
import { useAuth } from '../state/auth-store';

const customStyles = {
  page: {
    background: '#0D0D0D',
    minHeight: '100dvh',
    fontFamily: "'Inter', sans-serif",
    color: '#FFFFFF',
    WebkitFontSmoothing: 'antialiased',
    overflowX: 'hidden',
    position: 'relative',
  },
  patternDots: {
    backgroundImage: 'radial-gradient(rgba(200, 255, 0, 0.1) 1px, transparent 1px)',
    backgroundSize: '20px 20px',
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 0,
    pointerEvents: 'none',
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
    zIndex: 1000,
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
  heroZone: {
    position: 'relative',
    height: '240px',
    width: '100%',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    zIndex: 2,
  },
  heroSplit: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'linear-gradient(105deg, #000000 50%, #C8FF00 50.1%)',
    zIndex: 0,
  },
  heroContent: {
    position: 'relative',
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  profileAvatar: {
    width: '120px',
    height: '120px',
    background: '#C8FF00',
    border: '4px solid #FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '62px',
    transform: 'rotate(-3deg)',
    boxShadow: '10px 10px 0px rgba(0, 0, 0, 0.35)',
    marginBottom: '14px',
  },
  profileH1: {
    fontFamily: "'Anton', sans-serif",
    fontSize: '56px',
    textTransform: 'uppercase',
    lineHeight: 0.9,
    color: '#FFFFFF',
    textShadow: '4px 4px 0px #000000',
  },
  profileTag: {
    background: '#000000',
    color: '#C8FF00',
    padding: '4px 12px',
    fontWeight: 800,
    fontSize: '14px',
    textTransform: 'uppercase',
    display: 'inline-block',
    marginTop: '8px',
  },
  contentContainer: {
    maxWidth: '1400px',
    width: 'calc(100% - 48px)',
    margin: '-20px auto 72px',
    position: 'relative',
    zIndex: 20,
    background: '#0D0D0D',
    border: '2px solid #C8FF00',
    minHeight: '500px',
  },
  tabNav: {
    display: 'flex',
    background: '#1A1A1A',
    borderBottom: '2px solid #C8FF00',
  },
  tabBtnBase: {
    flex: 1,
    padding: '24px',
    border: 'none',
    background: 'transparent',
    color: '#FFFFFF',
    fontFamily: "'Anton', sans-serif",
    fontSize: '20px',
    textTransform: 'uppercase',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  tabBtnActive: {
    flex: 1,
    padding: '24px',
    border: 'none',
    background: '#C8FF00',
    color: '#000000',
    fontFamily: "'Anton', sans-serif",
    fontSize: '20px',
    textTransform: 'uppercase',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  tabPanel: {
    padding: '32px',
  },
  vaultHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '32px',
    gap: '10px',
  },
  vaultTitle: {
    fontFamily: "'Anton', sans-serif",
    fontSize: '36px',
    textTransform: 'uppercase',
    color: '#C8FF00',
  },
  vaultCount: {
    background: '#C8FF00',
    color: '#000000',
    fontFamily: "'Anton', sans-serif",
    fontSize: '16px',
    padding: '6px 16px',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  },
  vaultFilters: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
    flexWrap: 'wrap',
  },
  filterChipBase: {
    padding: '6px 14px',
    border: '2px solid #FFFFFF',
    background: 'transparent',
    color: '#FFFFFF',
    fontWeight: 700,
    fontSize: '12px',
    textTransform: 'uppercase',
    cursor: 'pointer',
    borderRadius: '99px',
    transition: 'all 0.15s',
  },
  filterChipActive: {
    padding: '6px 14px',
    border: '2px solid #C8FF00',
    background: '#C8FF00',
    color: '#000000',
    fontWeight: 700,
    fontSize: '12px',
    textTransform: 'uppercase',
    cursor: 'pointer',
    borderRadius: '99px',
    transition: 'all 0.15s',
  },
  trophyGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '24px',
  },
  trophyCardBase: {
    background: '#FFFFFF',
    border: '2px solid #C8FF00',
    borderRadius: '8px',
    overflow: 'hidden',
    textAlign: 'left',
    transition: 'all 0.2s',
    position: 'relative',
    cursor: 'pointer',
    boxShadow: '6px 6px 0px rgba(200, 255, 0, 0.3)',
  },
  trophyCardHovered: {
    background: '#FFFFFF',
    border: '2px solid #C8FF00',
    borderRadius: '8px',
    overflow: 'hidden',
    textAlign: 'left',
    transition: 'all 0.2s',
    position: 'relative',
    cursor: 'pointer',
    transform: 'translate(-2px, -2px)',
    boxShadow: '8px 8px 0px #C8FF00',
  },
  rarityRare: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    fontSize: '10px',
    fontWeight: 800,
    textTransform: 'uppercase',
    padding: '2px 8px',
    borderRadius: '99px',
    background: '#a855f7',
    color: '#fff',
  },
  rarityEpic: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    fontSize: '10px',
    fontWeight: 800,
    textTransform: 'uppercase',
    padding: '2px 8px',
    borderRadius: '99px',
    background: '#f97316',
    color: '#fff',
  },
  rarityCommon: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    fontSize: '10px',
    fontWeight: 800,
    textTransform: 'uppercase',
    padding: '2px 8px',
    borderRadius: '99px',
    background: '#444',
    color: '#aaa',
  },
  trophyEmoji: {
    fontSize: '64px',
    zIndex: 1,
    filter: 'drop-shadow(3px 3px 0px rgba(0,0,0,0.1))',
  },
  trophyName: {
    fontFamily: "'Anton', sans-serif",
    fontSize: '22px',
    textTransform: 'uppercase',
    lineHeight: 1.1,
    display: 'block',
    marginBottom: '8px',
    color: '#000000',
  },
  trophyMeta: {
    fontSize: '10px',
    color: '#888888',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  trophyPrice: {
    fontFamily: "'Anton', sans-serif",
    fontSize: '20px',
    color: '#000000',
    marginTop: '4px',
    display: 'block',
  },
  trophyImageArea: {
    height: '160px',
    background: '#F0F0F0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderBottom: '2px solid #000000',
  },
  trophyPatternDots: {
    backgroundImage: 'radial-gradient(#000000 1px, transparent 1px)',
    backgroundSize: '10px 10px',
    opacity: 0.1,
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  trophyContent: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    color: '#000000',
  },
  trophyMetaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTop: '1px solid #DDDDDD',
    paddingTop: '8px',
    gap: '10px',
  },
  trophySubMeta: {
    fontSize: '11px',
    color: '#666666',
    marginTop: '8px',
    fontWeight: 600,
  },
  activeBidsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  bidRow: {
    background: '#FFFFFF',
    color: '#000000',
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeft: '8px solid #C8FF00',
    gap: '14px',
    flexWrap: 'wrap',
  },
  bidVibeInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    minWidth: '220px',
  },
  bidVibeEmoji: {
    fontSize: '24px',
  },
  bidVibeName: {
    fontFamily: "'Anton', sans-serif",
    fontSize: '20px',
    textTransform: 'uppercase',
  },
  bidStatusGroup: {
    textAlign: 'right',
    minWidth: '100px',
  },
  bidStatusLabel: {
    fontSize: '10px',
    fontWeight: 800,
    textTransform: 'uppercase',
    color: '#888',
  },
  bidStatusValue: {
    fontFamily: "'Anton', sans-serif",
    fontSize: '18px',
  },
  receiptContainer: {
    background: '#fdfdfd',
    color: '#000',
    padding: '40px',
    fontFamily: "'Courier New', Courier, monospace",
    maxWidth: '500px',
    margin: '0 auto',
    position: 'relative',
    boxShadow: '10px 10px 0px rgba(200, 255, 0, 0.3)',
  },
  receiptHeader: {
    textAlign: 'center',
    borderBottom: '1px dashed #000',
    paddingBottom: '20px',
    marginBottom: '20px',
  },
  receiptRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
    marginBottom: '10px',
    gap: '10px',
  },
  receiptRowTotal: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '20px',
    marginBottom: '10px',
    borderTop: '1px solid #000',
    marginTop: '20px',
    paddingTop: '15px',
    fontWeight: 900,
    gap: '10px',
  },
  barcode: {
    width: '100%',
    height: '50px',
    background: 'repeating-linear-gradient(90deg, #000, #000 2px, #fff 2px, #fff 5px)',
    marginTop: '20px',
  },
  walletTopUpWrap: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '16px',
  },
  walletTopUpBtn: {
    background: '#C8FF00',
    color: '#000000',
    textDecoration: 'none',
    padding: '10px 16px',
    fontWeight: 900,
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
    border: '1px solid #C8FF00',
  },
  emptyState: {
    border: '2px dashed #444',
    padding: '24px',
    textAlign: 'center',
    color: '#999',
    fontWeight: 600,
    textTransform: 'uppercase',
  },
};

const rarityStyleMap = {
  epic: customStyles.rarityEpic,
  rare: customStyles.rarityRare,
  common: customStyles.rarityCommon,
};

const normalize = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const formatAuraNumber = (value) => {
  const numeric = typeof value === 'number' ? value : Number(String(value || '').replace(/,/g, ''));
  return Number.isFinite(numeric) ? numeric.toLocaleString() : '0';
};

const formatSigned = (value) => {
  const numeric = typeof value === 'number' ? value : Number(String(value || '').replace(/,/g, ''));
  if (!Number.isFinite(numeric)) return '+0';
  return `${numeric >= 0 ? '+' : '-'}${Math.abs(numeric).toLocaleString()}`;
};

const TrophyCard = ({ trophy, isMobile }) => {
  const [hovered, setHovered] = useState(false);
  const rarity = String(trophy.rarity || 'common').toLowerCase();
  const rarityStyle = rarityStyleMap[rarity] || customStyles.rarityCommon;
  const rarityLabel = rarity.charAt(0).toUpperCase() + rarity.slice(1);
  const categoryLabel = trophy.category || 'Misc';
  const wonDateLabel = trophy.wonDate || 'Unknown';

  return (
    <div
      style={hovered && !isMobile ? customStyles.trophyCardHovered : customStyles.trophyCardBase}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span style={rarityStyle}>{rarityLabel}</span>
      <div style={{ ...customStyles.trophyImageArea, height: isMobile ? '140px' : customStyles.trophyImageArea.height }}>
        <div style={customStyles.trophyPatternDots}></div>
        <span style={{ ...customStyles.trophyEmoji, fontSize: isMobile ? '52px' : customStyles.trophyEmoji.fontSize }}>
          {trophy.emoji || '✨'}
        </span>
      </div>
      <div style={{ ...customStyles.trophyContent, padding: isMobile ? '14px' : customStyles.trophyContent.padding }}>
        <span style={{ ...customStyles.trophyName, fontSize: isMobile ? '20px' : customStyles.trophyName.fontSize }}>
          {trophy.name}
        </span>
        <div style={customStyles.trophyMetaRow}>
          <div>
            <span style={customStyles.trophyMeta}>Won Price</span>
            <span style={customStyles.trophyPrice}>{formatAuraNumber(trophy.price)} AURA</span>
          </div>
          <span style={{ ...customStyles.trophySubMeta, marginTop: 0 }}>{categoryLabel}</span>
        </div>
        <span style={customStyles.trophySubMeta}>Won {wonDateLabel}</span>
      </div>
    </div>
  );
};

const VibeVaultTab = ({ isMobile, vaultItems }) => {
  const [activeFilter, setActiveFilter] = useState('All Vibes');

  const filterCategories = useMemo(() => {
    const base = ['All Vibes', 'Rare', 'Epic', 'Common'];
    const extra = Array.from(new Set(vaultItems.map((item) => item.category).filter(Boolean))).filter(
      (category) => !base.some((entry) => entry.toLowerCase() === String(category).toLowerCase()),
    );
    return [...base, ...extra];
  }, [vaultItems]);

  const filteredTrophies = useMemo(
    () =>
      vaultItems.filter((trophy) => {
        if (activeFilter === 'All Vibes') return true;
        if (activeFilter === 'Rare') return normalize(trophy.rarity) === 'rare';
        if (activeFilter === 'Epic') return normalize(trophy.rarity) === 'epic';
        if (activeFilter === 'Common') return normalize(trophy.rarity) === 'common';
        return normalize(trophy.category) === normalize(activeFilter);
      }),
    [activeFilter, vaultItems],
  );

  return (
    <div style={{ ...customStyles.tabPanel, padding: isMobile ? '18px 14px' : customStyles.tabPanel.padding }}>
      <div style={{ ...customStyles.vaultHeader, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center' }}>
        <span style={{ ...customStyles.vaultTitle, fontSize: isMobile ? '28px' : customStyles.vaultTitle.fontSize }}>⚡ Your Vibe Vault</span>
        <span style={{ ...customStyles.vaultCount, fontSize: isMobile ? '14px' : customStyles.vaultCount.fontSize }}>
          {vaultItems.length} Vibes Collected
        </span>
      </div>

      <div style={customStyles.vaultFilters}>
        {filterCategories.map((cat) => (
          <button
            key={cat}
            style={activeFilter === cat ? customStyles.filterChipActive : customStyles.filterChipBase}
            onClick={() => setActiveFilter(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {filteredTrophies.length === 0 ? (
        <div style={customStyles.emptyState}>No vibes match this filter yet</div>
      ) : (
        <div
          style={{
            ...customStyles.trophyGrid,
            gridTemplateColumns: isMobile ? '1fr' : customStyles.trophyGrid.gridTemplateColumns,
            gap: isMobile ? '12px' : customStyles.trophyGrid.gap,
          }}
        >
          {filteredTrophies.map((trophy) => (
            <TrophyCard key={trophy.id || trophy.name} trophy={trophy} isMobile={isMobile} />
          ))}
        </div>
      )}
    </div>
  );
};

const ActiveBidsTab = ({ isMobile, activeBids }) => (
  <div style={{ ...customStyles.tabPanel, padding: isMobile ? '18px 14px' : customStyles.tabPanel.padding }}>
    {activeBids.length === 0 ? (
      <div style={customStyles.emptyState}>No active bids right now</div>
    ) : (
      <div style={customStyles.activeBidsList}>
        {activeBids.map((bid) => {
          const statusColor = bid.status === 'HIGHEST' ? '#00AD11' : bid.status === 'OUTBID' ? '#FF4D00' : '#000000';
          return (
            <div key={bid.id || bid.name} style={customStyles.bidRow}>
              <div style={customStyles.bidVibeInfo}>
                <span style={customStyles.bidVibeEmoji}>{bid.emoji || '✨'}</span>
                <span style={{ ...customStyles.bidVibeName, fontSize: isMobile ? '16px' : customStyles.bidVibeName.fontSize }}>
                  {bid.name}
                </span>
              </div>

              <div style={{ ...customStyles.bidStatusGroup, textAlign: isMobile ? 'left' : customStyles.bidStatusGroup.textAlign }}>
                <div style={customStyles.bidStatusLabel}>Your Bid</div>
                <div style={customStyles.bidStatusValue}>{formatAuraNumber(bid.amount)} AURA</div>
              </div>

              <div style={{ ...customStyles.bidStatusGroup, textAlign: isMobile ? 'left' : customStyles.bidStatusGroup.textAlign }}>
                <div style={customStyles.bidStatusLabel}>Status</div>
                <div style={{ ...customStyles.bidStatusValue, color: statusColor }}>{bid.status || 'LIVE'}</div>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
);

const WalletLogTab = ({ isMobile, walletLog, balance }) => {
  const sortedLog = [...walletLog].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  return (
    <div style={{ ...customStyles.tabPanel, padding: isMobile ? '18px 14px' : customStyles.tabPanel.padding }}>
      <div
        style={{
          ...customStyles.receiptContainer,
          padding: isMobile ? '22px 16px' : customStyles.receiptContainer.padding,
          boxShadow: isMobile ? '6px 6px 0px rgba(200, 255, 0, 0.3)' : customStyles.receiptContainer.boxShadow,
        }}
      >
        <div style={customStyles.receiptHeader}>
          <h2 style={{ fontFamily: "'Anton', sans-serif", fontSize: isMobile ? '20px' : '24px' }}>VIBE TRANSACTION</h2>
          <p style={{ fontSize: '10px' }}>TERMINAL #8802-AURA | LIVE LEDGER</p>
        </div>

        <div>
          {sortedLog.length === 0 ? (
            <div style={{ ...customStyles.receiptRow, justifyContent: 'center' }}>No transactions yet</div>
          ) : (
            sortedLog.map((entry) => (
              <div key={entry.id} style={customStyles.receiptRow}>
                <span>{entry.label}</span>
                <span>{formatSigned(entry.amount)}</span>
              </div>
            ))
          )}

          <div style={customStyles.receiptRowTotal}>
            <span>CURRENT BALANCE</span>
            <span>{formatAuraNumber(balance)}</span>
          </div>
        </div>

        <div style={customStyles.barcode}></div>
        <p style={{ marginTop: '15px', textAlign: 'center', fontSize: '10px' }}>KEEP YOUR VIBE HIGH</p>
      </div>
      <div style={customStyles.walletTopUpWrap}>
        <Link
          href="/top-up"
          style={{
            ...customStyles.walletTopUpBtn,
            fontSize: isMobile ? '11px' : customStyles.walletTopUpBtn.fontSize,
            padding: isMobile ? '10px 14px' : customStyles.walletTopUpBtn.padding,
          }}
        >
          Top Up with Stripe
        </Link>
      </div>
    </div>
  );
};

export default function VaultPage() {
  const { balance, vaultItems, activeBids, walletLog } = useVibeStore();
  const { user } = useAuth();
  const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'Anonymous';
  const [activeTab, setActiveTab] = useState('trophies');
  const [navHover, setNavHover] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(1200);
  const pathname = usePathname();

  const isMobile = viewportWidth <= 768;
  const isTablet = viewportWidth <= 1024;
  const balanceDisplay = formatAuraNumber(balance);

  const navItems = [
    { label: 'Browse Vibes', href: '/' },
    { label: 'Vibes', href: '/vibes' },
    { label: 'Sell a Feeling', href: '/mint' },
    { label: 'Leaderboard', href: '/leaderboard' },
    { label: 'Vibe Vault', href: '/vault' },
    { label: 'Top Up', href: '/top-up' },
  ];

  const tabs = [
    { id: 'trophies', label: 'Vibe Vault' },
    { id: 'bids', label: 'Active Bids' },
    { id: 'wallet', label: 'Wallet Log' },
  ];

  useEffect(() => {
    const updateViewportWidth = () => setViewportWidth(window.innerWidth);
    updateViewportWidth();
    window.addEventListener('resize', updateViewportWidth);

    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;700;800&display=swap');
      body {
        background-color: #0D0D0D;
        color: #FFFFFF;
        font-family: 'Inter', sans-serif;
        -webkit-font-smoothing: antialiased;
        overflow-x: hidden;
        min-height: 100vh;
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      *, *::before, *::after { box-sizing: border-box; }
      .vault-scroll::-webkit-scrollbar { height: 6px; }
      .vault-scroll::-webkit-scrollbar-thumb { background: rgba(200, 255, 0, 0.5); border-radius: 99px; }
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
    <div style={customStyles.page}>
      <div style={customStyles.patternDots}></div>

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
              const isActive = item.href.startsWith('/') && pathname === item.href;

              if (item.href.startsWith('/')) {
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
              }

              return (
                <span
                  key={item.label}
                  style={{
                    ...customStyles.navItem,
                    color: navHover === item.label ? '#C8FF00' : '#FFFFFF',
                  }}
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
                touchAction: 'manipulation',
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
            const isActive = item.href.startsWith('/') && pathname === item.href;
            const menuItemStyle = {
              textAlign: 'left',
              width: '100%',
              border: isActive ? '2px solid #C8FF00' : '1px solid #2A2A2A',
              background: isActive ? '#1A1A1A' : '#121212',
              color: isActive ? '#C8FF00' : '#FFFFFF',
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
                <Link key={item.label} href={item.href} style={menuItemStyle} onClick={() => setMobileMenuOpen(false)}>
                  {item.label}
                </Link>
              );
            }

            return (
              <button key={item.label} type="button" onClick={() => setMobileMenuOpen(false)} style={menuItemStyle}>
                {item.label}
              </button>
            );
          })}
        </nav>
      )}

      <section
        style={{
          ...customStyles.heroZone,
          height: isMobile ? '180px' : customStyles.heroZone.height,
        }}
      >
        <div style={customStyles.heroSplit}></div>
        <div style={customStyles.heroContent}>
          <div
            style={{
              ...customStyles.profileAvatar,
              width: isMobile ? '78px' : customStyles.profileAvatar.width,
              height: isMobile ? '78px' : customStyles.profileAvatar.height,
              fontSize: isMobile ? '36px' : customStyles.profileAvatar.fontSize,
              marginBottom: isMobile ? '10px' : customStyles.profileAvatar.marginBottom,
            }}
          >
            🕶️
          </div>
          <div>
            <h1
              style={{
                ...customStyles.profileH1,
                fontSize: isMobile ? '34px' : (isTablet ? '46px' : customStyles.profileH1.fontSize),
              }}
            >
              <Link href={`/profile/${username}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                @{username}
              </Link>
            </h1>
            <div style={{ ...customStyles.profileTag, fontSize: isMobile ? '12px' : customStyles.profileTag.fontSize }}>
              Vibe Master Lvl. 42
            </div>
          </div>
        </div>
      </section>

      <div
        style={{
          ...customStyles.contentContainer,
          width: isMobile ? 'auto' : customStyles.contentContainer.width,
          margin: isMobile ? '-8px 12px 30px' : customStyles.contentContainer.margin,
        }}
      >
        <nav
          className={isMobile ? 'vault-scroll' : undefined}
          style={{
            ...customStyles.tabNav,
            overflowX: isMobile ? 'auto' : 'visible',
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              style={{
                ...(activeTab === tab.id ? customStyles.tabBtnActive : customStyles.tabBtnBase),
                fontSize: isMobile ? '16px' : '20px',
                padding: isMobile ? '14px 18px' : '24px',
                minWidth: isMobile ? '150px' : 'auto',
                flex: isMobile ? '0 0 auto' : 1,
              }}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {activeTab === 'trophies' && <VibeVaultTab isMobile={isMobile} vaultItems={vaultItems} />}
        {activeTab === 'bids' && <ActiveBidsTab isMobile={isMobile} activeBids={activeBids} />}
        {activeTab === 'wallet' && <WalletLogTab isMobile={isMobile} walletLog={walletLog} balance={balance} />}
      </div>
    </div>
  );
}
