import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || 'all';

  const sb = getSupabaseAdmin();
  if (!sb) {
    return NextResponse.json(
      { topSpenders: [], topVibes: [] },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  }

  let cutoff = null;
  const now = new Date();
  if (period === 'week') cutoff = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  else if (period === 'month') cutoff = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
  else if (period === 'year') cutoff = new Date(now - 365 * 24 * 60 * 60 * 1000).toISOString();

  // Fetch bids for leaderboard aggregation
  let bidsQuery = sb.from('vibe_bids').select('user_id, amount, vibe_id, created_at');
  if (cutoff) bidsQuery = bidsQuery.gte('created_at', cutoff);
  const { data: bidRows } = await bidsQuery;

  // Fetch vault_items for actual wins per user
  let winsQuery = sb.from('vault_items').select('user_id');
  if (cutoff) winsQuery = winsQuery.gte('created_at', cutoff);
  const { data: winRows } = await winsQuery;

  // Fetch all profiles for username lookup
  const { data: profiles } = await sb.from('profiles').select('id, username');

  // Aggregate total bid amount per user
  const spendMap = {};
  for (const row of bidRows || []) {
    if (!row.user_id) continue;
    if (!spendMap[row.user_id]) spendMap[row.user_id] = { total: 0 };
    spendMap[row.user_id].total += Number(row.amount) || 0;
  }

  // Count actual vault wins per user
  const winsMap = {};
  for (const row of winRows || []) {
    if (!row.user_id) continue;
    winsMap[row.user_id] = (winsMap[row.user_id] || 0) + 1;
  }

  const profileMap = {};
  for (const p of profiles || []) profileMap[p.id] = p.username;

  const topSpenders = Object.entries(spendMap)
    .map(([userId, { total }]) => ({
      username: profileMap[userId] ? `@${profileMap[userId]}` : 'Anonymous',
      totalSpent: total,
      vibesWon: winsMap[userId] || 0,
    }))
    .filter((s) => s.totalSpent > 0)
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 10);

  // Top vibes by value
  const { data: vibes } = await sb
    .from('vibes')
    .select('name, emoji, starting_price, buy_now_price, slug')
    .order('starting_price', { ascending: false })
    .limit(6);

  const topVibes = (vibes || [])
    .filter((v) => v?.slug)
    .map((v) => ({
      name: v.name,
      emoji: v.emoji || '✨',
      slug: v.slug,
      price: v.buy_now_price || v.starting_price || 0,
    }));

  return NextResponse.json(
    { topSpenders, topVibes },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
