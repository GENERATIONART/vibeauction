export const VIBE_REACTION_OPTIONS = [
  { id: 'fire', label: 'Fire', emoji: '🔥' },
  { id: 'cursed', label: 'Cursed', emoji: '🫠' },
  { id: 'genius', label: 'Genius', emoji: '🧠' },
  { id: 'cope', label: 'Cope', emoji: '😭' },
  { id: 'need-this', label: 'Need This', emoji: '💸' },
];

export const VIBE_REACTION_IDS = new Set(VIBE_REACTION_OPTIONS.map((option) => option.id));
