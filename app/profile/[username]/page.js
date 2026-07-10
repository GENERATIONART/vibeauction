'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '../../state/auth-store';
import NavBar from '../../components/NavBar';
import { getSupabaseClient } from '../../../lib/supabase-client';

const S = {
  page: {
    minHeight: '100dvh',
    background:
      'radial-gradient(circle at top, rgba(139,92,246,0.12) 0%, rgba(139,92,246,0.03) 18%, #09090b 50%, #050506 100%)',
    color: '#FFFFFF',
    fontFamily: "'Space Grotesk', sans-serif",
    WebkitFontSmoothing: 'antialiased',
    overflowX: 'hidden',
  },
  shell: {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '0 24px 64px',
  },
  hero: {
    position: 'relative',
    marginTop: '18px',
    border: '1px solid rgba(255,255,255,0.08)',
    background:
      'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 36%, rgba(139,92,246,0.08) 100%)',
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    inset: 0,
    background:
      'radial-gradient(circle at 80% 20%, rgba(139,92,246,0.22) 0%, rgba(139,92,246,0) 32%), radial-gradient(circle at 15% 25%, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 26%)',
    pointerEvents: 'none',
  },
  heroInner: {
    position: 'relative',
    zIndex: 1,
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.25fr) minmax(280px, 0.75fr)',
    gap: '18px',
    padding: '24px',
  },
  heroMain: {
    display: 'flex',
    gap: '18px',
    alignItems: 'flex-start',
  },
  avatarWrap: {
    flexShrink: 0,
  },
  avatar: {
    width: '118px',
    height: '118px',
    border: '4px solid #FFFFFF',
    background: '#8b5cf6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#050506',
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '56px',
    boxShadow: '10px 10px 0 rgba(0,0,0,0.35)',
    transform: 'rotate(-3deg)',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  heroText: {
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  eyebrow: {
    fontSize: '11px',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: '#A8A8A8',
  },
  handle: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '56px',
    lineHeight: 0.92,
    textTransform: 'uppercase',
    margin: 0,
    textWrap: 'balance',
  },
  subhead: {
    fontSize: '15px',
    lineHeight: 1.6,
    color: '#CACACA',
    maxWidth: '620px',
  },
  chipRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '6px',
  },
  chip: {
    border: '1px solid #2A2A2A',
    background: 'rgba(255,255,255,0.04)',
    color: '#E5E5E5',
    padding: '7px 10px',
    fontSize: '11px',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
  },
  chipAccent: {
    border: '1px solid rgba(139,92,246,0.42)',
    background: 'rgba(139,92,246,0.1)',
    color: '#a78bfa',
    padding: '7px 10px',
    fontSize: '11px',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
  },
  avatarEditor: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '10px',
  },
  avatarInput: {
    minWidth: '260px',
    flex: '1 1 260px',
    background: '#0d0d10',
    border: '1px solid #2B2B2B',
    color: '#FFFFFF',
    padding: '10px 12px',
    fontSize: '12px',
    outline: 'none',
  },
  actionBtn: {
    background: '#8b5cf6',
    color: '#000000',
    border: 'none',
    padding: '10px 12px',
    fontSize: '11px',
    fontWeight: 800,
    textTransform: 'uppercase',
    cursor: 'pointer',
  },
  ghostBtn: {
    background: '#101010',
    color: '#D0D0D0',
    border: '1px solid #333333',
    padding: '10px 12px',
    fontSize: '11px',
    fontWeight: 800,
    textTransform: 'uppercase',
    cursor: 'pointer',
  },
  avatarStatus: {
    fontSize: '11px',
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  spotlightPanel: {
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.03)',
    padding: '18px',
    minHeight: '100%',
  },
  panelLabel: {
    fontSize: '10px',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    color: '#8C8C8C',
    marginBottom: '10px',
  },
  spotlightGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '10px',
  },
  spotlightCard: {
    background: '#0d0d10',
    border: '1px solid #212121',
    padding: '8px',
  },
  spotlightThumb: {
    width: '100%',
    height: '94px',
    objectFit: 'cover',
    display: 'block',
    background: '#111111',
  },
  spotlightFallback: {
    width: '100%',
    height: '94px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#121212',
    color: '#666666',
    fontSize: '10px',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.7px',
  },
  spotlightName: {
    marginTop: '8px',
    fontSize: '10px',
    lineHeight: 1.3,
    textTransform: 'uppercase',
    fontWeight: 800,
    color: '#E0E0E0',
  },
  metricGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: '12px',
    marginTop: '18px',
  },
  metricCard: {
    background: '#0d0d10',
    border: '1px solid #1D1D1D',
    padding: '16px',
  },
  metricValue: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '32px',
    lineHeight: 1,
    color: '#FFFFFF',
  },
  metricLabel: {
    marginTop: '8px',
    fontSize: '10px',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.7px',
    color: '#777777',
  },
  digestGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.2fr) minmax(280px, 0.8fr)',
    gap: '18px',
    marginTop: '18px',
  },
  digestLead: {
    position: 'relative',
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.08)',
    background:
      'linear-gradient(145deg, rgba(139,92,246,0.12) 0%, rgba(255,255,255,0.04) 40%, rgba(255,255,255,0.02) 100%)',
    padding: '20px',
  },
  digestGlow: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    background:
      'radial-gradient(circle at 85% 15%, rgba(139,92,246,0.26) 0%, rgba(139,92,246,0) 28%), radial-gradient(circle at 12% 85%, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 24%)',
  },
  digestLabel: {
    position: 'relative',
    zIndex: 1,
    fontSize: '10px',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    color: '#A2A2A2',
  },
  digestTitle: {
    position: 'relative',
    zIndex: 1,
    marginTop: '12px',
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '42px',
    lineHeight: 0.94,
    textTransform: 'uppercase',
    color: '#FFFFFF',
  },
  digestText: {
    position: 'relative',
    zIndex: 1,
    marginTop: '12px',
    maxWidth: '600px',
    fontSize: '14px',
    lineHeight: 1.6,
    color: '#D0D0D0',
  },
  digestMetaRow: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    marginTop: '18px',
  },
  digestMetaChip: {
    background: '#09090b',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#EFEFEF',
    padding: '9px 11px',
    fontSize: '11px',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
  },
  digestSide: {
    display: 'grid',
    gap: '12px',
  },
  digestMiniCard: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    padding: '16px',
  },
  digestMiniLabel: {
    fontSize: '10px',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    color: '#8A8A8A',
  },
  digestMiniValue: {
    marginTop: '10px',
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '28px',
    lineHeight: 1,
    textTransform: 'uppercase',
    color: '#FFFFFF',
  },
  digestMiniText: {
    marginTop: '8px',
    fontSize: '12px',
    lineHeight: 1.55,
    color: '#B6B6B6',
  },
  ownerBanner: {
    marginTop: '14px',
    background: 'rgba(139,92,246,0.08)',
    border: '1px solid rgba(139,92,246,0.28)',
    color: '#a78bfa',
    padding: '12px 16px',
    fontSize: '12px',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  tabBar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '18px',
  },
  tab: {
    background: '#101010',
    color: '#BFBFBF',
    border: '1px solid #2A2A2A',
    padding: '10px 12px',
    fontSize: '11px',
    fontWeight: 800,
    textTransform: 'uppercase',
    cursor: 'pointer',
  },
  tabActive: {
    background: '#8b5cf6',
    color: '#000000',
    border: '1px solid #8b5cf6',
    padding: '10px 12px',
    fontSize: '11px',
    fontWeight: 800,
    textTransform: 'uppercase',
    cursor: 'pointer',
  },
  body: {
    display: 'grid',
    gridTemplateColumns: '1.15fr 0.85fr',
    gap: '18px',
    marginTop: '18px',
  },
  section: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  sectionHead: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    padding: '16px 18px',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
  },
  sectionTitle: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '28px',
    textTransform: 'uppercase',
    margin: 0,
    color: '#FFFFFF',
  },
  sectionMeta: {
    fontSize: '11px',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
    color: '#7F7F7F',
  },
  stack: {
    display: 'grid',
    gap: '0',
  },
  rowLink: {
    display: 'grid',
    gridTemplateColumns: '64px minmax(0, 1fr) auto',
    gap: '12px',
    alignItems: 'center',
    padding: '14px 18px',
    borderTop: '1px solid rgba(255,255,255,0.05)',
    textDecoration: 'none',
    color: 'inherit',
  },
  thumb: {
    width: '64px',
    height: '64px',
    objectFit: 'cover',
    display: 'block',
    background: '#111111',
    border: '1px solid #232323',
  },
  thumbFallback: {
    width: '64px',
    height: '64px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#111111',
    border: '1px solid #232323',
    color: '#666666',
    fontSize: '10px',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.7px',
  },
  rowTitle: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '22px',
    lineHeight: 1,
    textTransform: 'uppercase',
    color: '#FFFFFF',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  rowSub: {
    marginTop: '6px',
    fontSize: '11px',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
    color: '#7D7D7D',
  },
  rowMeta: {
    textAlign: 'right',
  },
  rowPrice: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '20px',
    color: '#8b5cf6',
    lineHeight: 1,
  },
  rowStatus: {
    marginTop: '6px',
    fontSize: '10px',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
    color: '#AFAFAF',
  },
  collectionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '12px',
    padding: '16px',
  },
  collectibleCard: {
    background: '#0d0d10',
    border: '1px solid #212121',
    padding: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  collectibleName: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '14px',
    lineHeight: 1.05,
    textTransform: 'uppercase',
    color: '#FFFFFF',
  },
  collectibleValue: {
    fontSize: '11px',
    fontWeight: 800,
    textTransform: 'uppercase',
    color: '#8b5cf6',
    letterSpacing: '0.6px',
  },
  walletRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    padding: '14px 18px',
    borderTop: '1px solid rgba(255,255,255,0.05)',
  },
  walletLabel: {
    fontWeight: 700,
    color: '#E2E2E2',
  },
  walletDate: {
    marginTop: '5px',
    fontSize: '11px',
    fontWeight: 800,
    textTransform: 'uppercase',
    color: '#6F6F6F',
  },
  walletAmt: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '22px',
    lineHeight: 1,
    color: '#8b5cf6',
  },
  empty: {
    padding: '36px 18px',
    textAlign: 'center',
    fontSize: '12px',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.7px',
    color: '#5F5F5F',
  },
  notFound: {
    maxWidth: '760px',
    margin: '0 auto',
    padding: '84px 24px',
    textAlign: 'center',
  },
};

const fmtDate = (value) => {
  const ms = new Date(value || '').getTime();
  if (!Number.isFinite(ms)) return 'Unknown';
  return new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

function MediaThumb({ src, alt, style, fallbackStyle }) {
  if (src) {
    return <img src={src} alt={alt} style={style} />;
  }
  return <div style={fallbackStyle}>IMG</div>;
}

function Section({ title, meta, children }) {
  return (
    <section style={S.section}>
      <div style={S.sectionHead}>
        <h2 style={S.sectionTitle}>{title}</h2>
        {meta ? <div style={S.sectionMeta}>{meta}</div> : null}
      </div>
      {children}
    </section>
  );
}

export default function ProfilePage() {
  const { username } = useParams();
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [avatarInput, setAvatarInput] = useState('');
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState('');
  const [avatarError, setAvatarError] = useState('');
  const [followStats, setFollowStats] = useState({ followerCount: 0, followingCount: 0, isFollowing: false });
  const [followBusy, setFollowBusy] = useState(false);

  const isMobile = viewportWidth <= 768;
  const isTablet = viewportWidth <= 1080;
  const isOwnProfile = Boolean(user && profile && user.id === profile.id);

  useEffect(() => {
    const update = () => setViewportWidth(window.innerWidth);
    update();
    window.addEventListener('resize', update);

    const style = document.createElement('style');
    style.textContent = `
      *, *::before, *::after { box-sizing: border-box; }
      body { margin: 0; background: #050506; overflow-x: hidden; }
    `;
    document.head.appendChild(style);
    return () => {
      window.removeEventListener('resize', update);
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    if (!username) return;
    const normalizedUsername = String(username).replace(/^@/, '').toLowerCase();
    const ownHandleCandidates = [
      user?.user_metadata?.username,
      user?.email?.split('@')?.[0],
    ]
      .map((value) => String(value || '').trim().toLowerCase())
      .filter(Boolean);

    async function fetchProfile() {
      setLoading(true);
      setNotFound(false);
      setProfile(null);
      setListings([]);

      const sb = getSupabaseClient();
      if (!sb) {
        setProfile({ username: normalizedUsername, created_at: new Date().toISOString() });
        setLoading(false);
        return;
      }

      let { data: profileData, error } = await sb
        .from('profiles')
        .select('*')
        .ilike('username', normalizedUsername)
        .single();

      if ((error || !profileData) && user?.id && ownHandleCandidates.includes(normalizedUsername)) {
        const fallbackProfile = await sb
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        profileData = fallbackProfile.data || null;
        error = fallbackProfile.error || null;

        const resolvedHandle =
          String(profileData?.username || user?.user_metadata?.username || user?.email?.split('@')?.[0] || '')
            .trim()
            .toLowerCase();

        if (profileData && !profileData.username && resolvedHandle) {
          profileData = { ...profileData, username: resolvedHandle };
          await sb.from('profiles').update({ username: resolvedHandle }).eq('id', user.id).is('username', null);
        }
      }

      if (error || !profileData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setProfile(profileData);
      setAvatarInput(profileData?.avatar_url || '');
      setAvatarMessage('');
      setAvatarError('');

      const { data: vibeData } = await sb
        .from('vibes')
        .select('id, slug, name, created_at, category, image_url')
        .or(`listed_by.eq.${profileData.id},listed_by.eq.${profileData.username},author.eq.${profileData.username}`)
        .order('created_at', { ascending: false })
        .limit(60);

      const allVibes = Array.isArray(vibeData) ? vibeData : [];

      setListings(allVibes);

      setLoading(false);
    }

    fetchProfile();
  }, [username, user]);

  const getAccessToken = async () => {
    const sb = getSupabaseClient();
    if (!sb) return null;
    const { data } = await sb.auth.getSession();
    return data?.session?.access_token ?? null;
  };

  useEffect(() => {
    if (!profile?.id) return;
    let cancelled = false;
    (async () => {
      const token = await getAccessToken();
      const res = await fetch(`/api/state/follow-stats?userId=${encodeURIComponent(profile.id)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: 'no-store',
      });
      const data = await res.json();
      if (!cancelled) setFollowStats(data);
    })();
    return () => { cancelled = true; };
  }, [profile?.id, user?.id]);

  const handleFollowToggle = async () => {
    if (!profile?.id || followBusy) return;
    const token = await getAccessToken();
    if (!token) return;
    setFollowBusy(true);
    try {
      await fetch('/api/state/follow', {
        method: followStats.isFollowing ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: profile.id }),
      });
      setFollowStats((prev) => ({
        ...prev,
        isFollowing: !prev.isFollowing,
        followerCount: prev.followerCount + (prev.isFollowing ? -1 : 1),
      }));
    } finally {
      setFollowBusy(false);
    }
  };

  const avatarUrl = typeof profile?.avatar_url === 'string' ? profile.avatar_url.trim() : '';
  const avatarMonogram = String(profile?.username || username || 'V').charAt(0).toUpperCase();
  const memberYear = profile?.created_at ? new Date(profile.created_at).getFullYear() : '—';
  const spotlightCollection = useMemo(() => listings.slice(0, 3), [listings]);
  const topListing = listings[0] || null;
  const collectorLine = isOwnProfile
    ? 'Your profile: everything you\'ve posted, all in one place.'
    : 'A feed of everything this creator has posted.';

  const saveAvatar = async () => {
    if (!isOwnProfile || !profile?.id || avatarSaving) return;
    const nextUrl = String(avatarInput || '').trim();
    if (nextUrl && !/^https?:\/\//i.test(nextUrl)) {
      setAvatarError('Avatar must be a valid http(s) URL.');
      setAvatarMessage('');
      return;
    }

    const sb = getSupabaseClient();
    if (!sb) {
      setAvatarError('Supabase is not configured.');
      setAvatarMessage('');
      return;
    }

    setAvatarSaving(true);
    setAvatarError('');
    setAvatarMessage('');
    try {
      const { error } = await sb.from('profiles').update({ avatar_url: nextUrl || null }).eq('id', profile.id);
      if (error) throw error;
      setProfile((previous) => ({ ...(previous || {}), avatar_url: nextUrl || null }));
      setAvatarMessage(nextUrl ? 'Profile photo updated.' : 'Profile photo removed.');
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : 'Failed to update profile photo.');
    } finally {
      setAvatarSaving(false);
    }
  };

  if (!loading && notFound) {
    return (
      <div style={S.page}>
        <NavBar />
        <div style={S.notFound}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '72px', color: '#242424', lineHeight: 1 }}>404</div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '40px', lineHeight: 1, marginTop: '6px' }}>
            @{username}
          </div>
          <div style={{ marginTop: '10px', color: '#878787', fontSize: '16px' }}>
            This vibe has left the building. User not found.
          </div>
          <Link href="/feed" style={{ display: 'inline-block', marginTop: '20px', background: '#8b5cf6', color: '#000000', padding: '12px 20px', borderRadius: '999px', textDecoration: 'none', fontWeight: 600 }}>
            Back To Feed
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      <NavBar />
      <div style={{ ...S.shell, padding: isMobile ? '0 14px 48px' : S.shell.padding }}>
        <section style={S.hero}>
          <div style={S.heroGlow} />
          <div
            style={{
              ...S.heroInner,
              gridTemplateColumns: isTablet ? '1fr' : S.heroInner.gridTemplateColumns,
              padding: isMobile ? '18px 16px' : S.heroInner.padding,
            }}
          >
            <div style={{ ...S.heroMain, flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '14px' : '18px' }}>
              <div style={S.avatarWrap}>
                <div style={{ ...S.avatar, width: isMobile ? '86px' : S.avatar.width, height: isMobile ? '86px' : S.avatar.height, fontSize: isMobile ? '40px' : S.avatar.fontSize }}>
                  {avatarUrl ? <img src={avatarUrl} alt={`${profile?.username || username} profile`} style={S.avatarImage} /> : avatarMonogram}
                </div>
              </div>
              <div style={S.heroText}>
                <div style={S.eyebrow}>{isOwnProfile ? 'Your Profile' : 'Profile'}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  <h1 style={{ ...S.handle, fontSize: isMobile ? '34px' : isTablet ? '46px' : S.handle.fontSize, margin: 0 }}>
                    @{profile?.username ?? username}
                  </h1>
                  {!isOwnProfile && user && profile?.id && (
                    <button
                      type="button"
                      onClick={handleFollowToggle}
                      disabled={followBusy}
                      style={{
                        border: followStats.isFollowing ? 'none' : '1px solid rgba(255,255,255,0.2)',
                        background: followStats.isFollowing ? '#8b5cf6' : 'transparent',
                        color: followStats.isFollowing ? '#000000' : '#e5e5e5',
                        fontSize: '13px',
                        fontWeight: 600,
                        padding: '7px 18px',
                        borderRadius: '999px',
                        cursor: followBusy ? 'default' : 'pointer',
                        opacity: followBusy ? 0.6 : 1,
                      }}
                    >
                      {followStats.isFollowing ? 'Following' : 'Follow'}
                    </button>
                  )}
                </div>
                <div style={S.subhead}>{collectorLine}</div>
                <div style={S.chipRow}>
                  <div style={S.chipAccent}>{listings.length} Vibes Posted</div>
                  <div style={S.chip}>{followStats.followerCount} Followers</div>
                  <div style={S.chip}>{followStats.followingCount} Following</div>
                  <div style={S.chip}>Member Since {memberYear}</div>
                </div>
                {isOwnProfile && (
                  <div style={S.avatarEditor}>
                    <input
                      type="url"
                      value={avatarInput}
                      onChange={(event) => {
                        setAvatarInput(event.target.value);
                        if (avatarError) setAvatarError('');
                        if (avatarMessage) setAvatarMessage('');
                      }}
                      placeholder="https://your-image-url.com/pfp.jpg"
                      style={{ ...S.avatarInput, minWidth: isMobile ? '100%' : S.avatarInput.minWidth }}
                    />
                    <button type="button" onClick={saveAvatar} style={{ ...S.actionBtn, opacity: avatarSaving ? 0.7 : 1 }} disabled={avatarSaving}>
                      {avatarSaving ? 'Saving...' : 'Update Photo'}
                    </button>
                    <button type="button" onClick={() => setAvatarInput('')} style={S.ghostBtn} disabled={avatarSaving}>
                      Clear
                    </button>
                    {(avatarError || avatarMessage) && (
                      <div style={{ ...S.avatarStatus, color: avatarError ? '#FF9A9A' : '#a78bfa' }}>{avatarError || avatarMessage}</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <aside style={S.spotlightPanel}>
              <div style={S.panelLabel}>Recent Vibes</div>
              {spotlightCollection.length === 0 ? (
                <div style={{ color: '#5F5F5F', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  No vibes posted yet
                </div>
              ) : (
                <div style={{ ...S.spotlightGrid, gridTemplateColumns: isMobile ? 'repeat(3, minmax(0, 1fr))' : S.spotlightGrid.gridTemplateColumns }}>
                  {spotlightCollection.map((entry, index) => (
                    <Link key={entry.id || index} href={`/vibe/${entry.slug || entry.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <div style={S.spotlightCard}>
                        <MediaThumb
                          src={entry.image_url}
                          alt={entry.name || 'Vibe'}
                          style={S.spotlightThumb}
                          fallbackStyle={S.spotlightFallback}
                        />
                        <div style={S.spotlightName}>{entry.name || 'Unknown Vibe'}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </aside>
          </div>
        </section>

        {isOwnProfile ? (
          <div style={S.ownerBanner}>
            This is your profile. Everything you post shows up here.
          </div>
        ) : null}

        <div style={{ ...S.metricGrid, gridTemplateColumns: isMobile ? 'repeat(2, minmax(0, 1fr))' : S.metricGrid.gridTemplateColumns }}>
          {[
            { label: 'Vibes Posted', value: listings.length, color: '#FFFFFF' },
            { label: 'Followers', value: followStats.followerCount, color: '#8b5cf6' },
            { label: 'Following', value: followStats.followingCount, color: '#9DDBFF' },
            { label: 'Member Since', value: memberYear, color: '#E2E2E2' },
          ].map((metric) => (
            <div key={metric.label} style={S.metricCard}>
              <div style={{ ...S.metricValue, color: metric.color }}>{loading ? '—' : metric.value}</div>
              <div style={S.metricLabel}>{metric.label}</div>
            </div>
          ))}
        </div>

        <section style={{ ...S.digestGrid, gridTemplateColumns: isTablet ? '1fr' : S.digestGrid.gridTemplateColumns }}>
          <div style={S.digestLead}>
            <div style={S.digestGlow} />
            <div style={S.digestLabel}>{isOwnProfile ? 'Your Profile' : 'Profile'}</div>
            <div style={{ ...S.digestTitle, fontSize: isMobile ? '32px' : S.digestTitle.fontSize }}>
              {topListing ? topListing.name || 'Latest Vibe' : `@${profile?.username ?? username}`}
            </div>
            <div style={S.digestText}>
              {topListing
                ? `Most recent vibe, posted ${fmtDate(topListing.created_at)}.`
                : 'This profile is set up and ready for its first post.'}
            </div>
            <div style={S.digestMetaRow}>
              <div style={S.digestMetaChip}>{listings.length} vibes posted</div>
              {profile?.actor_type === 'agent' && <div style={S.digestMetaChip}>AI Agent</div>}
            </div>
          </div>
        </section>

        <div style={{ ...S.body, gridTemplateColumns: isTablet ? '1fr' : S.body.gridTemplateColumns }}>
          <div style={{ display: 'grid', gap: '18px', gridColumn: isTablet ? 'auto' : '1 / -1' }}>
            <Section title="Vibes" meta={loading ? 'Loading' : `${listings.length} posted`}>
              {loading ? (
                <div style={S.empty}>Loading profile...</div>
              ) : listings.length === 0 ? (
                <div style={S.empty}>No vibes posted yet</div>
              ) : (
                <div style={{ ...S.collectionGrid, gridTemplateColumns: isMobile ? 'repeat(2, minmax(0, 1fr))' : S.collectionGrid.gridTemplateColumns }}>
                  {listings.map((listing) => (
                    <Link key={listing.id} href={`/vibe/${listing.slug || listing.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <div style={S.collectibleCard}>
                        <MediaThumb src={listing.image_url} alt={listing.name || 'Vibe'} style={{ ...S.spotlightThumb, height: isMobile ? '96px' : '120px' }} fallbackStyle={{ ...S.spotlightFallback, height: isMobile ? '96px' : '120px' }} />
                        <div style={S.collectibleName}>{listing.name || 'Unknown Vibe'}</div>
                        <div style={{ color: '#666', fontSize: '12px' }}>{listing.category || 'Vibes'}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}
