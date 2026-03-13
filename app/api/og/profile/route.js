import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username') || 'unknown';
  const avatarMonogram = String(username).charAt(0).toUpperCase() || 'U';

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

        {/* Diagonal split */}
        <div style={{
          position: 'absolute',
          top: 0, right: 0,
          width: '500px', height: '630px',
          background: 'linear-gradient(108deg, transparent 30%, #C8FF00 30.1%)',
          display: 'flex',
          opacity: 0.06,
        }} />

        {/* Main content */}
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', padding: '60px 80px', gap: '56px' }}>
          {/* Avatar */}
          <div style={{
            width: '200px',
            height: '200px',
            background: '#C8FF00',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '100px',
            flexShrink: 0,
            transform: 'rotate(-3deg)',
            boxShadow: '12px 12px 0px rgba(0,0,0,0.5)',
            border: '4px solid #FFFFFF',
          }}>
            {avatarMonogram}
          </div>

          {/* Text */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ fontSize: '20px', color: '#555', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '3px', display: 'flex' }}>
              VIBE AUCTION PROFILE
            </div>
            <div style={{
              fontSize: username.length > 16 ? '64px' : '80px',
              fontWeight: 900,
              color: '#FFFFFF',
              textTransform: 'uppercase',
              lineHeight: 0.95,
              letterSpacing: '-1px',
              display: 'flex',
            }}>
              @{username}
            </div>
            <div style={{
              background: '#1A1A1A',
              border: '1px solid #C8FF00',
              color: '#C8FF00',
              padding: '8px 18px',
              fontSize: '16px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              alignSelf: 'flex-start',
              display: 'flex',
            }}>
              View Profile & Vibes
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 80px',
          borderTop: '1px solid #1A1A1A',
          background: '#050505',
        }}>
          <div style={{ fontSize: '20px', fontWeight: 900, color: '#C8FF00', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex' }}>
            VIBE AUCTION
          </div>
          <div style={{ fontSize: '16px', color: '#444', fontWeight: 700, display: 'flex' }}>
            The world&apos;s first auction house for things that don&apos;t exist
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
