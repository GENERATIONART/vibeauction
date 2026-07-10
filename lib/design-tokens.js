/**
 * Shared visual design tokens, modeled on the LiveAgent reference design system
 * (violet accent, near-black glass cards, pill buttons/badges, Space Grotesk).
 */

export const COLORS = {
  accent: '#8b5cf6',
  accentGradientTo: '#f0abfc', // fuchsia-300
  bg: '#09090b',
  bgElevated: '#0d0d10',
  fg: '#f4f4f5',
  textMuted: '#a3a3a3', // neutral-400
  textFaint: '#737373', // neutral-500
  textDim: '#525252', // neutral-600
  cardFill: 'rgba(255,255,255,0.03)',
  cardFillHover: 'rgba(255,255,255,0.05)',
  border: 'rgba(255,255,255,0.08)',
  borderHover: 'rgba(255,255,255,0.2)',
  borderStrong: 'rgba(255,255,255,0.15)',
  accentBorderHover: 'rgba(139,92,246,0.4)',
  glassChip: 'rgba(0,0,0,0.6)',
  red: '#dc2626',
  redDot: '#ef4444',
};

export const FONT_FAMILY = "'Space Grotesk', sans-serif";

export const RADIUS = {
  pill: '999px',
  card: '0px',
  media: '0px',
  chip: '6px',
  chipLg: '8px',
};

export const GLOW = {
  card: '0 0 40px -12px rgba(139,92,246,0.35)',
  hero: '0 0 80px -20px rgba(139,92,246,0.5)',
};

export const buttonPrimary = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: RADIUS.pill,
  background: COLORS.accent,
  color: '#000000',
  fontWeight: 600,
  border: 'none',
  cursor: 'pointer',
  transition: 'opacity 0.15s ease, transform 0.15s ease',
};

export const buttonOutline = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: RADIUS.pill,
  background: 'transparent',
  color: COLORS.fg,
  fontWeight: 600,
  border: `1px solid ${COLORS.borderStrong}`,
  cursor: 'pointer',
  transition: 'border-color 0.15s ease',
};

export const card = {
  borderRadius: RADIUS.card,
  border: `1px solid ${COLORS.border}`,
  background: COLORS.cardFill,
  transition: 'border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease',
};

export const badgeAccent = {
  display: 'inline-block',
  borderRadius: RADIUS.chip,
  background: COLORS.accent,
  color: '#000000',
  fontSize: '11px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  padding: '2px 8px',
};

export const badgeGlass = {
  display: 'inline-block',
  borderRadius: RADIUS.chip,
  background: COLORS.glassChip,
  color: COLORS.fg,
  fontSize: '11px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  padding: '2px 8px',
  backdropFilter: 'blur(6px)',
};
