import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

const asNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = String(searchParams.get('status') || 'all').toLowerCase();
    const limit = Math.min(500, Math.max(1, asNumber(searchParams.get('limit'), 200)));
    const nowMs = Date.now();

    const sb = getSupabaseAdmin();
    if (!sb) {
      return NextResponse.json(
        { auctions: [], summary: { total: 0, live: 0, ended: 0, settled: 0 } },
        { headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const { data: vibeRows, error: vibeError } = await sb
      .from('vibes')
      .select('id, slug, name, category, image_url, starting_price, buy_now_price, end_time, created_at, author')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (vibeError) {
      throw new Error(vibeError.message || 'Failed to load vibes');
    }

    const { data: vaultRows, error: vaultError } = await sb
      .from('vault_items')
      .select('id, name, price, user_id, won_date, created_at')
      .order('created_at', { ascending: false })
      .limit(limit * 2);

    if (vaultError) {
      throw new Error(vaultError.message || 'Failed to load settled auctions');
    }

    const settledBySlug = new Map();
    const winnerIds = new Set();
    for (const row of vaultRows || []) {
      const vaultId = String(row?.id || '');
      if (!vaultId.startsWith('vault-')) continue;
      const slug = vaultId.slice('vault-'.length).trim();
      if (!slug) continue;
      settledBySlug.set(slug, row);
      if (row?.user_id) winnerIds.add(String(row.user_id));
    }

    const winnerIdList = Array.from(winnerIds);
    const winnerNameById = new Map();
    if (winnerIdList.length > 0) {
      const { data: profileRows } = await sb
        .from('profiles')
        .select('id, username')
        .in('id', winnerIdList);
      for (const row of profileRows || []) {
        winnerNameById.set(String(row.id), row.username ? `@${row.username}` : 'Anonymous');
      }
    }

    const auctions = (vibeRows || []).map((row) => {
      const endTimeMs = new Date(row?.end_time || '').getTime();
      const isEnded = Number.isFinite(endTimeMs) && endTimeMs <= nowMs;
      const settled = settledBySlug.get(String(row?.slug || ''));
      const isSettled = Boolean(settled);
      const resolvedStatus = isSettled ? 'settled' : isEnded ? 'ended' : 'live';
      const winnerId = settled?.user_id ? String(settled.user_id) : null;
      return {
        id: row.id || row.slug,
        slug: row.slug || row.id || '',
        name: row.name || 'Unknown Vibe',
        category: row.category || 'Vibes',
        imageUrl: row.image_url || null,
        createdAt: row.created_at || null,
        endTime: row.end_time || null,
        startingPrice: asNumber(row.starting_price, 0),
        buyNowPrice: asNumber(row.buy_now_price, 0),
        status: resolvedStatus,
        settledAt: settled?.created_at || null,
        settledPrice: settled ? asNumber(settled.price, 0) : null,
        winner: winnerId ? winnerNameById.get(winnerId) || 'Anonymous' : null,
        wonDate: settled?.won_date || null,
        author: row.author || null,
      };
    });

    const filtered =
      status === 'all' ? auctions : auctions.filter((auction) => auction.status === status);

    const summary = {
      total: auctions.length,
      live: auctions.filter((auction) => auction.status === 'live').length,
      ended: auctions.filter((auction) => auction.status === 'ended').length,
      settled: auctions.filter((auction) => auction.status === 'settled').length,
    };

    return NextResponse.json(
      { auctions: filtered, summary },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        auctions: [],
        summary: { total: 0, live: 0, ended: 0, settled: 0 },
        error: 'Failed to load auction history',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
