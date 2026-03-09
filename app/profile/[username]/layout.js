import { getSupabaseClient } from '../../../lib/supabase-client';

export async function generateMetadata({ params }) {
  const { username } = params;

  let bio = `View @${username}'s vibe collection, auction history, and reputation on Vibe Auction.`;
  let repScore = null;

  const sb = getSupabaseClient();
  if (sb) {
    const { data } = await sb
      .from('users')
      .select('bio, reputation, display_name')
      .eq('username', username)
      .single();

    if (data) {
      if (data.bio) bio = data.bio;
      if (data.reputation) repScore = data.reputation;
    }
  }

  const title = `@${username}`;
  const description = repScore
    ? `${bio} ★ ${Number(repScore).toFixed(1)} rep.`
    : bio;
  const ogImage = `/api/og/profile?username=${encodeURIComponent(username)}`;

  return {
    title,
    description,
    openGraph: {
      title: `@${username} on Vibe Auction`,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: `@${username}` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `@${username} on Vibe Auction`,
      description,
      images: [ogImage],
    },
  };
}

export default function ProfileLayout({ children }) {
  return children;
}
