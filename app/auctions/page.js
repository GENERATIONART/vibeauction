'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import NavBar from '../components/NavBar';

const STATUS_META = {
  live:    { label: 'Live',    border: '#C8FF00', text: '#C8FF00', bg: '#0D1A00', pulse: true  },
  ended:   { label: 'Ended',   border: '#FFB84D', text: '#FFCF8A', bg: '#1A1100', pulse: false },
  settled: { label: 'Settled', border: '#5BD3FF', text: '#AAE7FF', bg: '#001524', pulse: false },
};

const SORT_OPTIONS = [
  { key: 'newest',      label: 'Newest First'   },
  { key: 'oldest',      label: 'Oldest First'   },
  { key: 'price_hi',    label: 'Price: High → Low' },
  { key: 'price_lo',    label: 'Price: Low → High' },
  { key: 'ending_soon', label: 'Ending Soon'    },
];

const fmt = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n.toLocaleString() : '0';
};

const fmtDate = (v) => {
  const ms = new Date(v || '').getTime();
  if (!Number.isFinite(ms)) return '—';
  return new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const fmtCountdown = (ms) => {
  if (!Number.isFinite(ms) || ms <= 0) return 'Ended';
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
};

const normalizeStr = (v) =>
  String(v || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div
      style={{
        background: '#141414',
        border: '2px solid #222',
        borderRadius: '8px',
        overflow: 'hidden',
        animation: 'skeletonPulse 1.6s ease-in-out infinite',
      }}
    >
      <div style={{ height: '160px', background: '#1E1E1E' }} />
      <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ height: '22px', background: '#252525', borderRadius: '3px', width: '65%' }} />
        <div style={{ height: '13px', background: '#1E1E1E', borderRadius: '3px', width: '40%' }} />
        <div style={{ height: '36px', background: '#1E1E1E', borderRadius: '3px', marginTop: '6px' }} />
      </div>
      <div style={{ height: '44px', background: '#1A1A1A' }} />
    </div>
  );
}

// ─── Auction card ─────────────────────────────────────────────────────────────
function AuctionCard({ auction }) {
  const [now, setNow] = useState(() => Date.now());
  const [hovered, setHovered] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  const meta = STATUS_META[auction.status] || STATUS_META.ended;
  const endMs = useMemo(() => new Date(auction.endTime || '').getTime(), [auction.endTime]);
  const remaining = endMs - now;

  useEffect(() => {
    if (auction.status !== 'live') return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [auction.status]);

  useEffect(() => { setImgFailed(false); }, [auction.imageUrl]);

  const ctaLabel = auction.status === 'live' ? 'Place Bid →' : 'View Auction →';

  return (
    <Link
      href={`/auction/${auction.slug}`}
      style={{ textDecoration: 'none', display: 'block' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <article
        style={{
          background: '#FFFFFF',
          border: `2px solid ${hovered ? meta.border : '#C8FF00'}`,
          borderRadius: '8px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          boxShadow: hovered ? `8px 8px 0px ${meta.border}` : '6px 6px 0px rgba(200,255,0,0.25)',
          transform: hovered ? 'translate(-2px,-2px)' : 'none',
          transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s',
          color: '#000000',
        }}
      >
        {/* Image area */}
        <div
          style={{
            position: 'relative',
            height: '160px',
            background: '#F0F0F0',
            borderBottom: '2px solid #000',
            flexShrink: 0,
          }}
        >
          {auction.imageUrl && !imgFailed ? (
            <img
              src={auction.imageUrl}
              alt={auction.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              loading="lazy"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <>
              <div
                style={{
                  backgroundImage: 'radial-gradient(#000 1px, transparent 1px)',
                  backgroundSize: '10px 10px',
                  opacity: 0.08,
                  position: 'absolute',
                  inset: 0,
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%,-50%)',
                  fontSize: '12px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  border: '2px solid #222',
                  padding: '8px 12px',
                  background: 'rgba(255,255,255,0.7)',
                  letterSpacing: '0.5px',
                }}
              >
                Image Pending
              </span>
            </>
          )}

          {/* Status badge */}
          <span
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: meta.bg,
              border: `1px solid ${meta.border}`,
              color: meta.text,
              fontSize: '10px',
              padding: '4px 8px',
              textTransform: 'uppercase',
              fontWeight: 800,
              transform: 'rotate(2deg)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {meta.pulse && (
              <span
                style={{
                  display: 'inline-block',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#C8FF00',
                  animation: 'pulseDot 1.2s ease-in-out infinite',
                  flexShrink: 0,
                }}
              />
            )}
            {meta.label}
          </span>

          {/* Category badge */}
          {auction.category && (
            <span
              style={{
                position: 'absolute',
                bottom: '8px',
                left: '8px',
                background: 'rgba(0,0,0,0.78)',
                color: '#FFFFFF',
                fontSize: '10px',
                padding: '3px 7px',
                textTransform: 'uppercase',
                fontWeight: 700,
                letterSpacing: '0.3px',
              }}
            >
              {auction.category}
            </span>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <div
            style={{
              fontFamily: "'Anton', sans-serif",
              fontSize: '21px',
              lineHeight: 1.05,
              textTransform: 'uppercase',
              color: '#000',
            }}
          >
            {auction.name}
          </div>

          {auction.author && (
            <div style={{ fontSize: '11px', color: '#777', fontWeight: 700, textTransform: 'uppercase' }}>
              by {auction.author}
            </div>
          )}

          <div
            style={{
              borderTop: '1px solid #DDD',
              paddingTop: '8px',
              marginTop: '4px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
            }}
          >
            <div>
              <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: 700 }}>
                Start Price
              </div>
              <div style={{ fontFamily: "'Anton', sans-serif", fontSize: '20px', lineHeight: 1 }}>
                {fmt(auction.startingPrice)}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              {auction.status === 'live' && (
                <>
                  <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: 700 }}>
                    Time Left
                  </div>
                  <div
                    style={{
                      fontFamily: "'Anton', sans-serif",
                      fontSize: '20px',
                      lineHeight: 1,
                      color: remaining < 3_600_000 ? '#D14000' : '#000',
                    }}
                  >
                    {fmtCountdown(remaining)}
                  </div>
                </>
              )}
              {auction.status === 'ended' && (
                <>
                  <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: 700 }}>
                    Ended
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#555' }}>
                    {fmtDate(auction.endTime)}
                  </div>
                </>
              )}
              {auction.status === 'settled' && (
                <>
                  <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: 700 }}>
                    Sold For
                  </div>
                  <div
                    style={{
                      fontFamily: "'Anton', sans-serif",
                      fontSize: '20px',
                      lineHeight: 1,
                      color: '#0A6A87',
                    }}
                  >
                    {fmt(auction.settledPrice)} AURA
                  </div>
                </>
              )}
            </div>
          </div>

          {auction.status === 'settled' && auction.winner && (
            <div
              style={{
                marginTop: '4px',
                fontSize: '12px',
                fontWeight: 800,
                color: '#0A6A87',
                textTransform: 'uppercase',
              }}
            >
              Winner: {auction.winner}
            </div>
          )}
        </div>

        {/* CTA bar */}
        <div
          style={{
            background: hovered ? meta.border : '#000000',
            color: hovered ? '#000000' : meta.text,
            fontFamily: "'Anton', sans-serif",
            fontSize: '16px',
            textTransform: 'uppercase',
            textAlign: 'center',
            padding: '11px 10px',
            transition: 'background 0.15s, color 0.15s',
            flexShrink: 0,
          }}
        >
          {ctaLabel}
        </div>
      </article>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AuctionsPage() {
  const [allAuctions, setAllAuctions] = useState([]);
  const [summary, setSummary] = useState({ total: 0, live: 0, ended: 0, settled: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auctions/history?status=all&limit=300', { cache: 'no-store' });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error || 'Failed to load auctions');
      setAllAuctions(Array.isArray(payload?.auctions) ? payload.auctions : []);
      setSummary(payload?.summary || { total: 0, live: 0, ended: 0, settled: 0 });
    } catch (err) {
      setError(err?.message || 'Failed to load auctions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Refresh data every 60s to pick up new/settled auctions
    const refreshInterval = setInterval(load, 60_000);
    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;700;800&display=swap');
      * { box-sizing: border-box; }
      body { margin: 0; background: #0D0D0D; }
      @keyframes skeletonPulse { 0%,100% { opacity:1 } 50% { opacity:0.45 } }
      @keyframes pulseDot { 0%,100% { opacity:1; transform:scale(1) } 50% { opacity:0.4; transform:scale(0.75) } }
    `;
    document.head.appendChild(style);
    return () => {
      clearInterval(refreshInterval);
      document.head.removeChild(style);
    };
  }, [load]);

  const categories = useMemo(
    () => Array.from(new Set(allAuctions.map((a) => a.category).filter(Boolean))).sort(),
    [allAuctions],
  );

  const filtered = useMemo(() => {
    let items = allAuctions;

    if (statusFilter !== 'all') {
      items = items.filter((a) => a.status === statusFilter);
    }

    if (categoryFilter !== 'all') {
      items = items.filter((a) => normalizeStr(a.category) === normalizeStr(categoryFilter));
    }

    const q = normalizeStr(search);
    if (q) {
      items = items.filter((a) =>
        [a.name, a.category, a.author, a.winner].some((f) => normalizeStr(f).includes(q)),
      );
    }

    const result = [...items];
    switch (sort) {
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'price_hi':
        result.sort(
          (a, b) =>
            (b.settledPrice || b.startingPrice || 0) - (a.settledPrice || a.startingPrice || 0),
        );
        break;
      case 'price_lo':
        result.sort(
          (a, b) =>
            (a.settledPrice || a.startingPrice || 0) - (b.settledPrice || b.startingPrice || 0),
        );
        break;
      case 'ending_soon':
        result.sort((a, b) => {
          if (a.status === 'live' && b.status !== 'live') return -1;
          if (b.status === 'live' && a.status !== 'live') return 1;
          return new Date(a.endTime).getTime() - new Date(b.endTime).getTime();
        });
        break;
      default:
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }, [allAuctions, statusFilter, categoryFilter, search, sort]);

  const hasActiveFilters = search || statusFilter !== 'all' || categoryFilter !== 'all';
  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setSort('newest');
  };

  const statusTabs = [
    { key: 'all',     label: 'All',     count: summary.total   },
    { key: 'live',    label: 'Live',    count: summary.live    },
    { key: 'ended',   label: 'Ended',   count: summary.ended   },
    { key: 'settled', label: 'Settled', count: summary.settled },
  ];

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: '#0D0D0D',
        color: '#FFFFFF',
        fontFamily: "'Inter', sans-serif",
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      <NavBar />

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '28px 16px 60px' }}>

        {/* Header */}
        <header style={{ marginBottom: '22px' }}>
          <h1
            style={{
              margin: 0,
              fontFamily: "'Anton', sans-serif",
              fontSize: 'clamp(38px, 5.5vw, 62px)',
              lineHeight: 0.9,
              textTransform: 'uppercase',
            }}
          >
            Auction{' '}
            <span style={{ color: '#C8FF00' }}>Explorer</span>
          </h1>
          <p style={{ marginTop: '10px', color: '#888', fontSize: '14px', maxWidth: '560px' }}>
            Browse, search, and filter every auction — live, ended, and settled. One place to find it all.
          </p>
        </header>

        {/* Summary stats */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '10px',
            marginBottom: '22px',
          }}
        >
          {[
            { label: 'Total',   value: summary.total,   color: '#FFFFFF' },
            { label: 'Live',    value: summary.live,    color: '#C8FF00' },
            { label: 'Ended',   value: summary.ended,   color: '#FFCF8A' },
            { label: 'Settled', value: summary.settled, color: '#AAE7FF' },
          ].map((s) => (
            <div
              key={s.label}
              style={{ border: '1px solid #222', background: '#111', padding: '12px 14px' }}
            >
              <div
                style={{
                  color: '#666',
                  textTransform: 'uppercase',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.4px',
                }}
              >
                {s.label}
              </div>
              <div
                style={{
                  marginTop: '6px',
                  fontFamily: "'Anton', sans-serif",
                  fontSize: '32px',
                  lineHeight: 1,
                  color: s.color,
                }}
              >
                {fmt(s.value)}
              </div>
            </div>
          ))}
        </section>

        {/* Search + Sort row */}
        <div
          style={{
            display: 'flex',
            gap: '10px',
            marginBottom: '12px',
            flexWrap: 'wrap',
            alignItems: 'stretch',
          }}
        >
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, category, author, winner…"
            style={{
              flex: '1 1 280px',
              background: '#111',
              border: '2px solid #333',
              color: '#FFF',
              fontSize: '14px',
              fontFamily: "'Inter', sans-serif",
              padding: '10px 14px',
              outline: 'none',
              minHeight: '42px',
            }}
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            style={{
              background: '#111',
              border: '2px solid #333',
              color: '#FFF',
              fontSize: '13px',
              fontFamily: "'Inter', sans-serif",
              padding: '10px 14px',
              outline: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              minHeight: '42px',
            }}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Status filter tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
          {statusTabs.map((tab) => {
            const active = tab.key === statusFilter;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                style={{
                  border: active ? '1px solid #C8FF00' : '1px solid #2E2E2E',
                  background: active ? '#C8FF00' : '#101010',
                  color: active ? '#000' : '#BDBDBD',
                  padding: '7px 14px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  fontSize: '12px',
                  cursor: 'pointer',
                  letterSpacing: '0.3px',
                }}
              >
                {tab.label}
                <span
                  style={{
                    marginLeft: '6px',
                    background: active ? 'rgba(0,0,0,0.18)' : '#1E1E1E',
                    color: active ? '#000' : '#777',
                    fontSize: '11px',
                    padding: '1px 6px',
                    borderRadius: '99px',
                    fontWeight: 700,
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Category filter pills */}
        {categories.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '18px' }}>
            {['all', ...categories].map((cat) => {
              const active = categoryFilter === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  style={{
                    border: active ? '1px solid #5BD3FF' : '1px solid #262626',
                    background: active ? '#5BD3FF' : '#0A0A0A',
                    color: active ? '#000' : '#777',
                    padding: '5px 10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    fontSize: '11px',
                    cursor: 'pointer',
                    letterSpacing: '0.3px',
                  }}
                >
                  {cat === 'all' ? 'All Categories' : cat}
                </button>
              );
            })}
          </div>
        )}

        {/* Results bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '16px',
            minHeight: '28px',
          }}
        >
          <span
            style={{
              color: '#555',
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
            }}
          >
            {loading
              ? 'Loading…'
              : `${filtered.length.toLocaleString()} auction${filtered.length !== 1 ? 's' : ''}`}
          </span>
          {hasActiveFilters && !loading && (
            <button
              type="button"
              onClick={clearFilters}
              style={{
                background: 'transparent',
                border: '1px solid #333',
                color: '#777',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                padding: '3px 10px',
                cursor: 'pointer',
                letterSpacing: '0.3px',
              }}
            >
              Clear Filters ✕
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              marginBottom: '18px',
              border: '1px solid rgba(255,70,70,0.4)',
              background: 'rgba(255,70,70,0.1)',
              padding: '12px 16px',
              color: '#FF9C9C',
              fontWeight: 700,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={load}
              style={{
                background: '#FF4D00',
                color: '#FFF',
                border: 'none',
                padding: '6px 14px',
                fontWeight: 800,
                fontSize: '12px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                letterSpacing: '0.3px',
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
              gap: '16px',
            }}
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              border: '2px dashed #272727',
              padding: '56px 24px',
              textAlign: 'center',
              color: '#555',
            }}
          >
            <div
              style={{
                fontFamily: "'Anton', sans-serif",
                fontSize: '34px',
                textTransform: 'uppercase',
                marginBottom: '10px',
                color: '#444',
              }}
            >
              No Auctions Found
            </div>
            <div style={{ fontSize: '14px', marginBottom: '18px' }}>
              Try adjusting your filters or search query.
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                style={{
                  background: '#C8FF00',
                  color: '#000',
                  border: 'none',
                  padding: '10px 20px',
                  fontFamily: "'Anton', sans-serif",
                  fontSize: '16px',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
              gap: '16px',
            }}
          >
            {filtered.map((auction) => (
              <AuctionCard key={auction.id || auction.slug} auction={auction} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
