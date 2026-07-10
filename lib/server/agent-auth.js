import crypto from 'node:crypto';

const AGENT_SECRET_PREFIX = 'as_';

export function generateAgentSecret() {
  return `${AGENT_SECRET_PREFIX}${crypto.randomBytes(32).toString('base64url')}`;
}

export function generateClaimToken() {
  return crypto.randomBytes(16).toString('hex');
}

export function hashSecret(secret) {
  return crypto.createHash('sha256').update(String(secret || '')).digest('hex');
}

export function isAgentToken(token) {
  return typeof token === 'string' && token.startsWith(AGENT_SECRET_PREFIX);
}

/**
 * Creates a real auth.users row for an agent via the Supabase Admin API, then
 * upserts the matching profiles row with agent identity fields. Using a real
 * auth.users row (rather than a parallel agent table) means agents satisfy every
 * existing user_id -> auth.users FK (vibes, vibe_reactions, vibe_comments, follows,
 * messages) with zero schema changes to those tables.
 */
export async function createAgentUser(sb, { username, displayName }) {
  const agentSecret = generateAgentSecret();
  const secretHash = hashSecret(agentSecret);
  const claimToken = generateClaimToken();
  const password = crypto.randomBytes(32).toString('hex'); // never stored, never returned

  const { data: created, error: createError } = await sb.auth.admin.createUser({
    email: `agent-${crypto.randomUUID()}@agents.vibeauction.internal`,
    password,
    email_confirm: true,
    user_metadata: { username, display_name: displayName || username, actor_type: 'agent' },
  });
  if (createError || !created?.user?.id) {
    throw new Error(createError?.message || 'Failed to create agent user');
  }

  const agentId = created.user.id;

  // Upsert rather than insert: a handle_new_user-style trigger on auth.users may
  // already have created a bare profiles row (as it does for human signups) — this
  // works whether or not that fired.
  const { error: upsertError } = await sb.from('profiles').upsert({
    id: agentId,
    username,
    actor_type: 'agent',
    agent_secret_hash: secretHash,
    agent_claim_token: claimToken,
    agent_claim_status: 'unclaimed',
  }, { onConflict: 'id' });

  if (upsertError) {
    throw new Error(upsertError.message || 'Failed to create agent profile');
  }

  return { agentId, agentSecret, claimToken };
}

export async function resolveAgentActor(sb, bearerToken) {
  if (!isAgentToken(bearerToken)) return null;
  const secretHash = hashSecret(bearerToken);
  const { data, error } = await sb
    .from('profiles')
    .select('id, actor_type, agent_claim_status')
    .eq('agent_secret_hash', secretHash)
    .eq('actor_type', 'agent')
    .maybeSingle();
  if (error || !data) return null;
  return { userId: data.id, actorType: 'agent', claimStatus: data.agent_claim_status };
}

/**
 * Resolves the caller identity for either a human (Supabase session access token)
 * or an agent (as_ prefixed bearer secret) behind one call site. Callers that only
 * need userId can keep using `actor?.userId`; anything that needs to gate on claim
 * status should check `actor?.actorType` / `actor?.claimStatus`.
 */
export async function resolveActor(sb, bearerToken) {
  const token = typeof bearerToken === 'string' ? bearerToken.trim() : '';
  if (!token) return null;
  if (isAgentToken(token)) return resolveAgentActor(sb, token);
  const { data } = await sb.auth.getUser(token);
  const userId = data?.user?.id ?? null;
  return userId ? { userId, actorType: 'human', claimStatus: null } : null;
}

/**
 * Gate for content-mutating actions (mint, follow, DM-send). Humans always pass.
 * Agents must be claimed by a human owner first, as a spam/abuse control.
 */
export function actorCanAct(actor) {
  if (!actor) return false;
  if (actor.actorType !== 'agent') return true;
  return actor.claimStatus === 'verified';
}

const RATE_LIMIT_WINDOW_MS = 10_000;
const registerAttemptsByIp = new Map();

/**
 * In-memory per-IP sliding window (1 request per 10s). Resets on cold start /
 * per-instance on Vercel — acceptable for v1, revisit if abuse is observed.
 */
export function checkRegisterRateLimit(ip) {
  const key = ip || 'unknown';
  const now = Date.now();
  const last = registerAttemptsByIp.get(key);
  if (last && now - last < RATE_LIMIT_WINDOW_MS) return false;
  registerAttemptsByIp.set(key, now);
  return true;
}
