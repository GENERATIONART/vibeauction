import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
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
        }}
      >
        <div style={{
          fontSize: '200px',
          fontWeight: 900,
          color: '#000000',
          textTransform: 'uppercase',
          letterSpacing: '-8px',
          lineHeight: 0.8,
          display: 'flex',
          textAlign: 'center',
        }}>
          VIBE
        </div>
        <div style={{
          fontSize: '200px',
          fontWeight: 900,
          color: '#000000',
          textTransform: 'uppercase',
          letterSpacing: '-8px',
          lineHeight: 0.8,
          display: 'flex',
          textAlign: 'center',
        }}>
          AUCTION
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
