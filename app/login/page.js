'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../state/auth-store';

const styles = {
  page: {
    background: '#0D0D0D',
    color: '#FFFFFF',
    minHeight: '100dvh',
    fontFamily: "'Inter', sans-serif",
    WebkitFontSmoothing: 'antialiased',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
  },
  logo: {
    fontFamily: "'Anton', sans-serif",
    color: '#C8FF00',
    textTransform: 'uppercase',
    textDecoration: 'none',
    fontSize: '28px',
    letterSpacing: '0.5px',
    marginBottom: '32px',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    border: '2px solid #C8FF00',
    background: '#111111',
    padding: '32px 28px',
    boxShadow: '8px 8px 0px rgba(200,255,0,0.15)',
  },
  heading: {
    fontFamily: "'Anton', sans-serif",
    fontSize: '42px',
    lineHeight: 0.95,
    textTransform: 'uppercase',
    color: '#FFFFFF',
    marginBottom: '6px',
  },
  subheading: {
    color: '#888888',
    fontSize: '14px',
    marginBottom: '28px',
  },
  label: {
    display: 'block',
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: '#AAAAAA',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    background: '#1A1A1A',
    border: '1px solid #333333',
    color: '#FFFFFF',
    padding: '12px 14px',
    fontSize: '15px',
    fontFamily: "'Inter', sans-serif",
    outline: 'none',
    marginBottom: '18px',
    boxSizing: 'border-box',
  },
  btn: {
    width: '100%',
    background: '#C8FF00',
    color: '#000000',
    border: 'none',
    padding: '14px',
    fontFamily: "'Anton', sans-serif",
    fontSize: '20px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
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
    fontSize: '13px',
    fontWeight: 700,
    marginBottom: '16px',
  },
  footer: {
    marginTop: '20px',
    fontSize: '13px',
    color: '#666666',
    textAlign: 'center',
  },
  link: {
    color: '#C8FF00',
    textDecoration: 'none',
    fontWeight: 700,
  },
};

export default function LoginPage() {
  const router = useRouter();
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
      router.push('/');
    } catch (err) {
      setError(err?.message ?? 'Sign in failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <Link href="/" style={styles.logo}>Vibe Auction</Link>

      <div style={styles.card}>
        <h1 style={styles.heading}>Sign In</h1>
        <p style={styles.subheading}>Access your vault, bids, and vibes.</p>

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
