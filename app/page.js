import App from '../react-app (9).js';

export const metadata = {
  title: 'Browse Auction Vibes',
  description: "The world's first auction house for things that don't exist. Bid on rare feelings, cursed moments, and intangible vibes using AURA.",
  openGraph: {
    title: 'Vibe Auction — Bid on Vibes',
    description: "Buy and sell abstract feelings, rare moments & intangible vibes. The world's first auction house for things that don't exist.",
    images: [{ url: '/api/og', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vibe Auction — Bid on Vibes',
    description: "Buy and sell abstract feelings, rare moments & intangible vibes.",
    images: ['/api/og'],
  },
};

export default function Home() {
  return <App />;
}
