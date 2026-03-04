export const defaultAuctionSlug = 'permission-to-leave-early';

export const auctionItems = [
  {
    id: 1,
    slug: 'confidence-after-fresh-haircut',
    emoji: '✂️',
    title: 'Haircut confidence before the neck itch starts',
    bid: 850,
    timer: '04h 12m',
    badge: 'Live',
    category: 'Feelings',
    description:
      'That 17-minute window where you feel like a celebrity before tiny haircut hairs start crawling down your shirt.',
  },
  {
    id: 2,
    slug: 'permission-to-leave-early',
    emoji: '🚽',
    title: 'Permission to fake a bathroom emergency and bounce',
    bid: 1200,
    timer: '12m 30s',
    badge: 'Hot',
    category: 'Permissions',
    description:
      'A legendary social escape card that lets you whisper "be right back" and disappear from any awkward gathering.',
  },
  {
    id: 3,
    slug: 'the-feeling-of-inbox-zero',
    emoji: '🧄',
    title: "Burp that tastes like last night's garlic bread",
    bid: 3400,
    timer: '1d 04h',
    badge: null,
    category: 'Feelings',
    description:
      'Nostalgic, powerful, and a little dangerous in enclosed spaces. Pairs perfectly with regret and sparkling water.',
  },
  {
    id: 4,
    slug: 'sudden-burst-of-energy-at-2am',
    emoji: '🍕',
    title: '2AM second wind powered by cold pizza crust',
    bid: 150,
    timer: '56m 10s',
    badge: 'Rare',
    category: 'Moments',
    description:
      'You should be asleep, but now you are reorganizing your closet and writing business plans in notes app.',
  },
  {
    id: 5,
    slug: 'canceling-plans-guilt-free',
    emoji: '🫃',
    title: 'Canceling brunch because your stomach is negotiating',
    bid: 9001,
    timer: '02m 05s',
    badge: null,
    category: 'Permissions',
    description:
      'A premium cancellation shield for days when your digestive system starts a full committee meeting.',
  },
  {
    id: 6,
    slug: 'the-extra-fry-in-the-bag',
    emoji: '🧅',
    title: 'The mystery onion ring hiding in your fries',
    bid: 420,
    timer: '08h 22m',
    badge: null,
    category: 'Moments',
    description:
      'Unexpected bonus carb. Tiny victory. Immediate emotional attachment to a deep-fried stranger.',
  },
  {
    id: 7,
    slug: 'fart-turned-into-a-situation',
    emoji: '💨',
    title: 'Farting and realizing it was absolutely more than a fart',
    bid: 2250,
    timer: '03h 03m',
    badge: 'Hot',
    category: 'Feelings',
    description:
      'The exact millisecond where confidence leaves your body and every available exit becomes spiritually important.',
  },
  {
    id: 8,
    slug: 'accidental-food-moan',
    emoji: '🍝',
    title: 'Accidentally moaning at pasta in a crowded restaurant',
    bid: 1775,
    timer: '42m 19s',
    badge: 'Live',
    category: 'Moments',
    description:
      'A forkful hits, you make a sound, and suddenly every table within 20 feet is invested in your love life.',
  },
  {
    id: 9,
    slug: 'thats-what-she-said-reflex',
    emoji: '😏',
    title: 'Saying "that\'s what she said" to your manager on Zoom',
    bid: 666,
    timer: '06h 11m',
    badge: 'Rare',
    category: 'Excuses',
    description:
      'Your brain fires faster than HR policy. You are now living in post-joke consequence mode.',
  },
  {
    id: 10,
    slug: 'gym-trainer-harder-regret',
    emoji: '🏋️',
    title: 'Yelling "harder" at your trainer and hearing yourself too late',
    bid: 990,
    timer: '05h 54m',
    badge: null,
    category: 'Powers',
    description:
      'Motivational intent, catastrophic phrasing. You now avoid eye contact with the entire weight room.',
  },
];

const categoryTagMap = {
  Feelings: 'Feeling',
  Permissions: 'Permission',
  Moments: 'Moment',
  Powers: 'Power',
  Excuses: 'Excuse',
};

export function getAuctionItemBySlug(slug) {
  return auctionItems.find((item) => item.slug === slug) || null;
}

export function getCategoryTag(category) {
  return categoryTagMap[category] || 'Vibe';
}
