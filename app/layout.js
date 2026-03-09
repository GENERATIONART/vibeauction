import React from 'react';
import Providers from './providers';
import './globals.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vibeauction.com';
const SITE_NAME = 'Vibe Auction';
const DEFAULT_DESCRIPTION = "The world's first auction house for things that don't exist. Buy and sell rare feelings, cursed moments, and intangible vibes.";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: ['vibe auction', 'nft', 'feelings', 'abstract', 'auction', 'aura'],
  authors: [{ name: 'Vibe Auction' }],
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: '/api/og',
        width: 1200,
        height: 630,
        alt: 'Vibe Auction — bid on vibes',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@vibeauction',
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    images: ['/api/og'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: SITE_NAME,
  },
  formatDetection: { telephone: false },
  themeColor: '#000000',
  manifest: '/manifest.json',
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