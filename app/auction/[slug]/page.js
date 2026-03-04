import { notFound } from 'next/navigation';
import AuctionPage from '../../../react-auction-page.js';
import { auctionItems, getAuctionItemBySlug } from '../../../lib/auction-items.js';

export function generateStaticParams() {
  return auctionItems.map((item) => ({ slug: item.slug }));
}

export default function Page({ params }) {
  const vibe = getAuctionItemBySlug(params?.slug);

  if (!vibe) {
    notFound();
  }

  return <AuctionPage vibe={vibe} />;
}
