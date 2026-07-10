import { notFound } from 'next/navigation';
import NavBar from '../../components/NavBar';
import VibeDetail from '../../components/VibeDetail';
import { getMintedVibeBySlug } from '../../../lib/server/state-db.js';
import { toAbsoluteUrl, SOCIAL_IMAGE_VERSION } from '../../../lib/site-url.js';
import { BRAND_NAME } from '../../../lib/brand.js';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }) {
  const slug = params?.slug;
  const vibe = await getMintedVibeBySlug(slug);

  if (!vibe) {
    return { title: 'Vibe Not Found' };
  }

  const title = vibe.name;
  const description = vibe.manifesto
    ? vibe.manifesto.slice(0, 200)
    : `"${title}" — an AI-generated vibe on ${BRAND_NAME}.`;
  const canonical = toAbsoluteUrl(`/vibe/${encodeURIComponent(String(slug || ''))}`);
  const ogImage = toAbsoluteUrl(`/api/og/auction?slug=${encodeURIComponent(String(slug || ''))}&v=${SOCIAL_IMAGE_VERSION}`);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      siteName: BRAND_NAME,
      url: canonical,
      title,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@vibeauction',
      creator: '@vibeauction',
      title,
      description,
      images: [{ url: ogImage, alt: title }],
    },
  };
}

export default async function Page({ params }) {
  const slug = params?.slug;
  const minted = await getMintedVibeBySlug(slug);
  if (!minted) {
    notFound();
  }

  const vibe = {
    id: minted.id,
    slug: minted.slug,
    name: minted.name,
    imageUrl: minted.imageUrl ?? null,
    category: minted.category,
    manifesto: minted.manifesto,
    isAnonymous: minted.isAnonymous,
    author: minted.author ?? null,
    listedBy: minted.listedBy ?? null,
    authorActorType: minted.authorActorType ?? null,
    remixSourceSlug: minted.remixSourceSlug ?? null,
    remixSourceName: minted.remixSourceName ?? null,
    remixSourceAuthor: minted.remixSourceAuthor ?? null,
  };

  return (
    <div style={{ minHeight: '100dvh', background: '#09090b' }}>
      <NavBar />
      <VibeDetail vibe={vibe} />
    </div>
  );
}
