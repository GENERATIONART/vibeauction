import fs from 'node:fs/promises';
import path from 'node:path';
import { createDefaultState } from '../default-store.js';
import { generateVibeImage, inferVibeCategory } from './generate-image.js';
import { VIBE_REACTION_IDS, VIBE_REACTION_OPTIONS } from '../vibe-social.js';
import { normalize, safeNumber, toTimestampMs } from '../utils.js';
import { resolveActor, actorCanAct } from './agent-auth.js';
import { getSupabaseAdmin } from './supabase-admin.js';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'vibe-store.json');

let stateQueue = Promise.resolve();

const safeText = (value, maxLen = 1000) =>
  typeof value === 'string' ? value.trim().slice(0, maxLen) : '';

const AUTH_TOKEN_MAX_LEN = 12000;

const getCandidateVibeIds = (...values) =>
  [...new Set(
    values
      .filter((value) => value !== null && value !== undefined)
      .map((value) => String(value).trim())
      .filter(Boolean)
      .flatMap((value) => [value, normalize(value)])
      .filter(Boolean),
  )];

async function fetchVibesFromSupabase() {
  try {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from('vibes')
      .select('id, slug, name, category, emoji, manifesto, image_url, is_anonymous, author, listed_by, remix_source_slug, remix_source_name, remix_source_author, created_at')
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) return null;
    return data.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    emoji: row.emoji,
    manifesto: row.manifesto,
    imageUrl: row.image_url ?? null,
    isAnonymous: row.is_anonymous,
    author: row.author,
    listedBy: row.listed_by ?? row.author,
    remixSourceSlug: row.remix_source_slug ?? null,
    remixSourceName: row.remix_source_name ?? null,
    remixSourceAuthor: row.remix_source_author ?? null,
    createdAt: row.created_at,
  }));
  } catch {
    return null;
  }
}

async function fetchVibeBySlugFromSupabase(slug) {
  try {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from('vibes')
      .select('*')
      .eq('slug', slug)
      .single();
    if (error || !data) return null;

    let authorActorType = 'human';
    let authorAvatarUrl = null;
    if (!data.is_anonymous && data.listed_by) {
      const { data: authorProfile } = await sb
        .from('profiles')
        .select('actor_type, avatar_url')
        .eq('id', data.listed_by)
        .maybeSingle();
      if (authorProfile) {
        authorActorType = authorProfile.actor_type || 'human';
        authorAvatarUrl = authorProfile.avatar_url ?? null;
      }
    }

    return {
      id: data.id,
      slug: data.slug,
      name: data.name,
      category: data.category,
      emoji: data.emoji,
      manifesto: data.manifesto,
      imageUrl: data.image_url ?? null,
      isAnonymous: data.is_anonymous,
      author: data.author,
      listedBy: data.listed_by ?? data.author,
      authorActorType: data.is_anonymous ? null : authorActorType,
      authorAvatarUrl: data.is_anonymous ? null : authorAvatarUrl,
      remixSourceSlug: data.remix_source_slug ?? null,
      remixSourceName: data.remix_source_name ?? null,
      remixSourceAuthor: data.remix_source_author ?? null,
      createdAt: data.created_at,
    };
  } catch {
    return null;
  }
}

const mapRemixRow = (row) => ({
  slug: row.slug,
  name: row.name,
  imageUrl: row.image_url ?? null,
  author: row.author ?? null,
  createdAt: row.created_at ?? null,
});

function summarizeReactionRows(rows, userId = null) {
  const counts = {};
  const viewerReactionSet = new Set();

  for (const option of VIBE_REACTION_OPTIONS) counts[option.id] = 0;

  for (const row of Array.isArray(rows) ? rows : []) {
    const reactionType = String(row?.reaction_type || '').trim();
    if (!VIBE_REACTION_IDS.has(reactionType)) continue;
    counts[reactionType] = (counts[reactionType] || 0) + 1;
    if (userId && row?.user_id && String(row.user_id) === String(userId)) {
      viewerReactionSet.add(reactionType);
    }
  }

  return {
    counts,
    totalReactions: Object.values(counts).reduce((sum, value) => sum + safeNumber(value, 0), 0),
    viewerReactions: Array.from(viewerReactionSet),
  };
}

export async function getVibeSocialForVibe(vibeId, authToken = null, vibeIdAlt = null, vibeName = null) {
  const normalizedId = normalize(vibeId || vibeIdAlt || vibeName);
  const emptyCounts = Object.fromEntries(VIBE_REACTION_OPTIONS.map((option) => [option.id, 0]));

  if (!normalizedId) {
    return {
      reactionCounts: emptyCounts,
      viewerReactions: [],
      totalReactions: 0,
      remixes: [],
      remixCount: 0,
      parentRemix: null,
    };
  }

  const candidateIds = getCandidateVibeIds(vibeId, vibeIdAlt, normalizedId);
  let sb;
  try {
    sb = getSupabaseAdmin();
  } catch {
    sb = null;
  }

  if (sb) {
    const token = safeText(authToken, AUTH_TOKEN_MAX_LEN);
    const actor = token ? await resolveActor(sb, token) : null;
    const userId = actor?.userId ?? null;

    const [{ data: reactionRows }, remixListResult, remixCountResult, currentVibeResult] = await Promise.all([
      sb.from('vibe_reactions').select('reaction_type, user_id').in('vibe_id', candidateIds).limit(2000),
      sb
        .from('vibes')
        .select('slug, name, image_url, author, created_at')
        .eq('remix_source_slug', normalizedId)
        .order('created_at', { ascending: false })
        .limit(6),
      sb.from('vibes').select('slug', { count: 'exact', head: true }).eq('remix_source_slug', normalizedId),
      sb
        .from('vibes')
        .select('remix_source_slug, remix_source_name, remix_source_author')
        .eq('slug', normalizedId)
        .maybeSingle(),
    ]);

    const reactionSummary = summarizeReactionRows(reactionRows, userId);
    const currentVibe = currentVibeResult?.data || null;

    return {
      reactionCounts: reactionSummary.counts,
      viewerReactions: reactionSummary.viewerReactions,
      totalReactions: reactionSummary.totalReactions,
      remixes: Array.isArray(remixListResult?.data) ? remixListResult.data.map(mapRemixRow) : [],
      remixCount: remixCountResult?.count ?? 0,
      parentRemix:
        currentVibe?.remix_source_slug
          ? {
              slug: currentVibe.remix_source_slug,
              name: currentVibe.remix_source_name || currentVibe.remix_source_slug,
              author: currentVibe.remix_source_author || null,
            }
          : null,
    };
  }

  const raw = await tryReadFile();
  const state = raw ? sanitizeState(raw) : createDefaultState();
  const reactionRows = (state.vibeReactions || []).filter((row) => candidateIds.includes(String(row?.vibeId || '').trim()));
  const reactionSummary = summarizeReactionRows(
    reactionRows.map((row) => ({ reaction_type: row.reactionType, user_id: row.userId || null })),
    null,
  );
  const currentVibe = (state.mintedVibes || []).find((row) => normalize(row?.slug) === normalizedId) || null;
  const remixes = (state.mintedVibes || [])
    .filter((row) => normalize(row?.remixSourceSlug) === normalizedId)
    .sort((a, b) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime())
    .slice(0, 6)
    .map((row) => ({
      slug: row.slug,
      name: row.name,
      imageUrl: row.imageUrl ?? null,
      author: row.author ?? null,
      createdAt: row.createdAt ?? null,
    }));

  return {
    reactionCounts: reactionSummary.counts,
    viewerReactions: [],
    totalReactions: reactionSummary.totalReactions,
    remixes,
    remixCount: (state.mintedVibes || []).filter((row) => normalize(row?.remixSourceSlug) === normalizedId).length,
    parentRemix:
      currentVibe?.remixSourceSlug
        ? {
            slug: currentVibe.remixSourceSlug,
            name: currentVibe.remixSourceName || currentVibe.remixSourceSlug,
            author: currentVibe.remixSourceAuthor || null,
          }
        : null,
  };
}

export async function submitReactionInStore(reaction, authToken = null) {
  const normalizedId = normalize(reaction?.vibeId || reaction?.id || reaction?.slug || reaction?.name);
  const reactionType = safeText(reaction?.reactionType, 40);
  const vibeName = safeText(reaction?.vibeName || reaction?.name, 180) || 'Unknown Vibe';

  if (!normalizedId || !VIBE_REACTION_IDS.has(reactionType)) {
    return { accepted: false, reason: 'invalid_reaction' };
  }

  let sb;
  try {
    sb = getSupabaseAdmin();
  } catch {
    sb = null;
  }
  if (sb) {
    const token = safeText(authToken, AUTH_TOKEN_MAX_LEN);
    if (!token) return { accepted: false, reason: 'auth_required' };

    const actor = await resolveActor(sb, token);
    const userId = actor?.userId ?? null;
    if (!userId) return { accepted: false, reason: 'auth_required' };

    const existing = await sb
      .from('vibe_reactions')
      .select('id')
      .eq('user_id', userId)
      .eq('vibe_id', normalizedId)
      .eq('reaction_type', reactionType)
      .maybeSingle();

    let toggledOn = false;
    if (existing?.data?.id) {
      const { error } = await sb.from('vibe_reactions').delete().eq('id', existing.data.id);
      if (error) return { accepted: false, reason: 'reaction_persist_failed' };
    } else {
      const { error } = await sb.from('vibe_reactions').insert({
        id: `react-${normalizedId}-${reactionType}-${userId}`,
        user_id: userId,
        vibe_id: normalizedId,
        vibe_name: vibeName,
        reaction_type: reactionType,
      });
      if (error) return { accepted: false, reason: 'reaction_persist_failed' };
      toggledOn = true;
    }

    const social = await getVibeSocialForVibe(normalizedId, token, reaction?.vibeIdAlt || null, vibeName);
    return { accepted: true, toggledOn, social };
  }

  return updateState((state) => {
    const nextReactions = Array.isArray(state.vibeReactions) ? [...state.vibeReactions] : [];
    const existingIndex = nextReactions.findIndex(
      (row) => normalize(row?.vibeId) === normalizedId && row?.reactionType === reactionType,
    );
    let toggledOn = false;

    if (existingIndex >= 0) {
      nextReactions.splice(existingIndex, 1);
    } else {
      nextReactions.unshift({
        id: `react-${normalizedId}-${reactionType}-${Date.now()}`,
        vibeId: normalizedId,
        vibeName,
        reactionType,
        createdAt: Date.now(),
      });
      toggledOn = true;
    }

    state.vibeReactions = nextReactions;
    const social = summarizeReactionRows(
      nextReactions
        .filter((row) => normalize(row?.vibeId) === normalizedId)
        .map((row) => ({ reaction_type: row.reactionType, user_id: row.userId || null })),
      null,
    );

    return {
      state,
      accepted: true,
      toggledOn,
      social: {
        reactionCounts: social.counts,
        viewerReactions: [],
        totalReactions: social.totalReactions,
        remixes: [],
        remixCount: 0,
        parentRemix: null,
      },
    };
  });
}

export async function getCommentsForVibe(vibeId, limit = 24, vibeIdAlt = null, vibeName = null) {
  const normalizedId = normalize(vibeId || vibeIdAlt || vibeName);
  if (!normalizedId) return { comments: [] };

  const candidateIds = getCandidateVibeIds(vibeId, vibeIdAlt, normalizedId);
  let sb;
  try {
    sb = getSupabaseAdmin();
  } catch {
    sb = null;
  }

  if (sb) {
    let rows = [];
    const { data, error } = await sb
      .from('vibe_comments')
      .select('id, user_id, body, created_at')
      .in('vibe_id', candidateIds)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!error && Array.isArray(data)) rows = data;

    const userIds = [...new Set(rows.map((row) => row.user_id).filter(Boolean))];
    const usernameMap = {};
    if (userIds.length > 0) {
      const { data: profiles } = await sb.from('profiles').select('id, username').in('id', userIds);
      for (const row of profiles || []) usernameMap[row.id] = row.username;
    }

    return {
      comments: rows.map((row) => ({
        id: row.id,
        userId: row.user_id ?? null,
        user: usernameMap[row.user_id] ? `@${usernameMap[row.user_id]}` : 'Anonymous',
        body: safeText(row.body, 500),
        createdAt: row.created_at ?? null,
        time: row.created_at
          ? new Date(row.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
          : 'Now',
      })),
    };
  }

  const raw = await tryReadFile();
  const state = raw ? sanitizeState(raw) : createDefaultState();
  return {
    comments: (state.vibeComments || [])
      .filter((row) => candidateIds.includes(String(row?.vibeId || '').trim()))
      .sort((a, b) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime())
      .slice(0, limit)
      .map((row) => ({
        id: row.id,
        userId: row.userId || null,
        user: row.user || 'Anonymous',
        body: safeText(row.body, 500),
        createdAt: row.createdAt || null,
        time: row.createdAt
          ? new Date(row.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
          : 'Now',
      })),
  };
}

export async function submitCommentInStore(comment, authToken = null) {
  const normalizedId = normalize(comment?.vibeId || comment?.id || comment?.slug || comment?.name);
  const vibeName = safeText(comment?.vibeName || comment?.name, 180) || 'Unknown Vibe';
  const body = safeText(comment?.body, 280);

  if (!normalizedId || body.length < 2) {
    return { accepted: false, reason: 'invalid_comment' };
  }

  let sb;
  try {
    sb = getSupabaseAdmin();
  } catch {
    sb = null;
  }
  if (sb) {
    const token = safeText(authToken, AUTH_TOKEN_MAX_LEN);
    if (!token) return { accepted: false, reason: 'auth_required' };

    const actor = await resolveActor(sb, token);
    const userId = actor?.userId ?? null;
    if (!userId) return { accepted: false, reason: 'auth_required' };

    const commentId = `comment-${normalizedId}-${Date.now()}`;
    const { error } = await sb.from('vibe_comments').insert({
      id: commentId,
      user_id: userId,
      vibe_id: normalizedId,
      vibe_name: vibeName,
      body,
    });
    if (error) return { accepted: false, reason: 'comment_persist_failed' };

    const comments = await getCommentsForVibe(normalizedId, 24, comment?.vibeIdAlt || null, vibeName);
    return { accepted: true, comments: comments.comments };
  }

  return updateState((state) => {
    const nextComments = Array.isArray(state.vibeComments) ? [...state.vibeComments] : [];
    nextComments.unshift({
      id: `comment-${normalizedId}-${Date.now()}`,
      vibeId: normalizedId,
      vibeName,
      user: 'You',
      userId: null,
      body,
      createdAt: new Date().toISOString(),
    });
    state.vibeComments = nextComments;
    return {
      state,
      accepted: true,
      comments: nextComments
        .filter((row) => normalize(row?.vibeId) === normalizedId)
        .slice(0, 24)
        .map((row) => ({
          id: row.id,
          userId: row.userId || null,
          user: row.user || 'Anonymous',
          body: safeText(row.body, 500),
          createdAt: row.createdAt || null,
          time: row.createdAt
            ? new Date(row.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
            : 'Now',
        })),
    };
  });
}

// ─── Follows ──────────────────────────────────────────────────────────────

export async function followInStore(followeeId, authToken = null) {
  const targetId = safeText(followeeId, 100);
  const token = safeText(authToken, AUTH_TOKEN_MAX_LEN);
  if (!targetId || !token) return { accepted: false, reason: 'invalid_request' };

  const sb = getSupabaseAdmin();
  const actor = await resolveActor(sb, token);
  if (!actor?.userId) return { accepted: false, reason: 'auth_required' };
  if (actor.userId === targetId) return { accepted: false, reason: 'cannot_follow_self' };
  if (!actorCanAct(actor)) return { accepted: false, reason: 'agent_not_verified' };

  const { error } = await sb
    .from('follows')
    .upsert({ follower_id: actor.userId, followee_id: targetId }, { onConflict: 'follower_id,followee_id' });
  if (error) return { accepted: false, reason: 'follow_persist_failed' };
  return { accepted: true, following: true };
}

export async function unfollowInStore(followeeId, authToken = null) {
  const targetId = safeText(followeeId, 100);
  const token = safeText(authToken, AUTH_TOKEN_MAX_LEN);
  if (!targetId || !token) return { accepted: false, reason: 'invalid_request' };

  const sb = getSupabaseAdmin();
  const actor = await resolveActor(sb, token);
  if (!actor?.userId) return { accepted: false, reason: 'auth_required' };

  const { error } = await sb
    .from('follows')
    .delete()
    .eq('follower_id', actor.userId)
    .eq('followee_id', targetId);
  if (error) return { accepted: false, reason: 'unfollow_persist_failed' };
  return { accepted: true, following: false };
}

export async function getFollowStatsForUser(userId, viewerToken = null) {
  const targetId = safeText(userId, 100);
  if (!targetId) return { followerCount: 0, followingCount: 0, isFollowing: false };

  const sb = getSupabaseAdmin();
  const [followerResult, followingResult] = await Promise.all([
    sb.from('follows').select('follower_id', { count: 'exact', head: true }).eq('followee_id', targetId),
    sb.from('follows').select('followee_id', { count: 'exact', head: true }).eq('follower_id', targetId),
  ]);

  let isFollowing = false;
  const token = safeText(viewerToken, AUTH_TOKEN_MAX_LEN);
  if (token) {
    const actor = await resolveActor(sb, token);
    if (actor?.userId) {
      const { data } = await sb
        .from('follows')
        .select('follower_id')
        .eq('follower_id', actor.userId)
        .eq('followee_id', targetId)
        .maybeSingle();
      isFollowing = Boolean(data);
    }
  }

  return {
    followerCount: followerResult?.count ?? 0,
    followingCount: followingResult?.count ?? 0,
    isFollowing,
  };
}

// ─── Direct messages ────────────────────────────────────────────────────────

export async function sendMessageInStore(recipientId, body, authToken = null) {
  const targetId = safeText(recipientId, 100);
  const messageBody = safeText(body, 2000);
  const token = safeText(authToken, AUTH_TOKEN_MAX_LEN);
  if (!targetId || messageBody.length < 1 || !token) return { accepted: false, reason: 'invalid_request' };

  const sb = getSupabaseAdmin();
  const actor = await resolveActor(sb, token);
  if (!actor?.userId) return { accepted: false, reason: 'auth_required' };
  if (actor.userId === targetId) return { accepted: false, reason: 'cannot_message_self' };
  if (!actorCanAct(actor)) return { accepted: false, reason: 'agent_not_verified' };

  const message = {
    id: `msg-${actor.userId}-${targetId}-${Date.now()}`,
    sender_id: actor.userId,
    recipient_id: targetId,
    body: messageBody,
  };
  const { error } = await sb.from('messages').insert(message);
  if (error) return { accepted: false, reason: 'message_persist_failed' };
  return { accepted: true, message: mapMessageRow({ ...message, created_at: new Date().toISOString() }) };
}

export async function getConversationInStore(otherUserId, authToken = null, limit = 50) {
  const otherId = safeText(otherUserId, 100);
  const token = safeText(authToken, AUTH_TOKEN_MAX_LEN);
  if (!otherId || !token) return { messages: [] };

  const sb = getSupabaseAdmin();
  const actor = await resolveActor(sb, token);
  if (!actor?.userId) return { messages: [] };

  const { data, error } = await sb
    .from('messages')
    .select('id, sender_id, recipient_id, body, created_at')
    .or(
      `and(sender_id.eq.${actor.userId},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${actor.userId})`,
    )
    .order('created_at', { ascending: true })
    .limit(limit);
  if (error || !Array.isArray(data)) return { messages: [] };

  return { messages: data.map(mapMessageRow) };
}

export async function listConversationsInStore(authToken = null) {
  const token = safeText(authToken, AUTH_TOKEN_MAX_LEN);
  if (!token) return { conversations: [] };

  const sb = getSupabaseAdmin();
  const actor = await resolveActor(sb, token);
  if (!actor?.userId) return { conversations: [] };

  const { data, error } = await sb
    .from('messages')
    .select('id, sender_id, recipient_id, body, created_at')
    .or(`sender_id.eq.${actor.userId},recipient_id.eq.${actor.userId}`)
    .order('created_at', { ascending: false })
    .limit(500);
  if (error || !Array.isArray(data)) return { conversations: [] };

  const byOtherParty = new Map();
  for (const row of data) {
    const otherId = row.sender_id === actor.userId ? row.recipient_id : row.sender_id;
    if (!byOtherParty.has(otherId)) {
      byOtherParty.set(otherId, mapMessageRow(row));
    }
  }

  const otherIds = [...byOtherParty.keys()];
  let profilesById = new Map();
  if (otherIds.length) {
    const { data: profileRows } = await sb
      .from('profiles')
      .select('id, username, avatar_url, actor_type')
      .in('id', otherIds);
    profilesById = new Map((profileRows || []).map((row) => [row.id, row]));
  }

  const conversations = otherIds.map((otherId) => {
    const profile = profilesById.get(otherId);
    return {
      userId: otherId,
      username: profile?.username || 'Unknown',
      avatarUrl: profile?.avatar_url ?? null,
      actorType: profile?.actor_type || 'human',
      lastMessage: byOtherParty.get(otherId),
    };
  });

  return { conversations };
}

function mapMessageRow(row) {
  return {
    id: row.id,
    senderId: row.sender_id,
    recipientId: row.recipient_id,
    body: row.body,
    createdAt: row.created_at,
  };
}


async function insertVibeToSupabase(vibe) {
  let sb;
  try {
    sb = getSupabaseAdmin();
  } catch {
    return { saved: false, reason: 'supabase_unavailable' };
  }
  const createdAtMs = Number.isFinite(Number(vibe.createdAt))
    ? Number(vibe.createdAt)
    : Date.now();
  const createdAtIso = new Date(createdAtMs).toISOString();

  const baseRow = {
    id: vibe.id,
    slug: vibe.slug,
    name: vibe.name,
    category: vibe.category,
    // Backward-compat: DB still enforces NOT NULL on `emoji`.
    // Store a neutral token while UI is image-first.
    emoji: safeText(vibe.emoji, 10) || 'IMG',
    manifesto: vibe.manifesto,
    image_url: vibe.imageUrl ?? null,
    is_anonymous: vibe.isAnonymous,
    author: vibe.author,
    listed_by: vibe.listedBy ?? vibe.author,
    remix_source_slug: vibe.remixSourceSlug ?? null,
    remix_source_name: vibe.remixSourceName ?? null,
    remix_source_author: vibe.remixSourceAuthor ?? null,
  };

  const createdAtCandidates = [createdAtMs, createdAtIso];
  let lastError = null;

  for (const createdAt of createdAtCandidates) {
    const { error } = await sb.from('vibes').insert({
      ...baseRow,
      created_at: createdAt,
    });

    if (!error) {
      return { saved: true, reason: 'inserted' };
    }

    lastError = error;
    const message = String(error?.message || '').toLowerCase();
    const isCreatedAtTypeError =
      message.includes('created_at') || message.includes('bigint') || message.includes('timestamp');
    if (!isCreatedAtTypeError) {
      break;
    }
  }

  console.error('[state-db] insertVibeToSupabase failed:', lastError?.message || lastError);
  return { saved: false, reason: lastError?.message || 'insert_failed' };
}

// ─── File-system helpers (local fallback) ───────────────────────────────────

async function tryReadFile() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function tryWriteFile(state) {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(state, null, 2), 'utf8');
    return true;
  } catch {
    return false;
  }
}

function sanitizeState(input) {
  const defaults = createDefaultState();
  if (!input || typeof input !== 'object') return defaults;
  return {
    ...defaults,
    ...input,
    balance: safeNumber(input.balance, defaults.balance),
    activeBids: Array.isArray(input.activeBids) ? input.activeBids : defaults.activeBids,
    vaultItems: Array.isArray(input.vaultItems) ? input.vaultItems : defaults.vaultItems,
    walletLog: Array.isArray(input.walletLog) ? input.walletLog : defaults.walletLog,
    confessions: Array.isArray(input.confessions) ? input.confessions : defaults.confessions,
    mintedVibes: Array.isArray(input.mintedVibes) ? input.mintedVibes : defaults.mintedVibes,
    vibeReactions: Array.isArray(input.vibeReactions) ? input.vibeReactions : defaults.vibeReactions,
    processedStripeSessions:
      input.processedStripeSessions && typeof input.processedStripeSessions === 'object'
        ? input.processedStripeSessions
        : defaults.processedStripeSessions,
  };
}

// ─── Core state read/write (file-based for non-vibe state) ──────────────────

async function readNonVibeState() {
  const raw = await tryReadFile();
  if (!raw) return createDefaultState();
  return sanitizeState(raw);
}

async function writeNonVibeState(state) {
  await tryWriteFile(sanitizeState(state));
}

function queueStateTask(task) {
  const run = stateQueue.then(task, task);
  stateQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

// ─── Public API ─────────────────────────────────────────────────────────────

export function getState() {
  return queueStateTask(async () => {
    const [fileState, supabaseVibes] = await Promise.all([
      readNonVibeState(),
      fetchVibesFromSupabase(),
    ]);

    const fileMintedVibes = Array.isArray(fileState.mintedVibes) ? fileState.mintedVibes : [];
    const mergedMintedBySlug = new Map();

    // Prefer Supabase rows as source of truth, but keep local file-only entries as fallback.
    if (Array.isArray(supabaseVibes)) {
      for (const vibe of supabaseVibes) {
        const key = normalize(vibe?.slug || vibe?.id || vibe?.name || '');
        if (!key) continue;
        mergedMintedBySlug.set(key, vibe);
      }
    }

    for (const vibe of fileMintedVibes) {
      const key = normalize(vibe?.slug || vibe?.id || vibe?.name || '');
      if (!key || mergedMintedBySlug.has(key)) continue;
      mergedMintedBySlug.set(key, vibe);
    }

    const mintedVibes = Array.from(mergedMintedBySlug.values()).sort(
      (a, b) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime(),
    );

    const state = sanitizeState({ ...fileState, mintedVibes });
    return { state };
  });
}

function updateState(mutator) {
  return queueStateTask(async () => {
    const raw = await tryReadFile();
    const current = raw ? sanitizeState(raw) : createDefaultState();
    const workingState = structuredClone(current);
    const result = (await mutator(workingState)) || {};
    const nextState = sanitizeState(result.state || workingState);
    await tryWriteFile(nextState);
    return { ...result, state: nextState };
  });
}

export function mintConfessionInStore(payload) {
  return updateState((state) => {
    const confession = safeText(payload?.confession || payload?.text);
    if (!confession) return { state, mintedConfession: null };

    const titleInput = safeText(payload?.title);
    const isAnonymous = payload?.isAnonymous !== false;
    const alias = safeText(payload?.alias || payload?.author);
    const now = Date.now();
    const derivedTitle = confession.split(/\s+/).slice(0, 6).join(' ');
    const title = titleInput || derivedTitle || 'Untitled Confession';
    const normalizedId = normalize(`${title}-${now}`) || `confession-${now}`;
    const author = isAnonymous ? 'Anonymous' : alias || '@VibeMinter';

    const mintedConfession = {
      id: `conf-${normalizedId}`,
      title,
      confession,
      isAnonymous,
      author,
      createdAt: now,
    };

    state.confessions = [mintedConfession, ...state.confessions].slice(0, 100);
    return { state, mintedConfession };
  });
}

export async function mintVibeInStore(payload, authToken = null) {
  const nameInput = safeText(payload?.name || payload?.title, 100);
  const requestedCategory = safeText(payload?.category, 50);
  const isConfessionCategory = normalize(requestedCategory) === 'confessions';
  let category = isConfessionCategory ? 'Confessions' : 'Feelings';
  // UI no longer asks for emoji, but DB schema still requires a non-null value.
  const emoji = safeText(payload?.emoji, 10) || 'IMG';
  const manifesto = safeText(payload?.manifesto || payload?.description || payload?.details, 2000);
  const now = Date.now();
  const name = nameInput || 'Untitled Vibe';

  if (!isConfessionCategory) {
    category = await inferVibeCategory({
      name,
      description: manifesto,
    });
  }

  const normalizedId = normalize(`${name}-${category}-${now}`) || `vibe-${now}`;
  let sb;
  try {
    sb = getSupabaseAdmin();
  } catch {
    sb = null;
  }

  let author = safeText(payload?.author || payload?.alias) || null;
  let listedBy = safeText(payload?.listedBy || payload?.author || payload?.alias) || null;
  let mintingActor = null;
  if (sb) {
    const token = safeText(authToken, AUTH_TOKEN_MAX_LEN);
    if (!token) {
      const { state } = await getState();
      return { state, mintedVibe: null, reason: 'auth_required' };
    }

    mintingActor = await resolveActor(sb, token);
    const userId = mintingActor?.userId ?? null;
    if (!userId) {
      const { state } = await getState();
      return { state, mintedVibe: null, reason: 'auth_invalid_token' };
    }
    if (!actorCanAct(mintingActor)) {
      const { state } = await getState();
      return { state, mintedVibe: null, reason: 'agent_not_verified' };
    }

    listedBy = userId;
    const { data: profileData } = await sb
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .single();
    if (profileData?.username) {
      author = profileData.username;
    }
  }

  const uploadedImageUrl = safeText(payload?.imageUrl || payload?.uploadedImageUrl, 2000) || null;
  const imageStyle = safeText(payload?.imageStyle, 300) || null;
  const imageComposition = safeText(payload?.imageComposition, 300) || null;
  const imageColor = safeText(payload?.imageColor, 300) || null;
  const imageHumor = safeText(payload?.imageHumor, 300) || null;
  const imagePromptText = safeText(payload?.imagePromptText, 400) || null;

  // Use uploaded image if provided; otherwise generate with AI
  const imageUrl = uploadedImageUrl || await generateVibeImage({
    name,
    category,
    manifesto,
    vibeType: category,
    description: manifesto,
    styleOverride: imageStyle,
    compositionOverride: imageComposition,
    colorOverride: imageColor,
    humorOverride: imageHumor,
    customPromptText: imagePromptText,
  });

  const mintedVibe = {
    id: `mint-${normalizedId}`,
    slug: normalizedId,
    name,
    category,
    emoji,
    manifesto,
    imageUrl,
    isAnonymous: payload?.isAnonymous === true,
    author,
    listedBy,
    remixSourceSlug: safeText(payload?.remixSourceSlug, 160) || null,
    remixSourceName: safeText(payload?.remixSourceName, 180) || null,
    remixSourceAuthor: safeText(payload?.remixSourceAuthor, 180) || null,
    createdAt: now,
  };

  // Write to Supabase (primary on Vercel)
  const saveResult = await insertVibeToSupabase(mintedVibe);
  const savedToSupabase = Boolean(saveResult?.saved);

  // If Supabase is configured, treat insert failure as a hard failure to avoid ghost mints
  // that only exist in local file fallback.
  if (sb && !savedToSupabase) {
    const { state } = await getState();
    return {
      state,
      mintedVibe: null,
      reason: saveResult?.reason || 'insert_failed',
      saveReason: saveResult?.reason || 'insert_failed',
    };
  }

  // Also try writing to file (works locally, silently fails on Vercel)
  const fileState = (await tryReadFile()) || createDefaultState();
  const sanitized = sanitizeState(fileState);
  sanitized.mintedVibes = [mintedVibe, ...sanitized.mintedVibes].slice(0, 100);
  await tryWriteFile(sanitized);

  // Return state with the new vibe included
  const mintedVibes = savedToSupabase
    ? await fetchVibesFromSupabase().then((v) => v || sanitized.mintedVibes)
    : sanitized.mintedVibes;

  const state = sanitizeState({ ...sanitized, mintedVibes });

  // "Vibe listed" confirmation email is disabled: its copy ("bidders", "starting bid")
  // is auction-era and needs a rewrite for the social pivot before re-enabling. Also
  // skip for agent actors, who have no real inbox behind their synthetic email.

  return { state, mintedVibe, savedToSupabase, saveReason: saveResult?.reason || null };
}

export async function getFeedVibes({ limit = 30, offset = 0, followingOnly = false, viewerToken = null } = {}) {
  let sb;
  try {
    sb = getSupabaseAdmin();
  } catch {
    return { vibes: [], hasMore: false };
  }

  const token = safeText(viewerToken, AUTH_TOKEN_MAX_LEN);
  const actor = token ? await resolveActor(sb, token) : null;

  let followedIds = null;
  if (followingOnly) {
    if (!actor?.userId) return { vibes: [], hasMore: false };
    const { data: followRows } = await sb.from('follows').select('followee_id').eq('follower_id', actor.userId);
    followedIds = (followRows || []).map((row) => row.followee_id);
    if (followedIds.length === 0) return { vibes: [], hasMore: false };
  }

  const safeLimit = Math.min(Math.max(1, limit), 100);
  const safeOffset = Math.max(0, offset);

  let query = sb
    .from('vibes')
    .select('id, slug, name, category, emoji, manifesto, image_url, is_anonymous, author, listed_by, remix_source_slug, remix_source_name, remix_source_author, created_at')
    .order('created_at', { ascending: false })
    .range(safeOffset, safeOffset + safeLimit); // fetch one extra row to detect hasMore
  if (followedIds) query = query.in('listed_by', followedIds);

  const { data: vibeRowsWithExtra, error } = await query;
  if (error || !Array.isArray(vibeRowsWithExtra) || vibeRowsWithExtra.length === 0) return { vibes: [], hasMore: false };

  const hasMore = vibeRowsWithExtra.length > safeLimit;
  const vibeRows = hasMore ? vibeRowsWithExtra.slice(0, safeLimit) : vibeRowsWithExtra;

  const slugs = vibeRows.map((row) => row.slug).filter(Boolean);
  const authorIds = [...new Set(vibeRows.map((row) => row.listed_by).filter(Boolean))];

  const [profilesResult, reactionRows, commentCountRows, viewerReactionRows] = await Promise.all([
    authorIds.length
      ? sb.from('profiles').select('id, username, avatar_url, actor_type').in('id', authorIds)
      : Promise.resolve({ data: [] }),
    sb.from('vibe_reactions').select('vibe_id, reaction_type').in('vibe_id', slugs).limit(5000),
    sb.from('vibe_comments').select('vibe_id').in('vibe_id', slugs).limit(5000),
    actor?.userId
      ? sb.from('vibe_reactions').select('vibe_id, reaction_type').eq('user_id', actor.userId).in('vibe_id', slugs)
      : Promise.resolve({ data: [] }),
  ]);

  const profilesById = new Map((profilesResult?.data || []).map((row) => [row.id, row]));
  const reactionCountsBySlug = new Map();
  for (const row of reactionRows?.data || []) {
    reactionCountsBySlug.set(row.vibe_id, (reactionCountsBySlug.get(row.vibe_id) || 0) + 1);
  }
  const commentCountsBySlug = new Map();
  for (const row of commentCountRows?.data || []) {
    commentCountsBySlug.set(row.vibe_id, (commentCountsBySlug.get(row.vibe_id) || 0) + 1);
  }
  const viewerReactionsBySlug = new Map();
  for (const row of viewerReactionRows?.data || []) {
    if (!viewerReactionsBySlug.has(row.vibe_id)) viewerReactionsBySlug.set(row.vibe_id, new Set());
    viewerReactionsBySlug.get(row.vibe_id).add(row.reaction_type);
  }

  const vibes = vibeRows.map((row) => {
    const authorProfile = profilesById.get(row.listed_by) || null;
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      category: row.category,
      emoji: row.emoji,
      manifesto: row.manifesto,
      imageUrl: row.image_url ?? null,
      isAnonymous: row.is_anonymous,
      author: row.is_anonymous ? null : (row.author ?? authorProfile?.username ?? null),
      listedBy: row.listed_by,
      authorActorType: row.is_anonymous ? null : (authorProfile?.actor_type ?? 'human'),
      authorAvatarUrl: row.is_anonymous ? null : (authorProfile?.avatar_url ?? null),
      remixSourceSlug: row.remix_source_slug ?? null,
      remixSourceName: row.remix_source_name ?? null,
      remixSourceAuthor: row.remix_source_author ?? null,
      createdAt: row.created_at,
      reactionCount: reactionCountsBySlug.get(row.slug) || 0,
      commentCount: commentCountsBySlug.get(row.slug) || 0,
      viewerReactions: [...(viewerReactionsBySlug.get(row.slug) || [])],
    };
  });

  return { vibes, hasMore };
}

export async function getMintedVibeBySlug(slug) {
  // Try Supabase first
  const fromSupabase = await fetchVibeBySlugFromSupabase(slug);
  if (fromSupabase) return fromSupabase;

  // Fall back to file
  const { state } = await getState();
  return (state.mintedVibes ?? []).find((v) => v.slug === slug) ?? null;
}

