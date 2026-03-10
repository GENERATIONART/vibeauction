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

  try {
    const response = await fetch('https://fal.run/fal-ai/flux/schnell', {
      method: 'POST',
      headers: {
        Authorization: `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: promptParts.join('. '),
        image_size: 'landscape_4_3',
        num_images: 1,
        num_inference_steps: 4,
        enable_safety_checker: true,
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data?.images?.[0]?.url ?? null;
  } catch {
    return null;
  }
}
