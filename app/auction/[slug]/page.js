import { notFound } from 'next/navigation';
import AuctionPage from '../../../react-auction-page.js';
import { auctionItems, getAuctionItemBySlug } from '../../../lib/auction-items.js';
import { getMintedVibeBySlug } from '../../../lib/server/state-db.js';

// Pre-build the hardcoded static items at build time
export function generateStaticParams() {
  return auctionItems.map((item) => ({ slug: item.slug }));
}

// Allow slugs beyond the static list (minted vibes)
export const dynamicParams = true;

export default async function Page({ params }) {
  const slug = params?.slug;

  // Check static items first (served from static build)
  const staticVibe = getAuctionItemBySlug(slug);
  if (staticVibe) {
    return <AuctionPage vibe={staticVibe} />;
  }

  // Fall through to minted vibes (server-rendered on demand)
  const minted = await getMintedVibeBySlug(slug);
  if (!minted) {
    notFound();
  }

  const vibe = {
    id: minted.id,
    slug: minted.slug,
    emoji: minted.emoji,
    title: minted.name,
    bid: minted.startingPrice,
    timer: minted.duration,
    badge: 'New',
    category: minted.category,
    description: minted.manifesto,
  };

  return <AuctionPage vibe={vibe} />;
}
