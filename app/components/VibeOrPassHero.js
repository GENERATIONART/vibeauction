'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const PASS_QUIPS = ['Not your vibe.', 'Hard pass.', 'Absolutely not.', 'Ew.', 'Next.', 'Nope.', 'Skip.'];
const BID_QUIPS  = ['You animal.', 'Taste confirmed.', 'Based.', 'Bold move.', 'No regrets.', 'Extremely you.'];
const randomQuip = (arr) => arr[Math.floor(Math.random() * arr.length)];

export default function VibeOrPassHero() {
  const router = useRouter();
  const [vibes, setVibes]           = useState([]);
  const [index, setIndex]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [quip, setQuip]             = useState(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [imgFailed, setImgFailed]   = useState(false);
  const dragStartX = useRef(null);
  const quipTimer  = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch('/api/auctions/history?status=live&sort=newest&page=1&pageSize=50', { cache: 'no-store' });
        const data = await res.json();
        const list = Array.isArray(data?.auctions) ? data.auctions : [];
        setVibes([...list].sort(() => Math.random() - 0.5));
      } catch { /* silent */ }
      finally { setLoading(false); }
    })();
  }, []);

  const showQuip = useCallback((text, color) => {
    clearTimeout(quipTimer.current);
    setQuip({ text, color });
    quipTimer.current = setTimeout(() => setQuip(null), 1200);
  }, []);

  const advance = useCallback(() => {
    setIndex((i) => (i + 1) % Math.max(vibes.length, 1));
    setDragOffset(0);
    setIsDragging(false);
    setImgFailed(false);
  }, [vibes.length]);

  const handlePass = useCallback(() => {
    showQuip(randomQuip(PASS_QUIPS), '#FF3B3B');
    advance();
  }, [advance, showQuip]);

  const handleBid = useCallback(() => {
    const vibe = vibes[index];
    if (!vibe) return;
    showQuip(randomQuip(BID_QUIPS), '#C8FF00');
    advance();
    setTimeout(() => router.push(`/auction/${vibe.slug}`), 500);
  }, [advance, showQuip, vibes, index, router]);

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

  const vibe = vibes[index];
  const rotate      = isDragging ? dragOffset * 0.06 : 0;
  const passOpacity = isDragging && dragOffset < 0 ? Math.min(1, Math.abs(dragOffset) / 80) : 0;
  const bidOpacity  = isDragging && dragOffset > 0 ? Math.min(1, dragOffset / 80) : 0;

  // Full-bleed panel — fills the flex wrapper in the hero
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        background: '#0A0A0A',
        cursor: loading || !vibe ? 'default' : 'grab',
        userSelect: 'none',
        touchAction: 'none',
        overflow: 'hidden',
      }}
      onMouseDown={!loading && vibe ? onPointerDown : undefined}
      onMouseMove={!loading && vibe ? onPointerMove : undefined}
      onMouseUp={!loading && vibe ? onPointerUp : undefined}
      onMouseLeave={!loading && vibe ? onPointerUp : undefined}
      onTouchStart={!loading && vibe ? (e) => onPointerDown(e.touches[0]) : undefined}
      onTouchMove={!loading && vibe ? (e) => { e.preventDefault(); onPointerMove(e.touches[0]); } : undefined}
      onTouchEnd={!loading && vibe ? onPointerUp : undefined}
    >
      {/* Overlay header */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 18px',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%)',
        zIndex: 10, pointerEvents: 'none',
      }}>
        <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 13, textTransform: 'uppercase', letterSpacing: 2, color: '#888' }}>
          Vibe <span style={{ color: '#C8FF00' }}>or</span> Pass
        </div>
        <Link
          href="/swipe"
          style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: '#555', textDecoration: 'none', pointerEvents: 'auto' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#C8FF00'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#555'; }}
        >
          See all →
        </Link>
      </div>

      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 28, height: 28, border: '2px solid #222', borderTop: '2px solid #C8FF00', borderRadius: '50%', animation: 'voph-spin 0.8s linear infinite', margin: '0 auto 10px' }} />
            <style>{`@keyframes voph-spin { to { transform: rotate(360deg); } }`}</style>
            <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, color: '#333' }}>Loading vibes…</div>
          </div>
        </div>
      ) : !vibe ? null : (
        <>
          {/* Image — fills top ~58% */}
          <div
            style={{
              flex: '0 0 58%',
              position: 'relative',
              overflow: 'hidden',
              background: '#111',
              transform: isDragging ? `translateX(${dragOffset}px) rotate(${rotate}deg)` : 'none',
              transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(.25,.8,.25,1)',
            }}
          >
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
                <span style={{ fontFamily: "'Anton', sans-serif", fontSize: 48, opacity: 0.08, textTransform: 'uppercase', color: '#fff' }}>VIBE</span>
              </div>
            )}

            {/* PASS stamp */}
            <div style={{
              position: 'absolute', top: 24, left: 20,
              border: '4px solid #FF3B3B', borderRadius: 5,
              color: '#FF3B3B', fontFamily: "'Anton', sans-serif",
              fontSize: 36, padding: '2px 12px', textTransform: 'uppercase',
              transform: 'rotate(-12deg)', opacity: passOpacity,
              transition: 'opacity 0.05s', pointerEvents: 'none', letterSpacing: 2,
            }}>PASS</div>

            {/* BID stamp */}
            <div style={{
              position: 'absolute', top: 24, right: 20,
              border: '4px solid #C8FF00', borderRadius: 5,
              color: '#C8FF00', fontFamily: "'Anton', sans-serif",
              fontSize: 36, padding: '2px 12px', textTransform: 'uppercase',
              transform: 'rotate(12deg)', opacity: bidOpacity,
              transition: 'opacity 0.05s', pointerEvents: 'none', letterSpacing: 2,
            }}>BID</div>

            {/* Category pill */}
            {vibe.category && (
              <span style={{
                position: 'absolute', bottom: 10, left: 14,
                background: 'rgba(0,0,0,0.8)', color: '#666',
                fontSize: 9, fontWeight: 800, textTransform: 'uppercase',
                padding: '3px 8px', letterSpacing: '0.06em',
              }}>{vibe.category}</span>
            )}

            {/* Bottom gradient */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: 60,
              background: 'linear-gradient(to bottom, transparent, #0A0A0A)',
              pointerEvents: 'none',
            }} />
          </div>

          {/* Info */}
          <div
            style={{
              flex: 1,
              padding: '16px 20px 0',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              transform: isDragging ? `translateX(${dragOffset * 0.3}px)` : 'none',
              transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(.25,.8,.25,1)',
            }}
          >
            <div style={{
              fontFamily: "'Anton', sans-serif",
              fontSize: 'clamp(18px, 2vw, 26px)',
              lineHeight: 1.05, textTransform: 'uppercase', color: '#FFF',
            }}>{vibe.name}</div>
            <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 20, color: '#C8FF00' }}>
              {Number(vibe.startingPrice || 0).toLocaleString()} AURA
            </div>
          </div>

          {/* Quip */}
          {quip && (
            <div style={{
              position: 'absolute', bottom: 70, left: '50%', transform: 'translateX(-50%)',
              background: '#000', border: `1px solid ${quip.color}`, color: quip.color,
              fontFamily: "'Anton', sans-serif", fontSize: 14, textTransform: 'uppercase',
              letterSpacing: 1, padding: '7px 18px',
              pointerEvents: 'none', zIndex: 10, whiteSpace: 'nowrap',
              animation: 'voph-toast 1.2s ease forwards',
            }}>
              {quip.text}
              <style>{`@keyframes voph-toast { 0%{opacity:0;transform:translateX(-50%) translateY(8px)} 15%,70%{opacity:1;transform:translateX(-50%) translateY(0)} 100%{opacity:0;transform:translateX(-50%) translateY(-6px)} }`}</style>
            </div>
          )}

          {/* Buttons — pinned to bottom */}
          <div style={{ display: 'flex', marginTop: 'auto', borderTop: '1px solid #1A1A1A' }}>
            <button type="button" onClick={handlePass} style={{
              flex: 1, padding: '16px 0',
              background: 'rgba(255,59,59,0.06)', border: 'none',
              color: '#FF3B3B', fontFamily: "'Anton', sans-serif",
              fontSize: 16, textTransform: 'uppercase', letterSpacing: 1,
              cursor: 'pointer', transition: 'background 0.15s',
              borderRight: '1px solid #1A1A1A',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,59,59,0.15)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,59,59,0.06)'; }}
            >✕ Pass</button>
            <button type="button" onClick={handleBid} style={{
              flex: 1, padding: '16px 0',
              background: 'rgba(200,255,0,0.06)', border: 'none',
              color: '#C8FF00', fontFamily: "'Anton', sans-serif",
              fontSize: 16, textTransform: 'uppercase', letterSpacing: 1,
              cursor: 'pointer', transition: 'background 0.15s',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(200,255,0,0.18)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(200,255,0,0.06)'; }}
            >♥ Bid</button>
          </div>
        </>
      )}
    </div>
  );
}
