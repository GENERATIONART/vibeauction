import { ImageResponse } from 'next/og';
import { getAuctionItemBySlug } from '../../../../lib/auction-items.js';
import { getMintedVibeBySlug } from '../../../../lib/server/state-db.js';

export const runtime = 'nodejs';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug') || '';

  let title = 'Vibe Auction';
  let bid = 0;
  let imageUrl = null;

  try {
    const staticVibe = getAuctionItemBySlug(slug);
    const minted = staticVibe ? null : await getMintedVibeBySlug(slug);
    const vibe = staticVibe ?? minted;
    if (vibe) {
      title = staticVibe ? staticVibe.title : (vibe.name || vibe.title || title);
      bid = staticVibe ? staticVibe.bid : (vibe.startingPrice || 0);
      imageUrl = staticVibe ? null : (vibe.imageUrl ?? null);
    }
  } catch {
    // use defaults
  }

  const fs = title.length > 60 ? '44px' : title.length > 40 ? '54px' : title.length > 24 ? '66px' : '80px';

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
          background: '#000',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Full-bleed vibe image */}
        {imageUrl && (
          <img
            src={imageUrl}
            style={{
              position: 'absolute',
              top: 0, left: 0,
              width: '1200px',
              height: '630px',
              objectFit: 'cover',
              display: 'flex',
            }}
          />
        )}

        {/* Gradient overlay so text is always readable */}
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0,
          width: '1200px',
          height: imageUrl ? '320px' : '630px',
          background: imageUrl
            ? 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 60%, transparent 100%)'
            : '#000000',
          display: 'flex',
        }} />

        {/* Text block pinned to bottom */}
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0,
          width: '1200px',
          padding: '0 64px 48px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          <div style={{
            fontSize: fs,
            fontWeight: 900,
            color: '#FFFFFF',
            textTransform: 'uppercase',
            letterSpacing: '-1px',
            lineHeight: 1.05,
            display: 'flex',
            flexWrap: 'wrap',
          }}>
            {title}
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <div style={{
              background: '#C8FF00',
              color: '#000',
              padding: '6px 16px',
              fontSize: '18px',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '2px',
              display: 'flex',
            }}>
              PLACE BID
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#C8FF00',
              display: 'flex',
            }}>
              {Number(bid || 0).toLocaleString()} AURA
            </div>
          </div>
        </div>

        {/* Top-left brand badge */}
        <div style={{
          position: 'absolute',
          top: '28px',
          left: '40px',
          background: '#C8FF00',
          color: '#000',
          padding: '6px 14px',
          fontSize: '16px',
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: '2px',
          display: 'flex',
        }}>
          VIBE AUCTION
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
