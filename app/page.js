import React from 'react';
import { createClient } from '@supabase/supabase-js';

export default function Home() {
  return (
    <main>
      <h1>Vibe Auction</h1>
      <p>Welcome to the Vibe Auction platform!</p>
    </main>
  );
}

export async function generateMetadata() {
  return {
    title: 'Vibe Auction',
    description: 'Auction platform for unique vibes',
  };
}