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

const HUMOR_INTENSIFIERS = [
  'thumbnail test: the joke should be understandable in under 1 second',
  'single unmistakable punchline object or action in the foreground',
  'one supporting secondary gag in the background only if it does not dilute the main joke',
  'facial expressions and body language should clearly sell the bit',
  'prefer specific visual jokes over generic whimsy',
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

export const VIBE_CATEGORIES = [
  'Feelings',
  'Moments',
  'Confessions',
  'Permissions',
  'Powers',
  'Excuses',
  'Identity Crises',
  'Social Disasters',
  'Hot Takes',
  'Relationship Chaos',
  'Workplace Absurdity',
  'Internet Behavior',
  'Nightlife Lore',
  'Daily Delusions',
  'Petty Victories',
  'Main Character Energy',
  'Unhinged Ideas',
  'Core Memories',
];

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

const keywordCategoryFallback = ({ name, description }) => {
  const text = `${name || ''} ${description || ''}`.toLowerCase();
  const rules = [
    { category: 'Relationship Chaos', test: /(ex|breakup|dating|situationship|boyfriend|girlfriend|crush|kiss|cheat)/ },
    { category: 'Workplace Absurdity', test: /(boss|meeting|office|slack|deadline|coworker|corporate|job)/ },
    { category: 'Internet Behavior', test: /(twitter|x\.com|reddit|discord|meme|viral|tiktok|influencer|comment section)/ },
    { category: 'Nightlife Lore', test: /(bar|club|party|hangover|shots|afterparty|bouncer)/ },
    { category: 'Social Disasters', test: /(cringe|embarrass|awkward|secondhand shame|public fail|humiliated)/ },
    { category: 'Identity Crises', test: /(who am i|identity|midlife|quarter life|existential|imposter)/ },
    { category: 'Main Character Energy', test: /(main character|spotlight|dramatic entrance|cinematic)/ },
    { category: 'Hot Takes', test: /(hot take|unpopular opinion|controversial|debate)/ },
    { category: 'Petty Victories', test: /(petty|revenge|won anyway|small win|spite)/ },
    { category: 'Unhinged Ideas', test: /(chaos|unhinged|deranged|insane plan|wild idea)/ },
    { category: 'Core Memories', test: /(nostalgia|childhood|remember when|core memory|throwback)/ },
    { category: 'Permissions', test: /(permission|allowed to|can i|hall pass)/ },
    { category: 'Powers', test: /(superpower|ability|power to|x-ray vision|teleport|time travel)/ },
    { category: 'Excuses', test: /(excuse|sorry i|my bad|couldn.t make it|late because)/ },
    { category: 'Moments', test: /(moment|instantly|that time|split second|in public)/ },
  ];
  for (const rule of rules) {
    if (rule.test.test(text)) return rule.category;
  }
  return 'Feelings';
};

const buildCategorySchema = () => ({
  type: 'object',
  additionalProperties: false,
  properties: {
    category: { type: 'string' },
  },
  required: ['category'],
});

export async function inferVibeCategory({ name, description }) {
  const safeName = normalizeText(name, 140);
  const safeDescription = normalizeText(description, 700);
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return keywordCategoryFallback({ name: safeName, description: safeDescription });

  const model =
    process.env.OPENAI_CATEGORY_MODEL ||
    process.env.OPENAI_IMAGE_PLANNER_MODEL ||
    'gpt-4.1-mini';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);

  const system = [
    'You classify vibe-auction listings into exactly one category.',
    'Return JSON only, matching the schema.',
    'Pick the single best category for the user intent.',
  ].join(' ');

  const user = [
    `Title: ${safeName || '(none)'}`,
    `Description: ${safeDescription || '(none)'}`,
    `Allowed categories: ${VIBE_CATEGORIES.join(' | ')}`,
    'Choose exactly one from allowed categories.',
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
        temperature: 0,
        input: [
          { role: 'system', content: [{ type: 'input_text', text: system }] },
          { role: 'user', content: [{ type: 'input_text', text: user }] },
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'vibe_category',
            strict: true,
            schema: buildCategorySchema(),
          },
        },
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      console.error(`[generate-image] openai category error ${response.status}:`, body);
      return keywordCategoryFallback({ name: safeName, description: safeDescription });
    }

    const payload = await response.json();
    const raw = extractOpenAIText(payload);
    const parsed = parseJson(raw);
    const chosen = normalizeText(parsed?.category, 80);
    if (VIBE_CATEGORIES.includes(chosen)) return chosen;
    return keywordCategoryFallback({ name: safeName, description: safeDescription });
  } catch (err) {
    clearTimeout(timeout);
    console.error('[generate-image] openai category failed:', err?.message ?? err);
    return keywordCategoryFallback({ name: safeName, description: safeDescription });
  }
}

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
    'Comedy quality bar is high: produce punchy, absurd, internet-native humor that reads instantly.',
    'Avoid bland or merely pretty outputs; prioritize visual joke clarity and comedic tension.',
    'Do not produce generic cartoons without a specific joke mechanic tied to the vibe text.',
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
    `Humor intensity requirements: ${HUMOR_INTENSIFIERS.join(' | ')}`,
    'Select exactly one humor approach as primary and reflect it in humorMechanic.',
    'hardConstraints must include comedic readability (thumbnail test) and subject fidelity.',
    'Keep hardConstraints actionable and specific.',
    'negativeConstraints must include identity drift prevention and off-topic prevention.',
    'negativeConstraints must include: bland scene, no clear joke, generic stock illustration vibe.',
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
  customPromptText,
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
    customPromptText ? `User image direction: ${customPromptText}` : null,
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

export async function generateVibeImage({ name, category, manifesto, vibeType, description, styleOverride, compositionOverride, colorOverride, humorOverride, customPromptText }) {
  const apiKey = process.env.FAL_KEY;
  if (!apiKey) {
    console.error('[generate-image] FAL_KEY is not set — image generation skipped');
    return null;
  }

  const resolvedType = normalizeText(vibeType || category || 'Feelings', 60);
  const resolvedDescription = normalizeText(description || manifesto || '', 280);
  const seed = hashString(`${name || ''}|${resolvedType}|${resolvedDescription}`);
  const typeDirection = TYPE_DIRECTIONS[normalizeKey(resolvedType)] || TYPE_DIRECTIONS.feelings;
  const fallback = {
    styleDirection: (styleOverride && STYLE_DIRECTIONS.includes(styleOverride)) ? styleOverride : pickBySeed(STYLE_DIRECTIONS, seed, 0),
    compositionDirection: (compositionOverride && COMPOSITION_DIRECTIONS.includes(compositionOverride)) ? compositionOverride : pickBySeed(COMPOSITION_DIRECTIONS, seed, 3),
    colorDirection: (colorOverride && COLOR_DIRECTIONS.includes(colorOverride)) ? colorOverride : pickBySeed(COLOR_DIRECTIONS, seed, 7),
    humorDirection: (humorOverride && HUMOR_DIRECTIONS.includes(humorOverride)) ? humorOverride : pickBySeed(HUMOR_DIRECTIONS, seed, 11),
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
    customPromptText: customPromptText ? normalizeText(customPromptText, 300) : null,
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
