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

export async function generateMetadata({ params }) {
  const slug = params?.slug;
  const staticVibe = getAuctionItemBySlug(slug);
  const vibe = staticVibe ?? (await getMintedVibeBySlug(slug));

  if (!vibe) {
    return { title: 'Auction Not Found' };
  }

  const title = staticVibe ? staticVibe.title : vibe.name;
  const emoji = staticVibe ? staticVibe.emoji : (vibe.emoji || '✨');
  const bid = staticVibe ? staticVibe.bid : vibe.startingPrice;
  const description = `${emoji} Bid now on "${title}" — current bid ${Number(bid || 0).toLocaleString()} AURA. Live on Vibe Auction.`;
  const ogImage = `/api/og/auction?slug=${encodeURIComponent(slug)}`;

  return {
    title: `${emoji} ${title}`,
    description,
    openGraph: {
      title: `${emoji} ${title} — Live Auction`,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${emoji} ${title} — Live Auction`,
      description,
      images: [ogImage],
    },
  };
}

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
    buyNowPrice: minted.buyNowPrice ?? null,
    imageUrl: minted.imageUrl ?? null,
    timer: minted.duration,
    badge: 'New',
    category: minted.category,
    description: minted.manifesto,
  };

  return <AuctionPage vibe={vibe} />;
}
