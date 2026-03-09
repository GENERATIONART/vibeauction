import React from 'react';
import { createClient } from '@supabase/supabase-js';

export default function Home() {
  return (
    <div>
      <h1>Vibe Auction</h1>
      <p>Welcome to the Vibe Auction platform!</p>
    </div>
  );
}

export async function getServerSideProps() {
  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Example of fetching data (optional)
  const { data: auctions, error } = await supabase
    .from('auctions')
    .select('*');

  return {
    props: {
      auctions: auctions || [],
    },
  };
}