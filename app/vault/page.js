'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import NavBar from '../components/NavBar';
import { useAuth } from '../state/auth-store';

export default function VaultPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    const handle = profile?.username || user?.user_metadata?.username || user?.email?.split('@')[0] || null;
    if (handle) {
      router.replace(`/profile/${encodeURIComponent(handle)}?tab=vault`);
    }
  }, [loading, profile?.username, user, router]);

  const handle = profile?.username || user?.user_metadata?.username || user?.email?.split('@')[0] || null;

  return (
    <div style={{ minHeight: '100dvh', background: '#0D0D0D', color: '#FFFFFF', fontFamily: "'Inter', sans-serif" }}>
      <NavBar />
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '36px 16px' }}>
        <h1 style={{ fontFamily: "'Anton', sans-serif", fontSize: '46px', textTransform: 'uppercase', marginBottom: '10px' }}>
          Redirecting To Account
        </h1>
        <p style={{ color: '#AAAAAA', marginBottom: '16px' }}>
          Your vault now lives inside your profile account page.
        </p>
        {handle ? (
          <Link href={`/profile/${encodeURIComponent(handle)}?tab=vault`} style={{ color: '#C8FF00', fontWeight: 800 }}>
            Continue to Vault Tab
          </Link>
        ) : (
          <Link href="/login" style={{ color: '#C8FF00', fontWeight: 800 }}>
            Sign in to open your account
          </Link>
        )}
      </main>
    </div>
  );
}
