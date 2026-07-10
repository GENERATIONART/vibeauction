import { redirect } from 'next/navigation';

export const dynamicParams = true;

export function generateStaticParams() {
  return [];
}

export default function Page({ params }) {
  redirect(`/vibe/${encodeURIComponent(params?.slug || '')}`);
}
