'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useVibeStore } from '../state/vibe-store';
import { useAuth } from '../state/auth-store';
import NavBar from '../components/NavBar';

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
  trophyFallback: {
    fontSize: '13px',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    border: '2px solid #222222',
    padding: '8px 12px',
    background: 'rgba(255,255,255,0.6)',
    zIndex: 1,
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
  bidVibeThumb: {
    width: '38px',
    height: '38px',
    borderRadius: '6px',
    objectFit: 'cover',
    border: '1px solid #2A2A2A',
    flexShrink: 0,
    background: '#EEEEEE',
  },
  bidVibeThumbFallback: {
    width: '38px',
    height: '38px',
    border: '1px solid #2A2A2A',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#F0F0F0',
    color: '#444444',
    fontSize: '9px',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    flexShrink: 0,
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

const durationOptions = ['12 Hours', '24 Hours', '3 Days', '7 Days'];

const TrophyCard = ({ trophy, isMobile, mintVibe, userHandle, userId }) => {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);
  const [relisting, setRelisting] = useState(false);
  const [relistPrice, setRelistPrice] = useState('');
  const [relistBuyNow, setRelistBuyNow] = useState('');
  const [relistDuration, setRelistDuration] = useState('24 Hours');
  const [submitting, setSubmitting] = useState(false);
  const [relistError, setRelistError] = useState('');
  const priceInputRef = useRef(null);

  const rarity = String(trophy.rarity || 'common').toLowerCase();
  const rarityStyle = rarityStyleMap[rarity] || customStyles.rarityCommon;
  const rarityLabel = rarity.charAt(0).toUpperCase() + rarity.slice(1);
  const categoryLabel = trophy.category || 'Misc';
  const wonDateLabel = trophy.wonDate || 'Unknown';

  const inputStyle = {
    width: '100%',
    background: '#111111',
    border: '1px solid #444444',
    color: '#FFFFFF',
    padding: '8px 10px',
    fontSize: '14px',
    fontFamily: "'Inter', sans-serif",
    outline: 'none',
    boxSizing: 'border-box',
  };

  const handleRelist = async (e) => {
    e.preventDefault();
    const numericPrice = Number(String(relistPrice).replace(/,/g, '').trim());
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      setRelistError('Enter a starting price greater than 0.');
      return;
    }
    const buyNowNumeric = Number(String(relistBuyNow || '').replace(/,/g, '').trim());
    setSubmitting(true);
    setRelistError('');
    const mintResult = await mintVibe({
      name: trophy.name,
      category: trophy.category || 'Vibes',
      startingPrice: numericPrice,
      buyNowPrice: Number.isFinite(buyNowNumeric) && buyNowNumeric > 0 ? buyNowNumeric : null,
      duration: relistDuration,
      author: trophy.originalAuthor || userHandle || null,
      listedBy: userId || userHandle || null,
    });
    setSubmitting(false);
    if (!mintResult?.mintedVibe) {
      setRelistError(mintResult?.message || 'Listing failed. Try again.');
      return;
    }
    const minted = mintResult.mintedVibe;
    if (minted.slug) {
      router.push(`/auction/${minted.slug}`);
    } else {
      setRelisting(false);
    }
  };

  return (
    <div
      style={hovered && !isMobile && !relisting ? customStyles.trophyCardHovered : customStyles.trophyCardBase}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span style={rarityStyle}>{rarityLabel}</span>
      <div style={{ ...customStyles.trophyImageArea, height: isMobile ? '140px' : customStyles.trophyImageArea.height }}>
        <div style={customStyles.trophyPatternDots}></div>
        {trophy.imageUrl ? (
          <img
            src={trophy.imageUrl}
            alt={trophy.name}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 }}
          />
        ) : (
          <span style={{ ...customStyles.trophyFallback, fontSize: isMobile ? '12px' : customStyles.trophyFallback.fontSize }}>
            Image Pending
          </span>
        )}
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

        {!relisting ? (
          <button
            type="button"
            onClick={() => { setRelisting(true); setTimeout(() => priceInputRef.current?.focus(), 50); }}
            style={{
              marginTop: '12px',
              width: '100%',
              background: '#000000',
              color: '#C8FF00',
              border: '2px solid #C8FF00',
              padding: '10px',
              fontFamily: "'Anton', sans-serif",
              fontSize: '15px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              letterSpacing: '0.5px',
            }}
          >
            Relist for Sale
          </button>
        ) : (
          <form onSubmit={handleRelist} style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#888888', letterSpacing: '0.5px' }}>
              Relist Settings
            </div>
            <input
              ref={priceInputRef}
              type="number"
              min="1"
              placeholder="Starting price (AURA)"
              value={relistPrice}
              onChange={(e) => setRelistPrice(e.target.value)}
              style={inputStyle}
              required
            />
            <input
              type="number"
              min="1"
              placeholder="Buy It Now (optional)"
              value={relistBuyNow}
              onChange={(e) => setRelistBuyNow(e.target.value)}
              style={inputStyle}
            />
            <select
              value={relistDuration}
              onChange={(e) => setRelistDuration(e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              {durationOptions.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            {relistError && (
              <div style={{ fontSize: '12px', color: '#FF6B6B', fontWeight: 700 }}>{relistError}</div>
            )}
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  flex: 1,
                  background: submitting ? '#88AA00' : '#C8FF00',
                  color: '#000000',
                  border: 'none',
                  padding: '10px',
                  fontFamily: "'Anton', sans-serif",
                  fontSize: '14px',
                  textTransform: 'uppercase',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                }}
              >
                {submitting ? 'Listing...' : 'List It'}
              </button>
              <button
                type="button"
                onClick={() => { setRelisting(false); setRelistError(''); }}
                style={{
                  background: 'transparent',
                  color: '#666666',
                  border: '1px solid #333333',
                  padding: '10px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

const VibeVaultTab = ({ isMobile, vaultItems, mintVibe, userHandle, userId }) => {
  const [activeFilter, setActiveFilter] = useState('All Vibes');
  const [search, setSearch] = useState('');

  const filterCategories = useMemo(() => {
    const base = ['All Vibes', 'Rare', 'Epic', 'Common'];
    const extra = Array.from(new Set(vaultItems.map((item) => item.category).filter(Boolean))).filter(
      (category) => !base.some((entry) => entry.toLowerCase() === String(category).toLowerCase()),
    );
    return [...base, ...extra];
  }, [vaultItems]);

  const filteredTrophies = useMemo(() => {
    const q = normalize(search);
    return vaultItems.filter((trophy) => {
      const filterMatch = (() => {
        if (activeFilter === 'All Vibes') return true;
        if (activeFilter === 'Rare') return normalize(trophy.rarity) === 'rare';
        if (activeFilter === 'Epic') return normalize(trophy.rarity) === 'epic';
        if (activeFilter === 'Common') return normalize(trophy.rarity) === 'common';
        return normalize(trophy.category) === normalize(activeFilter);
      })();
      if (!filterMatch) return false;
      if (!q) return true;
      return [trophy.name, trophy.category, trophy.rarity, trophy.originalAuthor].some(
        (f) => normalize(f).includes(q),
      );
    });
  }, [activeFilter, search, vaultItems]);

  return (
    <div style={{ ...customStyles.tabPanel, padding: isMobile ? '18px 14px' : customStyles.tabPanel.padding }}>
      <div style={{ ...customStyles.vaultHeader, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center' }}>
        <span style={{ ...customStyles.vaultTitle, fontSize: isMobile ? '28px' : customStyles.vaultTitle.fontSize }}>Your Vibe Vault</span>
        <span style={{ ...customStyles.vaultCount, fontSize: isMobile ? '14px' : customStyles.vaultCount.fontSize }}>
          {vaultItems.length} Vibes Collected
        </span>
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search vault by name, category, rarity…"
        style={{
          width: '100%',
          background: '#111',
          border: '2px solid #333',
          color: '#FFF',
          fontSize: '14px',
          fontFamily: "'Inter', sans-serif",
          padding: '10px 14px',
          outline: 'none',
          marginBottom: '14px',
          boxSizing: 'border-box',
        }}
      />

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
        <div style={customStyles.emptyState}>
          {search ? `No vibes match "${search}"` : 'No vibes match this filter yet'}
        </div>
      ) : (
        <div
          style={{
            ...customStyles.trophyGrid,
            gridTemplateColumns: isMobile ? '1fr' : customStyles.trophyGrid.gridTemplateColumns,
            gap: isMobile ? '12px' : customStyles.trophyGrid.gap,
          }}
        >
          {filteredTrophies.map((trophy) => (
            <TrophyCard
              key={trophy.id || trophy.name}
              trophy={trophy}
              isMobile={isMobile}
              mintVibe={mintVibe}
              userHandle={userHandle}
              userId={userId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const ActiveBidsTab = ({ isMobile, activeBids }) => (
  <div style={{ ...customStyles.tabPanel, padding: isMobile ? '18px 14px' : customStyles.tabPanel.padding }}>
    {activeBids.length === 0 ? (
      <div style={customStyles.emptyState}>
        <div>No active bids right now</div>
        <Link
          href="/auctions"
          style={{
            display: 'inline-block',
            marginTop: '12px',
            background: '#C8FF00',
            color: '#000',
            padding: '8px 18px',
            fontFamily: "'Anton', sans-serif",
            fontSize: '15px',
            textTransform: 'uppercase',
            textDecoration: 'none',
          }}
        >
          Browse Auctions →
        </Link>
      </div>
    ) : (
      <div style={customStyles.activeBidsList}>
        {activeBids.map((bid) => {
          const isHighest = bid.status === 'HIGHEST';
          const isOutbid = bid.status === 'OUTBID';
          const statusBg = isHighest ? '#00AD11' : isOutbid ? '#FF4D00' : '#444444';
          const statusText = '#FFFFFF';
          const auctionSlug = bid.slug || (bid.id ? String(bid.id).replace(/^bid-/, '') : null);
          const row = (
            <div
              style={{
                ...customStyles.bidRow,
                borderLeft: `8px solid ${isHighest ? '#C8FF00' : isOutbid ? '#FF4D00' : '#444'}`,
                opacity: isOutbid ? 0.8 : 1,
              }}
            >
              <div style={customStyles.bidVibeInfo}>
                {bid.imageUrl ? (
                  <img
                    src={bid.imageUrl}
                    alt={bid.name || 'Vibe'}
                    style={customStyles.bidVibeThumb}
                  />
                ) : (
                  <span style={customStyles.bidVibeThumbFallback}>IMG</span>
                )}
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
                <div style={{ display: 'inline-block', background: statusBg, color: statusText, fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', padding: '3px 8px', borderRadius: '3px', letterSpacing: '0.3px' }}>
                  {bid.status || 'LIVE'}
                </div>
              </div>

              {auctionSlug && (
                <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
                  <Link
                    href={`/auction/${auctionSlug}`}
                    style={{
                      background: isHighest ? '#C8FF00' : '#222',
                      color: isHighest ? '#000' : '#C8FF00',
                      padding: '7px 12px',
                      fontFamily: "'Anton', sans-serif",
                      fontSize: '13px',
                      textTransform: 'uppercase',
                      textDecoration: 'none',
                      whiteSpace: 'nowrap',
                      border: `1px solid ${isHighest ? '#C8FF00' : '#444'}`,
                    }}
                  >
                    View →
                  </Link>
                </div>
              )}
            </div>
          );
          return <div key={bid.id || bid.name}>{row}</div>;
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
            sortedLog.map((entry) => {
              const ts = entry.createdAt
                ? new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : null;
              return (
                <div key={entry.id} style={{ ...customStyles.receiptRow, flexDirection: 'column', gap: '2px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                    <span>{entry.label}</span>
                    <span style={{ fontWeight: 900 }}>{formatSigned(entry.amount)}</span>
                  </div>
                  {ts && (
                    <span style={{ fontSize: '10px', color: '#888', letterSpacing: '0.3px' }}>{ts}</span>
                  )}
                </div>
              );
            })
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
  const { balance, vaultItems, activeBids, walletLog, mintVibe } = useVibeStore();
  const { user, profile } = useAuth();
  const username = profile?.username || user?.user_metadata?.username || user?.email?.split('@')[0] || 'Anonymous';
  const avatarMonogram = String(username || 'U').trim().charAt(0).toUpperCase() || 'U';
  const profilePath = `/profile/${encodeURIComponent(username)}`;
  const userId = user?.id || null;
  const [activeTab, setActiveTab] = useState('trophies');
  const [viewportWidth, setViewportWidth] = useState(1200);

  const isMobile = viewportWidth <= 768;
  const isTablet = viewportWidth <= 1024;
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

  return (
    <div style={customStyles.page}>
      <div style={customStyles.patternDots}></div>

      <NavBar />

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
            {avatarMonogram}
          </div>
          <div>
            <h1
              style={{
                ...customStyles.profileH1,
                fontSize: isMobile ? '34px' : (isTablet ? '46px' : customStyles.profileH1.fontSize),
              }}
            >
              <Link href={profilePath} style={{ color: 'inherit', textDecoration: 'none' }}>
                @{username}
              </Link>
            </h1>
            <div style={{ ...customStyles.profileTag, fontSize: isMobile ? '12px' : customStyles.profileTag.fontSize }}>
              {vaultItems.length > 0 ? `${vaultItems.length} Vibe${vaultItems.length !== 1 ? 's' : ''} Collected` : 'Vibe Collector'}
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

        {activeTab === 'trophies' && (
          <VibeVaultTab
            isMobile={isMobile}
            vaultItems={vaultItems}
            mintVibe={mintVibe}
            userHandle={username}
            userId={userId}
          />
        )}
        {activeTab === 'bids' && <ActiveBidsTab isMobile={isMobile} activeBids={activeBids} />}
        {activeTab === 'wallet' && <WalletLogTab isMobile={isMobile} walletLog={walletLog} balance={balance} />}
      </div>
    </div>
  );
}
