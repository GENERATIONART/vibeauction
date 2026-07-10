import React from 'react';
import Providers from './providers';
import './globals.css';
import { getSiteUrl, toAbsoluteUrl, SOCIAL_IMAGE_VERSION } from '../lib/site-url.js';
import { BRAND_DESCRIPTION, BRAND_NAME, BRAND_OG_ALT } from '../lib/brand.js';

const SITE_URL = getSiteUrl();
const SITE_NAME = BRAND_NAME;
const DEFAULT_DESCRIPTION = BRAND_DESCRIPTION;

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
  authors: [{ name: SITE_NAME }],
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
        alt: BRAND_OG_ALT,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@vibeauction',
    creator: '@vibeauction',
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    images: [{ url: toAbsoluteUrl(`/api/og?v=${SOCIAL_IMAGE_VERSION}`), alt: BRAND_OG_ALT }],
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
  themeColor: '#09090b',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
