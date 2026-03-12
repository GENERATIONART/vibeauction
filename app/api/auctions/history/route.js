import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getState } from '../../../../lib/server/state-db.js';

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
    const limit = Math.min(2000, Math.max(1, asNumber(searchParams.get('limit'), 500)));
    const nowMs = Date.now();

    const sb = getSupabaseAdmin();
    const statePayload = await getState();
    const mintedVibes = Array.isArray(statePayload?.state?.mintedVibes)
      ? statePayload.state.mintedVibes
      : [];
    if (!sb && mintedVibes.length === 0) {
      return NextResponse.json(
        { auctions: [], summary: { total: 0, live: 0, ended: 0, settled: 0 } },
        { headers: { 'Cache-Control': 'no-store' } },
      );
    }

    let vaultRows = [];
    if (sb) {
      const { data, error } = await sb
        .from('vault_items')
        .select('id, name, price, user_id, won_date, created_at')
        .order('created_at', { ascending: false })
        .limit(limit * 3);
      if (error) {
        throw new Error(error.message || 'Failed to load settled auctions');
      }
      vaultRows = Array.isArray(data) ? data : [];
    }

    const settledBySlug = new Map();
    const winnerIds = new Set();
    for (const row of vaultRows) {
      const vaultId = String(row?.id || '');
      if (!vaultId.startsWith('vault-')) continue;
      const slug = vaultId.slice('vault-'.length).trim();
      if (!slug) continue;
      settledBySlug.set(slug, row);
      if (row?.user_id) winnerIds.add(String(row.user_id));
    }

    const winnerIdList = Array.from(winnerIds);
    const winnerNameById = new Map();
    if (sb && winnerIdList.length > 0) {
      const { data: profileRows } = await sb
        .from('profiles')
        .select('id, username')
        .in('id', winnerIdList);
      for (const row of profileRows || []) {
        winnerNameById.set(String(row.id), row.username ? `@${row.username}` : 'Anonymous');
      }
    }

    const auctions = mintedVibes.map((row) => {
      const slug = String(row?.slug || row?.id || '').trim();
      const endTimeValue = row?.endTime || null;
      const endTimeMs = new Date(endTimeValue || '').getTime();
      const isEnded = Number.isFinite(endTimeMs) && endTimeMs <= nowMs;
      const settled = settledBySlug.get(slug);
      const isSettled = Boolean(settled);
      const resolvedStatus = isSettled ? 'settled' : isEnded ? 'ended' : 'live';
      const winnerId = settled?.user_id ? String(settled.user_id) : null;
      return {
        id: row.id || slug,
        slug,
        name: row.name || 'Unknown Vibe',
        category: row.category || 'Vibes',
        imageUrl: row.imageUrl || null,
        createdAt: row.createdAt || null,
        endTime: endTimeValue,
        startingPrice: asNumber(row.startingPrice, 0),
        buyNowPrice: asNumber(row.buyNowPrice, 0),
        status: resolvedStatus,
        settledAt: settled?.created_at || null,
        settledPrice: settled ? asNumber(settled.price, 0) : null,
        winner: winnerId ? winnerNameById.get(winnerId) || 'Anonymous' : null,
        wonDate: settled?.won_date || null,
        author: row.author || null,
      };
    });

    const filtered = (status === 'all'
      ? auctions
      : auctions.filter((auction) => auction.status === status)).slice(0, limit);

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
