import { notFound } from 'next/navigation';
import AuctionPage from '../../../react-auction-page.js';
import { getMintedVibeBySlug } from '../../../lib/server/state-db.js';
import { toAbsoluteUrl, SOCIAL_IMAGE_VERSION } from '../../../lib/site-url.js';
import { BRAND_NAME } from '../../../lib/brand.js';

export function generateStaticParams() {
  return [];
}

// Allow slugs beyond the static list (minted vibes)
export const dynamicParams = true;

export async function generateMetadata({ params }) {
  const slug = params?.slug;
  const vibe = await getMintedVibeBySlug(slug);

  if (!vibe) {
    return { title: 'Auction Not Found' };
  }

  const title = vibe.name;
  const bid = vibe.startingPrice;
  const description = `Bid on "${title}" — a collectible vibe with a live price of ${Number(bid || 0).toLocaleString()} AURA on ${BRAND_NAME}.`;
  const canonical = toAbsoluteUrl(`/auction/${encodeURIComponent(String(slug || ''))}`);
  const ogImage = toAbsoluteUrl(`/api/og/auction?slug=${encodeURIComponent(String(slug || ''))}&v=${SOCIAL_IMAGE_VERSION}`);

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      type: 'website',
      siteName: BRAND_NAME,
      url: canonical,
      title: `${title} — Live Market Listing`,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@vibeauction',
      creator: '@vibeauction',
      title: `${title} — Live Market Listing`,
      description,
      images: [{ url: ogImage, alt: title }],
    },
  };
}

export default async function Page({ params }) {
  const slug = params?.slug;

  // Fall through to minted vibes (server-rendered on demand)
  const minted = await getMintedVibeBySlug(slug);
  if (!minted) {
    notFound();
  }

  const vibe = {
    id: minted.id,
    slug: minted.slug,
    title: minted.name,
    bid: minted.startingPrice,
    buyNowPrice: minted.buyNowPrice ?? null,
    imageUrl: minted.imageUrl ?? null,
    timer: minted.duration,
    endTime: minted.endTime ?? null,
    badge: minted.endTime && new Date(minted.endTime).getTime() <= Date.now() ? null : 'New',
    category: minted.category,
    description: minted.manifesto,
    author: minted.author ?? null,
    listedBy: minted.listedBy ?? null,
    remixSourceSlug: minted.remixSourceSlug ?? null,
    remixSourceName: minted.remixSourceName ?? null,
    remixSourceAuthor: minted.remixSourceAuthor ?? null,
  };

  return <AuctionPage vibe={vibe} />;
}
