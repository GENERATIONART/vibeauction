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

  // Pick font size based on title length so it always fills the space
  const fs = title.length > 60 ? '52px' : title.length > 40 ? '66px' : title.length > 24 ? '82px' : '100px';

  try {
    return new ImageResponse(
      (
        <div
          style={{
            width: '1200px',
            height: '630px',
            background: '#000000',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'sans-serif',
            padding: '60px 80px',
            gap: '0px',
          }}
        >
          {/* The vibe name — hero */}
          <div style={{
            fontSize: fs,
            fontWeight: 900,
            color: '#FFFFFF',
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

          {/* Divider */}
          <div style={{
            width: '80px',
            height: '4px',
            background: '#C8FF00',
            marginTop: '36px',
            marginBottom: '28px',
            display: 'flex',
          }} />

          {/* Bid line */}
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '12px',
          }}>
            <div style={{
              fontSize: '22px',
              color: '#444',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '4px',
              display: 'flex',
            }}>
              opening bid
            </div>
            <div style={{
              fontSize: '48px',
              fontWeight: 900,
              color: '#C8FF00',
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
  } catch {
    return new Response(null, {
      status: 302,
      headers: { Location: '/api/og' },
    });
  }
}
