import { createClient } from '@supabase/supabase-js';
import { toAbsoluteUrl, SOCIAL_IMAGE_VERSION } from '../../../lib/site-url.js';

export async function generateMetadata({ params }) {
  const rawUsername = params?.username || 'unknown';
  const username = String(rawUsername).replace(/^@/, '').toLowerCase();

  let bio = `View @${username}'s vibe collection, auction history, and reputation on Vibe Auction.`;
  let repScore = null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const sb =
    supabaseUrl && supabaseAnon
      ? createClient(supabaseUrl, supabaseAnon, { auth: { persistSession: false } })
      : null;

  if (sb) {
    const { data } = await sb
      .from('profiles')
      .select('username, aura_balance')
      .ilike('username', username)
      .single();

    if (data) {
      repScore = Number(data.aura_balance) || null;
    }
  }

  const title = `@${username}`;
  const description = repScore
    ? `${bio} Wallet: ${Number(repScore).toLocaleString()} AURA.`
    : bio;
  const canonical = toAbsoluteUrl(`/profile/${encodeURIComponent(username)}`);
  const ogImage = toAbsoluteUrl(`/api/og/profile?username=${encodeURIComponent(username)}&v=${SOCIAL_IMAGE_VERSION}`);

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      type: 'profile',
      siteName: 'Vibe Auction',
      url: canonical,
      title: `@${username} on Vibe Auction`,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: `@${username}` }],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@vibeauction',
      creator: '@vibeauction',
      title: `@${username} on Vibe Auction`,
      description,
      images: [{ url: ogImage, alt: `@${username}` }],
    },
  };
}

export default function ProfileLayout({ children }) {
  return children;
}
