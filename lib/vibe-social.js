export const VIBE_REACTION_OPTIONS = [
  { id: 'fire', label: 'Fire' },
  { id: 'cursed', label: 'Cursed' },
  { id: 'genius', label: 'Genius' },
  { id: 'cope', label: 'Cope' },
  { id: 'need-this', label: 'Need This' },
];

export const VIBE_REACTION_IDS = new Set(VIBE_REACTION_OPTIONS.map((option) => option.id));
