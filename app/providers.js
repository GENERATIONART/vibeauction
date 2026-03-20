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
        <div style={{ padding: '40px', textAlign: 'center', background: '#0D0D0D', color: '#fff', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
          <h2 style={{ color: '#C8FF00' }}>Something went wrong</h2>
          <p style={{ color: '#888', marginTop: 12 }}>Refresh the page to try again.</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{ marginTop: 20, padding: '10px 24px', background: '#C8FF00', color: '#000', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }}
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
