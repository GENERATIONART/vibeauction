'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import NavBar from '../components/NavBar';

// ─── Helpers ────────────────────────────────────────────────────────────────

const fmt = (n) => Number(n || 0).toLocaleString();

function formatTimeLeft(endTime) {
  if (!endTime) return null;
  const ms = new Date(endTime).getTime() - Date.now();
  if (ms <= 0) return 'Ended';
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1_000);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

const PASS_QUIPS = [
  'Not your vibe.',
  'Hard pass.',
  'Absolutely not.',
  'Ew.',
  'Next.',
  'Nope.',
  'This is not the one.',
  'Skip.',
  'You deserve better.',
  'Moving on.',
];

const BID_QUIPS = [
  'You animal.',
  'Taste confirmed.',
  'Based.',
  'Bold move.',
  'No regrets.',
  'This is your destiny.',
  'Extremely you.',
  'The internet approves.',
  'Go get it.',
];

function randomQuip(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Card component ──────────────────────────────────────────────────────────

function SwipeCard({ vibe, onPass, onBid, isTop, dragOffset, isDragging }) {
  const [imgFailed, setImgFailed] = useState(false);
  const endMs = vibe.endTime ? new Date(vibe.endTime).getTime() : 0;
  const isLastChance = endMs > 0 && endMs - Date.now() < 5 * 60 * 1000;

  const rotate = isDragging ? dragOffset * 0.08 : 0;
  const passOpacity = isDragging && dragOffset < 0 ? Math.min(1, Math.abs(dragOffset) / 80) : 0;
  const bidOpacity  = isDragging && dragOffset > 0 ? Math.min(1, dragOffset / 80) : 0;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        transform: isDragging ? `translateX(${dragOffset}px) rotate(${rotate}deg)` : 'none',
        transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(.25,.8,.25,1)',
        borderRadius: 16,
        overflow: 'hidden',
        background: '#111',
        border: '2px solid #222',
        boxShadow: isTop ? '0 8px 40px rgba(0,0,0,0.6)' : 'none',
        cursor: isTop ? 'grab' : 'default',
        userSelect: 'none',
        touchAction: 'none',
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', height: '55%', background: '#1A1A1A', overflow: 'hidden' }}>
        {vibe.imageUrl && !imgFailed ? (
          <img
            src={vibe.imageUrl}
            alt={vibe.name}
            draggable={false}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }}
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            background: 'repeating-linear-gradient(45deg, #1A1A1A 0, #1A1A1A 10px, #141414 10px, #141414 20px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontFamily: "'Anton', sans-serif", fontSize: 48, opacity: 0.15, textTransform: 'uppercase', color: '#fff' }}>VIBE</span>
          </div>
        )}

        {/* PASS stamp */}
        <div style={{
          position: 'absolute', top: 24, left: 20,
          border: '4px solid #FF3B3B', borderRadius: 6,
          color: '#FF3B3B', fontFamily: "'Anton', sans-serif",
          fontSize: 38, padding: '2px 12px', textTransform: 'uppercase',
          transform: 'rotate(-12deg)', opacity: passOpacity,
          transition: 'opacity 0.05s', pointerEvents: 'none',
          letterSpacing: 2,
        }}>
          PASS
        </div>

        {/* BID stamp */}
        <div style={{
          position: 'absolute', top: 24, right: 20,
          border: '4px solid #C8FF00', borderRadius: 6,
          color: '#C8FF00', fontFamily: "'Anton', sans-serif",
          fontSize: 38, padding: '2px 12px', textTransform: 'uppercase',
          transform: 'rotate(12deg)', opacity: bidOpacity,
          transition: 'opacity 0.05s', pointerEvents: 'none',
          letterSpacing: 2,
        }}>
          BID
        </div>

        {/* Category */}
        {vibe.category && (
          <span style={{
            position: 'absolute', bottom: 10, left: 12,
            background: 'rgba(0,0,0,0.75)', color: '#aaa',
            fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
            padding: '3px 8px', letterSpacing: '0.05em',
          }}>
            {vibe.category}
          </span>
        )}

        {/* Last chance */}
        {isLastChance && (
          <span style={{
            position: 'absolute', top: 10, right: 10,
            background: '#FF3B3B', color: '#fff',
            fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
            padding: '3px 8px', borderRadius: 3, letterSpacing: '0.05em',
            animation: 'swipe-pulse 1s ease-in-out infinite',
          }}>
            ⚡ LAST CHANCE
          </span>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{
          fontFamily: "'Anton', sans-serif",
          fontSize: 'clamp(22px, 5vw, 32px)',
          lineHeight: 1, textTransform: 'uppercase', color: '#FFF',
        }}>
          {vibe.name}
        </div>

        {vibe.manifesto && (
          <div style={{ color: '#666', fontSize: 13, lineHeight: 1.4, maxHeight: 52, overflow: 'hidden' }}>
            {vibe.manifesto}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
          <div>
            <span style={{ fontFamily: "'Anton', sans-serif", fontSize: 22, color: '#C8FF00' }}>
              {fmt(vibe.startingPrice)} AURA
            </span>
            <span style={{ color: '#444', fontSize: 12, fontWeight: 700, marginLeft: 6 }}>starting</span>
          </div>
          {vibe.endTime && (
            <span style={{ color: '#555', fontSize: 12, fontWeight: 700 }}>
              ⏱ {formatTimeLeft(vibe.endTime)}
            </span>
          )}
        </div>

        {vibe.author && (
          <div style={{ color: '#444', fontSize: 12, fontWeight: 700 }}>by {vibe.author}</div>
        )}
      </div>

      {/* Action buttons */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        display: 'flex', gap: 0,
        borderTop: '1px solid #1A1A1A',
      }}>
        <button
          type="button"
          onClick={onPass}
          style={{
            flex: 1, padding: '14px 0',
            background: 'rgba(255,59,59,0.08)', border: 'none',
            color: '#FF3B3B', fontFamily: "'Anton', sans-serif",
            fontSize: 16, textTransform: 'uppercase', letterSpacing: 1,
            cursor: 'pointer', transition: 'background 0.15s',
            borderRight: '1px solid #1A1A1A',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,59,59,0.18)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,59,59,0.08)'; }}
        >
          ✕ Pass
        </button>
        <button
          type="button"
          onClick={onBid}
          style={{
            flex: 1, padding: '14px 0',
            background: 'rgba(200,255,0,0.08)', border: 'none',
            color: '#C8FF00', fontFamily: "'Anton', sans-serif",
            fontSize: 16, textTransform: 'uppercase', letterSpacing: 1,
            cursor: 'pointer', transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(200,255,0,0.2)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(200,255,0,0.08)'; }}
        >
          ♥ Bid
        </button>
      </div>
    </div>
  );
}

// ─── End screen ──────────────────────────────────────────────────────────────

function EndScreen({ stats, onRestart }) {
  const ratio = stats.total > 0 ? Math.round((stats.bids / stats.total) * 100) : 0;
  const verdict =
    ratio >= 70 ? { label: 'DEGENERATE BIDDER', color: '#C8FF00', sub: 'You have zero impulse control. We respect it.' } :
    ratio >= 40 ? { label: 'SELECTIVE TASTE', color: '#AAE7FF', sub: 'Discerning. Questionable. Perfect.' } :
    ratio >= 15 ? { label: 'HARD TO PLEASE', color: '#FFCF8A', sub: 'Nothing is good enough for you.' } :
                  { label: 'CERTIFIED HATER', color: '#FF3B3B', sub: 'You passed on everything. Respect.' };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 24, padding: '40px 24px',
      textAlign: 'center', minHeight: '60vh',
    }}>
      <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 'clamp(36px, 8vw, 64px)', lineHeight: 1, textTransform: 'uppercase', color: verdict.color }}>
        {verdict.label}
      </div>
      <div style={{ color: '#888', fontSize: 16, maxWidth: 340 }}>{verdict.sub}</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, width: '100%', maxWidth: 400 }}>
        {[
          { label: 'Swiped', value: stats.total },
          { label: 'Bids', value: stats.bids },
          { label: 'Passed', value: stats.passes },
        ].map((s) => (
          <div key={s.label} style={{ background: '#111', border: '1px solid #222', padding: '16px 8px', borderRadius: 8 }}>
            <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 32, color: '#FFF' }}>{s.value}</div>
            <div style={{ color: '#555', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          type="button"
          onClick={onRestart}
          style={{
            background: '#C8FF00', color: '#000', border: 'none',
            fontFamily: "'Anton', sans-serif", fontSize: 16, textTransform: 'uppercase',
            letterSpacing: 1, padding: '14px 28px', cursor: 'pointer', borderRadius: 6,
          }}
        >
          Go Again
        </button>
        <Link
          href="/auctions"
          style={{
            background: '#111', color: '#FFF', border: '1px solid #333',
            fontFamily: "'Anton', sans-serif", fontSize: 16, textTransform: 'uppercase',
            letterSpacing: 1, padding: '14px 28px', textDecoration: 'none', borderRadius: 6,
            display: 'inline-block',
          }}
        >
          Browse All
        </Link>
      </div>
    </div>
  );
}

// ─── Toast ───────────────────────────────────────────────────────────────────

function Toast({ message, color }) {
  return (
    <div style={{
      position: 'fixed', bottom: 120, left: '50%', transform: 'translateX(-50%)',
      background: '#111', border: `1px solid ${color}`, color,
      fontFamily: "'Anton', sans-serif", fontSize: 18, textTransform: 'uppercase',
      letterSpacing: 1, padding: '10px 24px', borderRadius: 6,
      pointerEvents: 'none', zIndex: 999,
      animation: 'swipe-toast 1.4s ease forwards',
    }}>
      {message}
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function SwipePage() {
  const router = useRouter();
  const [vibes, setVibes]       = useState([]);
  const [index, setIndex]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [done, setDone]         = useState(false);
  const [stats, setStats]       = useState({ total: 0, bids: 0, passes: 0 });
  const [toast, setToast]       = useState(null); // { message, color }
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX   = useRef(null);
  const cardRef      = useRef(null);
  const toastTimer   = useRef(null);

  // Load vibes
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/auctions/history?status=live&sort=newest&page=1&pageSize=100', { cache: 'no-store' });
        const data = await res.json();
        const list = Array.isArray(data?.auctions) ? data.auctions : [];
        // Shuffle for freshness
        const shuffled = [...list].sort(() => Math.random() - 0.5);
        setVibes(shuffled);
      } catch {
        setError('Failed to load vibes. Try refreshing.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const showToast = useCallback((message, color) => {
    clearTimeout(toastTimer.current);
    setToast({ message, color });
    toastTimer.current = setTimeout(() => setToast(null), 1400);
  }, []);

  const advance = useCallback((action) => {
    setStats((s) => ({
      total: s.total + 1,
      bids: s.bids + (action === 'bid' ? 1 : 0),
      passes: s.passes + (action === 'pass' ? 1 : 0),
    }));
    setIndex((i) => {
      const next = i + 1;
      if (next >= vibes.length) {
        setTimeout(() => setDone(true), 350);
      }
      return next;
    });
    setDragOffset(0);
    setIsDragging(false);
  }, [vibes.length]);

  const handlePass = useCallback(() => {
    showToast(randomQuip(PASS_QUIPS), '#FF3B3B');
    advance('pass');
  }, [advance, showToast]);

  const handleBid = useCallback(() => {
    const vibe = vibes[index];
    if (!vibe) return;
    showToast(randomQuip(BID_QUIPS), '#C8FF00');
    advance('bid');
    // Navigate to the auction after a short delay so they see the toast
    setTimeout(() => router.push(`/auction/${vibe.slug}`), 600);
  }, [advance, showToast, vibes, index, router]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (done || loading || !vibes.length) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft')  handlePass();
      if (e.key === 'ArrowRight') handleBid();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [done, loading, vibes.length, handlePass, handleBid]);

  // Touch / mouse drag
  const onPointerDown = useCallback((e) => {
    if (e.button !== undefined && e.button !== 0) return;
    dragStartX.current = e.clientX ?? e.touches?.[0]?.clientX;
    setIsDragging(true);
  }, []);

  const onPointerMove = useCallback((e) => {
    if (!isDragging || dragStartX.current === null) return;
    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    if (clientX === undefined) return;
    setDragOffset(clientX - dragStartX.current);
  }, [isDragging]);

  const onPointerUp = useCallback(() => {
    if (!isDragging) return;
    if (dragOffset < -80) {
      handlePass();
    } else if (dragOffset > 80) {
      handleBid();
    } else {
      setDragOffset(0);
      setIsDragging(false);
    }
    dragStartX.current = null;
  }, [isDragging, dragOffset, handlePass, handleBid]);

  const handleRestart = useCallback(() => {
    setVibes((v) => [...v].sort(() => Math.random() - 0.5));
    setIndex(0);
    setStats({ total: 0, bids: 0, passes: 0 });
    setDone(false);
  }, []);

  const current  = vibes[index];
  const next     = vibes[index + 1];

  return (
    <div style={{ background: '#0D0D0D', minHeight: '100dvh', color: '#FFF' }}>
      <style>{`
        @keyframes swipe-pulse { 0%,100% { opacity:1 } 50% { opacity:0.5 } }
        @keyframes swipe-toast { 0% { opacity:0; transform:translateX(-50%) translateY(10px); } 15%,75% { opacity:1; transform:translateX(-50%) translateY(0); } 100% { opacity:0; transform:translateX(-50%) translateY(-8px); } }
      `}</style>

      <NavBar />

      <main style={{ maxWidth: 480, margin: '0 auto', padding: '16px 16px 0', paddingBottom: 'max(24px, env(safe-area-inset-bottom, 24px))' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 'clamp(32px, 8vw, 48px)', lineHeight: 1, textTransform: 'uppercase' }}>
            Vibe <span style={{ color: '#C8FF00' }}>or</span> Pass
          </div>
          <div style={{ color: '#444', fontSize: 13, fontWeight: 700, marginTop: 6 }}>
            ← pass &nbsp;·&nbsp; drag or tap &nbsp;·&nbsp; bid →
          </div>
          {!loading && vibes.length > 0 && !done && (
            <div style={{ color: '#333', fontSize: 12, fontWeight: 700, marginTop: 4 }}>
              {index + 1} / {vibes.length}
            </div>
          )}
        </div>

        {/* Card stack */}
        {loading ? (
          <div style={{ height: 'min(520px, calc(100dvh - 220px))', background: '#111', border: '2px solid #1A1A1A', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', color: '#333' }}>
              <div style={{ width: 36, height: 36, border: '3px solid #222', borderTop: '3px solid #C8FF00', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
              <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 18, textTransform: 'uppercase', letterSpacing: 1 }}>Loading vibes...</div>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          </div>
        ) : error ? (
          <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF3B3B', fontWeight: 700 }}>
            {error}
          </div>
        ) : done ? (
          <EndScreen stats={stats} onRestart={handleRestart} />
        ) : !current ? null : (
          <>
            {/* Progress bar */}
            <div style={{ height: 3, background: '#1A1A1A', borderRadius: 2, marginBottom: 16, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#C8FF00', borderRadius: 2, width: `${((index) / vibes.length) * 100}%`, transition: 'width 0.3s' }} />
            </div>

            <div
              ref={cardRef}
              style={{ position: 'relative', height: 'min(520px, calc(100dvh - 220px))', touchAction: 'none' }}
              onMouseDown={onPointerDown}
              onMouseMove={onPointerMove}
              onMouseUp={onPointerUp}
              onMouseLeave={onPointerUp}
              onTouchStart={(e) => onPointerDown(e.touches[0])}
              onTouchMove={(e) => { e.preventDefault(); onPointerMove(e.touches[0]); }}
              onTouchEnd={onPointerUp}
            >
              {/* Next card (behind) */}
              {next && (
                <div style={{ position: 'absolute', inset: '8px 12px 0', transform: 'scale(0.97)', transformOrigin: 'bottom center', zIndex: 0, borderRadius: 16, overflow: 'hidden', background: '#111', border: '2px solid #1A1A1A' }}>
                  <SwipeCard vibe={next} onPass={() => {}} onBid={() => {}} isTop={false} dragOffset={0} isDragging={false} />
                </div>
              )}

              {/* Top card */}
              <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
                <SwipeCard
                  vibe={current}
                  onPass={handlePass}
                  onBid={handleBid}
                  isTop={true}
                  dragOffset={dragOffset}
                  isDragging={isDragging}
                />
              </div>
            </div>

            {/* Keyboard hint */}
            <div style={{ textAlign: 'center', marginTop: 16, color: '#2A2A2A', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>
              ← → arrow keys work too
            </div>
          </>
        )}
      </main>

      {toast && <Toast message={toast.message} color={toast.color} />}
    </div>
  );
}
