export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vibeauction.com';

  // Static routes
  const staticRoutes = ['', '/mint', '/swipe', '/about'].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: path === '' ? 1 : 0.8,
  }));

  // Dynamic vibe routes
  let vibeRoutes = [];
  try {
    const res = await fetch(`${baseUrl}/api/state/feed?limit=100`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      vibeRoutes = (data.vibes || []).map((v) => ({
        url: `${baseUrl}/vibe/${v.slug}`,
        lastModified: new Date(v.createdAt || Date.now()),
        changeFrequency: 'hourly',
        priority: 0.9,
      }));
    }
  } catch {}

  return [...staticRoutes, ...vibeRoutes];
}
