import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
  if (!sb) return NextResponse.json({ topSpenders: [], topVibes: [] });

  let cutoff = null;
  const now = new Date();
  if (period === 'week') cutoff = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  else if (period === 'month') cutoff = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
  else if (period === 'year') cutoff = new Date(now - 365 * 24 * 60 * 60 * 1000).toISOString();

  // Fetch vault items for spend aggregation
  let vaultQuery = sb.from('vault_items').select('user_id, price, created_at');
  if (cutoff) vaultQuery = vaultQuery.gte('created_at', cutoff);
  const { data: vaultItems } = await vaultQuery;

  // Fetch all profiles for username lookup
  const { data: profiles } = await sb.from('profiles').select('id, username');

  // Aggregate total spent per user
  const spendMap = {};
  for (const item of vaultItems || []) {
    if (!item.user_id) continue;
    if (!spendMap[item.user_id]) spendMap[item.user_id] = { total: 0, count: 0 };
    spendMap[item.user_id].total += Number(item.price) || 0;
    spendMap[item.user_id].count += 1;
  }

  const profileMap = {};
  for (const p of profiles || []) profileMap[p.id] = p.username;

  const topSpenders = Object.entries(spendMap)
    .map(([userId, { total, count }]) => ({
      username: profileMap[userId] ? `@${profileMap[userId]}` : 'Anonymous',
      totalSpent: total,
      vibesWon: count,
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

  const topVibes = (vibes || []).map((v) => ({
    name: v.name,
    emoji: v.emoji || '✨',
    slug: v.slug,
    price: v.buy_now_price || v.starting_price || 0,
  }));

  return NextResponse.json({ topSpenders, topVibes });
}
