'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../state/auth-store';
import { getSupabaseClient } from '../../lib/supabase-client';
import { VIBE_REACTION_OPTIONS } from '../../lib/vibe-social.js';
import { COLORS, RADIUS, GLOW } from '../../lib/design-tokens.js';

const PAGE_SIZE = 30;

const S = {
  wrap: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '24px 16px 64px',
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
  },
  tab: (active) => ({
    background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
    color: active ? '#FFFFFF' : COLORS.textMuted,
    border: active ? `1px solid ${COLORS.borderStrong}` : `1px solid ${COLORS.border}`,
    padding: '7px 18px',
    borderRadius: RADIUS.pill,
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
  }),
  masonry: {
    columnGap: '20px',
  },
  card: {
    border: `1px solid ${COLORS.border}`,
    background: COLORS.cardFill,
    borderRadius: RADIUS.card,
    overflow: 'hidden',
    marginBottom: '20px',
    breakInside: 'avoid',
    display: 'inline-block',
    width: '100%',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
  },
  authorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  avatar: (isAgent) => ({
    width: '30px',
    height: '30px',
    borderRadius: '999px',
    background: isAgent ? COLORS.accent : 'rgba(255,255,255,0.1)',
    color: isAgent ? '#000000' : COLORS.fg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: 700,
    flexShrink: 0,
  }),
  authorName: {
    fontWeight: 600,
    fontSize: '14px',
    color: COLORS.fg,
    textDecoration: 'none',
  },
  agentBadge: {
    background: COLORS.accent,
    color: '#000000',
    fontSize: '10px',
    fontWeight: 700,
    padding: '2px 7px',
    borderRadius: RADIUS.chip,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  followBtn: {
    background: 'transparent',
    border: `1px solid ${COLORS.borderStrong}`,
    color: '#e5e5e5',
    fontSize: '12px',
    fontWeight: 600,
    padding: '5px 14px',
    borderRadius: RADIUS.pill,
    cursor: 'pointer',
  },
  followBtnActive: {
    background: COLORS.accent,
    color: '#000000',
    border: 'none',
  },
  image: {
    width: '100%',
    display: 'block',
    height: 'auto',
    maxHeight: '520px',
    objectFit: 'cover',
    background: COLORS.bgElevated,
  },
  body: {
    padding: '16px',
  },
  name: {
    fontWeight: 700,
    fontSize: '17px',
    letterSpacing: '-0.005em',
    marginBottom: '5px',
  },
  manifesto: {
    color: COLORS.textMuted,
    fontSize: '14px',
    lineHeight: 1.5,
    marginBottom: '14px',
  },
  reactionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  pillGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    background: 'rgba(255,255,255,0.03)',
    border: `1px solid ${COLORS.border}`,
    borderRadius: RADIUS.pill,
    padding: '3px',
  },
  reactionBtn: (active) => ({
    background: active ? 'rgba(139,92,246,0.18)' : 'transparent',
    border: 'none',
    color: active ? COLORS.accent : COLORS.textMuted,
    fontSize: '14px',
    width: '30px',
    height: '30px',
    borderRadius: RADIUS.pill,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }),
  commentLink: {
    marginLeft: 'auto',
    color: COLORS.textFaint,
    fontSize: '13px',
    textDecoration: 'none',
    fontWeight: 600,
  },
  empty: {
    border: `1px dashed ${COLORS.border}`,
    borderRadius: RADIUS.card,
    padding: '48px 24px',
    textAlign: 'center',
    color: COLORS.textFaint,
  },
};

export default function Feed() {
  const { user } = useAuth();
  const [tab, setTab] = useState('all');
  const [vibes, setVibes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [followingIds, setFollowingIds] = useState(() => new Set());
  const sentinelRef = useRef(null);

  const getAccessToken = useCallback(async () => {
    const sb = getSupabaseClient();
    if (!sb) return null;
    const { data } = await sb.auth.getSession();
    return data?.session?.access_token ?? null;
  }, []);

  const fetchPage = useCallback(async (offset) => {
    const token = await getAccessToken();
    const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) });
    if (tab === 'following') params.set('following', '1');
    const res = await fetch(`/api/state/feed?${params.toString()}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: 'no-store',
    });
    return res.json();
  }, [tab, getAccessToken]);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPage(0);
      setVibes(Array.isArray(data?.vibes) ? data.vibes : []);
      setHasMore(Boolean(data?.hasMore));
    } catch {
      setVibes([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const data = await fetchPage(vibes.length);
      const nextVibes = Array.isArray(data?.vibes) ? data.vibes : [];
      setVibes((prev) => [...prev, ...nextVibes]);
      setHasMore(Boolean(data?.hasMore));
    } finally {
      setLoadingMore(false);
    }
  }, [fetchPage, vibes.length, loadingMore, hasMore]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) loadMore();
    }, { rootMargin: '600px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMore]);

  const toggleReactionLocally = (slug, reactionType) => {
    setVibes((prev) => prev.map((v) => {
      if (v.slug !== slug) return v;
      const hasIt = v.viewerReactions.includes(reactionType);
      return {
        ...v,
        reactionCount: Math.max(0, v.reactionCount + (hasIt ? -1 : 1)),
        viewerReactions: hasIt
          ? v.viewerReactions.filter((r) => r !== reactionType)
          : [...v.viewerReactions, reactionType],
      };
    }));
  };

  const handleReact = async (vibe, reactionType) => {
    const token = await getAccessToken();
    if (!token) return;

    // Flip it locally first so the click feels instant, then reconcile with the server.
    toggleReactionLocally(vibe.slug, reactionType);

    try {
      const res = await fetch('/api/state/vibe-social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reaction: { vibeId: vibe.slug, vibeName: vibe.name, reactionType } }),
      });
      const data = await res.json();
      if (!data?.accepted) toggleReactionLocally(vibe.slug, reactionType); // roll back
    } catch {
      toggleReactionLocally(vibe.slug, reactionType); // roll back
    }
  };

  const handleFollow = async (listedBy) => {
    const token = await getAccessToken();
    if (!token) return;
    const isFollowing = followingIds.has(listedBy);
    await fetch('/api/state/follow', {
      method: isFollowing ? 'DELETE' : 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ userId: listedBy }),
    });
    setFollowingIds((prev) => {
      const next = new Set(prev);
      if (isFollowing) next.delete(listedBy); else next.add(listedBy);
      return next;
    });
  };

  return (
    <div style={S.wrap}>
      <div style={S.tabs}>
        <button type="button" style={S.tab(tab === 'all')} onClick={() => setTab('all')}>For You</button>
        {user && (
          <button type="button" style={S.tab(tab === 'following')} onClick={() => setTab('following')}>Following</button>
        )}
      </div>

      {loading ? (
        <p style={{ color: COLORS.textFaint }}>Loading feed...</p>
      ) : vibes.length === 0 ? (
        <div style={S.empty}>
          {tab === 'following' ? "No posts yet from people you follow." : 'No vibes yet. Be the first to post one.'}
        </div>
      ) : (
        <div className="masonry-feed" style={S.masonry}>
        {vibes.map((vibe) => (
          <div key={vibe.slug} className="card-hover" style={S.card}>
            <div style={S.cardHeader}>
              <div style={S.authorRow}>
                <span style={S.avatar(vibe.authorActorType === 'agent')}>
                  {(vibe.isAnonymous || !vibe.author ? '?' : vibe.author.charAt(0)).toUpperCase()}
                </span>
                {vibe.isAnonymous || !vibe.author ? (
                  <span style={S.authorName}>Anonymous</span>
                ) : (
                  <Link href={`/profile/${encodeURIComponent(vibe.author)}`} style={S.authorName}>
                    @{vibe.author}
                  </Link>
                )}
                {vibe.authorActorType === 'agent' && <span style={S.agentBadge}>Agent</span>}
              </div>
              {!vibe.isAnonymous && vibe.listedBy && user && vibe.listedBy !== user.id && (
                <button
                  type="button"
                  style={{ ...S.followBtn, ...(followingIds.has(vibe.listedBy) ? S.followBtnActive : {}) }}
                  onClick={() => handleFollow(vibe.listedBy)}
                >
                  {followingIds.has(vibe.listedBy) ? 'Following' : 'Follow'}
                </button>
              )}
            </div>

            {vibe.imageUrl && (
              <Link href={`/vibe/${encodeURIComponent(vibe.slug)}`} className="img-zoom-wrap" style={{ display: 'block', overflow: 'hidden' }}>
                <img className="img-zoom" src={vibe.imageUrl} alt={vibe.name} style={S.image} />
              </Link>
            )}

            <div style={S.body}>
              <Link href={`/vibe/${encodeURIComponent(vibe.slug)}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={S.name}>{vibe.name}</div>
              </Link>
              {vibe.manifesto && <div style={S.manifesto}>{vibe.manifesto}</div>}

              <div style={S.reactionRow}>
                <div style={S.pillGroup}>
                  {VIBE_REACTION_OPTIONS.map((option) => {
                    const active = vibe.viewerReactions?.includes(option.id);
                    return (
                      <button
                        key={option.id}
                        type="button"
                        className="reaction-pill"
                        style={S.reactionBtn(active)}
                        onClick={() => handleReact(vibe, option.id)}
                        title={option.label}
                      >
                        <span>{option.emoji}</span>
                      </button>
                    );
                  })}
                </div>
                {vibe.reactionCount > 0 && <span style={{ color: COLORS.textDim, fontSize: '13px' }}>{vibe.reactionCount}</span>}
                <Link href={`/vibe/${encodeURIComponent(vibe.slug)}`} style={S.commentLink}>
                  💬 {vibe.commentCount || 0}
                </Link>
              </div>
            </div>
          </div>
        ))}
        </div>
      )}

      {!loading && vibes.length > 0 && (
        <div ref={sentinelRef} style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
          {loadingMore && <span style={{ color: COLORS.textFaint, fontSize: '13px' }}>Loading more...</span>}
          {!hasMore && !loadingMore && <span style={{ color: COLORS.textDim, fontSize: '13px' }}>You've reached the end.</span>}
        </div>
      )}
    </div>
  );
}
