import React from 'react';
import Providers from './providers';
import './globals.css';
import { getSiteUrl, toAbsoluteUrl, SOCIAL_IMAGE_VERSION } from '../lib/site-url.js';

const SITE_URL = getSiteUrl();
const SITE_NAME = 'Vibe Auction';
const DEFAULT_DESCRIPTION = "The world's first auction house for things that don't exist. Buy and sell rare feelings, cursed moments, and intangible vibes.";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  alternates: {
    canonical: '/',
  },
  keywords: ['vibe auction', 'nft', 'feelings', 'abstract', 'auction', 'aura'],
  authors: [{ name: 'Vibe Auction' }],
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    url: SITE_URL,
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: toAbsoluteUrl(`/api/og?v=${SOCIAL_IMAGE_VERSION}`),
        width: 1200,
        height: 630,
        alt: 'Vibe Auction — bid on vibes',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@vibeauction',
    creator: '@vibeauction',
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    images: [{ url: toAbsoluteUrl(`/api/og?v=${SOCIAL_IMAGE_VERSION}`), alt: 'Vibe Auction — bid on vibes' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: SITE_NAME,
  },
  formatDetection: { telephone: false },
  manifest: '/manifest.json',
};

export const viewport = {
  themeColor: '#000000',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
