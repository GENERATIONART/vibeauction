'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '../../state/auth-store';
import { useVibeStore } from '../../state/vibe-store';
import NavBar from '../../components/NavBar';
import { getSupabaseClient } from '../../../lib/supabase-client';

const S = {
  page: {
    minHeight: '100dvh',
    background:
      'radial-gradient(circle at top, rgba(200,255,0,0.12) 0%, rgba(200,255,0,0.03) 18%, #0A0A0A 50%, #050505 100%)',
    color: '#FFFFFF',
    fontFamily: "'Inter', sans-serif",
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
      'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 36%, rgba(200,255,0,0.08) 100%)',
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    inset: 0,
    background:
      'radial-gradient(circle at 80% 20%, rgba(200,255,0,0.22) 0%, rgba(200,255,0,0) 32%), radial-gradient(circle at 15% 25%, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 26%)',
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
    background: '#C8FF00',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#050505',
    fontFamily: "'Anton', sans-serif",
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
    fontFamily: "'Anton', sans-serif",
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
    border: '1px solid rgba(200,255,0,0.42)',
    background: 'rgba(200,255,0,0.1)',
    color: '#DFFF7B',
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
    background: '#0C0C0C',
    border: '1px solid #2B2B2B',
    color: '#FFFFFF',
    padding: '10px 12px',
    fontSize: '12px',
    outline: 'none',
  },
  actionBtn: {
    background: '#C8FF00',
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
    background: '#0C0C0C',
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
    background: '#0C0C0C',
    border: '1px solid #1D1D1D',
    padding: '16px',
  },
  metricValue: {
    fontFamily: "'Anton', sans-serif",
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
      'linear-gradient(145deg, rgba(200,255,0,0.12) 0%, rgba(255,255,255,0.04) 40%, rgba(255,255,255,0.02) 100%)',
    padding: '20px',
  },
  digestGlow: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    background:
      'radial-gradient(circle at 85% 15%, rgba(200,255,0,0.26) 0%, rgba(200,255,0,0) 28%), radial-gradient(circle at 12% 85%, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 24%)',
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
    fontFamily: "'Anton', sans-serif",
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
    background: '#090909',
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
    fontFamily: "'Anton', sans-serif",
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
    background: 'rgba(200,255,0,0.08)',
    border: '1px solid rgba(200,255,0,0.28)',
    color: '#DFFF7B',
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
    background: '#C8FF00',
    color: '#000000',
    border: '1px solid #C8FF00',
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
    fontFamily: "'Anton', sans-serif",
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
    fontFamily: "'Anton', sans-serif",
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
    fontFamily: "'Anton', sans-serif",
    fontSize: '20px',
    color: '#C8FF00',
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
    background: '#0C0C0C',
    border: '1px solid #212121',
    padding: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  collectibleName: {
    fontFamily: "'Anton', sans-serif",
    fontSize: '14px',
    lineHeight: 1.05,
    textTransform: 'uppercase',
    color: '#FFFFFF',
  },
  collectibleValue: {
    fontSize: '11px',
    fontWeight: 800,
    textTransform: 'uppercase',
    color: '#C8FF00',
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
    fontFamily: "'Anton', sans-serif",
    fontSize: '22px',
    lineHeight: 1,
    color: '#C8FF00',
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

const fmtAura = (value) => `${Number(value || 0).toLocaleString()} AURA`;
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
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { balance: privateBalance, walletLog } = useVibeStore();

  const [profile, setProfile] = useState(null);
  const [listings, setListings] = useState([]);
  const [pastAuctions, setPastAuctions] = useState([]);
  const [wonVibes, setWonVibes] = useState([]);
  const [activeProfileBids, setActiveProfileBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [accountTab, setAccountTab] = useState('overview');
  const [avatarInput, setAvatarInput] = useState('');
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState('');
  const [avatarError, setAvatarError] = useState('');

  const isMobile = viewportWidth <= 768;
  const isTablet = viewportWidth <= 1080;
  const requestedTab = String(searchParams.get('tab') || '').toLowerCase();
  const isOwnProfile = Boolean(user && profile && user.id === profile.id);

  useEffect(() => {
    const update = () => setViewportWidth(window.innerWidth);
    update();
    window.addEventListener('resize', update);

    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;700;800&display=swap');
      *, *::before, *::after { box-sizing: border-box; }
      body { margin: 0; background: #050505; overflow-x: hidden; }
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
      setPastAuctions([]);
      setWonVibes([]);
      setActiveProfileBids([]);

      const sb = getSupabaseClient();
      if (!sb) {
        setProfile({ username: normalizedUsername, aura_balance: 0, created_at: new Date().toISOString() });
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

      const now = Date.now();
      const [{ data: vibeData }, { data: vaultData }, { data: ownBidRows }] = await Promise.all([
        sb
          .from('vibes')
          .select('id, slug, name, starting_price, created_at, category, image_url, end_time')
          .or(`listed_by.eq.${profileData.id},listed_by.eq.${profileData.username},author.eq.${profileData.username}`)
          .order('created_at', { ascending: false })
          .limit(60),
        sb
          .from('vault_items')
          .select('id, name, category, price, won_date, image_url, created_at')
          .eq('user_id', profileData.id)
          .order('created_at', { ascending: false })
          .limit(30),
        sb
          .from('vibe_bids')
          .select('vibe_id, amount, created_at')
          .eq('user_id', profileData.id)
          .order('created_at', { ascending: false })
          .limit(300),
      ]);

      const allVibes = Array.isArray(vibeData) ? vibeData : [];
      const liveListings = allVibes.filter((vibe) => {
        const endTimeMs = new Date(vibe?.end_time || '').getTime();
        return !Number.isFinite(endTimeMs) || endTimeMs > now;
      });
      const archiveListings = allVibes.filter((vibe) => {
        const endTimeMs = new Date(vibe?.end_time || '').getTime();
        return Number.isFinite(endTimeMs) && endTimeMs <= now;
      });
      const collectedVibes = Array.isArray(vaultData) ? vaultData : [];

      setListings(liveListings);
      setPastAuctions(archiveListings);
      setWonVibes(collectedVibes);

      const candidateVibeIds = [...new Set((ownBidRows || []).map((row) => String(row?.vibe_id || '').trim()).filter(Boolean))];
      if (candidateVibeIds.length > 0) {
        const [{ data: allBidRows }, { data: bidVibeRows }] = await Promise.all([
          sb
            .from('vibe_bids')
            .select('vibe_id, user_id, amount, created_at')
            .in('vibe_id', candidateVibeIds)
            .order('amount', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(2500),
          sb
            .from('vibes')
            .select('slug, name, image_url, end_time, category')
            .in('slug', candidateVibeIds),
        ]);

        const highestByVibe = new Map();
        for (const row of allBidRows || []) {
          const key = String(row?.vibe_id || '').trim();
          if (!key || highestByVibe.has(key)) continue;
          highestByVibe.set(key, row);
        }

        const vibeBySlug = new Map((bidVibeRows || []).map((row) => [String(row.slug), row]));
        const leadingBids = candidateVibeIds
          .map((vibeId) => {
            const highest = highestByVibe.get(vibeId);
            const vibe = vibeBySlug.get(vibeId);
            const endTimeMs = new Date(vibe?.end_time || '').getTime();
            const isLive = !Number.isFinite(endTimeMs) || endTimeMs > now;
            if (!highest || String(highest.user_id) !== String(profileData.id) || !isLive || !vibe) return null;
            return {
              id: vibe.slug,
              slug: vibe.slug,
              name: vibe.name || 'Unknown Vibe',
              imageUrl: vibe.image_url || null,
              amount: Number(highest.amount || 0),
              status: 'Leading',
              category: vibe.category || 'Vibes',
            };
          })
          .filter(Boolean);

        setActiveProfileBids(leadingBids);
      }

      setLoading(false);
    }

    fetchProfile();
  }, [username, user]);

  useEffect(() => {
    if (!isOwnProfile) return;
    if (['overview', 'vault', 'bids', 'wallet'].includes(requestedTab)) {
      setAccountTab(requestedTab);
    }
  }, [isOwnProfile, requestedTab]);

  const avatarUrl = typeof profile?.avatar_url === 'string' ? profile.avatar_url.trim() : '';
  const avatarMonogram = String(profile?.username || username || 'V').charAt(0).toUpperCase();
  const auraBalance = Number(profile?.aura_balance || 0);
  const memberYear = profile?.created_at ? new Date(profile.created_at).getFullYear() : '—';
  const collectionValue = useMemo(
    () => wonVibes.reduce((sum, item) => sum + Number(item?.price || 0), 0),
    [wonVibes],
  );
  const spotlightCollection = useMemo(() => wonVibes.slice(0, 3), [wonVibes]);
  const topListing = useMemo(
    () =>
      [...listings].sort((a, b) => Number(b?.starting_price || 0) - Number(a?.starting_price || 0))[0] || null,
    [listings],
  );
  const latestAcquisition = useMemo(
    () =>
      [...wonVibes].sort(
        (a, b) => new Date(b?.won_date || b?.created_at || 0).getTime() - new Date(a?.won_date || a?.created_at || 0).getTime(),
      )[0] || null,
    [wonVibes],
  );
  const walletRows = useMemo(
    () => [...(Array.isArray(walletLog) ? walletLog : [])].sort((a, b) => Number(b?.createdAt || 0) - Number(a?.createdAt || 0)),
    [walletLog],
  );
  const collectorLine = isOwnProfile
    ? 'Your collector showroom: live listings, leading bids, and a vault of won vibes.'
    : 'A collector profile built from live listings, won artifacts, and visible market activity.';

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
          <div style={{ fontFamily: "'Anton', sans-serif", fontSize: '72px', color: '#242424', lineHeight: 1 }}>404</div>
          <div style={{ fontFamily: "'Anton', sans-serif", fontSize: '46px', textTransform: 'uppercase', lineHeight: 1, marginTop: '6px' }}>
            @{username}
          </div>
          <div style={{ marginTop: '10px', color: '#878787', fontSize: '16px' }}>
            This vibe has left the building. User not found.
          </div>
          <Link href="/" style={{ display: 'inline-block', marginTop: '20px', background: '#C8FF00', color: '#000000', padding: '12px 16px', textDecoration: 'none', fontWeight: 800, textTransform: 'uppercase' }}>
            Back To Market
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
                <div style={S.eyebrow}>{isOwnProfile ? 'Your Collector Showroom' : 'Collector Profile'}</div>
                <h1 style={{ ...S.handle, fontSize: isMobile ? '34px' : isTablet ? '46px' : S.handle.fontSize }}>
                  @{profile?.username ?? username}
                </h1>
                <div style={S.subhead}>{collectorLine}</div>
                <div style={S.chipRow}>
                  <div style={S.chipAccent}>{fmtAura(auraBalance)} Wallet</div>
                  <div style={S.chip}>{listings.length} Live Listings</div>
                  <div style={S.chip}>{wonVibes.length} Collected</div>
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
                      <div style={{ ...S.avatarStatus, color: avatarError ? '#FF9A9A' : '#DFFF7B' }}>{avatarError || avatarMessage}</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <aside style={S.spotlightPanel}>
              <div style={S.panelLabel}>Spotlight Collection</div>
              {spotlightCollection.length === 0 ? (
                <div style={{ color: '#5F5F5F', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  No spotlight pieces yet
                </div>
              ) : (
                <div style={{ ...S.spotlightGrid, gridTemplateColumns: isMobile ? 'repeat(3, minmax(0, 1fr))' : S.spotlightGrid.gridTemplateColumns }}>
                  {spotlightCollection.map((entry, index) => (
                    <div key={entry.id || index} style={S.spotlightCard}>
                      <MediaThumb
                        src={entry.image_url}
                        alt={entry.name || 'Vibe'}
                        style={S.spotlightThumb}
                        fallbackStyle={S.spotlightFallback}
                      />
                      <div style={S.spotlightName}>{entry.name || 'Unknown Vibe'}</div>
                    </div>
                  ))}
                </div>
              )}
            </aside>
          </div>
        </section>

        {isOwnProfile ? (
          <div style={S.ownerBanner}>
            This is your display case. Use the tabs below to move between your overview, collection, leading bids, and wallet activity.
          </div>
        ) : null}

        <div style={{ ...S.metricGrid, gridTemplateColumns: isMobile ? 'repeat(2, minmax(0, 1fr))' : S.metricGrid.gridTemplateColumns }}>
          {[
            { label: 'Live Listings', value: listings.length, color: '#FFFFFF' },
            { label: 'Collection Value', value: fmtAura(collectionValue), color: '#C8FF00' },
            { label: 'Leading Bids', value: activeProfileBids.length, color: '#9DDBFF' },
            { label: 'Archived Listings', value: pastAuctions.length, color: '#E2E2E2' },
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
            <div style={S.digestLabel}>{isOwnProfile ? 'Your Market Snapshot' : 'Collector Snapshot'}</div>
            <div style={{ ...S.digestTitle, fontSize: isMobile ? '32px' : S.digestTitle.fontSize }}>
              {topListing ? topListing.name || 'Top Listing' : latestAcquisition ? latestAcquisition.name || 'Fresh Pickup' : `@${profile?.username ?? username}`}
            </div>
            <div style={S.digestText}>
              {topListing
                ? `Highest priced live listing in this showroom, currently posted at ${fmtAura(topListing.starting_price || 0)}.`
                : latestAcquisition
                  ? `Latest piece added to the vault, acquired ${fmtDate(latestAcquisition.won_date || latestAcquisition.created_at)}.`
                  : 'This profile is set up and ready for its first meaningful market move.'}
            </div>
            <div style={S.digestMetaRow}>
              <div style={S.digestMetaChip}>{fmtAura(auraBalance)} wallet</div>
              <div style={S.digestMetaChip}>{listings.length} live listings</div>
              <div style={S.digestMetaChip}>{wonVibes.length} vault pieces</div>
              <div style={S.digestMetaChip}>{activeProfileBids.length} leading bids</div>
            </div>
          </div>

          <div style={S.digestSide}>
            <div style={S.digestMiniCard}>
              <div style={S.digestMiniLabel}>Best Live Ask</div>
              <div style={{ ...S.digestMiniValue, color: '#C8FF00' }}>
                {topListing ? fmtAura(topListing.starting_price || 0) : 'None'}
              </div>
              <div style={S.digestMiniText}>
                {topListing ? `${topListing.name || 'Unknown Vibe'} is the anchor listing in this profile.` : 'No live listings are posted right now.'}
              </div>
            </div>

            <div style={S.digestMiniCard}>
              <div style={S.digestMiniLabel}>Latest Vault Add</div>
              <div style={{ ...S.digestMiniValue, fontSize: isMobile ? '22px' : S.digestMiniValue.fontSize }}>
                {latestAcquisition ? latestAcquisition.name || 'Unknown Vibe' : 'Empty Vault'}
              </div>
              <div style={S.digestMiniText}>
                {latestAcquisition ? `${fmtAura(latestAcquisition.price || 0)} collected on ${fmtDate(latestAcquisition.won_date || latestAcquisition.created_at)}.` : 'No won vibes have been added to the collection yet.'}
              </div>
            </div>
          </div>
        </section>

        {isOwnProfile ? (
          <div style={S.tabBar}>
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'vault', label: 'Collection' },
              { id: 'bids', label: 'Leading Bids' },
              { id: 'wallet', label: 'Wallet' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setAccountTab(tab.id)}
                style={accountTab === tab.id ? S.tabActive : S.tab}
              >
                {tab.label}
              </button>
            ))}
          </div>
        ) : null}

        {(!isOwnProfile || accountTab === 'overview') && (
          <div style={{ ...S.body, gridTemplateColumns: isTablet ? '1fr' : S.body.gridTemplateColumns }}>
            <div style={{ display: 'grid', gap: '18px' }}>
              <Section title="Live Listings" meta={loading ? 'Loading' : `${listings.length} active`}>
                {loading ? (
                  <div style={S.empty}>Loading profile...</div>
                ) : listings.length === 0 ? (
                  <div style={S.empty}>No live listings right now</div>
                ) : (
                  <div style={S.stack}>
                    {listings.map((listing) => (
                      <Link key={listing.id} href={`/auction/${listing.slug || listing.id}`} style={S.rowLink}>
                        <MediaThumb src={listing.image_url} alt={listing.name || 'Vibe'} style={S.thumb} fallbackStyle={S.thumbFallback} />
                        <div style={{ minWidth: 0 }}>
                          <div style={S.rowTitle}>{listing.name || 'Unknown Vibe'}</div>
                          <div style={S.rowSub}>{listing.category || 'Vibes'}</div>
                        </div>
                        <div style={S.rowMeta}>
                          <div style={S.rowPrice}>{fmtAura(listing.starting_price || 0)}</div>
                          <div style={S.rowStatus}>Live</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </Section>

              <Section title="Archive" meta={loading ? 'Loading' : `${pastAuctions.length} archived`}>
                {loading ? (
                  <div style={S.empty}>Loading archive...</div>
                ) : pastAuctions.length === 0 ? (
                  <div style={S.empty}>No archived listings yet</div>
                ) : (
                  <div style={S.stack}>
                    {pastAuctions.map((listing) => (
                      <Link key={listing.id} href={`/auction/${listing.slug || listing.id}`} style={S.rowLink}>
                        <MediaThumb src={listing.image_url} alt={listing.name || 'Vibe'} style={S.thumb} fallbackStyle={S.thumbFallback} />
                        <div style={{ minWidth: 0 }}>
                          <div style={S.rowTitle}>{listing.name || 'Unknown Vibe'}</div>
                          <div style={S.rowSub}>{fmtDate(listing.created_at)}</div>
                        </div>
                        <div style={S.rowMeta}>
                          <div style={S.rowPrice}>{fmtAura(listing.starting_price || 0)}</div>
                          <div style={S.rowStatus}>Archived</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </Section>
            </div>

            <div style={{ display: 'grid', gap: '18px' }}>
              <Section title="Collection Vault" meta={loading ? 'Loading' : `${wonVibes.length} owned`}>
                {loading ? (
                  <div style={S.empty}>Loading collection...</div>
                ) : wonVibes.length === 0 ? (
                  <div style={S.empty}>No collected vibes yet</div>
                ) : (
                  <div style={{ ...S.collectionGrid, gridTemplateColumns: isMobile ? 'repeat(2, minmax(0, 1fr))' : S.collectionGrid.gridTemplateColumns }}>
                    {wonVibes.slice(0, 6).map((entry, index) => (
                      <div key={entry.id || index} style={S.collectibleCard}>
                        <MediaThumb src={entry.image_url} alt={entry.name || 'Vibe'} style={{ ...S.spotlightThumb, height: isMobile ? '96px' : '120px' }} fallbackStyle={{ ...S.spotlightFallback, height: isMobile ? '96px' : '120px' }} />
                        <div style={S.collectibleName}>{entry.name || 'Unknown Vibe'}</div>
                        <div style={S.collectibleValue}>{fmtAura(entry.price || 0)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </Section>

              <Section title="Market Position" meta={loading ? 'Loading' : `${activeProfileBids.length} live leads`}>
                {loading ? (
                  <div style={S.empty}>Loading bids...</div>
                ) : activeProfileBids.length === 0 ? (
                  <div style={S.empty}>No leading bids right now</div>
                ) : (
                  <div style={S.stack}>
                    {activeProfileBids.slice(0, 4).map((bid, index) => (
                      <Link key={bid.id || index} href={`/auction/${bid.slug || bid.id}`} style={S.rowLink}>
                        <MediaThumb src={bid.imageUrl} alt={bid.name || 'Vibe'} style={S.thumb} fallbackStyle={S.thumbFallback} />
                        <div style={{ minWidth: 0 }}>
                          <div style={S.rowTitle}>{bid.name || 'Unknown Vibe'}</div>
                          <div style={S.rowSub}>{bid.category || 'Vibes'}</div>
                        </div>
                        <div style={S.rowMeta}>
                          <div style={S.rowPrice}>{fmtAura(bid.amount || 0)}</div>
                          <div style={S.rowStatus}>Leading</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </Section>
            </div>
          </div>
        )}

        {isOwnProfile && accountTab === 'vault' && (
          <Section title="Collection Vault" meta={`${wonVibes.length} owned`}>
            {wonVibes.length === 0 ? (
              <div style={S.empty}>No collected vibes yet</div>
            ) : (
              <div style={{ ...S.collectionGrid, gridTemplateColumns: isMobile ? 'repeat(2, minmax(0, 1fr))' : 'repeat(3, minmax(0, 1fr))' }}>
                {wonVibes.map((entry, index) => (
                  <div key={entry.id || index} style={S.collectibleCard}>
                    <MediaThumb src={entry.image_url} alt={entry.name || 'Vibe'} style={{ ...S.spotlightThumb, height: isMobile ? '110px' : '140px' }} fallbackStyle={{ ...S.spotlightFallback, height: isMobile ? '110px' : '140px' }} />
                    <div style={S.collectibleName}>{entry.name || 'Unknown Vibe'}</div>
                    <div style={S.collectibleValue}>{fmtAura(entry.price || 0)}</div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        )}

        {isOwnProfile && accountTab === 'bids' && (
          <Section title="Leading Bids" meta={`${activeProfileBids.length} live leads`}>
            {activeProfileBids.length === 0 ? (
              <div style={S.empty}>You are not leading any live bids right now</div>
            ) : (
              <div style={S.stack}>
                {activeProfileBids.map((bid, index) => (
                  <Link key={bid.id || index} href={`/auction/${bid.slug || bid.id}`} style={S.rowLink}>
                    <MediaThumb src={bid.imageUrl} alt={bid.name || 'Vibe'} style={S.thumb} fallbackStyle={S.thumbFallback} />
                    <div style={{ minWidth: 0 }}>
                      <div style={S.rowTitle}>{bid.name || 'Unknown Vibe'}</div>
                      <div style={S.rowSub}>{bid.category || 'Vibes'}</div>
                    </div>
                    <div style={S.rowMeta}>
                      <div style={S.rowPrice}>{fmtAura(bid.amount || 0)}</div>
                      <div style={S.rowStatus}>Leading</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Section>
        )}

        {isOwnProfile && accountTab === 'wallet' && (
          <Section title="Wallet Activity" meta={fmtAura(privateBalance || 0)}>
            {walletRows.length === 0 ? (
              <div style={S.empty}>No wallet activity yet</div>
            ) : (
              <div>
                {walletRows.map((entry) => (
                  <div key={entry.id || `${entry.label}-${entry.createdAt}`} style={S.walletRow}>
                    <div>
                      <div style={S.walletLabel}>{entry.label || 'Transaction'}</div>
                      <div style={S.walletDate}>{entry.createdAt ? fmtDate(entry.createdAt) : 'Unknown date'}</div>
                    </div>
                    <div style={S.walletAmt}>{fmtAura(entry.amount || 0)}</div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        )}
      </div>
    </div>
  );
}
