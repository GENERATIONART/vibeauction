'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useVibeStore } from '../state/vibe-store';
import { useAuth } from '../state/auth-store';

const NAV_ITEMS = [
  { label: 'Browse Vibes', href: '/' },
  { label: 'Markets', href: '/markets' },
  { label: 'Vibes', href: '/vibes' },
  { label: 'Drop Vibe', href: '/mint' },
  { label: 'Leaderboard', href: '/leaderboard' },
  { label: 'Vibe Vault', href: '/vault' },
  { label: 'Top Up', href: '/top-up' },
];

export default function NavBar() {
  const { balance } = useVibeStore();
  const { user, profile, signOut } = useAuth();
  const pathname = usePathname();
  const [navHover, setNavHover] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(1200);

  const isMobile = viewportWidth <= 768;
  const isSmallMobile = viewportWidth <= 420;
  const isTablet = viewportWidth <= 1024;
  const sidePadding = isSmallMobile ? 12 : isMobile ? 16 : isTablet ? 20 : 24;
  const headerHeight = isMobile ? 64 : 60;
  const balanceDisplay = Number.isFinite(balance) ? balance.toLocaleString() : '0';
  const userHandle = profile?.username || user?.email?.split('@')[0] || null;
  const profilePath = userHandle ? `/profile/${encodeURIComponent(userHandle)}` : '/vault';
  const profileLabel = userHandle ? `@${userHandle}` : '@you';

  useEffect(() => {
    const update = () => setViewportWidth(window.innerWidth);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    if (!isMobile && mobileMenuOpen) setMobileMenuOpen(false);
  }, [isMobile, mobileMenuOpen]);

  const navItemStyle = {
    fontWeight: 700,
    fontSize: '14px',
    color: '#FFFFFF',
    textDecoration: 'none',
    textTransform: 'uppercase',
    cursor: 'pointer',
  };

  const mobileNavLinkBase = {
    textAlign: 'left',
    width: '100%',
    padding: '10px 12px',
    borderRadius: '6px',
    fontWeight: 700,
    fontSize: isSmallMobile ? '12px' : '13px',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
    textDecoration: 'none',
    display: 'block',
  };

  return (
    <>
      <header
        style={{
          background: '#000000',
          height: headerHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: `0 ${sidePadding}px`,
          position: 'sticky',
          top: 0,
          zIndex: 100,
          borderBottom: '2px solid #C8FF00',
        }}
      >
        <Link
          href="/"
          style={{
            fontFamily: "'Anton', sans-serif",
            fontSize: isSmallMobile ? '17px' : isMobile ? '20px' : '24px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: '#C8FF00',
            textDecoration: 'none',
            maxWidth: isMobile ? '45%' : 'none',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          Vibe Auction
        </Link>

        {!isMobile && (
          <nav style={{ display: 'flex', gap: '24px' }}>
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  style={{
                    ...navItemStyle,
                    color: isActive || navHover === item.label ? '#C8FF00' : '#FFFFFF',
                  }}
                  onMouseEnter={() => setNavHover(item.label)}
                  onMouseLeave={() => setNavHover('')}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: isSmallMobile ? '6px' : '8px', minWidth: 0 }}>
          {!isMobile && user && (
            <>
              <Link
                href={profilePath}
                style={{ ...navItemStyle, color: '#C8FF00', fontSize: '13px', whiteSpace: 'nowrap' }}
              >
                {profileLabel}
              </Link>
              <button
                type="button"
                onClick={() => signOut()}
                style={{
                  background: 'transparent',
                  border: '1px solid #444',
                  color: '#AAAAAA',
                  fontSize: '12px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Sign Out
              </button>
            </>
          )}
          {!isMobile && !user && (
            <>
              <Link
                href="/login"
                style={{ ...navItemStyle, color: pathname === '/login' ? '#C8FF00' : '#FFFFFF', fontSize: '13px' }}
              >
                Login
              </Link>
              <Link
                href="/signup"
                style={{
                  background: '#C8FF00',
                  color: '#000000',
                  padding: '5px 12px',
                  borderRadius: '4px',
                  fontWeight: 700,
                  fontSize: '13px',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                Sign Up
              </Link>
            </>
          )}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: '#C8FF00',
              color: '#000000',
              padding: isSmallMobile ? '4px 8px' : isMobile ? '4px 10px' : '4px 12px',
              borderRadius: '99px',
              fontWeight: 700,
              fontSize: isSmallMobile ? '11px' : isMobile ? '12px' : '13px',
              minWidth: 0,
              whiteSpace: 'nowrap',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <span>{balanceDisplay} AURA</span>
          </div>
          {isMobile && (
            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              style={{
                width: isSmallMobile ? '34px' : '38px',
                height: isSmallMobile ? '34px' : '38px',
                borderRadius: '6px',
                border: '2px solid #C8FF00',
                background: '#0D0D0D',
                color: '#C8FF00',
                fontSize: isSmallMobile ? '18px' : '20px',
                lineHeight: 1,
                cursor: 'pointer',
              }}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
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
            padding: `10px ${sidePadding}px 14px`,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            position: 'sticky',
            top: headerHeight,
            zIndex: 99,
          }}
        >
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                style={{
                  ...mobileNavLinkBase,
                  border: isActive ? '2px solid #C8FF00' : '1px solid #2A2A2A',
                  background: isActive ? '#1A1A1A' : '#121212',
                  color: isActive ? '#C8FF00' : '#FFFFFF',
                }}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}

          {!user && (
            <>
              <div
                style={{
                  fontFamily: "'Anton', sans-serif",
                  fontSize: isSmallMobile ? '18px' : '20px',
                  textTransform: 'uppercase',
                  color: '#C8FF00',
                  padding: '10px 12px',
                  borderBottom: '1px solid #2A2A2A',
                  marginBottom: '4px',
                }}
              >
                Authentication
              </div>
              <Link
                href="/login"
                style={{
                  ...mobileNavLinkBase,
                  border: pathname === '/login' ? '2px solid #C8FF00' : '1px solid #2A2A2A',
                  background: pathname === '/login' ? '#1A1A1A' : '#121212',
                  color: pathname === '/login' ? '#C8FF00' : '#FFFFFF',
                }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                href="/signup"
                style={{
                  ...mobileNavLinkBase,
                  border: '2px solid #C8FF00',
                  background: '#C8FF00',
                  color: '#000000',
                }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign Up
              </Link>
            </>
          )}

          {user && (
            <>
              <Link
                href={profilePath}
                style={{
                  ...mobileNavLinkBase,
                  border: '2px solid #C8FF00',
                  background: '#1A1A1A',
                  color: '#C8FF00',
                }}
                onClick={() => setMobileMenuOpen(false)}
              >
                {profileLabel}
              </Link>
              <button
                type="button"
                onClick={() => { signOut(); setMobileMenuOpen(false); }}
                style={{
                  ...mobileNavLinkBase,
                  border: '1px solid #444',
                  background: '#121212',
                  color: '#AAAAAA',
                  cursor: 'pointer',
                }}
              >
                Sign Out
              </button>
            </>
          )}
        </nav>
      )}
    </>
  );
}
