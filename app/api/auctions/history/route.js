import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { buildGraduationSnapshot } from '../../../../lib/vibe-graduation.js';
import { getGraduationBoard } from '../../../../lib/server/state-db.js';
import { apiError } from '../../../../lib/api-error.js';

export const dynamic = 'force-dynamic';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

const applyLiveFilter = (query, nowIso) => query.or(`end_time.is.null,end_time.gt.${nowIso}`);

const asNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const PAGE_SIZE_DEFAULT = 48;
const PAGE_SIZE_MAX = 100;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status   = String(searchParams.get('status')   || 'all').toLowerCase();
    const sort     = String(searchParams.get('sort')     || 'newest').toLowerCase();
    const search   = String(searchParams.get('search')   || '').trim();
    const category = String(searchParams.get('category') || '').trim();
    const pageSize = Math.min(PAGE_SIZE_MAX, Math.max(1, asNumber(searchParams.get('pageSize'), PAGE_SIZE_DEFAULT)));
    const page     = Math.max(1, asNumber(searchParams.get('page'), 1));
    const nowMs    = Date.now();
    const nowIso   = new Date(nowMs).toISOString();

    const sb = getSupabaseAdmin();
    if (!sb) {
      return NextResponse.json(
        {
          auctions: [],
          summary: { total: 0, live: 0, ended: 0, settled: 0 },
          pagination: { page, pageSize, total: 0, totalPages: 0 },
          categories: [],
        },
        { headers: { 'Cache-Control': 'no-store' } },
      );
    }

    // Parallel lightweight queries: global counts + distinct categories
    const [
      { count: totalCount },
      { count: liveCount },
      { count: settledCount },
      { data: catRows },
    ] = await Promise.all([
      sb.from('vibes').select('id', { count: 'exact', head: true }),
      applyLiveFilter(sb.from('vibes').select('id', { count: 'exact', head: true }), nowIso),
      sb.from('vault_items').select('id', { count: 'exact', head: true }).like('id', 'vault-%'),
      sb.from('vibes').select('category').not('category', 'is', null).limit(2000),
    ]);

    const summaryTotal   = totalCount   ?? 0;
    const summaryLive    = liveCount    ?? 0;
    const summarySettled = settledCount ?? 0;
    const summaryEnded   = Math.max(0, summaryTotal - summaryLive - summarySettled);
    const summary        = { total: summaryTotal, live: summaryLive, ended: summaryEnded, settled: summarySettled };
    const categories     = [...new Set((catRows || []).map((r) => r.category).filter(Boolean))].sort();

    // Build paginated vibes query
    let q = sb
      .from('vibes')
      .select(
        'id, slug, name, category, image_url, starting_price, buy_now_price, end_time, created_at, author',
        { count: 'exact' },
      );

    // DB-level status filter (ended/settled share the same filter; resolved in JS below)
    if (status === 'live') {
      q = applyLiveFilter(q, nowIso);
    } else if (status === 'ended' || status === 'settled') {
      q = q.lte('end_time', nowIso);
    }

    if (search) {
      // Escape ilike special chars to prevent full-table wildcard scans
      const escapedSearch = search.replace(/[%_\\]/g, '\\$&');
      q = q.ilike('name', `%${escapedSearch}%`);
    }

    if (category && category !== 'all') {
      q = q.eq('category', category);
    }

    switch (sort) {
      case 'oldest':      q = q.order('created_at',    { ascending: true  });                            break;
      case 'price_hi':    q = q.order('starting_price', { ascending: false });                            break;
      case 'price_lo':    q = q.order('starting_price', { ascending: true  });                            break;
      case 'ending_soon': q = q.order('end_time',       { ascending: true, nullsFirst: false });           break;
      default:            q = q.order('created_at',    { ascending: false });
    }

    const { data: vibeRows, error: vibeError, count: filteredCount } = await q.range(
      (page - 1) * pageSize,
      page * pageSize - 1,
    );

    if (vibeError) throw new Error(vibeError.message || 'Failed to load vibes');

    // Vault lookup — only for slugs on this page
    const slugsOnPage = (vibeRows || []).map((r) => r.slug).filter(Boolean);
    const settledBySlug = new Map();
    const winnerIds = new Set();
    const topBidBySlug = new Map();
    const reactionCountBySlug = new Map();
    const commentCountBySlug = new Map();
    const participantIdsBySlug = new Map();
    const remixCountBySlug = new Map();

    if (slugsOnPage.length > 0) {
      const [{ data: vaultRows }, { data: bidRows }, { data: reactionRows }, { data: commentRows }, { data: remixRows }] = await Promise.all([
        sb
          .from('vault_items')
          .select('id, name, price, user_id, won_date, created_at')
          .in('id', slugsOnPage.map((s) => `vault-${s}`)),
        sb
          .from('vibe_bids')
          .select('vibe_id, amount, user_id, created_at')
          .in('vibe_id', slugsOnPage)
          .order('created_at', { ascending: false })
          .limit(3000),
        sb
          .from('vibe_reactions')
          .select('vibe_id, user_id')
          .in('vibe_id', slugsOnPage)
          .limit(3000),
        sb
          .from('vibe_comments')
          .select('vibe_id, user_id')
          .in('vibe_id', slugsOnPage)
          .limit(3000),
        sb
          .from('vibes')
          .select('remix_source_slug')
          .in('remix_source_slug', slugsOnPage)
          .limit(3000),
      ]);

      for (const row of vaultRows || []) {
        const vaultId = String(row?.id || '');
        if (!vaultId.startsWith('vault-')) continue;
        const slug = vaultId.slice('vault-'.length).trim();
        if (!slug) continue;
        settledBySlug.set(slug, row);
        if (row?.user_id) winnerIds.add(String(row.user_id));
      }

      for (const row of bidRows || []) {
        const slug = String(row?.vibe_id || '').trim();
        if (!slug) continue;
        const amount = asNumber(row?.amount, 0);
        const previous = topBidBySlug.get(slug) || 0;
        if (amount > previous) topBidBySlug.set(slug, amount);
        if (row?.user_id) {
          if (!participantIdsBySlug.has(slug)) participantIdsBySlug.set(slug, new Set());
          participantIdsBySlug.get(slug).add(String(row.user_id));
        }
      }

      for (const row of reactionRows || []) {
        const slug = String(row?.vibe_id || '').trim();
        if (!slug) continue;
        reactionCountBySlug.set(slug, (reactionCountBySlug.get(slug) || 0) + 1);
        if (row?.user_id) {
          if (!participantIdsBySlug.has(slug)) participantIdsBySlug.set(slug, new Set());
          participantIdsBySlug.get(slug).add(String(row.user_id));
        }
      }

      for (const row of commentRows || []) {
        const slug = String(row?.vibe_id || '').trim();
        if (!slug) continue;
        commentCountBySlug.set(slug, (commentCountBySlug.get(slug) || 0) + 1);
        if (row?.user_id) {
          if (!participantIdsBySlug.has(slug)) participantIdsBySlug.set(slug, new Set());
          participantIdsBySlug.get(slug).add(String(row.user_id));
        }
      }

      for (const row of remixRows || []) {
        const slug = String(row?.remix_source_slug || '').trim();
        if (!slug) continue;
        remixCountBySlug.set(slug, (remixCountBySlug.get(slug) || 0) + 1);
      }
    }

    // Winner names
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

    const graduationBoard = await getGraduationBoard(200);
    const graduationBySlug = new Map((graduationBoard?.board || []).map((entry) => [String(entry.slug || '').trim(), entry.graduation]));

    const auctions = (vibeRows || [])
      .map((row) => {
        const endTimeMs      = new Date(row?.end_time || '').getTime();
        const isEnded        = Number.isFinite(endTimeMs) && endTimeMs <= nowMs;
        const settled        = settledBySlug.get(String(row?.slug || ''));
        const isSettled      = Boolean(settled);
        const resolvedStatus = isSettled ? 'settled' : isEnded ? 'ended' : 'live';

        // Secondary JS filter to distinguish ended vs settled (needs vault cross-ref)
        if (status === 'settled' && resolvedStatus !== 'settled') return null;
        if (status === 'ended'   && resolvedStatus !== 'ended')   return null;

        const winnerId = settled?.user_id ? String(settled.user_id) : null;
        const slug = String(row?.slug || '').trim();
        const graduation =
          graduationBySlug.get(slug) ||
          buildGraduationSnapshot({
            currentAura: Math.max(
              asNumber(row.starting_price, 0),
              topBidBySlug.get(slug) || 0,
              settled ? asNumber(settled.price, 0) : 0,
            ),
            uniqueParticipants: participantIdsBySlug.get(slug)?.size || 0,
            totalReactions: reactionCountBySlug.get(slug) || 0,
            commentCount: commentCountBySlug.get(slug) || 0,
            remixCount: remixCountBySlug.get(slug) || 0,
            recentBidCount: 0,
            weeklyRank: null,
          });

        return {
          id:            row.id || row.slug,
          slug:          row.slug || row.id || '',
          name:          row.name || 'Unknown Vibe',
          category:      row.category || 'Vibes',
          imageUrl:      row.image_url || null,
          createdAt:     row.created_at || null,
          endTime:       row.end_time || null,
          startingPrice: asNumber(row.starting_price, 0),
          buyNowPrice:   asNumber(row.buy_now_price, 0),
          status:        resolvedStatus,
          settledAt:     settled?.created_at || null,
          settledPrice:  settled ? asNumber(settled.price, 0) : null,
          winner:        winnerId ? winnerNameById.get(winnerId) || 'Anonymous' : null,
          wonDate:       settled?.won_date || null,
          author:        row.author || null,
          graduation,
        };
      })
      .filter(Boolean);

    const totalFiltered = filteredCount ?? 0;
    const totalPages    = Math.max(1, Math.ceil(totalFiltered / pageSize));

    const res = NextResponse.json(
      { auctions, summary, pagination: { page, pageSize, total: totalFiltered, totalPages }, categories },
    );
    res.headers.set('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=30');
    return res;
  } catch {
    return apiError('Internal server error');
  }
}
