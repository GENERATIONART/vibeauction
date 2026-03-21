'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const PASS_QUIPS = ['Not your vibe.', 'Hard pass.', 'Absolutely not.', 'Ew.', 'Next.', 'Nope.', 'Skip.'];
const BID_QUIPS  = ['You animal.', 'Taste confirmed.', 'Based.', 'Bold move.', 'No regrets.', 'Extremely you.'];
const randomQuip = (arr) => arr[Math.floor(Math.random() * arr.length)];

function HeroSwipeCard({ vibe, onPass, onBid, dragOffset, isDragging }) {
  const [imgFailed, setImgFailed] = useState(false);
  const rotate      = isDragging ? dragOffset * 0.08 : 0;
  const passOpacity = isDragging && dragOffset < 0 ? Math.min(1, Math.abs(dragOffset) / 80) : 0;
  const bidOpacity  = isDragging && dragOffset > 0 ? Math.min(1, dragOffset / 80) : 0;

  return (
    <div style={{
      position: 'absolute', inset: 0,
      transform: isDragging ? `translateX(${dragOffset}px) rotate(${rotate}deg)` : 'none',
      transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(.25,.8,.25,1)',
      borderRadius: 12, overflow: 'hidden',
      background: '#111', border: '2px solid #222',
      boxShadow: '0 6px 32px rgba(0,0,0,0.5)',
      cursor: 'grab', userSelect: 'none', touchAction: 'none',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Image */}
      <div style={{ position: 'relative', flex: '0 0 52%', background: '#1A1A1A', overflow: 'hidden' }}>
        {vibe.imageUrl && !imgFailed ? (
          <img
            src={vibe.imageUrl} alt={vibe.name} draggable={false}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }}
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            background: 'repeating-linear-gradient(45deg, #1A1A1A 0, #1A1A1A 10px, #141414 10px, #141414 20px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontFamily: "'Anton', sans-serif", fontSize: 36, opacity: 0.12, textTransform: 'uppercase', color: '#fff' }}>VIBE</span>
          </div>
        )}

        {/* PASS stamp */}
        <div style={{
          position: 'absolute', top: 16, left: 14,
          border: '3px solid #FF3B3B', borderRadius: 5,
          color: '#FF3B3B', fontFamily: "'Anton', sans-serif",
          fontSize: 28, padding: '1px 10px', textTransform: 'uppercase',
          transform: 'rotate(-12deg)', opacity: passOpacity,
          transition: 'opacity 0.05s', pointerEvents: 'none', letterSpacing: 2,
        }}>PASS</div>

        {/* BID stamp */}
        <div style={{
          position: 'absolute', top: 16, right: 14,
          border: '3px solid #C8FF00', borderRadius: 5,
          color: '#C8FF00', fontFamily: "'Anton', sans-serif",
          fontSize: 28, padding: '1px 10px', textTransform: 'uppercase',
          transform: 'rotate(12deg)', opacity: bidOpacity,
          transition: 'opacity 0.05s', pointerEvents: 'none', letterSpacing: 2,
        }}>BID</div>

        {vibe.category && (
          <span style={{
            position: 'absolute', bottom: 8, left: 10,
            background: 'rgba(0,0,0,0.75)', color: '#888',
            fontSize: 9, fontWeight: 800, textTransform: 'uppercase',
            padding: '2px 7px', letterSpacing: '0.05em',
          }}>{vibe.category}</span>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{
          fontFamily: "'Anton', sans-serif",
          fontSize: 'clamp(16px, 3vw, 22px)',
          lineHeight: 1, textTransform: 'uppercase', color: '#FFF',
        }}>{vibe.name}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ fontFamily: "'Anton', sans-serif", fontSize: 18, color: '#C8FF00' }}>
            {Number(vibe.startingPrice || 0).toLocaleString()} AURA
          </span>
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', borderTop: '1px solid #1A1A1A' }}>
        <button type="button" onClick={onPass} style={{
          flex: 1, padding: '12px 0', background: 'rgba(255,59,59,0.08)', border: 'none',
          color: '#FF3B3B', fontFamily: "'Anton', sans-serif", fontSize: 14,
          textTransform: 'uppercase', letterSpacing: 1, cursor: 'pointer',
          borderRight: '1px solid #1A1A1A', transition: 'background 0.15s',
        }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,59,59,0.18)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,59,59,0.08)'; }}
        >✕ Pass</button>
        <button type="button" onClick={onBid} style={{
          flex: 1, padding: '12px 0', background: 'rgba(200,255,0,0.08)', border: 'none',
          color: '#C8FF00', fontFamily: "'Anton', sans-serif", fontSize: 14,
          textTransform: 'uppercase', letterSpacing: 1, cursor: 'pointer',
          transition: 'background 0.15s',
        }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(200,255,0,0.2)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(200,255,0,0.08)'; }}
        >♥ Bid</button>
      </div>
    </div>
  );
}

export default function VibeOrPassHero() {
  const router = useRouter();
  const [vibes, setVibes]           = useState([]);
  const [index, setIndex]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [quip, setQuip]             = useState(null);   // { text, color }
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(null);
  const quipTimer  = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch('/api/auctions/history?status=live&sort=newest&page=1&pageSize=50', { cache: 'no-store' });
        const data = await res.json();
        const list = Array.isArray(data?.auctions) ? data.auctions : [];
        setVibes([...list].sort(() => Math.random() - 0.5));
      } catch { /* silent — hero widget fails gracefully */ }
      finally { setLoading(false); }
    })();
  }, []);

  const showQuip = useCallback((text, color) => {
    clearTimeout(quipTimer.current);
    setQuip({ text, color });
    quipTimer.current = setTimeout(() => setQuip(null), 1200);
  }, []);

  const advance = useCallback((action) => {
    setIndex((i) => {
      const next = i + 1;
      // Loop back to start when exhausted
      if (next >= vibes.length) return 0;
      return next;
    });
    setDragOffset(0);
    setIsDragging(false);
  }, [vibes.length]);

  const handlePass = useCallback(() => {
    showQuip(randomQuip(PASS_QUIPS), '#FF3B3B');
    advance('pass');
  }, [advance, showQuip]);

  const handleBid = useCallback(() => {
    const vibe = vibes[index];
    if (!vibe) return;
    showQuip(randomQuip(BID_QUIPS), '#C8FF00');
    advance('bid');
    setTimeout(() => router.push(`/auction/${vibe.slug}`), 500);
  }, [advance, showQuip, vibes, index, router]);

  // Drag handlers
  const onPointerDown = useCallback((e) => {
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
    if (dragOffset < -80)     handlePass();
    else if (dragOffset > 80) handleBid();
    else { setDragOffset(0); setIsDragging(false); }
    dragStartX.current = null;
  }, [isDragging, dragOffset, handlePass, handleBid]);

  const current = vibes[index];
  const next    = vibes[(index + 1) % Math.max(vibes.length, 1)];

  if (loading) {
    return (
      <div style={{
        flex: 1, minHeight: 400, background: '#111', border: '2px solid #1E1E1E', borderRadius: 12,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center', color: '#333' }}>
          <div style={{ width: 28, height: 28, border: '2px solid #222', borderTop: '2px solid #C8FF00', borderRadius: '50%', animation: 'voph-spin 0.8s linear infinite', margin: '0 auto 10px' }} />
          <style>{`@keyframes voph-spin { to { transform: rotate(360deg); } }`}</style>
          <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, color: '#333' }}>Loading vibes…</div>
        </div>
      </div>
    );
  }

  if (!vibes.length) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      {/* Label row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 13, textTransform: 'uppercase', letterSpacing: 2, color: '#555' }}>
          Vibe <span style={{ color: '#C8FF00' }}>or</span> Pass
        </div>
        <Link href="/swipe" style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: '#444', textDecoration: 'none' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#C8FF00'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#444'; }}
        >
          See all →
        </Link>
      </div>

      {/* Card stack */}
      <div
        style={{ position: 'relative', flex: 1, minHeight: 360, touchAction: 'none' }}
        onMouseDown={onPointerDown}
        onMouseMove={onPointerMove}
        onMouseUp={onPointerUp}
        onMouseLeave={onPointerUp}
        onTouchStart={(e) => onPointerDown(e.touches[0])}
        onTouchMove={(e) => { e.preventDefault(); onPointerMove(e.touches[0]); }}
        onTouchEnd={onPointerUp}
      >
        {/* Card behind */}
        {next && next !== current && (
          <div style={{ position: 'absolute', inset: '6px 10px 0', transform: 'scale(0.97)', transformOrigin: 'bottom center', zIndex: 0, borderRadius: 12, overflow: 'hidden', background: '#111', border: '2px solid #1A1A1A' }}>
            <HeroSwipeCard vibe={next} onPass={() => {}} onBid={() => {}} dragOffset={0} isDragging={false} />
          </div>
        )}
        {/* Top card */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
          <HeroSwipeCard
            vibe={current}
            onPass={handlePass}
            onBid={handleBid}
            dragOffset={dragOffset}
            isDragging={isDragging}
          />
        </div>

        {/* Inline quip */}
        {quip && (
          <div style={{
            position: 'absolute', bottom: 60, left: '50%', transform: 'translateX(-50%)',
            background: '#111', border: `1px solid ${quip.color}`, color: quip.color,
            fontFamily: "'Anton', sans-serif", fontSize: 14, textTransform: 'uppercase',
            letterSpacing: 1, padding: '7px 18px', borderRadius: 5,
            pointerEvents: 'none', zIndex: 10, whiteSpace: 'nowrap',
            animation: 'voph-toast 1.2s ease forwards',
          }}>
            {quip.text}
            <style>{`@keyframes voph-toast { 0%{opacity:0;transform:translateX(-50%) translateY(8px)} 15%,70%{opacity:1;transform:translateX(-50%) translateY(0)} 100%{opacity:0;transform:translateX(-50%) translateY(-6px)} }`}</style>
          </div>
        )}
      </div>

      {/* Hint */}
      <div style={{ textAlign: 'center', marginTop: 8, color: '#2A2A2A', fontSize: 10, fontWeight: 700, letterSpacing: '0.05em' }}>
        drag or tap · ← → keys
      </div>
    </div>
  );
}
