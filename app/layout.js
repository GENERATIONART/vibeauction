import React from 'react';
import { VibeStoreProvider } from './state/vibe-store';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <VibeStoreProvider>{children}</VibeStoreProvider>
      </body>
    </html>
  );
}