/**
 * Generate an AI image for a vibe using Flux Schnell via fal.ai
 * Requires FAL_KEY environment variable
 * @param {{ name: string, category: string, manifesto: string }} vibe
 * @returns {Promise<string|null>} image URL or null on failure
 */
export async function generateVibeImage({ name, category, manifesto }) {
  const apiKey = process.env.FAL_KEY;
  if (!apiKey) return null;

  const promptParts = [
    `Surreal abstract artwork representing "${name}"`,
    category ? `a ${category} vibe` : null,
    manifesto ? manifesto.slice(0, 100) : null,
    'Bold graphic design, dreamlike quality, editorial art style, vivid colors, no text, no words',
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
