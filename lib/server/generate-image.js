/**
 * Generate an AI image for a vibe using Flux Schnell via fal.ai
 * Requires FAL_KEY environment variable
 * @param {{ name: string, category: string, manifesto: string }} vibe
 * @returns {Promise<string|null>} image URL or null on failure
 */
export async function generateVibeImage({ name, category, manifesto }) {
  const apiKey = process.env.FAL_KEY;
  if (!apiKey) return null;

  const manifestoSnippet = String(manifesto || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 220);

  const promptParts = [
    `Create a surreal comedic illustration representing "${name}"`,
    category ? `Theme/category: ${category}` : null,
    manifestoSnippet ? `Comedic premise inspiration: ${manifestoSnippet}` : null,
    'This must be obviously funny at first glance: one clear visual punchline, absurd situation, playful irony, exaggerated expressions/body language, and whimsical props',
    'Lean into meme-like energy while staying artistic: bold graphic design, dreamlike editorial style, vivid colors, high contrast, dynamic composition',
    'Use tasteful humor and light chaos; avoid boring or serious mood',
    'No text, no words, no letters, no logos, no UI elements, no watermark',
    'Avoid photorealism, violence, gore, horror, sadness, or bleak tone',
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
