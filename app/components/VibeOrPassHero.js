'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const PASS_QUIPS = ['Not your vibe.', 'Hard pass.', 'Absolutely not.', 'Ew.', 'Next.', 'Nope.', 'Skip.'];
const BID_QUIPS  = ['You animal.', 'Taste confirmed.', 'Based.', 'Bold move.', 'No regrets.', 'Extremely you.'];
const randomQuip = (arr) => arr[Math.floor(Math.random() * arr.length)];

export default function VibeOrPassHero({ compact = false }) {
  const router = useRouter();
  const [vibes, setVibes]           = useState([]);
  const [index, setIndex]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [quip, setQuip]             = useState(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [imgFailed, setImgFailed]   = useState(false);
  const [exiting, setExiting]       = useState(null); // 'left' | 'right' | null
  const [hasInteracted, setHasInteracted] = useState(false);
  const [swiped, setSwiped]         = useState({ pass: 0, bid: 0 });
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

  const advance = useCallback((dir) => {
    setHasInteracted(true);
    setExiting(dir);
    setTimeout(() => {
      setIndex((i) => (i + 1) % Math.max(vibes.length, 1));
      setDragOffset(0);
      setIsDragging(false);
      setImgFailed(false);
      setExiting(null);
    }, 250);
  }, [vibes.length]);

  const handlePass = useCallback(() => {
    showQuip(randomQuip(PASS_QUIPS), '#FF3B3B');
    setSwiped((s) => ({ ...s, pass: s.pass + 1 }));
    advance('left');
  }, [advance, showQuip]);

  const handleBid = useCallback(() => {
    const vibe = vibes[index];
    if (!vibe) return;
    showQuip(randomQuip(BID_QUIPS), '#C8FF00');
    setSwiped((s) => ({ ...s, bid: s.bid + 1 }));
    advance('right');
    setTimeout(() => router.push(`/auction/${vibe.slug}`), 600);
  }, [advance, showQuip, vibes, index, router]);

  const onPointerDown = useCallback((e) => {
    if (exiting) return;
    dragStartX.current = e.clientX ?? e.touches?.[0]?.clientX;
    setIsDragging(true);
  }, [exiting]);

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
  const nextVibe = vibes[(index + 1) % Math.max(vibes.length, 1)];
  const rotate      = isDragging ? dragOffset * 0.06 : 0;
  const passOpacity = isDragging && dragOffset < 0 ? Math.min(1, Math.abs(dragOffset) / 80) : 0;
  const bidOpacity  = isDragging && dragOffset > 0 ? Math.min(1, dragOffset / 80) : 0;
  const canInteract = !loading && vibe && !exiting;

  // Exit animation transform
  const getCardTransform = () => {
    if (exiting === 'left') return 'translateX(-120%) rotate(-15deg)';
    if (exiting === 'right') return 'translateX(120%) rotate(15deg)';
    if (isDragging) return `translateX(${dragOffset}px) rotate(${rotate}deg)`;
    return 'none';
  };

  const cardTransition = exiting
    ? 'transform 0.25s cubic-bezier(.4,0,.2,1), opacity 0.25s ease'
    : isDragging ? 'none' : 'transform 0.3s cubic-bezier(.25,.8,.25,1)';

  // Progress dots (max 8 visible)
  const totalVibes = vibes.length;
  const dotCount = Math.min(totalVibes, 8);
  const totalSwiped = swiped.pass + swiped.bid;

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        background: '#0A0A0A',
        cursor: canInteract ? 'grab' : 'default',
        userSelect: 'none',
        touchAction: 'none',
        overflow: 'hidden',
        minHeight: compact ? 280 : 0,
      }}
      onMouseDown={canInteract ? onPointerDown : undefined}
      onMouseMove={canInteract ? onPointerMove : undefined}
      onMouseUp={canInteract ? onPointerUp : undefined}
      onMouseLeave={canInteract ? onPointerUp : undefined}
      onTouchStart={canInteract ? (e) => onPointerDown(e.touches[0]) : undefined}
      onTouchMove={canInteract ? (e) => { e.preventDefault(); onPointerMove(e.touches[0]); } : undefined}
      onTouchEnd={canInteract ? onPointerUp : undefined}
    >
      {/* Keyframe animations */}
      <style>{`
        @keyframes voph-spin { to { transform: rotate(360deg); } }
        @keyframes voph-toast { 0%{opacity:0;transform:translateX(-50%) translateY(8px)} 15%,70%{opacity:1;transform:translateX(-50%) translateY(0)} 100%{opacity:0;transform:translateX(-50%) translateY(-6px)} }
        @keyframes voph-hint-fade { 0%,100%{opacity:0} 30%,70%{opacity:1} }
        @keyframes voph-hint-arrows { 0%,100%{transform:translateX(0)} 50%{transform:translateX(3px)} }
      `}</style>

      {/* Overlay header */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: compact ? '10px 14px' : '14px 18px',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, transparent 100%)',
        zIndex: 10, pointerEvents: 'none',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <div style={{ fontFamily: "'Anton', sans-serif", fontSize: compact ? 11 : 13, textTransform: 'uppercase', letterSpacing: 2, color: '#888' }}>
            Vibe <span style={{ color: '#C8FF00' }}>or</span> Pass
          </div>
          {totalSwiped > 0 && (
            <span style={{
              fontSize: 9, fontWeight: 800, color: '#444',
              background: '#141414', padding: '2px 6px',
              letterSpacing: '0.5px',
            }}>
              {totalSwiped} rated
            </span>
          )}
        </div>
        <Link
          href="/swipe"
          style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: '#555', textDecoration: 'none', pointerEvents: 'auto' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#C8FF00'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#555'; }}
        >
          Full screen →
        </Link>
      </div>

      {/* Subtle side glow to match hero */}
      <div style={{
        position: 'absolute', top: '20%', left: -40, width: 80, height: '60%',
        background: 'radial-gradient(ellipse, rgba(200,255,0,0.04) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 28, height: 28, border: '2px solid #222', borderTop: '2px solid #C8FF00', borderRadius: '50%', animation: 'voph-spin 0.8s linear infinite', margin: '0 auto 10px' }} />
            <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, color: '#333' }}>Loading vibes…</div>
          </div>
        </div>
      ) : !vibe ? (
        /* Empty state */
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 32, color: '#1A1A1A', marginBottom: 12 }}>👀</div>
            <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 16, textTransform: 'uppercase', letterSpacing: 1, color: '#333', marginBottom: 8 }}>
              No vibes to judge
            </div>
            <Link href="/mint" style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: '#C8FF00', textDecoration: 'none' }}>
              Mint one →
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Peek-behind next card */}
          {nextVibe && nextVibe !== vibe && (
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 100,
              zIndex: 0, overflow: 'hidden',
              opacity: 0.3, filter: 'blur(1px)',
            }}>
              {nextVibe.imageUrl && (
                <img
                  src={nextVibe.imageUrl} alt="" draggable={false}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }}
                />
              )}
            </div>
          )}

          {/* Main card (z-index above peek) */}
          <div style={{
            position: 'relative', zIndex: 1, flex: '1 1 0',
            overflow: 'hidden', background: '#111',
            transform: getCardTransform(),
            transition: cardTransition,
            opacity: exiting ? 0.6 : 1,
          }}>
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
              position: 'absolute', top: '50%', left: 16,
              transform: 'translateY(-50%) rotate(-12deg)',
              border: '4px solid #FF3B3B', borderRadius: 5,
              color: '#FF3B3B', fontFamily: "'Anton', sans-serif",
              fontSize: compact ? 28 : 36, padding: '2px 12px', textTransform: 'uppercase',
              opacity: passOpacity,
              transition: 'opacity 0.05s', pointerEvents: 'none', letterSpacing: 2,
            }}>PASS</div>

            {/* BID stamp */}
            <div style={{
              position: 'absolute', top: '50%', right: 16,
              transform: 'translateY(-50%) rotate(12deg)',
              border: '4px solid #C8FF00', borderRadius: 5,
              color: '#C8FF00', fontFamily: "'Anton', sans-serif",
              fontSize: compact ? 28 : 36, padding: '2px 12px', textTransform: 'uppercase',
              opacity: bidOpacity,
              transition: 'opacity 0.05s', pointerEvents: 'none', letterSpacing: 2,
            }}>BID</div>

            {/* Category pill */}
            {vibe.category && (
              <span style={{
                position: 'absolute', bottom: 14, left: 14,
                background: 'rgba(0,0,0,0.85)', color: '#888',
                fontSize: 9, fontWeight: 800, textTransform: 'uppercase',
                padding: '4px 10px', letterSpacing: '0.08em',
                borderRadius: 2,
              }}>{vibe.category}</span>
            )}

            {/* Bottom gradient */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
              background: 'linear-gradient(to bottom, transparent, #0A0A0A)',
              pointerEvents: 'none',
            }} />
          </div>

          {/* Info */}
          <div
            style={{
              position: 'relative', zIndex: 1,
              flex: '0 0 auto',
              padding: compact ? '10px 16px' : '14px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              transform: isDragging ? `translateX(${dragOffset * 0.3}px)` : 'none',
              transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(.25,.8,.25,1)',
            }}
          >
            <div style={{
              fontFamily: "'Anton', sans-serif",
              fontSize: compact ? 16 : 20,
              lineHeight: 1.1, textTransform: 'uppercase', color: '#FFF',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{vibe.name}</div>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontFamily: "'Anton', sans-serif", fontSize: compact ? 14 : 16, color: '#C8FF00' }}>
                {Number(vibe.startingPrice || 0).toLocaleString()} AURA
              </span>
              {/* Drag hint + Progress dots */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {!hasInteracted && !isDragging && (
                  <span style={{
                    fontSize: 9, fontWeight: 800, textTransform: 'uppercase',
                    letterSpacing: '0.5px', color: '#444',
                    animation: 'voph-hint-fade 3s ease infinite',
                  }}>← Swipe →</span>
                )}
                {totalVibes > 1 && (
                  <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                    {Array.from({ length: dotCount }).map((_, i) => (
                      <div key={i} style={{
                        width: i === (index % dotCount) ? 12 : 4,
                        height: 4,
                        borderRadius: 2,
                        background: i === (index % dotCount) ? '#C8FF00' : '#2A2A2A',
                        transition: 'all 0.2s ease',
                      }} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quip */}
          {quip && (
            <div style={{
              position: 'absolute', bottom: 70, left: '50%', transform: 'translateX(-50%)',
              background: '#000', border: `1px solid ${quip.color}`, color: quip.color,
              fontFamily: "'Anton', sans-serif", fontSize: compact ? 12 : 14, textTransform: 'uppercase',
              letterSpacing: 1, padding: '7px 18px',
              pointerEvents: 'none', zIndex: 10, whiteSpace: 'nowrap',
              animation: 'voph-toast 1.2s ease forwards',
            }}>
              {quip.text}
            </div>
          )}

          {/* Buttons — pinned to bottom */}
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', borderTop: '1px solid #1A1A1A' }}>
            <button type="button" onClick={handlePass} disabled={!!exiting} style={{
              flex: 1, padding: compact ? '10px 0' : '14px 0',
              background: 'rgba(255,59,59,0.06)', border: 'none',
              color: '#FF3B3B', fontFamily: "'Anton', sans-serif",
              fontSize: compact ? 14 : 16, textTransform: 'uppercase', letterSpacing: 1,
              cursor: exiting ? 'default' : 'pointer', transition: 'background 0.15s',
              borderRight: '1px solid #1A1A1A',
            }}
              onMouseEnter={(e) => { if (!exiting) e.currentTarget.style.background = 'rgba(255,59,59,0.15)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,59,59,0.06)'; }}
            >✕ Pass</button>
            <button type="button" onClick={handleBid} disabled={!!exiting} style={{
              flex: 1, padding: compact ? '10px 0' : '14px 0',
              background: 'rgba(200,255,0,0.06)', border: 'none',
              color: '#C8FF00', fontFamily: "'Anton', sans-serif",
              fontSize: compact ? 14 : 16, textTransform: 'uppercase', letterSpacing: 1,
              cursor: exiting ? 'default' : 'pointer', transition: 'background 0.15s',
            }}
              onMouseEnter={(e) => { if (!exiting) e.currentTarget.style.background = 'rgba(200,255,0,0.18)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(200,255,0,0.06)'; }}
            >♥ Bid</button>
          </div>
        </>
      )}
    </div>
  );
}
