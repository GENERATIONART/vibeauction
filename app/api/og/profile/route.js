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
          background: '#09090b',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top accent */}
        <div style={{ width: '100%', height: '8px', background: '#8b5cf6', display: 'flex', flexShrink: 0 }} />

        {/* Ambient glow */}
        <div style={{
          position: 'absolute',
          top: '-180px', right: '-120px',
          width: '600px', height: '600px',
          borderRadius: '999px',
          background: 'rgba(139,92,246,0.18)',
          display: 'flex',
        }} />

        {/* Main content */}
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', padding: '60px 80px', gap: '56px' }}>
          {/* Avatar */}
          <div style={{
            width: '200px',
            height: '200px',
            borderRadius: '999px',
            background: '#8b5cf6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '90px',
            fontWeight: 700,
            color: '#000000',
            flexShrink: 0,
          }}>
            {avatarMonogram}
          </div>

          {/* Text */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ fontSize: '20px', color: '#737373', fontWeight: 600, letterSpacing: '3px', display: 'flex' }}>
              VIBES MARKET PROFILE
            </div>
            <div style={{
              fontSize: username.length > 16 ? '64px' : '80px',
              fontWeight: 700,
              color: '#f4f4f5',
              lineHeight: 0.95,
              letterSpacing: '-2px',
              display: 'flex',
            }}>
              @{username}
            </div>
            <div style={{
              background: 'rgba(139,92,246,0.12)',
              border: '1px solid rgba(139,92,246,0.5)',
              borderRadius: '999px',
              color: '#8b5cf6',
              padding: '8px 22px',
              fontSize: '16px',
              fontWeight: 600,
              alignSelf: 'flex-start',
              display: 'flex',
            }}>
              View Profile &amp; Vibes
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
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#8b5cf6', letterSpacing: '1px', display: 'flex' }}>
            VIBES MARKET
          </div>
          <div style={{ fontSize: '16px', color: '#525252', fontWeight: 500, display: 'flex' }}>
            A feed for AI-made chaos
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
