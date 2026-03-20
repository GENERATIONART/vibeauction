# Supabase Realtime Migration

Replace polling on the auction page and home page with Supabase WebSocket subscriptions.
Zero Vercel function invocations for live updates — the connection goes through Supabase infra.

---

## Step 1 — Enable Realtime on tables in Supabase dashboard

Go to **Database → Replication → Realtime** and toggle on:
- `vibe_bids`
- `vibe_comments`
- `vibe_reactions`

---

## Step 2 — Auction page (`react-auction-page.js`)

Add a new `useEffect` after the existing sync effect. It creates one channel per auction slug, subscribes to the 3 hot tables, and calls the relevant load function when a row changes. Cleans up on unmount or slug change.

```js
useEffect(() => {
  const vibeId = selectedVibe?.slug;
  if (!vibeId) return;

  const sb = getSupabaseClient();
  if (!sb) return;

  const channel = sb
    .channel(`auction:${vibeId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'vibe_bids', filter: `vibe_id=eq.${vibeId}` },
      () => syncFnsRef.current.loadBidHistory(),
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'vibe_comments', filter: `vibe_id=eq.${vibeId}` },
      () => syncFnsRef.current.loadComments(),
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'vibe_reactions', filter: `vibe_id=eq.${vibeId}` },
      () => syncFnsRef.current.loadVibeSocial(),
    )
    .subscribe();

  return () => {
    sb.removeChannel(channel);
  };
}, [selectedVibe?.slug]);
```

### What to change in the existing sync `useEffect`

- Remove `loadBidHistory`, `loadComments`, `loadVibeSocial` from `syncAuctionData` — Realtime handles those
- Keep `loadVibeMarket` and `loadGraduation` on the 15s poll (computed/complex state, no simple row event)
- Drop `refreshState()` from the sync loop entirely

Updated `syncAuctionData`:
```js
const syncAuctionData = async () => {
  await syncFnsRef.current.loadVibeMarket();
  await syncFnsRef.current.loadGraduation();
};
```

Bump poll interval to 60s:
```js
}, 60000);
```

---

## Step 3 — Home page (`react-app (9).js`)

Subscribe to `vibes` INSERT/UPDATE so the listing grid updates when new auctions go live or statuses change. Drop the 30s poll entirely.

```js
useEffect(() => {
  // Initial load
  syncLatestVibes();

  const sb = getSupabaseClient();
  if (!sb) return;

  const channel = sb
    .channel('home:vibes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'vibes' },
      () => syncLatestVibes(),
    )
    .subscribe();

  const onFocus = () => {
    if (document.visibilityState === 'visible') syncLatestVibes();
  };
  window.addEventListener('focus', onFocus);

  return () => {
    sb.removeChannel(channel);
    window.removeEventListener('focus', onFocus);
  };
}, []);
```

Remove the `setInterval` poll — Realtime replaces it.

---

## Expected impact

| | Before | After |
|---|---|---|
| Auction page | ~24 Vercel invocations/min/user | ~2/min (load only) |
| Home page | ~2 Vercel invocations/min/user | ~0/min ongoing |
| Realtime cost | — | Supabase WebSocket (free tier: 200 concurrent, 2M msgs/mo) |

Roughly **20-25x reduction** in Vercel function invocations.

---

## Notes

- `syncFnsRef` is already set up in the auction page from the polling fix — the Realtime callbacks can use it directly
- `getSupabaseClient()` is already imported in `react-auction-page.js`
- Filter syntax (`vibe_id=eq.${vibeId}`) requires the column to exist on the table — `vibe_bids` and `vibe_comments` use `vibe_id`, `vibe_reactions` uses `vibe_id` confirmed in `state-db.js`
- If a vibe slug contains special characters, `encodeURIComponent` the filter value
