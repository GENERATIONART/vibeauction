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

  // Fake lot numbers make it feel like a real auction house
  const lotNum = String(Math.abs(slug.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 899 + 100);

  try {
    return new ImageResponse(
      (
        <div
          style={{
            width: '1200px',
            height: '630px',
            background: '#0A0A0A',
            display: 'flex',
            fontFamily: 'sans-serif',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Left yellow panel */}
          <div style={{
            width: '320px',
            height: '100%',
            background: '#C8FF00',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            gap: '8px',
            padding: '40px 32px',
          }}>
            <div style={{
              fontSize: '13px',
              fontWeight: 900,
              color: '#000',
              textTransform: 'uppercase',
              letterSpacing: '4px',
              display: 'flex',
            }}>
              Lot
            </div>
            <div style={{
              fontSize: '120px',
              fontWeight: 900,
              color: '#000',
              lineHeight: 0.85,
              letterSpacing: '-4px',
              display: 'flex',
            }}>
              {lotNum}
            </div>
            <div style={{
              width: '60px',
              height: '4px',
              background: '#000',
              display: 'flex',
              marginTop: '12px',
            }} />
            <div style={{
              fontSize: '12px',
              fontWeight: 900,
              color: '#000',
              textTransform: 'uppercase',
              letterSpacing: '3px',
              marginTop: '12px',
              display: 'flex',
              textAlign: 'center',
            }}>
              {category}
            </div>
          </div>

          {/* Right content */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: '48px 52px',
            justifyContent: 'space-between',
          }}>
            {/* Category + "LIVE AUCTION" label */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{
                fontSize: '13px',
                fontWeight: 900,
                color: '#444',
                textTransform: 'uppercase',
                letterSpacing: '4px',
                display: 'flex',
              }}>
                VIBE AUCTION HOUSE
              </div>
              <div style={{
                background: '#FF3B3B',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '3px',
                padding: '5px 14px',
                display: 'flex',
              }}>
                ● LIVE
              </div>
            </div>

            {/* Vibe title — the hero */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0px',
            }}>
              <div style={{
                fontSize: title.length > 50 ? '38px' : title.length > 35 ? '46px' : title.length > 22 ? '56px' : '68px',
                fontWeight: 900,
                color: '#FFFFFF',
                lineHeight: 1.0,
                textTransform: 'uppercase',
                letterSpacing: '-1px',
                display: 'flex',
                flexWrap: 'wrap',
              }}>
                {title}
              </div>
            </div>

            {/* Bid + CTA */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{
                  fontSize: '12px',
                  color: '#555',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '3px',
                  display: 'flex',
                }}>
                  Opening bid
                </div>
                <div style={{
                  fontSize: '52px',
                  fontWeight: 900,
                  color: '#C8FF00',
                  lineHeight: 1,
                  display: 'flex',
                }}>
                  {Number(bid || 0).toLocaleString()}
                  <span style={{ fontSize: '28px', color: '#666', marginLeft: '10px', alignSelf: 'flex-end', marginBottom: '6px', display: 'flex' }}>AURA</span>
                </div>
              </div>

              <div style={{
                background: '#C8FF00',
                color: '#000',
                padding: '16px 32px',
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
        </div>
      ),
      { width: 1200, height: 630 },
    );
  } catch {
    return new Response(null, {
      status: 302,
      headers: { Location: '/api/og' },
    });
  }
}
