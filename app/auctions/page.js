'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import NavBar from '../components/NavBar';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'live', label: 'Live' },
  { key: 'ended', label: 'Ended' },
  { key: 'settled', label: 'Settled' },
];

const STATUS_COLORS = {
  live: { bg: 'rgba(200,255,0,0.18)', border: 'rgba(200,255,0,0.55)', text: '#E9FF9A' },
  ended: { bg: 'rgba(255,190,80,0.15)', border: 'rgba(255,190,80,0.45)', text: '#FFD7A1' },
  settled: { bg: 'rgba(80,200,255,0.15)', border: 'rgba(80,200,255,0.4)', text: '#AAE7FF' },
};

const numberFormat = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed.toLocaleString() : '0';
};

const formatDate = (value) => {
  const ms = new Date(value || '').getTime();
  if (!Number.isFinite(ms)) return 'Unknown';
  return new Date(ms).toLocaleString();
};

export default function AuctionsPage() {
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [auctions, setAuctions] = useState([]);
  const [summary, setSummary] = useState({ total: 0, live: 0, ended: 0, settled: 0 });

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;700;800&display=swap');
      * { box-sizing: border-box; }
      body { margin: 0; background: #0D0D0D; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`/api/auctions/history?status=${encodeURIComponent(filter)}&limit=300`, {
          cache: 'no-store',
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload?.error || 'Failed to load auction history');
        if (!cancelled) {
          setAuctions(Array.isArray(payload?.auctions) ? payload.auctions : []);
          setSummary(payload?.summary || { total: 0, live: 0, ended: 0, settled: 0 });
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load auction history');
          setAuctions([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [filter]);

  const visibleCount = useMemo(() => auctions.length, [auctions]);

  return (
    <div style={{ minHeight: '100dvh', background: '#0D0D0D', color: '#FFFFFF', fontFamily: "'Inter', sans-serif" }}>
      <NavBar />
      <main style={{ maxWidth: '1340px', margin: '0 auto', padding: '28px 16px 44px' }}>
        <header style={{ marginBottom: '18px' }}>
          <h1 style={{ margin: 0, fontFamily: "'Anton', sans-serif", fontSize: '52px', lineHeight: 0.92, textTransform: 'uppercase' }}>
            Auction Status
          </h1>
          <p style={{ marginTop: '10px', color: '#9A9A9A', fontSize: '14px' }}>
            Track which auctions are still live, ended, and fully settled.
          </p>
        </header>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '10px',
            marginBottom: '16px',
          }}
        >
          {[
            { label: 'Total', value: summary.total },
            { label: 'Live', value: summary.live },
            { label: 'Ended', value: summary.ended },
            { label: 'Settled', value: summary.settled },
          ].map((item) => (
            <div key={item.label} style={{ border: '1px solid #222222', background: '#121212', padding: '12px' }}>
              <div style={{ color: '#7A7A7A', textTransform: 'uppercase', fontSize: '11px', fontWeight: 700 }}>{item.label}</div>
              <div style={{ marginTop: '6px', fontFamily: "'Anton', sans-serif", fontSize: '32px', lineHeight: 1 }}>
                {numberFormat(item.value)}
              </div>
            </div>
          ))}
        </section>

        <section style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '18px' }}>
          {FILTERS.map((item) => {
            const active = item.key === filter;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                style={{
                  border: active ? '1px solid #C8FF00' : '1px solid #333333',
                  background: active ? '#C8FF00' : '#101010',
                  color: active ? '#000000' : '#BDBDBD',
                  padding: '8px 12px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                {item.label}
              </button>
            );
          })}
          <div style={{ marginLeft: 'auto', color: '#777777', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', alignSelf: 'center' }}>
            Showing {numberFormat(visibleCount)}
          </div>
        </section>

        {error && (
          <div style={{ marginBottom: '16px', border: '1px solid rgba(255,70,70,0.45)', background: 'rgba(255,70,70,0.12)', padding: '12px', color: '#FF9C9C', fontWeight: 700 }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ border: '1px solid #222222', background: '#101010', padding: '18px', color: '#999999' }}>
            Loading auction status...
          </div>
        ) : auctions.length === 0 ? (
          <div style={{ border: '1px solid #222222', background: '#101010', padding: '18px', color: '#999999' }}>
            No auctions found for this status.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
              gap: '12px',
            }}
          >
            {auctions.map((auction) => {
              const statusKey = auction.status || 'ended';
              const statusColor = STATUS_COLORS[statusKey] || STATUS_COLORS.ended;
              return (
                <Link
                  key={auction.id || auction.slug}
                  href={auction.slug ? `/auction/${auction.slug}` : '/'}
                  style={{
                    border: '1px solid #2A2A2A',
                    background: '#111111',
                    textDecoration: 'none',
                    color: '#FFFFFF',
                    display: 'block',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ position: 'relative', height: '160px', background: '#0A0A0A' }}>
                    {auction.imageUrl ? (
                      <img
                        src={auction.imageUrl}
                        alt={auction.name || 'Vibe'}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: '#555555', fontWeight: 800 }}>
                        NO IMAGE
                      </div>
                    )}
                    <span
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: statusColor.bg,
                        border: `1px solid ${statusColor.border}`,
                        color: statusColor.text,
                        fontSize: '11px',
                        padding: '3px 7px',
                        textTransform: 'uppercase',
                        fontWeight: 800,
                      }}
                    >
                      {statusKey}
                    </span>
                  </div>
                  <div style={{ padding: '12px' }}>
                    <div style={{ fontFamily: "'Anton', sans-serif", fontSize: '30px', lineHeight: 0.95, textTransform: 'uppercase' }}>
                      {auction.name || 'Unknown Vibe'}
                    </div>
                    <div style={{ marginTop: '10px', fontSize: '12px', color: '#A4A4A4', textTransform: 'uppercase', fontWeight: 700 }}>
                      Category: {auction.category || 'Vibes'}
                    </div>
                    <div style={{ marginTop: '6px', fontSize: '12px', color: '#A4A4A4', textTransform: 'uppercase', fontWeight: 700 }}>
                      Start: {numberFormat(auction.startingPrice)} AURA
                    </div>
                    {statusKey === 'settled' && (
                      <>
                        <div style={{ marginTop: '6px', fontSize: '12px', color: '#AAE7FF', textTransform: 'uppercase', fontWeight: 700 }}>
                          Settled: {numberFormat(auction.settledPrice)} AURA
                        </div>
                        <div style={{ marginTop: '6px', fontSize: '12px', color: '#A4A4A4', fontWeight: 700 }}>
                          Winner: {auction.winner || 'Unknown'}
                        </div>
                      </>
                    )}
                    {statusKey !== 'settled' && (
                      <div style={{ marginTop: '6px', fontSize: '12px', color: '#A4A4A4', fontWeight: 700 }}>
                        End Time: {formatDate(auction.endTime)}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
