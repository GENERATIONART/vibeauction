export const GRADUATION_AURA_TARGET = 25000;
export const GRADUATION_MIN_PARTICIPANTS = 25;
export const GRADUATION_MIN_REACTIONS = 20;
export const GRADUATION_MIN_COMMENTS = 6;
export const GRADUATION_MAX_PER_WEEK = 2;
export const GRADUATION_WINDOW_DAYS = 7;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function computeGraduationScore({
  currentAura = 0,
  uniqueParticipants = 0,
  totalReactions = 0,
  commentCount = 0,
  remixCount = 0,
  recentBidCount = 0,
}) {
  return Math.round(
    currentAura * 0.55 +
    uniqueParticipants * 180 +
    totalReactions * 45 +
    commentCount * 90 +
    remixCount * 140 +
    recentBidCount * 120,
  );
}

export function buildGraduationSnapshot({
  currentAura = 0,
  uniqueParticipants = 0,
  totalReactions = 0,
  commentCount = 0,
  remixCount = 0,
  recentBidCount = 0,
  weeklyRank = null,
}) {
  const auraProgress = clamp(currentAura / GRADUATION_AURA_TARGET, 0, 1);
  const participantProgress = clamp(uniqueParticipants / GRADUATION_MIN_PARTICIPANTS, 0, 1);
  const reactionProgress = clamp(totalReactions / GRADUATION_MIN_REACTIONS, 0, 1);
  const commentProgress = clamp(commentCount / GRADUATION_MIN_COMMENTS, 0, 1);
  const score = computeGraduationScore({
    currentAura,
    uniqueParticipants,
    totalReactions,
    commentCount,
    remixCount,
    recentBidCount,
  });

  const meetsThresholds =
    currentAura >= GRADUATION_AURA_TARGET &&
    uniqueParticipants >= GRADUATION_MIN_PARTICIPANTS &&
    totalReactions >= GRADUATION_MIN_REACTIONS &&
    commentCount >= GRADUATION_MIN_COMMENTS;
  const graduated = meetsThresholds && Number.isFinite(weeklyRank) && weeklyRank <= GRADUATION_MAX_PER_WEEK;

  let state = 'launching';
  let label = 'Launching';
  if (graduated) {
    state = 'graduated';
    label = 'Graduated';
  } else if (meetsThresholds) {
    state = 'breakout';
    label = 'Breakout';
  } else if (auraProgress >= 0.45 || participantProgress >= 0.45 || reactionProgress >= 0.45) {
    state = 'heating';
    label = 'Heating Up';
  }

  return {
    state,
    label,
    graduated,
    score,
    weeklyRank: Number.isFinite(weeklyRank) ? weeklyRank : null,
    currentAura,
    targetAura: GRADUATION_AURA_TARGET,
    uniqueParticipants,
    minParticipants: GRADUATION_MIN_PARTICIPANTS,
    totalReactions,
    minReactions: GRADUATION_MIN_REACTIONS,
    commentCount,
    minComments: GRADUATION_MIN_COMMENTS,
    remixCount,
    recentBidCount,
    auraProgressPct: Math.round(auraProgress * 100),
    participantProgressPct: Math.round(participantProgress * 100),
    reactionProgressPct: Math.round(reactionProgress * 100),
    commentProgressPct: Math.round(commentProgress * 100),
  };
}
