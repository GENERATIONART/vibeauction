import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: '#0A0A0A',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Yellow diagonal slash background accent */}
        <div style={{
          position: 'absolute',
          top: '-60px',
          right: '-40px',
          width: '420px',
          height: '760px',
          background: '#C8FF00',
          transform: 'rotate(12deg)',
          display: 'flex',
          opacity: 0.07,
        }} />

        {/* Top warning bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '18px 56px',
          background: '#C8FF00',
          flexShrink: 0,
        }}>
          <div style={{
            background: '#000',
            color: '#C8FF00',
            fontWeight: 900,
            fontSize: '13px',
            textTransform: 'uppercase',
            letterSpacing: '3px',
            padding: '4px 12px',
            display: 'flex',
          }}>
            ⚠ BREAKING
          </div>
          <div style={{
            fontWeight: 900,
            fontSize: '14px',
            color: '#000',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            display: 'flex',
          }}>
            Live bidding now open — feelings are going fast
          </div>
        </div>

        {/* Main content */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          padding: '48px 56px 40px',
          justifyContent: 'space-between',
        }}>
          {/* Headline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              fontSize: '92px',
              fontWeight: 900,
              color: '#FFFFFF',
              lineHeight: 0.88,
              textTransform: 'uppercase',
              letterSpacing: '-3px',
              display: 'flex',
              flexDirection: 'column',
            }}>
              <span style={{ display: 'flex' }}>WE ARE</span>
              <span style={{ color: '#C8FF00', display: 'flex' }}>SELLING</span>
              <span style={{ display: 'flex' }}>FEELINGS.</span>
            </div>

            <div style={{
              fontSize: '22px',
              color: '#666',
              fontWeight: 500,
              display: 'flex',
              marginTop: '8px',
            }}>
              You can bid on "the specific relief of taking off pants after a long day."
            </div>
          </div>

          {/* Bottom row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{
              fontSize: '18px',
              fontWeight: 800,
              color: '#333',
              textTransform: 'uppercase',
              letterSpacing: '3px',
              display: 'flex',
            }}>
              vibeauction.vercel.app
            </div>
            <div style={{
              background: '#C8FF00',
              color: '#000',
              padding: '14px 32px',
              fontSize: '18px',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '2px',
              display: 'flex',
            }}>
              BID NOW →
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
