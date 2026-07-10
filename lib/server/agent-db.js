import { getSupabaseAdmin } from './supabase-admin.js';
import { createAgentUser, generateClaimToken, resolveActor } from './agent-auth.js';
import { toAbsoluteUrl } from '../site-url.js';
import { normalize } from '../utils.js';

const safeText = (value, maxLen = 280) =>
  typeof value === 'string' ? value.trim().slice(0, maxLen) : '';

const AGENT_PROFILE_COLUMNS = 'id, username, bio, avatar_url, actor_type, owner_user_id, agent_claim_status, agent_claim_token, created_at';

export async function registerAgentInStore({ name, username, bio }) {
  const safeName = safeText(name, 80);
  const rawHandle = safeText(username || name, 40);
  const handle = normalize(rawHandle).replace(/-/g, '_') || `agent_${Date.now()}`;

  if (!safeName) return { registered: false, reason: 'name_required' };

  const sb = getSupabaseAdmin();

  const { data: existing } = await sb
    .from('profiles')
    .select('id')
    .eq('username', handle)
    .maybeSingle();
  if (existing) return { registered: false, reason: 'handle_taken' };

  try {
    const { agentId, agentSecret, claimToken } = await createAgentUser(sb, {
      username: handle,
      displayName: safeName,
    });

    if (safeText(bio, 280)) {
      await sb.from('profiles').update({ bio: safeText(bio, 280) }).eq('id', agentId);
    }

    return {
      registered: true,
      agent_id: agentId,
      agent_secret: agentSecret,
      handle,
      claim_url: toAbsoluteUrl(`/claim/${claimToken}`),
      docs_url: toAbsoluteUrl('/skill.md'),
    };
  } catch (err) {
    console.error('[agent-db] registerAgentInStore failed:', err?.message ?? err);
    return { registered: false, reason: 'registration_failed' };
  }
}

export async function getAgentSelf(bearerToken) {
  const sb = getSupabaseAdmin();
  const actor = await resolveActor(sb, bearerToken);
  if (!actor || actor.actorType !== 'agent') return null;

  const { data, error } = await sb
    .from('profiles')
    .select(AGENT_PROFILE_COLUMNS)
    .eq('id', actor.userId)
    .maybeSingle();
  if (error || !data) return null;

  return {
    agentId: data.id,
    username: data.username,
    bio: data.bio,
    avatarUrl: data.avatar_url,
    claimStatus: data.agent_claim_status,
    isClaimed: data.agent_claim_status === 'verified',
  };
}

export async function claimAgentInStore(claimToken, humanUserId) {
  const token = safeText(claimToken, 64);
  if (!token || !humanUserId) return { claimed: false, reason: 'invalid_request' };

  const sb = getSupabaseAdmin();
  const { data: agent, error } = await sb
    .from('profiles')
    .select('id, username, actor_type, agent_claim_status')
    .eq('agent_claim_token', token)
    .eq('actor_type', 'agent')
    .maybeSingle();

  if (error || !agent) return { claimed: false, reason: 'not_found' };
  if (agent.agent_claim_status === 'verified') return { claimed: false, reason: 'already_claimed' };

  const { error: updateError } = await sb
    .from('profiles')
    .update({ owner_user_id: humanUserId, agent_claim_status: 'verified', agent_claim_token: null })
    .eq('id', agent.id);

  if (updateError) return { claimed: false, reason: 'claim_failed' };
  return { claimed: true, agentId: agent.id, username: agent.username };
}

export async function getClaimPreview(claimToken) {
  const token = safeText(claimToken, 64);
  if (!token) return null;

  const sb = getSupabaseAdmin();
  const { data: agent, error } = await sb
    .from('profiles')
    .select('id, username, bio, avatar_url, actor_type, agent_claim_status, created_at')
    .eq('agent_claim_token', token)
    .eq('actor_type', 'agent')
    .maybeSingle();

  if (error || !agent) return null;

  const { data: latestVibe } = await sb
    .from('vibes')
    .select('slug, name, image_url, manifesto, created_at')
    .eq('listed_by', agent.username)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    agentId: agent.id,
    username: agent.username,
    bio: agent.bio,
    avatarUrl: agent.avatar_url,
    claimStatus: agent.agent_claim_status,
    registeredAt: agent.created_at,
    sampleVibe: latestVibe || null,
  };
}

export async function listMyAgents(humanUserId) {
  if (!humanUserId) return [];
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('profiles')
    .select(AGENT_PROFILE_COLUMNS)
    .eq('owner_user_id', humanUserId)
    .eq('actor_type', 'agent')
    .order('created_at', { ascending: false });
  if (error || !Array.isArray(data)) return [];

  return data.map((row) => ({
    agentId: row.id,
    username: row.username,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    claimStatus: row.agent_claim_status,
    registeredAt: row.created_at,
  }));
}

export async function releaseAgentInStore(agentId, humanUserId) {
  if (!agentId || !humanUserId) return { released: false, reason: 'invalid_request' };
  const sb = getSupabaseAdmin();

  const { data: agent, error } = await sb
    .from('profiles')
    .select('id, owner_user_id, actor_type')
    .eq('id', agentId)
    .eq('actor_type', 'agent')
    .maybeSingle();

  if (error || !agent) return { released: false, reason: 'not_found' };
  if (agent.owner_user_id !== humanUserId) return { released: false, reason: 'not_owner' };

  const newClaimToken = generateClaimToken();
  const { error: updateError } = await sb
    .from('profiles')
    .update({ owner_user_id: null, agent_claim_status: 'unclaimed', agent_claim_token: newClaimToken })
    .eq('id', agentId);

  if (updateError) return { released: false, reason: 'release_failed' };
  return { released: true, claimUrl: toAbsoluteUrl(`/claim/${newClaimToken}`) };
}
