'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import NavBar from '../components/NavBar';

const GRADUATION_CARD_META = {
  launching: { label: 'Launching', color: '#8E8E8E', bg: '#171717' },
  heating: { label: 'Heating', color: '#FFB84D', bg: '#221707' },
  breakout: { label: 'Breakout', color: '#C8FF00', bg: '#162200' },
  graduated: { label: 'Graduated', color: '#5BD3FF', bg: '#071B25' },
};

const fmt = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toLocaleString() : '0';
};

export default function BreakoutsPage() {
  const [board, setBoard] = useState([]);
  const [summary, setSummary] = useState({ breakoutCount: 0, graduatedCount: 0, qualifyingCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadBoard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/state/vibe-graduation-board?limit=18', { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || 'Failed to load breakout board');
      setBoard(Array.isArray(payload?.board) ? payload.board : []);
      setSummary(payload?.summary || { breakoutCount: 0, graduatedCount: 0, qualifyingCount: 0 });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load breakout board');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBoard();
    const intervalId = window.setInterval(loadBoard, 60000);
    return () => window.clearInterval(intervalId);
  }, [loadBoard]);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;700;800&display=swap');
      * { box-sizing: border-box; }
      body { margin: 0; background: #0D0D0D; }
      @keyframes skeletonPulse { 0%,100% { opacity:1 } 50% { opacity:0.45 } }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <div style={{ minHeight: '100dvh', background: '#0D0D0D', color: '#FFFFFF', fontFamily: "'Inter', sans-serif", WebkitFontSmoothing: 'antialiased' }}>
      <NavBar />

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '28px 16px 60px' }}>
        <header style={{ marginBottom: '22px' }}>
          <div style={{ color: '#C8FF00', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            Weekly Graduation Queue
          </div>
          <h1 style={{ margin: '8px 0 0', fontFamily: "'Anton', sans-serif", fontSize: 'clamp(40px, 6vw, 72px)', lineHeight: 0.9, textTransform: 'uppercase' }}>
            Breakout <span style={{ color: '#FFB84D' }}>Watch</span>
          </h1>
          <p style={{ marginTop: '12px', color: '#8C8C8C', fontSize: '14px', maxWidth: '760px', lineHeight: 1.6 }}>
            This is the public graduation board. Only the top-ranked vibes this week can become token launch candidates, so this is where the rare ones start separating from the pile.
          </p>
        </header>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '22px' }}>
          {[
            { label: 'Top 2 Now', value: summary.qualifyingCount, color: '#C8FF00' },
            { label: 'Breakouts', value: summary.breakoutCount, color: '#FFB84D' },
            { label: 'Graduated', value: summary.graduatedCount, color: '#5BD3FF' },
          ].map((item) => (
            <div key={item.label} style={{ border: '1px solid #222', background: '#111', padding: '12px 14px' }}>
              <div style={{ color: '#666', textTransform: 'uppercase', fontSize: '11px', fontWeight: 700, letterSpacing: '0.4px' }}>{item.label}</div>
              <div style={{ marginTop: '6px', fontFamily: "'Anton', sans-serif", fontSize: '32px', lineHeight: 1, color: item.color }}>{fmt(item.value)}</div>
            </div>
          ))}
        </section>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '18px' }}>
          <Link
            href="/auctions"
            style={{
              background: '#C8FF00',
              color: '#000',
              textDecoration: 'none',
              padding: '10px 14px',
              fontWeight: 800,
              textTransform: 'uppercase',
              fontSize: '12px',
              letterSpacing: '0.4px',
            }}
          >
            Open Market
          </Link>
          <Link
            href="/mint"
            style={{
              background: '#111',
              border: '1px solid #333',
              color: '#FFF',
              textDecoration: 'none',
              padding: '10px 14px',
              fontWeight: 800,
              textTransform: 'uppercase',
              fontSize: '12px',
              letterSpacing: '0.4px',
            }}
          >
            Launch a Vibe
          </Link>
        </div>

        {error && (
          <div style={{ marginBottom: '18px', border: '1px solid rgba(255,70,70,0.4)', background: 'rgba(255,70,70,0.1)', padding: '12px 16px', color: '#FF9C9C', fontWeight: 700 }}>
            {error}
          </div>
        )}

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
          {loading
            ? Array.from({ length: 12 }).map((_, index) => (
                <div key={index} style={{ border: '1px solid #222', background: '#111', minHeight: '240px', animation: 'skeletonPulse 1.6s ease-in-out infinite' }} />
              ))
            : board.map((entry) => {
                const meta = GRADUATION_CARD_META[entry?.graduation?.state] || GRADUATION_CARD_META.launching;
                return (
                  <Link key={entry.slug} href={`/auction/${entry.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <article style={{ border: '1px solid #262626', background: '#0B0B0B', height: '100%', display: 'flex', flexDirection: 'column' }}>
                      {entry.imageUrl ? (
                        <img src={entry.imageUrl} alt={entry.name} style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }} />
                      ) : (
                        <div style={{ height: '180px', background: '#151515' }} />
                      )}
                      <div style={{ padding: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'flex-start' }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ color: '#666', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                              Rank #{entry?.graduation?.weeklyRank || '—'}
                            </div>
                            <div style={{ marginTop: '8px', fontFamily: "'Anton', sans-serif", fontSize: '24px', lineHeight: 0.98, textTransform: 'uppercase' }}>
                              {entry.name}
                            </div>
                          </div>
                          <div
                            style={{
                              background: meta.bg,
                              border: `1px solid ${meta.color}`,
                              color: meta.color,
                              fontSize: '10px',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              letterSpacing: '0.6px',
                              padding: '5px 8px',
                              borderRadius: '999px',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {meta.label}
                          </div>
                        </div>
                        <div style={{ marginTop: '10px', color: '#808080', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>
                          {entry.author ? `by ${entry.author}` : entry.category || 'Vibe'}
                        </div>
                        <div style={{ marginTop: '14px', height: '8px', background: '#171717', borderRadius: '999px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${Math.max(8, Math.min(100, Number(entry?.graduation?.auraProgressPct || 0)))}%`,
                              height: '100%',
                              background: 'linear-gradient(90deg, #FF7A18 0%, #C8FF00 100%)',
                            }}
                          />
                        </div>
                        <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <div>
                            <div style={{ color: '#666', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>Aura</div>
                            <div style={{ marginTop: '4px', fontFamily: "'Anton', sans-serif", fontSize: '18px', lineHeight: 1 }}>
                              {fmt(entry?.graduation?.currentAura)}
                            </div>
                          </div>
                          <div>
                            <div style={{ color: '#666', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>Score</div>
                            <div style={{ marginTop: '4px', fontFamily: "'Anton', sans-serif", fontSize: '18px', lineHeight: 1 }}>
                              {fmt(entry?.graduation?.score)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  </Link>
                );
              })}
        </section>
      </main>
    </div>
  );
}
