'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../state/auth-store';
import { BRAND_NAME } from '../../lib/brand.js';
import { COLORS, RADIUS } from '../../lib/design-tokens.js';

const styles = {
  page: {
    background: COLORS.bg,
    color: COLORS.fg,
    minHeight: '100dvh',
    fontFamily: "'Space Grotesk', sans-serif",
    WebkitFontSmoothing: 'antialiased',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
  },
  logo: {
    fontWeight: 300,
    letterSpacing: '0.02em',
    color: COLORS.accent,
    textDecoration: 'none',
    fontSize: '24px',
    marginBottom: '32px',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    border: `1px solid ${COLORS.border}`,
    background: COLORS.cardFill,
    borderRadius: RADIUS.card,
    padding: '32px 28px',
  },
  heading: {
    fontSize: '28px',
    fontWeight: 700,
    letterSpacing: '-0.01em',
    color: COLORS.fg,
    marginBottom: '6px',
  },
  subheading: {
    color: COLORS.textFaint,
    fontSize: '14px',
    marginBottom: '28px',
  },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    color: COLORS.textMuted,
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    background: COLORS.bgElevated,
    border: `1px solid ${COLORS.border}`,
    color: COLORS.fg,
    padding: '12px 14px',
    fontSize: '15px',
    fontFamily: "'Space Grotesk', sans-serif",
    borderRadius: '10px',
    outline: 'none',
    marginBottom: '18px',
    boxSizing: 'border-box',
  },
  btn: {
    width: '100%',
    background: COLORS.accent,
    color: '#000000',
    border: 'none',
    padding: '13px',
    borderRadius: RADIUS.pill,
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '4px',
  },
  btnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  error: {
    background: 'rgba(255,82,82,0.12)',
    border: '1px solid rgba(255,82,82,0.4)',
    color: '#FFBCBC',
    padding: '10px 12px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: 600,
    marginBottom: '16px',
  },
  footer: {
    marginTop: '20px',
    fontSize: '13px',
    color: COLORS.textDim,
    textAlign: 'center',
  },
  link: {
    color: COLORS.accent,
    textDecoration: 'none',
    fontWeight: 600,
  },
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      const next = searchParams.get('next');
      router.push(next && next.startsWith('/') ? next : '/feed');
    } catch (err) {
      setError(err?.message ?? 'Sign in failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <Link href="/" style={styles.logo}>{BRAND_NAME}</Link>

      <div style={styles.card}>
        <h1 style={styles.heading}>Sign In</h1>
        <p style={styles.subheading}>Access your collection, bids, and listed vibes.</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <label style={styles.label} htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            placeholder="you@example.com"
          />

          <label style={styles.label} htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            placeholder="••••••••"
          />

          <button
            type="submit"
            disabled={loading}
            style={{ ...styles.btn, ...(loading ? styles.btnDisabled : {}) }}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <p style={styles.footer}>
          No account?{' '}
          <Link href="/signup" style={styles.link}>Sign up free</Link>
        </p>
      </div>
    </div>
  );
}
