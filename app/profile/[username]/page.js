'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useAuth } from '../../state/auth-store';
import { getSupabaseClient } from '../../../lib/supabase-client';

const S = {
  page: {
    background: '#0D0D0D',
    minHeight: '100dvh',
    fontFamily: "'Inter', sans-serif",
    color: '#FFFFFF',
    WebkitFontSmoothing: 'antialiased',
    overflowX: 'hidden',
  },
  header: {
    background: '#000000',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    borderBottom: '2px solid #C8FF00',
  },
  logo: {
    fontFamily: "'Anton', sans-serif",
    fontSize: '24px',
    textTransform: 'uppercase',
    color: '#C8FF00',
    textDecoration: 'none',
  },
  navLinks: { display: 'flex', gap: '24px' },
  navItem: {
    fontWeight: 700,
    fontSize: '14px',
    color: '#FFFFFF',
    textDecoration: 'none',
    textTransform: 'uppercase',
  },
  heroBanner: {
    position: 'relative',
    height: '220px',
    overflow: 'hidden',
    background: '#000000',
  },
  heroDiag: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(108deg, #000000 52%, #C8FF00 52.1%)',
  },
  heroInner: {
    position: 'relative',
    zIndex: 10,
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 32px',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '28px',
  },
  avatar: {
    width: '110px',
    height: '110px',
    background: '#C8FF00',
    border: '4px solid #FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '58px',
    flexShrink: 0,
    transform: 'rotate(-3deg)',
    boxShadow: '8px 8px 0px rgba(0,0,0,0.4)',
  },
  heroText: { display: 'flex', flexDirection: 'column', gap: '4px' },
  handle: {
    fontFamily: "'Anton', sans-serif",
    fontSize: '52px',
    lineHeight: 0.95,
    textTransform: 'uppercase',
    color: '#FFFFFF',
    textShadow: '3px 3px 0px #000000',
  },
  bio: {
    fontSize: '14px',
    color: '#CCCCCC',
    maxWidth: '420px',
    marginTop: '6px',
    lineHeight: 1.5,
  },
  repBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    background: '#000000',
    color: '#C8FF00',
    border: '1px solid #C8FF00',
    padding: '3px 10px',
    fontSize: '12px',
    fontWeight: 800,
    textTransform: 'uppercase',
    marginTop: '6px',
    width: 'fit-content',
  },
  statsBar: {
    background: '#111111',
    borderBottom: '2px solid #1E1E1E',
    display: 'flex',
  },
  statCell: {
    flex: 1,
    padding: '20px 24px',
    borderRight: '1px solid #1E1E1E',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  statValue: {
    fontFamily: "'Anton', sans-serif",
    fontSize: '32px',
    color: '#C8FF00',
    lineHeight: 1,
  },
  statLabel: {
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: '#666666',
  },
  body: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '32px 32px 64px',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '32px',
    alignItems: 'start',
  },
  sectionTitle: {
    fontFamily: "'Anton', sans-serif",
    fontSize: '28px',
    textTransform: 'uppercase',
    color: '#C8FF00',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  card: {
    background: '#111111',
    border: '2px solid #1E1E1E',
    borderRadius: '6px',
    overflow: 'hidden',
  },
  listingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '14px 16px',
    borderBottom: '1px solid #1A1A1A',
    cursor: 'pointer',
    transition: 'background 0.15s',
    textDecoration: 'none',
    color: 'inherit',
  },
  listingEmoji: {
    fontSize: '32px',
    flexShrink: 0,
    width: '44px',
    textAlign: 'center',
  },
  listingName: {
    fontFamily: "'Anton', sans-serif",
    fontSize: '18px',
    textTransform: 'uppercase',
    color: '#FFFFFF',
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  listingMeta: {
    textAlign: 'right',
    flexShrink: 0,
  },
  listingBid: {
    fontFamily: "'Anton', sans-serif",
    fontSize: '16px',
    color: '#C8FF00',
  },
  listingTimer: {
    fontSize: '11px',
    color: '#666',
    fontWeight: 700,
  },
  wonGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    padding: '16px',
  },
  wonCard: {
    background: '#0D0D0D',
    border: '1px solid #2A2A2A',
    borderRadius: '6px',
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    textAlign: 'center',
  },
  wonEmoji: { fontSize: '36px' },
  wonName: {
    fontFamily: "'Anton', sans-serif",
    fontSize: '13px',
    textTransform: 'uppercase',
    color: '#FFFFFF',
    lineHeight: 1.1,
  },
  wonPrice: {
    fontSize: '11px',
    color: '#C8FF00',
    fontWeight: 700,
  },
  ratingsSection: {
    gridColumn: '1 / -1',
  },
  ratingHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '16px',
  },
  bigScore: {
    fontFamily: "'Anton', sans-serif",
    fontSize: '64px',
    lineHeight: 1,
    color: '#C8FF00',
  },
  starRow: {
    display: 'flex',
    gap: '4px',
    fontSize: '24px',
  },
  ratingCount: {
    fontSize: '13px',
    color: '#666',
    fontWeight: 700,
    textTransform: 'uppercase',
  },
  reviewCard: {
    background: '#111111',
    border: '1px solid #1E1E1E',
    padding: '16px',
    borderRadius: '6px',
  },
  reviewMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  reviewHandle: {
    fontWeight: 700,
    fontSize: '13px',
    color: '#C8FF00',
  },
  reviewStars: { fontSize: '14px', letterSpacing: '1px' },
  reviewText: {
    fontSize: '14px',
    color: '#CCCCCC',
    lineHeight: 1.6,
  },
  emptyState: {
    padding: '32px 16px',
    textAlign: 'center',
    color: '#444',
    fontWeight: 700,
    textTransform: 'uppercase',
    fontSize: '13px',
  },
  notFound: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    gap: '16px',
    textAlign: 'center',
    padding: '32px',
  },
  ownProfileBanner: {
    background: 'rgba(200,255,0,0.08)',
    border: '1px solid rgba(200,255,0,0.3)',
    color: '#C8FF00',
    padding: '10px 24px',
    fontSize: '13px',
    fontWeight: 700,
    textTransform: 'uppercase',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
};

const STARS = (score) => {
  const full = Math.round(score);
  return '★'.repeat(full) + '☆'.repeat(5 - full);
};

const MOCK_REVIEWS = [
  { id: 1, rater: '@VibeCheck', stars: 5, text: 'Absolute legend. Delivered the vibe exactly as described. 10/10 would bid against again.' },
  { id: 2, rater: '@MoodRing99', stars: 4, text: 'Solid seller. The Monday Optimism was a bit stale but still usable.' },
  { id: 3, rater: '@DeepFeels', stars: 5, text: 'The Unearned Confidence vibe changed my life. No notes.' },
];

export default function ProfilePage() {
  const { username } = useParams();
  const pathname = usePathname();
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [listings, setListings] = useState([]);
  const [pastAuctions, setPastAuctions] = useState([]);
  const [wonVibes, setWonVibes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [navHover, setNavHover] = useState('');

  const isMobile = viewportWidth <= 768;
  const isTablet = viewportWidth <= 1024;

  const isOwnProfile = user?.user_metadata?.username === username ||
    user?.email?.split('@')[0] === username;

  const navItems = [
    { label: 'Browse Vibes', href: '/' },
    { label: 'Sell a Feeling', href: '/mint' },
    { label: 'Leaderboard', href: '/leaderboard' },
    { label: 'Vibe Vault', href: '/vault' },
  ];

  useEffect(() => {
    const update = () => setViewportWidth(window.innerWidth);
    update();
    window.addEventListener('resize', update);

    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;700;800&display=swap');
      *, *::before, *::after { box-sizing: border-box; }
      body { margin: 0; background: #0D0D0D; overflow-x: hidden; }
    `;
    document.head.appendChild(style);
    return () => {
      window.removeEventListener('resize', update);
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    if (!username) return;

    async function fetchProfile() {
      setLoading(true);
      const sb = getSupabaseClient();

      if (sb) {
        const { data: userData, error } = await sb
          .from('users')
          .select('*')
          .eq('username', username)
          .single();

        if (error || !userData) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        setProfile(userData);

        const { data: auctionData } = await sb
          .from('auctions')
          .select('id, title, description, current_price, starting_price, end_time, status')
          .eq('seller_id', userData.id)
          .eq('status', 'active')
          .order('end_time', { ascending: true })
          .limit(6);

        setListings(auctionData || []);

        const { data: pastData } = await sb
          .from('auctions')
          .select('id, title, current_price, starting_price, end_time, status')
          .eq('seller_id', userData.id)
          .in('status', ['completed', 'cancelled'])
          .order('end_time', { ascending: false })
          .limit(20);

        setPastAuctions(pastData || []);

        const { data: bidData } = await sb
          .from('bids')
          .select('amount, auctions(id, title, status)')
          .eq('bidder_id', userData.id)
          .order('created_at', { ascending: false })
          .limit(8);

        const won = (bidData || []).filter((b) => b.auctions?.status === 'completed');
        setWonVibes(won);
      } else {
        // No Supabase — show mock profile matching the username
        setProfile({
          username,
          display_name: username,
          bio: 'Collector of rare emotional states and intangible sensations. Bidding since the beginning of vibes.',
          reputation: 4.7,
          created_at: '2024-01-15T00:00:00Z',
        });
        setListings([]);
        setPastAuctions([]);
        setWonVibes([]);
      }

      setLoading(false);
    }

    fetchProfile();
  }, [username]);

  const repScore = profile?.reputation ?? 0;
  const memberYear = profile?.created_at ? new Date(profile.created_at).getFullYear() : '—';
  const avatarEmojis = ['🕶️', '👾', '🌀', '🔮', '🎭', '🦋', '⚡', '🌊'];
  const avatarEmoji = avatarEmojis[(username?.charCodeAt(0) ?? 0) % avatarEmojis.length];

  if (!loading && notFound) {
    return (
      <div style={S.page}>
        <header style={{ ...S.header, height: isMobile ? '56px' : '60px', padding: isMobile ? '0 16px' : '0 24px' }}>
          <Link href="/" style={{ ...S.logo, fontSize: isMobile ? '18px' : '24px' }}>Vibe Auction</Link>
        </header>
        <div style={S.notFound}>
          <div style={{ fontSize: '64px' }}>👻</div>
          <h1 style={{ fontFamily: "'Anton', sans-serif", fontSize: '48px', textTransform: 'uppercase', color: '#C8FF00' }}>
            @{username}
          </h1>
          <p style={{ color: '#666', fontSize: '16px' }}>This vibe has left the building. User not found.</p>
          <Link href="/" style={{ background: '#C8FF00', color: '#000', padding: '12px 24px', fontWeight: 800, fontSize: '14px', textTransform: 'uppercase', textDecoration: 'none' }}>
            Back to Auction
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      <style>{`*, *::before, *::after { box-sizing: border-box; } html, body { overflow-x: hidden; }`}</style>

      {/* Header */}
      <header style={{ ...S.header, height: isMobile ? '56px' : '60px', padding: isMobile ? '0 16px' : '0 24px' }}>
        <Link href="/" style={{ ...S.logo, fontSize: isMobile ? '18px' : '24px' }}>Vibe Auction</Link>
        {!isMobile && (
          <nav style={S.navLinks}>
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                style={{ ...S.navItem, color: navHover === item.label || pathname === item.href ? '#C8FF00' : '#FFFFFF' }}
                onMouseEnter={() => setNavHover(item.label)}
                onMouseLeave={() => setNavHover('')}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
        {user && (
          <Link href="/vault" style={{ background: '#C8FF00', color: '#000', padding: '4px 12px', fontWeight: 800, fontSize: '12px', textTransform: 'uppercase', textDecoration: 'none', borderRadius: '4px', whiteSpace: 'nowrap' }}>
            My Vault
          </Link>
        )}
      </header>

      {/* Own profile banner */}
      {isOwnProfile && (
        <div style={S.ownProfileBanner}>
          👁 This is your public profile — <Link href="/vault" style={{ color: '#C8FF00', textDecoration: 'underline' }}>go to your vault</Link>
        </div>
      )}

      {/* Hero */}
      <section style={{ ...S.heroBanner, height: isMobile ? '170px' : '220px' }}>
        <div style={S.heroDiag} />
        <div style={{
          ...S.heroInner,
          padding: isMobile ? '0 16px' : '0 32px',
          gap: isMobile ? '16px' : '28px',
        }}>
          {loading ? (
            <div style={{ ...S.avatar, width: isMobile ? '72px' : '110px', height: isMobile ? '72px' : '110px', fontSize: isMobile ? '36px' : '58px', background: '#222', border: '4px solid #333' }} />
          ) : (
            <div style={{ ...S.avatar, width: isMobile ? '72px' : '110px', height: isMobile ? '72px' : '110px', fontSize: isMobile ? '36px' : '58px' }}>
              {avatarEmoji}
            </div>
          )}
          <div style={S.heroText}>
            {loading ? (
              <div style={{ width: '240px', height: '48px', background: '#222', borderRadius: '4px' }} />
            ) : (
              <>
                <h1 style={{ ...S.handle, fontSize: isMobile ? '28px' : isTablet ? '40px' : '52px' }}>
                  @{profile?.username ?? username}
                </h1>
                {profile?.bio && (
                  <p style={{ ...S.bio, fontSize: isMobile ? '12px' : '14px', display: isMobile ? 'none' : 'block' }}>
                    {profile.bio}
                  </p>
                )}
                {repScore > 0 && (
                  <span style={{ ...S.repBadge, fontSize: isMobile ? '10px' : '12px' }}>
                    ★ {repScore.toFixed(1)} Rep
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <div style={{
        ...S.statsBar,
        flexDirection: isMobile ? 'row' : 'row',
        flexWrap: isMobile ? 'wrap' : 'nowrap',
      }}>
        {[
          { label: 'Vibes Won', value: loading ? '—' : wonVibes.length || '0' },
          { label: 'Vibes Created', value: loading ? '—' : (listings.length + pastAuctions.length) || '0' },
          { label: 'Reputation', value: loading ? '—' : repScore > 0 ? repScore.toFixed(1) : 'New' },
          { label: 'Member Since', value: loading ? '—' : memberYear },
        ].map((stat, i, arr) => (
          <div
            key={stat.label}
            style={{
              ...S.statCell,
              flex: isMobile ? '1 1 50%' : 1,
              borderRight: isMobile ? (i % 2 === 1 ? 'none' : '1px solid #1E1E1E') : (i === arr.length - 1 ? 'none' : '1px solid #1E1E1E'),
              borderBottom: isMobile && i < 2 ? '1px solid #1E1E1E' : 'none',
              padding: isMobile ? '14px 16px' : '20px 24px',
            }}
          >
            <span style={{ ...S.statValue, fontSize: isMobile ? '24px' : '32px' }}>{stat.value}</span>
            <span style={S.statLabel}>{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Bio on mobile (hidden in hero) */}
      {isMobile && profile?.bio && (
        <div style={{ padding: '16px', background: '#111', borderBottom: '1px solid #1A1A1A', fontSize: '13px', color: '#AAAAAA', lineHeight: 1.6 }}>
          {profile.bio}
        </div>
      )}

      {/* Main content */}
      <div style={{
        ...S.body,
        gridTemplateColumns: isTablet ? '1fr' : '1fr 1fr',
        padding: isMobile ? '20px 14px 48px' : isTablet ? '24px 24px 48px' : '32px 32px 64px',
        gap: isMobile ? '24px' : '32px',
      }}>

        {/* Active Listings */}
        <section>
          <div style={S.sectionTitle}>
            <span>🔥</span>
            <span style={{ fontSize: isMobile ? '22px' : '28px' }}>Active Listings</span>
          </div>
          <div style={S.card}>
            {loading ? (
              <div style={S.emptyState}>Loading...</div>
            ) : listings.length === 0 ? (
              <div style={S.emptyState}>No active listings right now</div>
            ) : (
              listings.map((listing) => {
                const price = listing.current_price ?? listing.starting_price;
                const endTime = listing.end_time ? new Date(listing.end_time) : null;
                const hoursLeft = endTime ? Math.max(0, Math.round((endTime - Date.now()) / 3600000)) : null;
                return (
                  <Link
                    key={listing.id}
                    href={`/auction/${listing.id}`}
                    style={{
                      ...S.listingRow,
                      textDecoration: 'none',
                    }}
                  >
                    <span style={S.listingEmoji}>🌀</span>
                    <span style={S.listingName}>{listing.title}</span>
                    <div style={S.listingMeta}>
                      <div style={S.listingBid}>{Number(price).toLocaleString()} AURA</div>
                      {hoursLeft !== null && (
                        <div style={S.listingTimer}>{hoursLeft}h left</div>
                      )}
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </section>

        {/* Vibe Collection */}
        <section>
          <div style={S.sectionTitle}>
            <span>🏆</span>
            <span style={{ fontSize: isMobile ? '22px' : '28px' }}>Vibe Collection</span>
          </div>
          <div style={S.card}>
            {loading ? (
              <div style={S.emptyState}>Loading...</div>
            ) : wonVibes.length === 0 ? (
              <div style={S.emptyState}>No vibes collected yet</div>
            ) : (
              <div style={{ ...S.wonGrid, gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr', padding: '14px' }}>
                {wonVibes.map((entry, i) => (
                  <div key={i} style={S.wonCard}>
                    <span style={S.wonEmoji}>✨</span>
                    <span style={S.wonName}>{entry.auctions?.title ?? 'Unknown Vibe'}</span>
                    <span style={S.wonPrice}>{Number(entry.amount).toLocaleString()} AURA</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Past Auctions — full width */}
        <section style={{ gridColumn: isTablet ? 'auto' : '1 / -1' }}>
          <div style={S.sectionTitle}>
            <span>📦</span>
            <span style={{ fontSize: isMobile ? '22px' : '28px' }}>Past Auctions</span>
            {!loading && pastAuctions.length > 0 && (
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 700, color: '#555', textTransform: 'none', marginLeft: 'auto' }}>
                {pastAuctions.length} total
              </span>
            )}
          </div>
          <div style={S.card}>
            {loading ? (
              <div style={S.emptyState}>Loading...</div>
            ) : pastAuctions.length === 0 ? (
              <div style={S.emptyState}>No past auctions yet</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: isTablet ? '1fr' : '1fr 1fr 1fr', gap: 0 }}>
                {pastAuctions.map((auction, i) => {
                  const finalPrice = auction.current_price ?? auction.starting_price;
                  const soldDate = auction.end_time ? new Date(auction.end_time).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—';
                  const isCompleted = auction.status === 'completed';
                  return (
                    <div
                      key={auction.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 16px',
                        borderBottom: '1px solid #1A1A1A',
                        borderRight: !isTablet && (i + 1) % 3 !== 0 ? '1px solid #1A1A1A' : 'none',
                      }}
                    >
                      <span style={{ fontSize: '24px', flexShrink: 0, width: '32px', textAlign: 'center' }}>
                        {isCompleted ? '✅' : '❌'}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "'Anton', sans-serif", fontSize: '15px', textTransform: 'uppercase', color: '#FFFFFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {auction.title}
                        </div>
                        <div style={{ fontSize: '11px', color: '#555', fontWeight: 700, textTransform: 'uppercase', marginTop: '2px' }}>
                          {soldDate}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontFamily: "'Anton', sans-serif", fontSize: '14px', color: isCompleted ? '#C8FF00' : '#555' }}>
                          {isCompleted ? `${Number(finalPrice).toLocaleString()} AURA` : 'Cancelled'}
                        </div>
                        <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: isCompleted ? '#3a5a00' : '#3a2000', background: isCompleted ? 'rgba(200,255,0,0.1)' : 'rgba(255,100,0,0.1)', padding: '1px 6px', borderRadius: '99px', marginTop: '2px' }}>
                          {isCompleted ? 'Sold' : 'Cancelled'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Ratings */}
        <section style={S.ratingsSection}>
          <div style={S.sectionTitle}>
            <span>⭐</span>
            <span style={{ fontSize: isMobile ? '22px' : '28px' }}>Reputation</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={S.ratingHeader}>
              <span style={{ ...S.bigScore, fontSize: isMobile ? '48px' : '64px' }}>
                {repScore > 0 ? repScore.toFixed(1) : '—'}
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ ...S.starRow, fontSize: isMobile ? '18px' : '24px' }}>
                  {repScore > 0 ? STARS(repScore) : '☆☆☆☆☆'}
                </div>
                <span style={S.ratingCount}>
                  {MOCK_REVIEWS.length} reviews
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isTablet ? '1fr' : '1fr 1fr 1fr', gap: '12px' }}>
              {MOCK_REVIEWS.map((review) => (
                <div key={review.id} style={S.reviewCard}>
                  <div style={S.reviewMeta}>
                    <span style={S.reviewHandle}>{review.rater}</span>
                    <span style={S.reviewStars}>{'★'.repeat(review.stars)}{'☆'.repeat(5 - review.stars)}</span>
                  </div>
                  <p style={S.reviewText}>{review.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
