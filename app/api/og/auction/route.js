import { ImageResponse } from 'next/og';
import { getAuctionItemBySlug } from '../../../../lib/auction-items.js';
import { getMintedVibeBySlug } from '../../../../lib/server/state-db.js';

export const runtime = 'nodejs';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug') || '';

  const staticVibe = getAuctionItemBySlug(slug);
  const minted = staticVibe ? null : await getMintedVibeBySlug(slug);
  const vibe = staticVibe ?? minted;

  const title = vibe ? (staticVibe ? staticVibe.title : vibe.name) : 'Unknown Vibe';
  const bid = vibe ? (staticVibe ? staticVibe.bid : vibe.startingPrice) : 0;
  const category = vibe ? (staticVibe ? staticVibe.category : vibe.category) : 'Vibes';
  const imageUrl = vibe ? (staticVibe ? null : (vibe.imageUrl ?? null)) : null;

  try {
    return new ImageResponse(
      (
        <div
          style={{
            width: '1200px',
            height: '630px',
            background: '#0D0D0D',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'sans-serif',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Top accent */}
          <div style={{ width: '100%', height: '8px', background: '#C8FF00', display: 'flex', flexShrink: 0 }} />

          {/* Left content */}
          <div style={{ display: 'flex', flex: 1, padding: '56px 64px', gap: '48px', alignItems: 'center' }}>
            <div style={{
              width: '220px',
              height: '220px',
              background: '#C8FF00',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              overflow: 'hidden',
            }}>
              {imageUrl ? (
                <img src={imageUrl} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'flex' }} />
              ) : (
                <div style={{ fontSize: '28px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', color: '#111111', display: 'flex' }}>
                  VIBE
                </div>
              )}
            </div>

            {/* Text */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
              {/* Category badge */}
              <div style={{
                background: '#1A1A1A',
                border: '1px solid #333',
                color: '#C8FF00',
                padding: '6px 14px',
                fontSize: '16px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '2px',
                display: 'flex',
                alignSelf: 'flex-start',
              }}>
                {category}
              </div>

              {/* Title */}
              <div style={{
                fontSize: title.length > 40 ? '40px' : title.length > 25 ? '48px' : '56px',
                fontWeight: 900,
                color: '#FFFFFF',
                lineHeight: 1.05,
                textTransform: 'uppercase',
                display: 'flex',
                flexWrap: 'wrap',
              }}>
                {title}
              </div>

              {/* Bid */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                <div style={{ fontSize: '16px', color: '#666', fontWeight: 700, textTransform: 'uppercase', display: 'flex' }}>
                  Starting bid
                </div>
                <div style={{ fontSize: '36px', fontWeight: 900, color: '#C8FF00', display: 'flex' }}>
                  {Number(bid || 0).toLocaleString()} AURA
                </div>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 64px',
            borderTop: '1px solid #1A1A1A',
            background: '#050505',
          }}>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#C8FF00', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex' }}>
              VIBE AUCTION
            </div>
            <div style={{
              background: '#C8FF00',
              color: '#000',
              padding: '10px 24px',
              fontSize: '16px',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '2px',
              display: 'flex',
            }}>
              PLACE BID
            </div>
          </div>
        </div>
      ),
      { width: 1200, height: 630 },
    );
  } catch {
    // Fallback: redirect to the generic OG image so X always gets a valid image
    return new Response(null, {
      status: 302,
      headers: { Location: '/api/og' },
    });
  }
}
