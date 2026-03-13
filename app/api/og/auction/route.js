import { ImageResponse } from 'next/og';
import { getAuctionItemBySlug } from '../../../../lib/auction-items.js';
import { getMintedVibeBySlug } from '../../../../lib/server/state-db.js';

export const runtime = 'nodejs';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug') || '';

  let title = 'Vibe Auction';
  let bid = 0;

  try {
    const staticVibe = getAuctionItemBySlug(slug);
    const minted = staticVibe ? null : await getMintedVibeBySlug(slug);
    const vibe = staticVibe ?? minted;
    if (vibe) {
      title = staticVibe ? staticVibe.title : (vibe.name || vibe.title || 'Vibe Auction');
      bid = staticVibe ? staticVibe.bid : (vibe.startingPrice || 0);
    }
  } catch {
    // use defaults
  }

  const fs = title.length > 60 ? '56px' : title.length > 40 ? '72px' : title.length > 24 ? '88px' : '110px';

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: '#C8FF00',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          padding: '60px 80px',
        }}
      >
        <div style={{
          fontSize: fs,
          fontWeight: 900,
          color: '#000000',
          textTransform: 'uppercase',
          letterSpacing: '-2px',
          lineHeight: 1.0,
          display: 'flex',
          textAlign: 'center',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          {title}
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginTop: '32px',
        }}>
          <div style={{
            fontSize: '20px',
            color: '#444444',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '4px',
            display: 'flex',
          }}>
            opening bid
          </div>
          <div style={{
            fontSize: '44px',
            fontWeight: 900,
            color: '#000000',
            letterSpacing: '-1px',
            display: 'flex',
          }}>
            {Number(bid || 0).toLocaleString()} AURA
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
