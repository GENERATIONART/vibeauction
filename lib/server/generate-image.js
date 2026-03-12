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

const parseJson = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const extractOpenAIText = (payload) => {
  if (typeof payload?.output_text === 'string' && payload.output_text.trim()) return payload.output_text.trim();
  if (!Array.isArray(payload?.output)) return '';
  for (const item of payload.output) {
    if (!Array.isArray(item?.content)) continue;
    for (const part of item.content) {
      if (typeof part?.text === 'string' && part.text.trim()) return part.text.trim();
    }
  }
  return '';
};

const buildPlannerSchema = () => ({
  type: 'object',
  additionalProperties: false,
  properties: {
    subject: { type: 'string' },
    action: { type: 'string' },
    setting: { type: 'string' },
    mood: { type: 'string' },
    humorMechanic: { type: 'string' },
    styleDirection: { type: 'string' },
    compositionDirection: { type: 'string' },
    colorDirection: { type: 'string' },
    identityTraits: {
      type: 'array',
      items: { type: 'string' },
      minItems: 1,
      maxItems: 8,
    },
    hardConstraints: {
      type: 'array',
      items: { type: 'string' },
      minItems: 3,
      maxItems: 10,
    },
    negativeConstraints: {
      type: 'array',
      items: { type: 'string' },
      minItems: 5,
      maxItems: 14,
    },
  },
  required: [
    'subject',
    'action',
    'setting',
    'mood',
    'humorMechanic',
    'styleDirection',
    'compositionDirection',
    'colorDirection',
    'identityTraits',
    'hardConstraints',
    'negativeConstraints',
  ],
});

const planPromptWithOpenAI = async ({
  name,
  resolvedType,
  resolvedDescription,
  typeDirection,
}) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.OPENAI_IMAGE_PLANNER_MODEL || 'gpt-4.1-mini';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);

  const system = [
    'You create high-fidelity image plans for a vibe auction app.',
    'Goal: keep subject identity and user intent accurate while still being funny.',
    'Never change identity traits if user text implies them (ethnicity, gender presentation, age cues).',
    'Use only one clear comedic focal point and avoid random unrelated elements.',
    'Pick style/composition/color that fits the vibe, not pure randomness.',
    'Return valid JSON only following the provided schema.',
  ].join(' ');

  const user = [
    `Vibe title: ${normalizeText(name, 140)}`,
    `Vibe type: ${resolvedType}`,
    resolvedDescription ? `Vibe description: ${resolvedDescription}` : 'Vibe description: (none)',
    `Type direction: ${typeDirection}`,
    `Allowed style directions: ${STYLE_DIRECTIONS.join(' | ')}`,
    `Allowed composition directions: ${COMPOSITION_DIRECTIONS.join(' | ')}`,
    `Allowed color directions: ${COLOR_DIRECTIONS.join(' | ')}`,
    `Allowed humor approaches: ${HUMOR_DIRECTIONS.join(' | ')}`,
    'Keep hardConstraints actionable and specific.',
    'negativeConstraints must include identity drift prevention and off-topic prevention.',
  ].join('\n');

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.5,
        input: [
          { role: 'system', content: [{ type: 'input_text', text: system }] },
          { role: 'user', content: [{ type: 'input_text', text: user }] },
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'vibe_image_plan',
            strict: true,
            schema: buildPlannerSchema(),
          },
        },
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      console.error(`[generate-image] openai planner error ${response.status}:`, body);
      return null;
    }

    const payload = await response.json();
    const raw = extractOpenAIText(payload);
    const parsed = parseJson(raw);
    if (!parsed) {
      console.error('[generate-image] openai planner returned non-json output');
      return null;
    }
    return parsed;
  } catch (err) {
    clearTimeout(timeout);
    console.error('[generate-image] openai planner failed:', err?.message ?? err);
    return null;
  }
};

const compilePromptFromPlan = ({
  name,
  resolvedType,
  resolvedDescription,
  typeDirection,
  plan,
  fallback,
}) => {
  const styleDirection = normalizeText(plan?.styleDirection || fallback.styleDirection, 220);
  const compositionDirection = normalizeText(
    plan?.compositionDirection || fallback.compositionDirection,
    220,
  );
  const colorDirection = normalizeText(plan?.colorDirection || fallback.colorDirection, 220);
  const humorDirection = normalizeText(plan?.humorMechanic || fallback.humorDirection, 220);
  const subject = normalizeText(plan?.subject || name, 220);
  const action = normalizeText(plan?.action || 'comedic action centered on the vibe concept', 220);
  const setting = normalizeText(plan?.setting || 'a scene that supports the joke', 220);
  const mood = normalizeText(plan?.mood || 'funny and playful', 120);
  const identityTraits = Array.isArray(plan?.identityTraits)
    ? plan.identityTraits.map((v) => normalizeText(v, 100)).filter(Boolean).slice(0, 8)
    : [];
  const hardConstraints = Array.isArray(plan?.hardConstraints)
    ? plan.hardConstraints.map((v) => normalizeText(v, 140)).filter(Boolean).slice(0, 10)
    : [];
  const negativeConstraints = Array.isArray(plan?.negativeConstraints)
    ? plan.negativeConstraints.map((v) => normalizeText(v, 120)).filter(Boolean).slice(0, 14)
    : [];

  return [
    `Create hilarious artwork representing "${name}"`,
    `Vibe type: ${resolvedType}`,
    resolvedDescription ? `Description details to include as visual cues: ${resolvedDescription}` : null,
    `Type direction: ${typeDirection}`,
    `Primary subject: ${subject}`,
    `Action: ${action}`,
    `Setting: ${setting}`,
    `Mood: ${mood}`,
    identityTraits.length ? `Identity traits to preserve exactly: ${identityTraits.join('; ')}` : null,
    `Humor approach: ${humorDirection}`,
    `Style direction: ${styleDirection}`,
    `Composition direction: ${compositionDirection}`,
    `Color and lighting direction: ${colorDirection}`,
    hardConstraints.length ? `Hard constraints: ${hardConstraints.join('; ')}` : null,
    negativeConstraints.length ? `Negative constraints: ${negativeConstraints.join('; ')}` : null,
    'Preserve listed identity traits exactly; do not alter ethnicity, skin tone, age cues, or gender presentation unless user requested it.',
    'One clear comedic focal point. Keep all details on-topic with the vibe.',
    'No text, no words, no letters, no logos, no UI elements, no watermark',
    'Avoid graphic violence and avoid sadness as the main tone',
    'Playful absurdity is allowed, including suggestive humor when it stays comedic and non-graphic.',
  ]
    .filter(Boolean)
    .join('. ');
};

export async function generateVibeImage({ name, category, manifesto, vibeType, description }) {
  const apiKey = process.env.FAL_KEY;
  if (!apiKey) return null;

  const resolvedType = normalizeText(vibeType || category || 'Feelings', 60);
  const resolvedDescription = normalizeText(description || manifesto || '', 280);
  const seed = hashString(`${name || ''}|${resolvedType}|${resolvedDescription}`);
  const typeDirection = TYPE_DIRECTIONS[normalizeKey(resolvedType)] || TYPE_DIRECTIONS.feelings;
  const fallback = {
    styleDirection: pickBySeed(STYLE_DIRECTIONS, seed, 0),
    compositionDirection: pickBySeed(COMPOSITION_DIRECTIONS, seed, 3),
    colorDirection: pickBySeed(COLOR_DIRECTIONS, seed, 7),
    humorDirection: pickBySeed(HUMOR_DIRECTIONS, seed, 11),
  };
  const plan = await planPromptWithOpenAI({
    name,
    resolvedType,
    resolvedDescription,
    typeDirection,
  });
  const prompt = compilePromptFromPlan({
    name,
    resolvedType,
    resolvedDescription,
    typeDirection,
    plan,
    fallback,
  });

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
