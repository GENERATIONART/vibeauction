'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { useVibeStore } from '../state/vibe-store';
import NavBar from '../components/NavBar';

const customStyles = {
  pageWrapper: {
    position: 'relative',
    backgroundColor: '#0D0D0D',
    color: '#FFFFFF',
    fontFamily: "'Inter', sans-serif",
    WebkitFontSmoothing: 'antialiased',
    overflowX: 'hidden',
    minHeight: '100dvh',
  },
  header: {
    background: '#000000',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    borderBottom: '2px solid #C8FF00',
    position: 'relative',
    zIndex: 20,
  },
  logo: {
    fontFamily: "'Anton', sans-serif",
    fontSize: '24px',
    textTransform: 'uppercase',
    color: '#C8FF00',
    textDecoration: 'none',
  },
  auctionSettled: {
    fontFamily: "'Anton', sans-serif",
    color: '#C8FF00',
    letterSpacing: '0.4px',
  },
  confettiContainer: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 1,
    overflow: 'hidden',
  },
  victoryOverlay: {
    position: 'relative',
    zIndex: 10,
    minHeight: 'calc(100dvh - 60px)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    background: 'radial-gradient(circle at center, rgba(200, 255, 0, 0.15) 0%, transparent 70%)',
  },
  victoryHeader: {
    textAlign: 'center',
    marginBottom: '40px',
  },
  victoryTitle: {
    fontFamily: "'Anton', sans-serif",
    fontSize: '120px',
    lineHeight: 0.8,
    textTransform: 'uppercase',
    color: '#C8FF00',
    textShadow: '8px 8px 0px #000000',
    marginBottom: '10px',
  },
  victorySubtitle: {
    fontFamily: "'Anton', sans-serif",
    fontSize: '48px',
    textTransform: 'uppercase',
    background: '#FFFFFF',
    color: '#000000',
    padding: '0 20px',
    display: 'inline-block',
    transform: 'rotate(-2deg)',
  },
  certificateContainer: {
    background: '#FFFFFF',
    color: '#000000',
    padding: '40px',
    borderRadius: '4px',
    width: '600px',
    maxWidth: '100%',
    border: '10px double #000000',
    boxShadow: '20px 20px 0px #C8FF00',
    position: 'relative',
    marginBottom: '50px',
  },
  certPattern: {
    position: 'absolute',
    inset: '10px',
    border: '2px solid rgba(0,0,0,0.1)',
    pointerEvents: 'none',
    backgroundImage: 'radial-gradient(#000000 1px, transparent 1px)',
    backgroundSize: '20px 20px',
    opacity: 0.05,
  },
  certHeader: {
    textAlign: 'center',
    borderBottom: '2px solid #000000',
    paddingBottom: '20px',
    marginBottom: '30px',
  },
  certHeaderH4: {
    fontFamily: "'Anton', sans-serif",
    fontSize: '14px',
    letterSpacing: '4px',
    textTransform: 'uppercase',
  },
  vibeName: {
    fontFamily: "'Anton', sans-serif",
    fontSize: '42px',
    textTransform: 'uppercase',
    textAlign: 'center',
    lineHeight: 1,
    margin: '20px 0',
  },
  certDetails: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '40px',
    fontFamily: "'Inter', sans-serif",
    fontWeight: 800,
    textTransform: 'uppercase',
    fontSize: '14px',
    gap: '14px',
  },
  auraPrice: {
    fontFamily: "'Anton', sans-serif",
    fontSize: '32px',
    color: '#000000',
    display: 'block',
  },
  seal: {
    position: 'absolute',
    bottom: '-30px',
    right: '40px',
    width: '100px',
    height: '100px',
    background: '#C8FF00',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Anton', sans-serif",
    textTransform: 'uppercase',
    fontSize: '12px',
    textAlign: 'center',
    border: '4px solid #000000',
    transform: 'rotate(15deg)',
    lineHeight: 1,
  },
  actionGroup: {
    display: 'flex',
    gap: '20px',
  },
  btnLarge: {
    fontFamily: "'Anton', sans-serif",
    fontSize: '24px',
    textTransform: 'uppercase',
    padding: '16px 48px',
    cursor: 'pointer',
    border: 'none',
    transition: '0.2s',
  },
  btnFlex: {
    background: '#C8FF00',
    color: '#000000',
    boxShadow: '6px 6px 0px #FFFFFF',
  },
  btnVault: {
    background: '#000000',
    color: '#FFFFFF',
    border: '2px solid #C8FF00',
    boxShadow: '6px 6px 0px #C8FF00',
  },
  svgDripTop: {
    position: 'absolute',
    top: '60px',
    left: 0,
    width: '100%',
    height: '120px',
    zIndex: 5,
    fill: '#C8FF00',
    opacity: 0.3,
    pointerEvents: 'none',
  },
};

const ConfettiPiece = ({ left, color, duration, delay, opacity, size, rotateSeed }) => {
  const style = {
    position: 'absolute',
    backgroundColor: color,
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: size > 8 ? '2px' : '1px',
    top: '-20px',
    left: `${left}vw`,
    opacity,
    animation: `confettiFall ${duration}s linear ${delay}s infinite`,
    transform: `rotate(${rotateSeed}deg)`,
  };

  return <div style={style} />;
};

const makeConfettiPieces = (count) => {
  const colors = ['#C8FF00', '#FFFFFF', '#1A1A1A'];
  const pieces = [];

  for (let i = 0; i < count; i += 1) {
    const size = Math.random() * 10 + 5;
    pieces.push({
      id: i,
      left: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 5,
      opacity: Math.random() * 0.7 + 0.2,
      size,
      rotateSeed: Math.random() * 360,
    });
  }

  return pieces;
};

function WonPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeBids, settleAuction } = useVibeStore();
  const [confettiPieces, setConfettiPieces] = useState([]);
  const [flexHovered, setFlexHovered] = useState(false);
  const [vaultHovered, setVaultHovered] = useState(false);
  const [flexClicked, setFlexClicked] = useState(false);
  const [vaultClicked, setVaultClicked] = useState(false);
  const [settling, setSettling] = useState(false);
  const [actionError, setActionError] = useState('');
  const [viewportWidth, setViewportWidth] = useState(1200);

  const isMobile = viewportWidth <= 768;
  const isSmallPhone = viewportWidth <= 460;

  // Read vibe data from URL params (set by auction page on win)
  const paramId = searchParams.get('id');
  const paramName = searchParams.get('name');
  const paramEmoji = searchParams.get('emoji');
  const paramAmount = searchParams.get('amount');
  const paramSlug = searchParams.get('slug');
  const paramCategory = searchParams.get('category') || 'Vibes';

  // Fall back to finding any active bid if no params
  const fallbackBid = !paramId ? activeBids[0] : null;

  const wonVibeId = paramId || (fallbackBid ? String(fallbackBid.id || fallbackBid.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : 'unknown-vibe');
  const wonVibeName = paramName || fallbackBid?.name || 'Unknown Vibe';
  const wonVibeEmoji = paramEmoji || fallbackBid?.emoji || '✨';
  const wonVibeSlug = paramSlug || wonVibeId;

  const matchingBid = activeBids.find((bid) => {
    const normalizedName = String(bid?.id || bid?.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return normalizedName === wonVibeId;
  });

  const winningBid = paramAmount ? Number(paramAmount) : (matchingBid?.amount || 0);
  const winningBidDisplay = Number.isFinite(winningBid) && winningBid > 0 ? winningBid.toLocaleString() : '—';

  useEffect(() => {
    const updateViewportWidth = () => setViewportWidth(window.innerWidth);
    updateViewportWidth();
    window.addEventListener('resize', updateViewportWidth);

    const styleEl = document.createElement('style');
    styleEl.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;700;800&display=swap');
      @keyframes confettiFall {
        to { transform: translateY(115dvh) rotate(720deg); }
      }
    `;
    document.head.appendChild(styleEl);

    return () => {
      window.removeEventListener('resize', updateViewportWidth);
      document.head.removeChild(styleEl);
    };
  }, []);

  useEffect(() => {
    const count = isMobile ? 60 : 100;
    setConfettiPieces(makeConfettiPieces(count));
  }, [isMobile]);

  const handleFlexClick = () => {
    setFlexClicked(true);
    setTimeout(() => setFlexClicked(false), 300);
  };

  const handleVaultClick = async () => {
    if (settling) return;
    setVaultClicked(true);
    setActionError('');
    setSettling(true);

    const settled = await settleAuction({
      id: wonVibeId,
      name: wonVibeName,
      emoji: wonVibeEmoji,
      category: paramCategory,
      rarity: 'epic',
      price: winningBid,
    });

    setSettling(false);

    if (!settled) {
      setActionError('Could not move this vibe to vault. Please try again.');
      setVaultClicked(false);
      return;
    }

    setTimeout(() => {
      setVaultClicked(false);
      router.push('/vault');
    }, 220);
  };

  const btnFlexStyle = {
    ...customStyles.btnLarge,
    ...customStyles.btnFlex,
    fontSize: isMobile ? '20px' : customStyles.btnLarge.fontSize,
    width: isMobile ? '100%' : 'auto',
    padding: isMobile ? '14px 20px' : customStyles.btnLarge.padding,
    ...(flexHovered || flexClicked ? { transform: 'translate(2px, 2px)', boxShadow: '4px 4px 0px #FFFFFF' } : {}),
  };

  const btnVaultStyle = {
    ...customStyles.btnLarge,
    ...customStyles.btnVault,
    fontSize: isMobile ? '20px' : customStyles.btnLarge.fontSize,
    width: isMobile ? '100%' : 'auto',
    padding: isMobile ? '14px 20px' : customStyles.btnLarge.padding,
    ...(vaultHovered || vaultClicked ? { transform: 'translate(2px, 2px)', boxShadow: '4px 4px 0px #C8FF00' } : {}),
  };

  return (
    <div style={customStyles.pageWrapper}>
      <NavBar />

      <svg
        style={{
          ...customStyles.svgDripTop,
          top: isMobile ? '56px' : '60px',
          height: isMobile ? '90px' : customStyles.svgDripTop.height,
        }}
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
      >
        <path d="M0,0 L1440,0 L1440,60 C1300,60 1250,110 1100,110 C950,110 900,40 750,40 C600,40 550,100 400,100 C250,100 150,50 0,50 Z" />
      </svg>

      <div style={customStyles.confettiContainer}>
        {confettiPieces.map((piece) => (
          <ConfettiPiece key={piece.id} {...piece} />
        ))}
      </div>

      <main
        style={{
          ...customStyles.victoryOverlay,
          minHeight: isMobile ? 'calc(100dvh - 56px)' : customStyles.victoryOverlay.minHeight,
          padding: isMobile ? '24px 14px 30px' : customStyles.victoryOverlay.padding,
          justifyContent: isMobile ? 'flex-start' : customStyles.victoryOverlay.justifyContent,
          paddingTop: isMobile ? '40px' : '40px',
        }}
      >
        <div style={{ ...customStyles.victoryHeader, marginBottom: isMobile ? '24px' : customStyles.victoryHeader.marginBottom }}>
          <h1
            style={{
              ...customStyles.victoryTitle,
              fontSize: isSmallPhone ? '58px' : (isMobile ? '74px' : customStyles.victoryTitle.fontSize),
              textShadow: isMobile ? '4px 4px 0px #000000' : customStyles.victoryTitle.textShadow,
            }}
          >
            YOU WON!
          </h1>
          <div
            style={{
              ...customStyles.victorySubtitle,
              fontSize: isSmallPhone ? '22px' : (isMobile ? '30px' : customStyles.victorySubtitle.fontSize),
              padding: isMobile ? '0 12px' : customStyles.victorySubtitle.padding,
            }}
          >
            VIBE ACQUIRED
          </div>
        </div>

        <div
          style={{
            ...customStyles.certificateContainer,
            width: isMobile ? '92vw' : customStyles.certificateContainer.width,
            padding: isMobile ? '22px 16px 28px' : customStyles.certificateContainer.padding,
            border: isMobile ? '6px double #000000' : customStyles.certificateContainer.border,
            boxShadow: isMobile ? '10px 10px 0px #C8FF00' : customStyles.certificateContainer.boxShadow,
            marginBottom: isMobile ? '26px' : customStyles.certificateContainer.marginBottom,
          }}
        >
          <div style={customStyles.certPattern} />
          <div style={{ ...customStyles.certHeader, marginBottom: isMobile ? '18px' : customStyles.certHeader.marginBottom }}>
            <h4 style={{ ...customStyles.certHeaderH4, fontSize: isSmallPhone ? '10px' : customStyles.certHeaderH4.fontSize, letterSpacing: isMobile ? '2px' : '4px' }}>
              Official Certificate of Ownership
            </h4>
          </div>

          <div style={{ textAlign: 'center', fontSize: isMobile ? '50px' : '64px', marginBottom: '10px' }}>{wonVibeEmoji}</div>
          <h2 style={{ ...customStyles.vibeName, fontSize: isSmallPhone ? '28px' : (isMobile ? '34px' : customStyles.vibeName.fontSize) }}>
            {wonVibeName}
          </h2>

          <div
            style={{
              ...customStyles.certDetails,
              marginTop: isMobile ? '24px' : customStyles.certDetails.marginTop,
              flexDirection: isSmallPhone ? 'column' : 'row',
              alignItems: isSmallPhone ? 'flex-start' : 'stretch',
            }}
          >
            <div>
              <span style={{ color: '#888', display: 'block', marginBottom: '5px' }}>Winner</span>
              <span>You</span>
            </div>
            <div style={{ textAlign: isSmallPhone ? 'left' : 'right' }}>
              <span style={{ color: '#888', display: 'block', marginBottom: '5px' }}>Winning Bid</span>
              <span style={{ ...customStyles.auraPrice, fontSize: isMobile ? '28px' : customStyles.auraPrice.fontSize }}>{winningBidDisplay} AURA</span>
            </div>
          </div>

          <div
            style={{
              ...customStyles.seal,
              width: isMobile ? '84px' : customStyles.seal.width,
              height: isMobile ? '84px' : customStyles.seal.height,
              fontSize: isMobile ? '10px' : customStyles.seal.fontSize,
              right: isMobile ? '18px' : customStyles.seal.right,
              bottom: isMobile ? '-24px' : customStyles.seal.bottom,
            }}
          >
            Authentic<br />Abstract<br />Concept
          </div>
        </div>

        <div
          style={{
            ...customStyles.actionGroup,
            flexDirection: isMobile ? 'column' : 'row',
            width: isMobile ? '92vw' : 'auto',
            gap: isMobile ? '12px' : customStyles.actionGroup.gap,
            flexWrap: 'wrap',
          }}
        >
          {actionError && (
            <div
              style={{
                width: '100%',
                background: 'rgba(255,80,80,0.14)',
                border: '1px solid rgba(255,80,80,0.38)',
                color: '#FFB6B6',
                fontWeight: 700,
                fontSize: '13px',
                padding: '10px',
                textAlign: 'center',
              }}
            >
              {actionError}
            </div>
          )}
          <button
            style={btnFlexStyle}
            onClick={handleFlexClick}
            onMouseEnter={() => setFlexHovered(true)}
            onMouseLeave={() => setFlexHovered(false)}
          >
            Flex on Feed
          </button>
          <button
            style={{
              ...btnVaultStyle,
              opacity: settling ? 0.7 : 1,
              cursor: settling ? 'not-allowed' : btnVaultStyle.cursor,
            }}
            onClick={handleVaultClick}
            onMouseEnter={() => setVaultHovered(true)}
            onMouseLeave={() => setVaultHovered(false)}
            disabled={settling}
          >
            {settling ? 'Vaulting...' : 'Vault It'}
          </button>
        </div>
      </main>
    </div>
  );
}

export default function WonPage() {
  return (
    <Suspense>
      <WonPageInner />
    </Suspense>
  );
}
