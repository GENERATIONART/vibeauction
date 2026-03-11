'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useVibeStore } from '../../state/vibe-store';

const styles = {
  page: {
    background: '#0D0D0D',
    color: '#FFFFFF',
    minHeight: '100dvh',
    fontFamily: "'Inter', sans-serif",
    WebkitFontSmoothing: 'antialiased',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  },
  card: {
    width: '100%',
    maxWidth: '640px',
    border: '2px solid #C8FF00',
    background: '#111111',
    padding: '28px 24px',
    boxShadow: '10px 10px 0px rgba(200,255,0,0.2)',
  },
  title: {
    fontFamily: "'Anton', sans-serif",
    fontSize: '54px',
    lineHeight: 0.95,
    textTransform: 'uppercase',
    marginBottom: '12px',
    color: '#C8FF00',
  },
  status: {
    fontSize: '15px',
    lineHeight: 1.5,
    color: '#DDDDDD',
  },
  success: {
    marginTop: '14px',
    background: 'rgba(200,255,0,0.1)',
    border: '1px solid rgba(200,255,0,0.4)',
    color: '#E9FF9A',
    padding: '12px',
    fontWeight: 700,
  },
  warning: {
    marginTop: '14px',
    background: 'rgba(255,176,32,0.12)',
    border: '1px solid rgba(255,176,32,0.4)',
    color: '#FFDE9D',
    padding: '12px',
    fontWeight: 700,
  },
  error: {
    marginTop: '14px',
    background: 'rgba(255,82,82,0.12)',
    border: '1px solid rgba(255,82,82,0.4)',
    color: '#FFBCBC',
    padding: '12px',
    fontWeight: 700,
  },
  actions: {
    marginTop: '18px',
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  primary: {
    background: '#C8FF00',
    color: '#000000',
    textDecoration: 'none',
    border: 'none',
    padding: '12px 18px',
    fontWeight: 900,
    textTransform: 'uppercase',
    fontSize: '13px',
  },
  secondary: {
    background: 'transparent',
    color: '#FFFFFF',
    textDecoration: 'none',
    border: '1px solid #555555',
    padding: '12px 18px',
    fontWeight: 700,
    textTransform: 'uppercase',
    fontSize: '13px',
  },
};

function TopUpSuccessContent() {
  const searchParams = useSearchParams();
  const didRequest = useRef(false);
  const { balance, confirmStripeSession } = useVibeStore();

  const [phase, setPhase] = useState('loading');
  const [message, setMessage] = useState('Confirming your payment session...');
  const [creditedAmount, setCreditedAmount] = useState(0);

  const sessionId = searchParams.get('session_id') || '';
  const balanceDisplay = Number.isFinite(balance) ? balance.toLocaleString() : '0';

  useEffect(() => {
    if (!sessionId) {
      setPhase('error');
      setMessage('No session ID was provided in the return URL.');
      return;
    }

    if (didRequest.current) return;
    didRequest.current = true;

    const run = async () => {
      try {
        const result = await confirmStripeSession(sessionId);

        if (result?.credited) {
          setCreditedAmount(Number(result?.auraAmount) || 0);
          setPhase('success');
          setMessage('Top-up completed and added to your wallet.');
          return;
        }

        if (result?.reason === 'already_processed') {
          setCreditedAmount(Number(result?.auraAmount) || 0);
          setPhase('already');
          setMessage('This Stripe session was already credited.');
          return;
        }

        if (result?.reason === 'credited_profile_retry') {
          setCreditedAmount(Number(result?.auraAmount) || 0);
          setPhase('success');
          setMessage('Top-up finalized and synced to your profile.');
          return;
        }

        if (result?.reason === 'profile_credit_failed') {
          setPhase('pending');
          setMessage('Payment was confirmed, but wallet sync needs a retry. Refresh this page.');
          return;
        }

        if (result?.reason === 'user_mismatch') {
          setPhase('error');
          setMessage('This checkout session belongs to a different account.');
          return;
        }

        if (result?.reason === 'auth_required') {
          setPhase('pending');
          setMessage('Sign in to the account that started checkout, then retry.');
          return;
        }

        if (result?.reason === 'not_paid') {
          setPhase('pending');
          setMessage('Stripe reports this checkout is not paid yet.');
          return;
        }

        setPhase('error');
        setMessage('Could not confirm the Stripe payment session.');
      } catch (confirmError) {
        setPhase('error');
        setMessage(confirmError instanceof Error ? confirmError.message : 'Failed to confirm session');
      }
    };

    run();
  }, [confirmStripeSession, sessionId]);

  return (
    <div style={styles.page}>
      <section style={styles.card}>
        <h1 style={styles.title}>Top Up Status</h1>
        <p style={styles.status}>{message}</p>

        {phase === 'loading' && <div style={styles.warning}>Processing payment confirmation...</div>}

        {phase === 'success' && (
          <div style={styles.success}>
            +{creditedAmount.toLocaleString()} AURA credited. Current balance: {balanceDisplay} AURA.
          </div>
        )}

        {phase === 'already' && (
          <div style={styles.warning}>
            Session already processed. Current balance: {balanceDisplay} AURA.
          </div>
        )}

        {phase === 'pending' && (
          <div style={styles.warning}>Payment not finalized yet. Wait a moment, then try again.</div>
        )}

        {phase === 'error' && <div style={styles.error}>{message}</div>}

        <div style={styles.actions}>
          <Link href="/vault" style={styles.primary}>
            Go To Vault
          </Link>
          <Link href="/top-up" style={styles.secondary}>
            Back To Top Up
          </Link>
        </div>
      </section>
    </div>
  );
}

export default function TopUpSuccessPage() {
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
          Loading payment status...
        </div>
      }
    >
      <TopUpSuccessContent />
    </Suspense>
  );
}
