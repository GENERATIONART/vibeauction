'use client';

import { Component } from 'react';
import { VibeStoreProvider } from './state/vibe-store';
import { AuthProvider } from './state/auth-store';

class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', background: '#09090b', color: '#f4f4f5', minHeight: '100vh', fontFamily: "'Space Grotesk', sans-serif" }}>
          <h2 style={{ color: '#8b5cf6' }}>Something went wrong</h2>
          <p style={{ color: '#a3a3a3', marginTop: 12 }}>Refresh the page to try again.</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{ marginTop: 20, padding: '10px 24px', background: '#8b5cf6', color: '#000', border: 'none', borderRadius: 999, cursor: 'pointer', fontWeight: 600 }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function Providers({ children }) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <VibeStoreProvider>{children}</VibeStoreProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
