/**
 * Generate an AI image for a vibe using Flux Schnell via fal.ai
 * Requires FAL_KEY environment variable
 * @param {{ name: string, category?: string, manifesto?: string, vibeType?: string, description?: string }} vibe
 * @returns {Promise<string|null>} image URL or null on failure
 */
const STYLE_DIRECTIONS = [
  'surreal editorial collage with layered paper cutout textures',
  'bold mid-century poster design with geometric forms and dramatic silhouettes',
  'stop-motion clay diorama aesthetic with tactile handmade objects',
  'expressionist digital painting with thick brush textures and playful distortion',
  'retro halftone comic look with dynamic action framing',
  'dreamy 3D toy-world render with exaggerated proportions and tiny details',
  'neo-dada photomontage style with unexpected object combinations',
  'street-art mural energy with stylized characters and punchy shapes',
  'vintage pulp cover composition with dramatic perspective',
  'minimalist vector scene with absurd props and high-contrast staging',
];

const COMPOSITION_DIRECTIONS = [
  'wide cinematic shot with a clear foreground gag and supporting background joke',
  'tight close-up on the funniest object interaction, with secondary visual punchline in the back',
  'off-center framing with strong negative space and one unmistakable comedic focal point',
  'dynamic dutch angle and exaggerated depth for chaotic funny momentum',
  'symmetrical composition that contrasts serious framing with absurd content',
];

const COLOR_DIRECTIONS = [
  'acid neon palette with high contrast and playful lighting',
  'warm candy colors with dramatic shadow shapes',
  'limited duotone palette plus one surprise accent color',
  'saturated festival palette with energetic glow highlights',
  'moody cinematic base colors with absurd bright prop accents',
];

const HUMOR_DIRECTIONS = [
  'visual irony where a serious setup has an obviously ridiculous payoff',
  'physical comedy through exaggerated motion and over-the-top reactions',
  'awkward social tension played as a silent visual joke',
  'unexpected scale mismatch (tiny thing acting powerful or huge thing acting delicate)',
  'deadpan absurdism: everything is composed seriously except one impossible detail',
];

const TYPE_DIRECTIONS = {
  feelings:
    'Translate an internal emotional state into an exaggerated physical world metaphor that still reads instantly funny.',
  moments:
    'Freeze a chaotic split-second like a comedy still frame where cause and effect are both visible.',
  confessions:
    'Visualize a secret in a cheeky, self-aware way with playful embarrassment and comedic symbolism.',
  thoughts:
    'Show inner monologue as absurd external objects or characters interacting in one scene.',
  reactions:
    'Center facial/body reaction comedy and overblown expressive poses.',
};

const normalizeText = (value, maxLen = 220) =>
  String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);

const normalizeKey = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');

const hashString = (value) => {
  let hash = 2166136261;
  const text = String(value || '');
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const pickBySeed = (choices, seed, offset = 0) => {
  if (!Array.isArray(choices) || choices.length === 0) return '';
  return choices[(seed + offset) % choices.length];
};

export async function generateVibeImage({ name, category, manifesto, vibeType, description }) {
  const apiKey = process.env.FAL_KEY;
  if (!apiKey) return null;

  const resolvedType = normalizeText(vibeType || category || 'Feelings', 60);
  const resolvedDescription = normalizeText(description || manifesto || '', 280);
  const seed = hashString(`${name || ''}|${resolvedType}|${resolvedDescription}`);
  const typeDirection = TYPE_DIRECTIONS[normalizeKey(resolvedType)] || TYPE_DIRECTIONS.feelings;
  const styleDirection = pickBySeed(STYLE_DIRECTIONS, seed, 0);
  const compositionDirection = pickBySeed(COMPOSITION_DIRECTIONS, seed, 3);
  const colorDirection = pickBySeed(COLOR_DIRECTIONS, seed, 7);
  const humorDirection = pickBySeed(HUMOR_DIRECTIONS, seed, 11);

  const promptParts = [
    `Create hilarious artwork representing "${name}"`,
    `Vibe type: ${resolvedType}`,
    resolvedDescription ? `Description details to include as visual cues: ${resolvedDescription}` : null,
    `Type direction: ${typeDirection}`,
    `Humor approach: ${humorDirection}`,
    `Style direction: ${styleDirection}`,
    `Composition direction: ${compositionDirection}`,
    `Color and lighting direction: ${colorDirection}`,
    'Must feel distinct and varied across different vibes; avoid repetitive default cartoon look',
    'This must be funny at first glance with one clear visual punchline and readable comedic situation',
    'Keep it playful and absurd',
    'No text, no words, no letters, no logos, no UI elements, no watermark',
    'Avoid violence, sadness,',
    'permit sexual suggestion for the point of them being funny and absurd'
  ].filter(Boolean);

  const prompt = promptParts.join('. ');

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const response = await fetch('https://fal.run/fal-ai/flux/schnell', {
      method: 'POST',
      headers: {
        Authorization: `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        image_size: 'landscape_4_3',
        num_images: 1,
        num_inference_steps: 4,
        enable_safety_checker: true,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      console.error(`[generate-image] fal.ai error ${response.status}:`, text);
      return null;
    }

    const data = await response.json();
    const url = data?.images?.[0]?.url ?? null;
    if (!url) console.error('[generate-image] fal.ai returned no image URL:', JSON.stringify(data));
    return url;
  } catch (err) {
    console.error('[generate-image] fetch failed:', err?.message ?? err);
    return null;
  }
}
