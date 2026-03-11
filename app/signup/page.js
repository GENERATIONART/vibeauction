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
  success: {
    background: 'rgba(200,255,0,0.08)',
    border: '1px solid rgba(200,255,0,0.35)',
    color: '#E8FFA0',
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const trimmedUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!trimmedUsername || trimmedUsername.length < 3) {
      setError('Username must be at least 3 characters (letters, numbers, underscores only).');
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
        router.push('/');
      }
    } catch (err) {
      setError(err?.message ?? 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <Link href="/" style={styles.logo}>Vibe Auction</Link>

      <div style={styles.card}>
        <h1 style={styles.heading}>Sign Up</h1>
        <p style={styles.subheading}>Join the auction. Bid on vibes. Drop your own.</p>

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
