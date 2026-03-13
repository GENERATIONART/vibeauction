import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: '#080808',
          display: 'flex',
          fontFamily: 'serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Left neon stripe */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0,
          width: '6px', height: '100%',
          background: '#C8FF00',
          display: 'flex',
        }} />

        {/* Fine diagonal rule */}
        <div style={{
          position: 'absolute',
          top: 0, right: 0,
          width: '500px', height: '100%',
          background: 'linear-gradient(135deg, transparent 60%, #141414 60%)',
          display: 'flex',
        }} />

        {/* Content */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flex: 1,
          padding: '64px 80px 64px 86px',
        }}>

          {/* Top: house name + established */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{
              fontSize: '13px',
              fontWeight: 400,
              color: '#C8FF00',
              textTransform: 'uppercase',
              letterSpacing: '6px',
              display: 'flex',
            }}>
              Vibe Auction House
            </div>
            <div style={{
              fontSize: '12px',
              color: '#333',
              letterSpacing: '4px',
              textTransform: 'uppercase',
              display: 'flex',
            }}>
              Est. 2024
            </div>
          </div>

          {/* Centre: headline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{
              width: '48px',
              height: '1px',
              background: '#C8FF00',
              display: 'flex',
            }} />
            <div style={{
              fontSize: '84px',
              fontWeight: 700,
              color: '#FFFFFF',
              lineHeight: 0.92,
              letterSpacing: '-2px',
              display: 'flex',
              flexDirection: 'column',
            }}>
              <span style={{ display: 'flex' }}>Selling</span>
              <span style={{ display: 'flex' }}>feelings</span>
              <span style={{ color: '#C8FF00', fontStyle: 'italic', display: 'flex' }}>seriously.</span>
            </div>
            <div style={{
              fontSize: '20px',
              color: '#555',
              fontWeight: 400,
              fontStyle: 'italic',
              display: 'flex',
              marginTop: '4px',
            }}>
              The world's first auction house for things that don't exist.
            </div>
          </div>

          {/* Bottom: domain + cta */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{
              fontSize: '14px',
              color: '#2A2A2A',
              letterSpacing: '3px',
              textTransform: 'uppercase',
              display: 'flex',
            }}>
              vibeauction.vercel.app
            </div>
            <div style={{
              border: '1px solid #C8FF00',
              color: '#C8FF00',
              padding: '12px 36px',
              fontSize: '13px',
              fontWeight: 400,
              textTransform: 'uppercase',
              letterSpacing: '4px',
              display: 'flex',
            }}>
              Bid Now
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
