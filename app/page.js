const React = require('react');
const { createClient } = require('@supabase/supabase-js');

function Home() {
  return (
    <main>
      <h1>Vibe Auction</h1>
      <p>Welcome to the Vibe Auction platform!</p>
    </main>
  );
}

function generateMetadata() {
  return {
    title: 'Vibe Auction',
    description: 'Auction platform for unique vibes',
  };
}

module.exports = Home;
module.exports.generateMetadata = generateMetadata;