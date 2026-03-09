import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: '#0D0D0D',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          padding: '80px',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Accent stripe */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '8px', background: '#C8FF00', display: 'flex' }} />

        {/* Dot pattern */}
        <div style={{
          position: 'absolute',
          top: 0, right: 0,
          width: '500px', height: '630px',
          backgroundImage: 'radial-gradient(rgba(200,255,0,0.12) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          display: 'flex',
        }} />

        {/* Big emoji */}
        <div style={{ fontSize: '120px', lineHeight: 1, marginBottom: '32px', display: 'flex' }}>⚡</div>

        {/* Title */}
        <div style={{
          fontSize: '88px',
          fontWeight: 900,
          color: '#FFFFFF',
          lineHeight: 0.95,
          textTransform: 'uppercase',
          letterSpacing: '-2px',
          marginBottom: '24px',
          display: 'flex',
        }}>
          VIBE<br />AUCTION
        </div>

        {/* Tagline */}
        <div style={{
          fontSize: '28px',
          color: '#888888',
          fontWeight: 600,
          maxWidth: '600px',
          lineHeight: 1.4,
          display: 'flex',
        }}>
          The world&apos;s first auction house for things that don&apos;t exist.
        </div>

        {/* Badge */}
        <div style={{
          position: 'absolute',
          bottom: '60px',
          right: '80px',
          background: '#C8FF00',
          color: '#000000',
          padding: '12px 28px',
          fontSize: '20px',
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: '2px',
          display: 'flex',
        }}>
          BID NOW
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
