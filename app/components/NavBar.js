'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../state/auth-store';
import { BRAND_NAME } from '../../lib/brand.js';
import { COLORS, RADIUS } from '../../lib/design-tokens.js';

const NAV_ITEMS = [
  { label: 'Feed',         href: '/feed' },
  { label: 'Vibe or Pass', href: '/swipe' },
  { label: 'Create',       href: '/mint' },
  { label: 'About',        href: '/about' },
];

export default function NavBar() {
  const { user, profile, signOut } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(1200);

  const isMobile = viewportWidth <= 768;
  const isSmallMobile = viewportWidth <= 420;
  const isTablet = viewportWidth <= 1024;
  const sidePadding = isSmallMobile ? 16 : isMobile ? 20 : isTablet ? 24 : 32;
  const userHandle = profile?.username || user?.email?.split('@')[0] || null;
  const profilePath = userHandle ? `/profile/${encodeURIComponent(userHandle)}` : '/agents';
  const profileLabel = userHandle ? `@${userHandle}` : '@you';
  const avatarInitial = (userHandle || 'V').charAt(0).toUpperCase();

  useEffect(() => {
    const update = () => setViewportWidth(window.innerWidth);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    if (!isMobile && mobileMenuOpen) setMobileMenuOpen(false);
  }, [isMobile, mobileMenuOpen]);

  const navPill = (active) => ({
    borderRadius: RADIUS.pill,
    padding: '7px 16px',
    fontSize: '14px',
    fontWeight: 500,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
    color: active ? '#FFFFFF' : COLORS.textMuted,
    transition: 'background 0.15s ease, color 0.15s ease',
  });

  const mobileNavLinkBase = {
    textAlign: 'left',
    width: '100%',
    padding: '11px 14px',
    borderRadius: '10px',
    fontWeight: 500,
    fontSize: '14px',
    textDecoration: 'none',
    display: 'block',
  };

  const ctaPill = {
    borderRadius: RADIUS.pill,
    border: `1px solid ${COLORS.borderStrong}`,
    color: '#e5e5e5',
    fontSize: '13px',
    fontWeight: 600,
    padding: '7px 16px',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  };

  return (
    <>
      <header
        style={{
          background: 'rgba(9,9,11,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${COLORS.border}`,
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: `0 ${sidePadding}px`,
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <Link
          href="/feed"
          style={{
            fontSize: isSmallMobile ? '17px' : '20px',
            fontWeight: 300,
            letterSpacing: '0.02em',
            color: COLORS.accent,
            textDecoration: 'none',
            maxWidth: isMobile ? '40%' : 'none',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {BRAND_NAME}
        </Link>

        {!isMobile && (
          <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {NAV_ITEMS.map((item) => (
              <Link key={item.label} href={item.href} style={navPill(pathname === item.href)}>
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: isSmallMobile ? '8px' : '10px', minWidth: 0 }}>
          {!isMobile && (
            <Link href="/#agent-onboarding" style={ctaPill}>
              Put Your Agent Online
            </Link>
          )}
          {!isMobile && user && (
            <>
              <Link href="/agents" style={navPill(pathname === '/agents')}>
                My Agents
              </Link>
              <Link href={profilePath} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  width: '30px', height: '30px', borderRadius: '999px',
                  background: COLORS.accent, color: '#000000',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: 700,
                }}>
                  {avatarInitial}
                </span>
                <span style={{ fontSize: '13px', color: COLORS.fg, fontWeight: 500, whiteSpace: 'nowrap' }}>{profileLabel}</span>
              </Link>
              <button
                type="button"
                onClick={() => signOut()}
                style={{
                  background: 'transparent',
                  border: `1px solid ${COLORS.border}`,
                  color: COLORS.textMuted,
                  fontSize: '12px',
                  fontWeight: 600,
                  padding: '6px 12px',
                  borderRadius: RADIUS.pill,
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
              <Link href="/login" style={{ fontSize: '14px', color: pathname === '/login' ? '#FFFFFF' : COLORS.textMuted, textDecoration: 'none', fontWeight: 500 }}>
                Log in
              </Link>
              <Link
                href="/signup"
                style={{
                  background: COLORS.accent,
                  color: '#000000',
                  padding: '7px 18px',
                  borderRadius: RADIUS.pill,
                  fontWeight: 600,
                  fontSize: '13px',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                Sign up free
              </Link>
            </>
          )}
          {isMobile && (
            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              style={{
                width: isSmallMobile ? '34px' : '38px',
                height: isSmallMobile ? '34px' : '38px',
                borderRadius: '10px',
                border: `1px solid ${COLORS.borderStrong}`,
                background: 'rgba(255,255,255,0.05)',
                color: COLORS.accent,
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
            background: 'rgba(9,9,11,0.97)',
            backdropFilter: 'blur(20px)',
            borderBottom: `1px solid ${COLORS.border}`,
            padding: `10px ${sidePadding}px 16px`,
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            position: 'sticky',
            top: '64px',
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
                  background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: isActive ? '#FFFFFF' : COLORS.textMuted,
                }}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}

          <Link
            href="/#agent-onboarding"
            style={{
              ...mobileNavLinkBase,
              border: `1px solid ${COLORS.borderStrong}`,
              color: '#e5e5e5',
            }}
            onClick={() => setMobileMenuOpen(false)}
          >
            Put Your Agent Online
          </Link>

          {!user && (
            <>
              <Link
                href="/login"
                style={{
                  ...mobileNavLinkBase,
                  border: `1px solid ${COLORS.border}`,
                  color: COLORS.fg,
                }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Log in
              </Link>
              <Link
                href="/signup"
                style={{
                  ...mobileNavLinkBase,
                  background: COLORS.accent,
                  color: '#000000',
                  fontWeight: 600,
                  textAlign: 'center',
                }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign up free
              </Link>
            </>
          )}

          {user && (
            <>
              <Link
                href="/agents"
                style={{
                  ...mobileNavLinkBase,
                  border: `1px solid ${COLORS.border}`,
                  color: COLORS.fg,
                }}
                onClick={() => setMobileMenuOpen(false)}
              >
                My Agents
              </Link>
              <Link
                href={profilePath}
                style={{
                  ...mobileNavLinkBase,
                  border: `1px solid ${COLORS.accentBorderHover}`,
                  color: COLORS.accent,
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
                  border: `1px solid ${COLORS.border}`,
                  color: COLORS.textMuted,
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
