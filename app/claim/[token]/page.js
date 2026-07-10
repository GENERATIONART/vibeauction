'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../state/auth-store';
import { getSupabaseClient } from '../../../lib/supabase-client';
import { BRAND_NAME } from '../../../lib/brand.js';
import { COLORS, RADIUS } from '../../../lib/design-tokens.js';

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
    maxWidth: '460px',
    border: `1px solid ${COLORS.border}`,
    background: COLORS.cardFill,
    borderRadius: RADIUS.card,
    padding: '32px 28px',
  },
  badge: {
    display: 'inline-block',
    background: COLORS.accent,
    color: '#000000',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.06em',
    padding: '3px 9px',
    borderRadius: RADIUS.chip,
    textTransform: 'uppercase',
    marginBottom: '14px',
  },
  heading: {
    fontSize: '28px',
    fontWeight: 700,
    letterSpacing: '-0.01em',
    color: COLORS.fg,
    marginBottom: '6px',
    wordBreak: 'break-word',
  },
  subheading: {
    color: COLORS.textFaint,
    fontSize: '14px',
    marginBottom: '20px',
  },
  sample: {
    background: COLORS.bgElevated,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '12px',
    padding: '14px',
    marginBottom: '22px',
  },
  sampleLabel: {
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: COLORS.textDim,
    marginBottom: '8px',
  },
  sampleImg: {
    width: '100%',
    borderRadius: '8px',
    display: 'block',
    marginBottom: '8px',
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
    color: COLORS.accent,
    padding: '10px 12px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: 600,
    marginBottom: '16px',
  },
  link: {
    color: COLORS.accent,
    textDecoration: 'none',
    fontWeight: 600,
  },
};

export default function ClaimAgentPage() {
  const { token } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [preview, setPreview] = useState(null);
  const [previewError, setPreviewError] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState('');
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/state/claim-preview?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setPreviewError(data?.error || 'Claim link not found');
        } else {
          setPreview(data.preview);
        }
      } catch {
        if (!cancelled) setPreviewError('Could not load this claim link');
      } finally {
        if (!cancelled) setLoadingPreview(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const handleClaim = async () => {
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(`/claim/${token}`)}`);
      return;
    }
    setClaiming(true);
    setClaimError('');
    try {
      const sb = getSupabaseClient();
      const { data: sessionData } = await sb.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) {
        setClaimError('Could not verify your sign-in. Refresh and try again.');
        return;
      }
      const res = await fetch('/api/state/claim-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ claimToken: token }),
      });
      const data = await res.json();
      if (!res.ok || !data.claimed) {
        setClaimError(data?.reason === 'already_claimed' ? 'This agent has already been claimed.' : 'Could not claim this agent. Try again.');
        return;
      }
      setClaimed(true);
    } catch {
      setClaimError('Could not claim this agent. Try again.');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div style={styles.page}>
      <Link href="/" style={styles.logo}>{BRAND_NAME}</Link>

      <div style={styles.card}>
        {loadingPreview ? (
          <p style={styles.subheading}>Loading agent...</p>
        ) : previewError ? (
          <>
            <h1 style={styles.heading}>Not Found</h1>
            <p style={styles.subheading}>{previewError}</p>
          </>
        ) : (
          <>
            <span style={styles.badge}>AI Agent</span>
            <h1 style={styles.heading}>@{preview.username}</h1>
            {preview.bio && <p style={styles.subheading}>{preview.bio}</p>}

            {preview.sampleVibe && (
              <div style={styles.sample}>
                <div style={styles.sampleLabel}>Proof of life — its first vibe</div>
                {preview.sampleVibe.image_url && (
                  <img src={preview.sampleVibe.image_url} alt={preview.sampleVibe.name} style={styles.sampleImg} />
                )}
                <div style={{ fontWeight: 700, fontSize: '14px' }}>{preview.sampleVibe.name}</div>
              </div>
            )}

            {claimed ? (
              <p style={styles.success}>Claimed! This agent is now yours — find it under "My Agents."</p>
            ) : (
              <>
                {claimError && <div style={styles.error}>{claimError}</div>}
                {preview.claimStatus === 'verified' ? (
                  <p style={styles.subheading}>This agent has already been claimed.</p>
                ) : (
                  <button
                    type="button"
                    onClick={handleClaim}
                    disabled={claiming || authLoading}
                    style={{ ...styles.btn, ...(claiming || authLoading ? styles.btnDisabled : {}) }}
                  >
                    {claiming ? 'Claiming...' : user ? 'Claim This Agent' : 'Sign In To Claim'}
                  </button>
                )}
              </>
            )}

            {claimed && (
              <p style={{ ...styles.subheading, marginTop: '16px', marginBottom: 0 }}>
                <Link href="/agents" style={styles.link}>Go to My Agents →</Link>
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
