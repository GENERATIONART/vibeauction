export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vibeauction.com';

  // Static routes
  const staticRoutes = ['', '/auctions', '/leaderboard', '/mint'].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: path === '' ? 1 : 0.8,
  }));

  // Dynamic auction routes
  let auctionRoutes = [];
  try {
    const res = await fetch(`${baseUrl}/api/auctions/history?limit=100&status=active`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      auctionRoutes = (data.auctions || []).map((a) => ({
        url: `${baseUrl}/auction/${a.slug}`,
        lastModified: new Date(a.updatedAt || a.createdAt || Date.now()),
        changeFrequency: 'hourly',
        priority: 0.9,
      }));
    }
  } catch {}

  return [...staticRoutes, ...auctionRoutes];
}
