import { redirect } from 'next/navigation';
import { defaultAuctionSlug } from '../../lib/auction-items.js';

export default function Page() {
  redirect(`/auction/${defaultAuctionSlug}`);
}
