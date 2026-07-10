import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: '#09090b',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{
          position: 'absolute',
          top: '-180px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '900px',
          height: '600px',
          borderRadius: '999px',
          background: 'rgba(139,92,246,0.25)',
          filter: 'blur(10px)',
          display: 'flex',
        }} />
        <div style={{
          fontSize: '160px',
          fontWeight: 700,
          color: '#f4f4f5',
          letterSpacing: '-6px',
          lineHeight: 0.95,
          display: 'flex',
          textAlign: 'center',
          zIndex: 1,
        }}>
          VIBES
        </div>
        <div style={{
          fontSize: '160px',
          fontWeight: 700,
          color: '#8b5cf6',
          letterSpacing: '-6px',
          lineHeight: 0.95,
          display: 'flex',
          textAlign: 'center',
          zIndex: 1,
        }}>
          MARKET
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
