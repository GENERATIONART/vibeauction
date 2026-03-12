'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useVibeStore } from '../state/vibe-store';
import NavBar from '../components/NavBar';

const VIBES_BATCH_SIZE = 12;

const normalize = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const formatAura = (value) => {
  const numeric = typeof value === 'number' ? value : Number(String(value || '').replace(/,/g, ''));
  return Number.isFinite(numeric) ? numeric.toLocaleString() : '0';
};

const formatDate = (value) => {
  if (!Number.isFinite(value)) return 'Unknown date';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(value);
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

const hasNonBlankImageUrl = (value) =>
  typeof value === 'string' && value.trim().length > 0;

const customStyles = {
  page: {
    background: '#0D0D0D',
    minHeight: '100dvh',
    color: '#FFFFFF',
    fontFamily: "'Inter', sans-serif",
    WebkitFontSmoothing: 'antialiased',
    overflowX: 'hidden',
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
  hero: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '30px 24px 20px',
    position: 'relative',
  },
  heroTitle: {
    fontFamily: "'Anton', sans-serif",
    fontSize: '80px',
    lineHeight: 0.9,
    textTransform: 'uppercase',
    marginBottom: '12px',
  },
  highlightTag: {
    display: 'inline-block',
    background: '#C8FF00',
    color: '#000000',
    padding: '4px 12px',
    fontWeight: 800,
    fontSize: '18px',
    textTransform: 'uppercase',
    transform: 'rotate(-2deg)',
  },
  heroSubtext: {
    marginTop: '12px',
    color: 'rgba(255,255,255,0.78)',
    maxWidth: '760px',
    lineHeight: 1.5,
    fontSize: '16px',
  },
  bodyWrap: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 24px 42px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: '12px',
    marginBottom: '18px',
  },
  statCard: {
    background: '#121212',
    border: '1px solid #2A2A2A',
    borderLeft: '4px solid #C8FF00',
    padding: '12px',
  },
  statLabel: {
    fontSize: '11px',
    fontWeight: 800,
    textTransform: 'uppercase',
    color: '#7D7D7D',
    letterSpacing: '0.4px',
    marginBottom: '4px',
  },
  statValue: {
    fontFamily: "'Anton', sans-serif",
    fontSize: '28px',
    lineHeight: 1,
    color: '#C8FF00',
  },
  controls: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
    flexWrap: 'wrap',
  },
  searchInput: {
    background: '#111111',
    border: '2px solid #333333',
    color: '#FFFFFF',
    fontSize: '14px',
    fontFamily: "'Inter', sans-serif",
    padding: '10px 12px',
    minWidth: '280px',
    outline: 'none',
    borderRadius: '0',
  },
  filterRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  filterChip: {
    border: '1px solid #3A3A3A',
    color: '#FFFFFF',
    background: '#171717',
    padding: '7px 12px',
    textTransform: 'uppercase',
    fontWeight: 700,
    fontSize: '12px',
    cursor: 'pointer',
  },
  filterChipActive: {
    border: '1px solid #C8FF00',
    color: '#000000',
    background: '#C8FF00',
    padding: '7px 12px',
    textTransform: 'uppercase',
    fontWeight: 700,
    fontSize: '12px',
    cursor: 'pointer',
  },
  galleryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
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
    color: '#000000',
  },
  cardImageArea: {
    height: '156px',
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
  sourceBadge: {
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
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  cardTitle: {
    fontFamily: "'Anton', sans-serif",
    fontSize: '22px',
    lineHeight: 1.1,
    textTransform: 'uppercase',
  },
  cardDescription: {
    fontSize: '13px',
    color: '#404040',
    lineHeight: 1.45,
    minHeight: '56px',
  },
  cardMetaRow: {
    borderTop: '1px solid #DDDDDD',
    paddingTop: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: '10px',
  },
  cardMetaLabel: {
    fontSize: '10px',
    textTransform: 'uppercase',
    fontWeight: 700,
    color: '#888888',
  },
  cardMetaValue: {
    fontFamily: "'Anton', sans-serif",
    fontSize: '18px',
    color: '#000000',
  },
  cardSubline: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '11px',
    color: '#666666',
    textTransform: 'uppercase',
    fontWeight: 700,
    gap: '8px',
  },
  cardActionWrap: {
    padding: '0 14px 14px',
  },
  cardActionBtn: {
    width: '100%',
    border: 'none',
    background: '#000000',
    color: '#C8FF00',
    padding: '11px',
    fontFamily: "'Anton', sans-serif",
    fontSize: '16px',
    textTransform: 'uppercase',
  },
  emptyState: {
    border: '2px dashed #3A3A3A',
    color: '#9A9A9A',
    textAlign: 'center',
    padding: '32px',
    textTransform: 'uppercase',
    fontWeight: 700,
  },
};

const TokenCard = ({ item, isMobile }) => {
  const [hovered, setHovered] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const hasAuctionPage = Boolean(item.slug);

  useEffect(() => {
    setImageFailed(false);
  }, [item.imageUrl]);

  const inner = (
    <article
      style={{
        ...customStyles.card,
        transform: hovered && !isMobile ? 'translate(-2px, -2px)' : 'none',
        boxShadow: hovered && !isMobile ? '8px 8px 0px #C8FF00' : customStyles.card.boxShadow,
        cursor: hasAuctionPage ? 'pointer' : 'default',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={customStyles.sourceBadge}>{item.source}</div>
      <div style={{ ...customStyles.cardImageArea, height: isMobile ? '142px' : customStyles.cardImageArea.height }}>
        <div style={customStyles.patternDots}></div>
        {item.imageUrl && !imageFailed ? (
          <img
            src={item.imageUrl}
            alt={item.name}
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
      <div style={customStyles.cardContent}>
        <h3 style={{ ...customStyles.cardTitle, fontSize: isMobile ? '20px' : customStyles.cardTitle.fontSize }}>
          {item.name}
        </h3>
        <p style={customStyles.cardDescription}>{item.description}</p>
        <div style={customStyles.cardMetaRow}>
          <div>
            <div style={customStyles.cardMetaLabel}>Owner</div>
            <div style={customStyles.cardMetaValue}>{item.owner}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={customStyles.cardMetaLabel}>Last Value</div>
            <div style={customStyles.cardMetaValue}>{item.valueLabel}</div>
          </div>
        </div>
        <div style={customStyles.cardSubline}>
          <span>{item.category}</span>
          <span>{item.dateLabel}</span>
        </div>
      </div>
      <div style={customStyles.cardActionWrap}>
        <div
          style={{
            ...customStyles.cardActionBtn,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: hasAuctionPage
              ? (hovered ? '#C8FF00' : '#000000')
              : '#1A1A1A',
            color: hasAuctionPage
              ? (hovered ? '#000000' : '#C8FF00')
              : '#444444',
            transition: 'all 0.15s',
            fontFamily: "'Anton', sans-serif",
            fontSize: isMobile ? '14px' : '16px',
            padding: '11px',
            textTransform: 'uppercase',
          }}
        >
          {hasAuctionPage ? 'View Auction →' : 'Off Auction'}
        </div>
      </div>
    </article>
  );

  if (hasAuctionPage) {
    return (
      <Link href={`/auction/${item.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
        {inner}
      </Link>
    );
  }

  return inner;
};

export default function VibesPage() {
  const { vaultItems, mintedVibes, refreshState } = useVibeStore();

  const [viewportWidth, setViewportWidth] = useState(1200);
  const [activeFilter, setActiveFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(VIBES_BATCH_SIZE);
  const [loadMoreTrigger, setLoadMoreTrigger] = useState(null);

  const isMobile = viewportWidth <= 768;
  const isTablet = viewportWidth <= 1024;

  const syncLatestVibes = useCallback(async () => {
    try {
      await refreshState();
    } catch {
      // Keep existing UI data when refresh fails transiently.
    }
  }, [refreshState]);

  useEffect(() => {
    const updateViewportWidth = () => setViewportWidth(window.innerWidth);
    updateViewportWidth();
    window.addEventListener('resize', updateViewportWidth);

    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;700;800&display=swap');
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
    }, 20000);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.clearInterval(pollId);
    };
  }, [syncLatestVibes]);

  const allItems = useMemo(() => {
    const vaultList = (Array.isArray(vaultItems) ? vaultItems : [])
      .filter((item) => hasNonBlankImageUrl(item?.imageUrl))
      .map((item) => {
      const createdAtMs = toTimestampMs(item.createdAt);
      return {
        id: `vault-${item.id || normalize(item.name)}`,
        name: item.name || 'Untitled Vibe',
        category: item.category || 'Vault',
        source: 'Vault',
        owner: 'Unknown',
        description: `Won on ${item.wonDate || 'unknown date'}. Currently kept off auction.`,
        valueLabel: `${formatAura(item.price)} AURA`,
        imageUrl: item.imageUrl ?? null,
        createdAt: createdAtMs,
        dateLabel: item.wonDate ? `Won ${item.wonDate}` : 'Owned',
        signature: normalize(`${item.name}-${item.category}`),
      };
    });

    const mintedList = (Array.isArray(mintedVibes) ? mintedVibes : [])
      .filter((item) => hasNonBlankImageUrl(item?.imageUrl))
      .map((item) => {
      const isConfession = normalize(item.category) === 'confessions';
      const createdAtMs = toTimestampMs(item.createdAt);
      return {
        id: `minted-${item.id || normalize(item.name)}`,
        slug: item.slug || null,
        name: item.name || 'Untitled Vibe',
        category: item.category || 'Minted',
        source: isConfession ? 'Confessions' : 'Minted',
        owner: item.isAnonymous ? 'Anonymous' : item.author || '@VibeMinter',
        description: item.manifesto || (isConfession ? 'Anonymous confession minted and archived.' : 'Direct mint stored as a collectible vibe.'),
        valueLabel: isConfession ? 'Soulbound' : `${formatAura(item.startingPrice)} AURA`,
        imageUrl: item.imageUrl ?? null,
        createdAt: createdAtMs,
        dateLabel: createdAtMs > 0 ? formatDate(createdAtMs) : 'Recently minted',
        signature: normalize(`${item.name}-${item.manifesto}-${item.category}`),
      };
    });

    return [...mintedList, ...vaultList].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [vaultItems, mintedVibes]);

  const stats = useMemo(() => {
    const vaultCount = allItems.filter((item) => item.source === 'Vault').length;
    const mintedCount = allItems.filter((item) => item.source === 'Minted').length;
    const confessionCount = allItems.filter((item) => item.source === 'Confessions').length;
    return {
      searchable: mintedCount,
      vault: vaultCount,
      minted: mintedCount,
      confessions: confessionCount,
    };
  }, [allItems]);

  const filteredItems = useMemo(() => {
    const query = normalize(search);

    return allItems.filter((item) => {
      const filterMatch =
        activeFilter === 'All' ||
        normalize(item.source) === normalize(activeFilter) ||
        normalize(item.category) === normalize(activeFilter);

      if (!filterMatch) return false;
      if (!query) return true;

      return [item.name, item.description, item.category, item.owner, item.source].some((field) =>
        normalize(field).includes(query),
      );
    });
  }, [allItems, activeFilter, search]);

  const visibleItems = useMemo(() => filteredItems.slice(0, visibleCount), [filteredItems, visibleCount]);
  const hasMoreItems = visibleCount < filteredItems.length;

  useEffect(() => {
    setVisibleCount(VIBES_BATCH_SIZE);
  }, [activeFilter, search]);

  useEffect(() => {
    setVisibleCount((previous) =>
      Math.min(
        Math.max(VIBES_BATCH_SIZE, previous),
        filteredItems.length > 0 ? filteredItems.length : VIBES_BATCH_SIZE,
      ),
    );
  }, [filteredItems.length]);

  useEffect(() => {
    if (!loadMoreTrigger || !hasMoreItems) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting) return;
        setVisibleCount((previous) => Math.min(previous + VIBES_BATCH_SIZE, filteredItems.length));
      },
      { rootMargin: '240px 0px' },
    );

    observer.observe(loadMoreTrigger);
    return () => observer.disconnect();
  }, [loadMoreTrigger, hasMoreItems, filteredItems.length]);

  const filterOptions = ['All', 'Vault', 'Minted', 'Confessions'];

  return (
    <div style={customStyles.page}>
      <NavBar />

      <section
        style={{
          ...customStyles.hero,
          padding: isMobile ? '24px 16px 14px' : isTablet ? '28px 20px 16px' : customStyles.hero.padding,
        }}
      >
        <h1
          style={{
            ...customStyles.heroTitle,
            fontSize: isMobile ? '46px' : isTablet ? '66px' : customStyles.heroTitle.fontSize,
          }}
        >
          Vibes{' '}
          <span style={{ ...customStyles.highlightTag, fontSize: isMobile ? '14px' : customStyles.highlightTag.fontSize }}>
            OFF AUCTION
          </span>
        </h1>
        <p style={{ ...customStyles.heroSubtext, fontSize: isMobile ? '14px' : customStyles.heroSubtext.fontSize }}>
          A permanent gallery of vibes that are currently not listed for auction. Browse won vibes, direct mints, and confessions kept outside the bidding floor.
        </p>
      </section>

      <section
        style={{
          ...customStyles.bodyWrap,
          padding: isMobile ? '0 16px 24px' : customStyles.bodyWrap.padding,
        }}
      >
        <div
          style={{
            ...customStyles.statsGrid,
            gridTemplateColumns: isMobile ? '1fr 1fr' : isTablet ? 'repeat(2, minmax(0, 1fr))' : customStyles.statsGrid.gridTemplateColumns,
          }}
        >
          <div style={customStyles.statCard}>
            <div style={customStyles.statLabel}>Searchable Listings</div>
            <div style={customStyles.statValue}>{stats.searchable}</div>
          </div>
          <div style={customStyles.statCard}>
            <div style={customStyles.statLabel}>Vault Items</div>
            <div style={customStyles.statValue}>{stats.vault}</div>
          </div>
          <div style={customStyles.statCard}>
            <div style={customStyles.statLabel}>Direct Mints</div>
            <div style={customStyles.statValue}>{stats.minted}</div>
          </div>
          <div style={customStyles.statCard}>
            <div style={customStyles.statLabel}>Confessions</div>
            <div style={customStyles.statValue}>{stats.confessions}</div>
          </div>
        </div>

        <div style={customStyles.controls}>
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search vibes, owners, or categories"
            style={{
              ...customStyles.searchInput,
              minWidth: isMobile ? '100%' : customStyles.searchInput.minWidth,
              width: isMobile ? '100%' : 'auto',
            }}
          />
          <div style={customStyles.filterRow}>
            {filterOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setActiveFilter(option)}
                style={activeFilter === option ? customStyles.filterChipActive : customStyles.filterChip}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div style={customStyles.emptyState}>No vibes match this filter yet</div>
        ) : (
          <div
            style={{
              ...customStyles.galleryGrid,
              gridTemplateColumns: isMobile ? '1fr' : customStyles.galleryGrid.gridTemplateColumns,
            }}
          >
            {visibleItems.map((item) => (
              <TokenCard key={item.id} item={item} isMobile={isMobile} />
            ))}
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
          </div>
        )}
      </section>
    </div>
  );
}
