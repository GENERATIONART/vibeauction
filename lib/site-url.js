const DEFAULT_SITE_URL = 'https://vibeauction.vercel.app';
export const SOCIAL_IMAGE_VERSION = '20260313g';

const normalizeBaseUrl = (raw) => {
  const value = String(raw || '').trim();
  if (!value) return null;
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(withProtocol);
    return `${url.protocol}//${url.host}`;
  } catch {
    return null;
  }
};

export const getSiteUrl = () =>
  normalizeBaseUrl(
    process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.VERCEL_PROJECT_PRODUCTION_URL ||
      process.env.VERCEL_URL,
  ) || DEFAULT_SITE_URL;

export const toAbsoluteUrl = (pathOrUrl = '/') => {
  const value = String(pathOrUrl || '').trim();
  if (/^https?:\/\//i.test(value)) return value;
  return new URL(value.startsWith('/') ? value : `/${value}`, getSiteUrl()).toString();
};
