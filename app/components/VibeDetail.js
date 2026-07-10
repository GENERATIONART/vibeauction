'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../state/auth-store';
import { getSupabaseClient } from '../../lib/supabase-client';
import { VIBE_REACTION_OPTIONS } from '../../lib/vibe-social.js';
import { COLORS, RADIUS } from '../../lib/design-tokens.js';

const S = {
  wrap: {
    maxWidth: '720px',
    margin: '0 auto',
    padding: '24px 16px 64px',
  },
  authorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '16px',
  },
  authorName: {
    fontWeight: 600,
    fontSize: '15px',
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
    marginLeft: 'auto',
    background: 'transparent',
    border: `1px solid ${COLORS.borderStrong}`,
    color: '#e5e5e5',
    fontSize: '13px',
    fontWeight: 600,
    padding: '6px 16px',
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
    borderRadius: RADIUS.card,
    display: 'block',
    marginBottom: '20px',
    background: COLORS.bgElevated,
  },
  name: {
    fontSize: '30px',
    fontWeight: 700,
    letterSpacing: '-0.01em',
    marginBottom: '10px',
    lineHeight: 1.15,
  },
  manifesto: {
    color: '#d4d4d4',
    fontSize: '16px',
    lineHeight: 1.6,
    marginBottom: '20px',
  },
  remix: {
    color: COLORS.textFaint,
    fontSize: '13px',
    marginBottom: '20px',
  },
  reactionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
    marginBottom: '28px',
    paddingBottom: '24px',
    borderBottom: `1px solid ${COLORS.border}`,
  },
  reactionBtn: (active) => ({
    background: active ? 'rgba(139,92,246,0.15)' : 'transparent',
    border: active ? `1px solid ${COLORS.accentBorderHover}` : `1px solid ${COLORS.border}`,
    color: active ? COLORS.accent : COLORS.textMuted,
    fontSize: '14px',
    padding: '7px 12px',
    borderRadius: RADIUS.pill,
    cursor: 'pointer',
  }),
  commentsHeading: {
    fontWeight: 600,
    fontSize: '15px',
    marginBottom: '16px',
    color: COLORS.fg,
  },
  commentForm: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
  },
  commentInput: {
    flex: 1,
    background: COLORS.bgElevated,
    border: `1px solid ${COLORS.border}`,
    color: COLORS.fg,
    padding: '10px 14px',
    borderRadius: RADIUS.pill,
    fontSize: '14px',
  },
  commentBtn: {
    background: COLORS.accent,
    color: '#000000',
    border: 'none',
    padding: '10px 20px',
    borderRadius: RADIUS.pill,
    fontWeight: 600,
    cursor: 'pointer',
  },
  comment: {
    borderBottom: `1px solid ${COLORS.border}`,
    padding: '12px 0',
  },
  commentUser: {
    fontWeight: 600,
    fontSize: '13px',
    color: COLORS.accent,
  },
  commentBody: {
    fontSize: '14px',
    color: '#dddddd',
    marginTop: '2px',
  },
  commentTime: {
    fontSize: '11px',
    color: COLORS.textDim,
    marginTop: '2px',
  },
};

export default function VibeDetail({ vibe }) {
  const { user, profile } = useAuth();
  const [social, setSocial] = useState({ reactionCounts: {}, viewerReactions: [], totalReactions: 0 });
  const [comments, setComments] = useState([]);
  const [commentBody, setCommentBody] = useState('');
  const [posting, setPosting] = useState(false);
  const [followStats, setFollowStats] = useState({ followerCount: 0, isFollowing: false });

  const getAccessToken = useCallback(async () => {
    const sb = getSupabaseClient();
    if (!sb) return null;
    const { data } = await sb.auth.getSession();
    return data?.session?.access_token ?? null;
  }, []);

  const loadSocial = useCallback(async () => {
    const token = await getAccessToken();
    const res = await fetch(`/api/state/vibe-social?vibeId=${encodeURIComponent(vibe.slug)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: 'no-store',
    });
    const data = await res.json();
    if (data?.social) setSocial(data.social);
  }, [vibe.slug, getAccessToken]);

  const loadComments = useCallback(async () => {
    const res = await fetch(`/api/state/vibe-comments?vibeId=${encodeURIComponent(vibe.slug)}`, { cache: 'no-store' });
    const data = await res.json();
    setComments(Array.isArray(data?.comments) ? data.comments : []);
  }, [vibe.slug]);

  const loadFollowStats = useCallback(async () => {
    if (!vibe.listedBy) return;
    const token = await getAccessToken();
    const res = await fetch(`/api/state/follow-stats?userId=${encodeURIComponent(vibe.listedBy)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: 'no-store',
    });
    const data = await res.json();
    setFollowStats(data);
  }, [vibe.listedBy, getAccessToken]);

  useEffect(() => {
    loadSocial();
    loadComments();
    loadFollowStats();
  }, [loadSocial, loadComments, loadFollowStats]);

  const handleReact = async (reactionType) => {
    const token = await getAccessToken();
    if (!token) return;

    // Optimistic update — flip the reaction locally before the network call resolves.
    const wasActive = social.viewerReactions?.includes(reactionType);
    const previousSocial = social;
    setSocial((prev) => ({
      ...prev,
      viewerReactions: wasActive
        ? prev.viewerReactions.filter((r) => r !== reactionType)
        : [...(prev.viewerReactions || []), reactionType],
      reactionCounts: {
        ...prev.reactionCounts,
        [reactionType]: Math.max(0, (prev.reactionCounts?.[reactionType] || 0) + (wasActive ? -1 : 1)),
      },
      totalReactions: Math.max(0, (prev.totalReactions || 0) + (wasActive ? -1 : 1)),
    }));

    try {
      const res = await fetch('/api/state/vibe-social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reaction: { vibeId: vibe.slug, vibeName: vibe.name, reactionType } }),
      });
      const data = await res.json();
      if (data?.social) setSocial(data.social);
      else if (!data?.accepted) setSocial(previousSocial);
    } catch {
      setSocial(previousSocial);
    }
  };

  const handleFollow = async () => {
    const token = await getAccessToken();
    if (!token || !vibe.listedBy) return;

    const wasFollowing = followStats.isFollowing;
    setFollowStats((prev) => ({
      ...prev,
      isFollowing: !wasFollowing,
      followerCount: Math.max(0, prev.followerCount + (wasFollowing ? -1 : 1)),
    }));

    try {
      await fetch('/api/state/follow', {
        method: wasFollowing ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: vibe.listedBy }),
      });
    } catch {
      setFollowStats((prev) => ({ ...prev, isFollowing: wasFollowing, followerCount: Math.max(0, prev.followerCount + (wasFollowing ? 1 : -1)) }));
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    const body = commentBody.trim();
    if (!body) return;
    const token = await getAccessToken();
    if (!token) return;

    // Show the comment immediately instead of waiting on the round trip.
    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticComment = {
      id: optimisticId,
      user: profile?.username ? `@${profile.username}` : 'You',
      body,
      createdAt: new Date().toISOString(),
      time: 'Just now',
    };
    setComments((prev) => [optimisticComment, ...prev]);
    setCommentBody('');
    setPosting(true);
    try {
      const res = await fetch('/api/state/vibe-comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ comment: { vibeId: vibe.slug, vibeName: vibe.name, body } }),
      });
      const data = await res.json();
      if (data?.accepted && Array.isArray(data.comments)) {
        setComments(data.comments);
      } else {
        setComments((prev) => prev.filter((c) => c.id !== optimisticId));
      }
    } catch {
      setComments((prev) => prev.filter((c) => c.id !== optimisticId));
    } finally {
      setPosting(false);
    }
  };

  return (
    <div style={S.wrap}>
      <div style={S.authorRow}>
        {vibe.isAnonymous || !vibe.author ? (
          <span style={S.authorName}>Anonymous</span>
        ) : (
          <Link href={`/profile/${encodeURIComponent(vibe.author)}`} style={S.authorName}>@{vibe.author}</Link>
        )}
        {vibe.authorActorType === 'agent' && <span style={S.agentBadge}>Agent</span>}
        {followStats.followerCount > 0 && (
          <span style={{ color: COLORS.textDim, fontSize: '12px' }}>{followStats.followerCount} followers</span>
        )}
        {user && vibe.listedBy && vibe.listedBy !== user.id && (
          <button
            type="button"
            style={{ ...S.followBtn, ...(followStats.isFollowing ? S.followBtnActive : {}) }}
            onClick={handleFollow}
          >
            {followStats.isFollowing ? 'Following' : 'Follow'}
          </button>
        )}
      </div>

      {vibe.imageUrl && <img src={vibe.imageUrl} alt={vibe.name} style={S.image} />}

      <div style={S.name}>{vibe.name}</div>
      {vibe.manifesto && <div style={S.manifesto}>{vibe.manifesto}</div>}

      {vibe.remixSourceSlug && (
        <div style={S.remix}>
          Remix of{' '}
          <Link href={`/vibe/${encodeURIComponent(vibe.remixSourceSlug)}`} style={{ color: COLORS.accent }}>
            {vibe.remixSourceName || vibe.remixSourceSlug}
          </Link>
        </div>
      )}

      <div style={S.reactionRow}>
        {VIBE_REACTION_OPTIONS.map((option) => {
          const active = social.viewerReactions?.includes(option.id);
          const count = social.reactionCounts?.[option.id] || 0;
          return (
            <button key={option.id} type="button" style={S.reactionBtn(active)} onClick={() => handleReact(option.id)}>
              {option.emoji} {count > 0 ? count : ''}
            </button>
          );
        })}
      </div>

      <div style={S.commentsHeading}>{comments.length} Comments</div>

      {user ? (
        <form style={S.commentForm} onSubmit={handleComment}>
          <input
            style={S.commentInput}
            value={commentBody}
            onChange={(e) => setCommentBody(e.target.value)}
            placeholder="Say something..."
            maxLength={280}
          />
          <button type="submit" style={S.commentBtn} disabled={posting}>
            {posting ? 'Posting...' : 'Post'}
          </button>
        </form>
      ) : (
        <p style={{ color: COLORS.textDim, fontSize: '13px', marginBottom: '20px' }}>
          <Link href="/login" style={{ color: COLORS.accent }}>Sign in</Link> to comment.
        </p>
      )}

      {comments.map((comment) => (
        <div key={comment.id} style={S.comment}>
          <div style={S.commentUser}>{comment.user || 'Anonymous'}</div>
          <div style={S.commentBody}>{comment.body}</div>
          <div style={S.commentTime}>{comment.time}</div>
        </div>
      ))}
    </div>
  );
}
