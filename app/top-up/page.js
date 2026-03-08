'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useVibeStore } from '../state/vibe-store';

const packs = [
  {
    id: 'starter',
    label: 'Starter Pack',
    aura: 500,
    usd: '$5',
    subtitle: 'Quick boost for a few bids',
  },
  {
    id: 'booster',
    label: 'Booster Pack',
    aura: 1300,
    usd: '$12',
    subtitle: 'Best value for active bidders',
  },
  {
    id: 'mega',
    label: 'Mega Pack',
    aura: 3000,
    usd: '$25',
    subtitle: 'High-volume bidding power',
  },
];

const navItems = [
  { label: 'Browse Vibes', href: '/' },
  { label: 'Vibes', href: '/vibes' },
  { label: 'Sell a Feeling', href: '/mint' },
  { label: 'Leaderboard', href: '/leaderboard' },
  { label: 'Vibe Vault', href: '/vault' },
  { label: 'Top Up', href: '/top-up' },
];

const customStyles = {
  page: {
    background: '#0D0D0D',
    color: '#FFFFFF',
    minHeight: '100dvh',
    fontFamily: "'Inter', sans-serif",
    WebkitFontSmoothing: 'antialiased',
  },
  header: {
    background: '#000000',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    borderBottom: '2px solid #C8FF00',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  logo: {
    fontFamily: "'Anton', sans-serif",
    color: '#C8FF00',
    textTransform: 'uppercase',
    textDecoration: 'none',
    fontSize: '24px',
  },
  nav: {
    display: 'flex',
    gap: '22px',
  },
  navItem: {
    color: '#FFFFFF',
    textDecoration: 'none',
    textTransform: 'uppercase',
    fontWeight: 700,
    fontSize: '13px',
  },
  balancePill: {
    background: '#C8FF00',
    color: '#000000',
    borderRadius: '999px',
    padding: '4px 12px',
    fontWeight: 800,
    fontSize: '12px',
  },
  main: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '44px 20px 60px',
  },
  h1: {
    fontFamily: "'Anton', sans-serif",
    textTransform: 'uppercase',
    fontSize: '56px',
    lineHeight: 0.95,
    marginBottom: '14px',
  },
  subtitle: {
    color: '#A1A1A1',
    fontSize: '16px',
    marginBottom: '26px',
  },
  notice: {
    padding: '12px 14px',
    border: '1px solid rgba(200,255,0,0.35)',
    background: 'rgba(200,255,0,0.08)',
    color: '#E8FFA0',
    fontWeight: 700,
    marginBottom: '16px',
  },
  error: {
    padding: '12px 14px',
    border: '1px solid rgba(255,82,82,0.45)',
    background: 'rgba(255,82,82,0.13)',
    color: '#FFB3B3',
    fontWeight: 700,
    marginBottom: '16px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '14px',
  },
  packCard: {
    background: '#111111',
    border: '2px solid #2E2E2E',
    padding: '18px',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  packCardSelected: {
    background: '#121812',
    border: '2px solid #C8FF00',
    padding: '18px',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  packTitle: {
    fontFamily: "'Anton', sans-serif",
    textTransform: 'uppercase',
    fontSize: '24px',
    color: '#FFFFFF',
  },
  packAura: {
    fontSize: '24px',
    fontWeight: 800,
    color: '#C8FF00',
  },
  packUsd: {
    fontSize: '14px',
    color: '#D8D8D8',
    fontWeight: 700,
  },
  ctaWrap: {
    marginTop: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    flexWrap: 'wrap',
  },
  ctaBtn: {
    background: '#C8FF00',
    color: '#000000',
    border: 'none',
    padding: '14px 22px',
    fontWeight: 900,
    textTransform: 'uppercase',
    fontSize: '14px',
    letterSpacing: '0.4px',
    cursor: 'pointer',
  },
  ghostBtn: {
    background: 'transparent',
    color: '#FFFFFF',
    border: '1px solid #555555',
    padding: '12px 20px',
    fontWeight: 700,
    textTransform: 'uppercase',
    fontSize: '13px',
    textDecoration: 'none',
  },
};

function TopUpPageContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedPack, setSelectedPack] = useState('booster');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [viewportWidth, setViewportWidth] = useState(1200);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { balance, createStripeCheckoutSession } = useVibeStore();

  const isMobile = viewportWidth <= 768;
  const isCanceled = searchParams.get('canceled') === '1';
  const balanceDisplay = Number.isFinite(balance) ? balance.toLocaleString() : '0';

  useEffect(() => {
    const updateViewportWidth = () => setViewportWidth(window.innerWidth);
    updateViewportWidth();
    window.addEventListener('resize', updateViewportWidth);
    return () => window.removeEventListener('resize', updateViewportWidth);
  }, []);

  useEffect(() => {
    if (!isMobile && mobileMenuOpen) setMobileMenuOpen(false);
  }, [isMobile, mobileMenuOpen]);

  const selectedPackData = useMemo(
    () => packs.find((pack) => pack.id === selectedPack) || packs[0],
    [selectedPack],
  );

  const startCheckout = async () => {
    try {
      setSubmitting(true);
      setError('');

      const data = await createStripeCheckoutSession(selectedPackData.id);
      if (!data?.checkoutUrl) {
        setError('Stripe checkout URL was not returned.');
        setSubmitting(false);
        return;
      }

      window.location.assign(data.checkoutUrl);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : 'Failed to start checkout');
      setSubmitting(false);
    }
  };

  return (
    <div style={customStyles.page}>
      <header
        style={{
          ...customStyles.header,
          height: isMobile ? '64px' : customStyles.header.height,
          padding: isMobile ? '0 14px' : customStyles.header.padding,
        }}
      >
        <Link
          href="/"
          style={{ ...customStyles.logo, fontSize: isMobile ? '20px' : customStyles.logo.fontSize }}
        >
          Vibe Auction
        </Link>

        {!isMobile && (
          <nav style={customStyles.nav}>
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    ...customStyles.navItem,
                    color: isActive ? '#C8FF00' : '#FFFFFF',
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              ...customStyles.balancePill,
              padding: isMobile ? '4px 10px' : customStyles.balancePill.padding,
              fontSize: isMobile ? '11px' : customStyles.balancePill.fontSize,
            }}
          >
            {balanceDisplay} AURA
          </div>
          {isMobile && (
            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '6px',
                border: '2px solid #C8FF00',
                background: '#0D0D0D',
                color: '#C8FF00',
                fontSize: '20px',
                lineHeight: 1,
                cursor: 'pointer',
              }}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          )}
        </div>
      </header>

      {isMobile && mobileMenuOpen && (
        <nav
          style={{
            background: '#000000',
            borderBottom: '2px solid #C8FF00',
            padding: '10px 14px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  textAlign: 'left',
                  width: '100%',
                  border: isActive ? '2px solid #C8FF00' : '1px solid #2A2A2A',
                  background: isActive ? '#1A1A1A' : '#121212',
                  color: isActive ? '#C8FF00' : '#FFFFFF',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '13px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px',
                  textDecoration: 'none',
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}

      <main
        style={{
          ...customStyles.main,
          padding: isMobile ? '24px 16px 40px' : customStyles.main.padding,
        }}
      >
        <h1 style={{ ...customStyles.h1, fontSize: isMobile ? '38px' : customStyles.h1.fontSize }}>Top Up Aura</h1>
        <p style={customStyles.subtitle}>
          Choose a pack and continue to secure Stripe checkout.
        </p>

        {isCanceled && <div style={customStyles.notice}>Checkout was canceled. No charge was made.</div>}
        {error && <div style={customStyles.error}>{error}</div>}

        <section style={customStyles.grid}>
          {packs.map((pack) => {
            const selected = pack.id === selectedPack;
            return (
              <button
                key={pack.id}
                type="button"
                onClick={() => setSelectedPack(pack.id)}
                style={selected ? customStyles.packCardSelected : customStyles.packCard}
              >
                <span style={customStyles.packTitle}>{pack.label}</span>
                <span style={customStyles.packAura}>{pack.aura.toLocaleString()} AURA</span>
                <span style={customStyles.packUsd}>{pack.usd}</span>
                <span style={{ color: '#8A8A8A', fontSize: '13px' }}>{pack.subtitle}</span>
              </button>
            );
          })}
        </section>

        <div style={customStyles.ctaWrap}>
          <button type="button" onClick={startCheckout} style={customStyles.ctaBtn} disabled={submitting}>
            {submitting ? 'Starting Checkout...' : `Checkout ${selectedPackData.usd}`}
          </button>
          <Link href="/vault" style={customStyles.ghostBtn}>
            Back To Vault
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function TopUpPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100dvh',
            display: 'grid',
            placeItems: 'center',
            background: '#0D0D0D',
            color: '#FFFFFF',
            fontFamily: "'Inter', sans-serif",
          }}
        >
          Loading top-up...
        </div>
      }
    >
      <TopUpPageContent />
    </Suspense>
  );
}
