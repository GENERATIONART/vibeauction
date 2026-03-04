'use client';

import { VibeStoreProvider } from './state/vibe-store';

export default function Providers({ children }) {
  return <VibeStoreProvider>{children}</VibeStoreProvider>;
}
