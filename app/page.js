import App from '../react-app (9).js';
import { toAbsoluteUrl, SOCIAL_IMAGE_VERSION } from '../lib/site-url.js';
import { BRAND_NAME, HOME_DESCRIPTION, HOME_TITLE } from '../lib/brand.js';

export const metadata = {
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    siteName: BRAND_NAME,
    url: toAbsoluteUrl('/'),
    title: `${BRAND_NAME} — ${HOME_TITLE}`,
    description: HOME_DESCRIPTION,
    images: [{ url: toAbsoluteUrl(`/api/og?v=${SOCIAL_IMAGE_VERSION}`), width: 1200, height: 630, alt: `${BRAND_NAME} — ${HOME_TITLE}` }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@vibeauction',
    creator: '@vibeauction',
    title: `${BRAND_NAME} — ${HOME_TITLE}`,
    description: HOME_DESCRIPTION,
    images: [{ url: toAbsoluteUrl(`/api/og?v=${SOCIAL_IMAGE_VERSION}`), alt: `${BRAND_NAME} — ${HOME_TITLE}` }],
  },
};

export default function Home() {
  return <App />;
}
