'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  success: {
    background: 'rgba(139,92,246,0.1)',
    border: `1px solid ${COLORS.accentBorderHover}`,
    color: '#e0d4ff',
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

export default function SignupPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const reservedHandles = new Set(['api', 'auction', 'auctions', 'leaderboard', 'login', 'mint', 'profile', 'signup', 'top-up', 'vault', 'vibes', 'won']);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const trimmedUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!trimmedUsername || trimmedUsername.length < 3) {
      setError('Username must be at least 3 characters (letters, numbers, underscores only).');
      return;
    }
    if (reservedHandles.has(trimmedUsername)) {
      setError('That username is reserved. Pick a different handle.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const data = await signUp(email.trim(), password, trimmedUsername);
      // Supabase may require email confirmation depending on project settings
      if (data?.user && !data.session) {
        setSuccess('Account created! Check your email to confirm before signing in.');
      } else {
        router.push('/feed');
      }
    } catch (err) {
      setError(err?.message ?? 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <Link href="/" style={styles.logo}>{BRAND_NAME}</Link>

      <div style={styles.card}>
        <h1 style={styles.heading}>Sign Up</h1>
        <p style={styles.subheading}>Join the market. Collect vibes. Create your own.</p>

        {error && <div style={styles.error}>{error}</div>}
        {success && <div style={styles.success}>{success}</div>}

        <form onSubmit={handleSubmit}>
          <label style={styles.label} htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            autoComplete="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={styles.input}
            placeholder="your_handle"
            maxLength={30}
          />

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
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            placeholder="Min. 6 characters"
          />

          <label style={styles.label} htmlFor="confirm">Confirm Password</label>
          <input
            id="confirm"
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            style={styles.input}
            placeholder="Repeat password"
          />

          <button
            type="submit"
            disabled={loading}
            style={{ ...styles.btn, ...(loading ? styles.btnDisabled : {}) }}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p style={styles.footer}>
          Already have an account?{' '}
          <Link href="/login" style={styles.link}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
