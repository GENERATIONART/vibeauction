'use client';

import { VibeStoreProvider } from './state/vibe-store';
import { AuthProvider } from './state/auth-store';

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <VibeStoreProvider>{children}</VibeStoreProvider>
    </AuthProvider>
  );
}
