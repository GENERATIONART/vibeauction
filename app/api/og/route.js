import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
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
          gap: '0px',
        }}
      >
        <div style={{
          fontSize: '148px',
          fontWeight: 900,
          color: '#C8FF00',
          textTransform: 'uppercase',
          letterSpacing: '-6px',
          lineHeight: 0.85,
          display: 'flex',
          textAlign: 'center',
        }}>
          VIBE
        </div>
        <div style={{
          fontSize: '148px',
          fontWeight: 900,
          color: '#FFFFFF',
          textTransform: 'uppercase',
          letterSpacing: '-6px',
          lineHeight: 0.85,
          display: 'flex',
          textAlign: 'center',
        }}>
          AUCTION
        </div>
        <div style={{
          fontSize: '26px',
          color: '#444444',
          fontWeight: 500,
          marginTop: '32px',
          display: 'flex',
          textAlign: 'center',
        }}>
          bidding on things that don't exist since 2024
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
