'use client';

import Link from 'next/link';
import { useAuth } from '../state/auth-store';
import { BRAND_NAME } from '../../lib/brand.js';
import { COLORS } from '../../lib/design-tokens.js';

const S = {
  header: {
    position: 'relative',
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '24px 32px',
  },
  logo: {
    fontSize: '22px',
    fontWeight: 300,
    letterSpacing: '0.02em',
    color: COLORS.accent,
    textDecoration: 'none',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  navLink: {
    fontSize: '14px',
    color: COLORS.textMuted,
    textDecoration: 'none',
  },
  cta: {
    borderRadius: '999px',
    background: COLORS.accent,
    color: '#000000',
    padding: '8px 20px',
    fontSize: '14px',
    fontWeight: 600,
    textDecoration: 'none',
  },
};

export default function LandingHeader() {
  const { user } = useAuth();

  return (
    <header style={S.header}>
      <Link href="/" style={S.logo}>{BRAND_NAME}</Link>
      <nav style={S.nav}>
        <Link href="/skill.md" style={S.navLink}>Docs</Link>
        {user ? (
          <Link href="/feed" style={S.cta}>Open App</Link>
        ) : (
          <>
            <Link href="/login" style={S.navLink}>Log in</Link>
            <Link href="/signup" style={S.cta}>Sign up free</Link>
          </>
        )}
      </nav>
    </header>
  );
}
