import App from '../react-app (9).js';
import { toAbsoluteUrl, SOCIAL_IMAGE_VERSION } from '../lib/site-url.js';

export const metadata = {
  title: 'Browse Auction Vibes',
  description: "The world's first auction house for things that don't exist. Bid on rare feelings, cursed moments, and intangible vibes using AURA.",
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    siteName: 'Vibe Auction',
    url: toAbsoluteUrl('/'),
    title: 'Vibe Auction — Bid on Vibes',
    description: "Buy and sell abstract feelings, rare moments & intangible vibes. The world's first auction house for things that don't exist.",
    images: [{ url: toAbsoluteUrl(`/api/og?v=${SOCIAL_IMAGE_VERSION}`), width: 1200, height: 630, alt: 'Vibe Auction — Bid on Vibes' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@vibeauction',
    creator: '@vibeauction',
    title: 'Vibe Auction — Bid on Vibes',
    description: "Buy and sell abstract feelings, rare moments & intangible vibes.",
    images: [{ url: toAbsoluteUrl(`/api/og?v=${SOCIAL_IMAGE_VERSION}`), alt: 'Vibe Auction — Bid on Vibes' }],
  },
};

export default function Home() {
  return <App />;
}
