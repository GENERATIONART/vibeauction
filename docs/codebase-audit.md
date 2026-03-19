# Vibeauction Codebase Audit
_25-sweep analysis — March 2026_

---

## Sweep 1 — Error Boundaries / Unhandled Promise Rejections

- **No React error boundary anywhere.** Any render throw (e.g. `.toLocaleString()` on `undefined`) crashes the whole page to blank. Add one to `app/providers.js`.
- `vibe-store.js` vault fetch uses `.then()` with no `.catch()` — silent network failures.
- `auth-store.js` — `loadProfile` errors inside `onAuthStateChange` are unhandled.
- `settleAuction` in `vibe-store.js` fires vault refresh via `.then()` with no `.catch()`.

---

## Sweep 2 — N+1 Database Queries

- `getRecentBidsForVibe` in `state-db.js` calls `sb.auth.admin.getUserById(id)` one at a time inside `Promise.allSettled` for every user with a missing username. 10 users = 10 sequential admin API calls.
- Same pattern in `placeBidInStore`.
- `resolvePredictionsForAuction` fires one `.update()` per prediction row and one `.update()` per user. Should be batched.

---

## Sweep 3 — Auth/Authorization on API Routes

- **`/api/state` is completely unauthenticated.** Anyone can GET the full state including `walletLog`, `confessions`, `activeBids`.
- `/api/auction/bids` — no auth required to enumerate bid history for any vibe.
- `getSupabaseAdmin()` in `state-db.js` falls back to `NEXT_PUBLIC_SUPABASE_ANON_KEY` when `SUPABASE_SERVICE_ROLE_KEY` is missing. Server-side operations meant to bypass RLS silently run with anon permissions instead of failing loudly.
- `/api/state/place-bid/route.js` — missing `export const dynamic = 'force-dynamic'`.

---

## Sweep 4 — State Management (Re-renders, Unstable References)

- `vibe-store.js` provider `value` memo depends on `store` (the entire state object). Every `setStore` call re-renders ALL `useVibeStore()` consumers — even if they only read `mintedVibes` and `balance` didn't change.
- `auth-store.js` — `signUp`, `signIn`, `signOut` are plain async functions (not `useCallback`). Recreated on every render, causing unnecessary re-renders of all `useAuth()` consumers.
- `NavBar.js` — `viewportWidth` initialises at `1200` (SSR safe) then corrects in `useEffect`, causing a visible layout flash on mobile.
- `auctions/page.js` — `setPage(1)` + `fetchAuctions()` fires a double fetch when filters change (page change triggers the effect again).

---

## Sweep 5 — Memory Leaks

- `auctions/page.js` and `leaderboard/page.js` both append a `<style>` with `@import url(Google Fonts)` on every mount. In React Strict Mode (double mount), fonts are re-requested. Should be loaded once in `layout.js` via `next/font/google`.
- `auctions/page.js` 60s interval captures `fetchAuctions` which references `abortRef`. Interval fire can race with a user-initiated fetch and cancel it.

---

## Sweep 6 — Duplicate Logic

- `normalize()` is defined identically in at least 5 files: `react-auction-page.js`, `react-app (9).js`, `vibe-store.js`, `state-db.js`. Should live in `lib/utils.js`.
- `safeNumber()` duplicated in 4 files.
- `mapSupabaseVibeRow()` duplicated between `vibe-store.js` and `state-db.js`.
- `marketApiRequest` (auction page) and `apiRequest` (vibe-store) are nearly identical HTTP helpers.
- `fetchHighestBidsFromClientSupabase` (client) and `fetchHighestBidsFromSupabase` (server) do the same reduction — fetch all bids, reduce to highest per vibe.

---

## Sweep 7 — API Routes Doing DB-Layer Work

- `/api/auctions/history` fetches all ended vibes, then filters `status=settled` in JS because "settled" means a `vault_items` row exists. Pagination totals are therefore wrong when filtering by settled.
- Same route calls `getGraduationBoard(200)` on every request — that's 5 Supabase queries per history page load.
- `deductAuraFromProfile` in `state-db.js` does a read-then-write for balance (see Sweep 15).

---

## Sweep 8 — Missing Loading/Error States

- `vault/page.js` — loading state shows "Redirecting To Account" with no spinner.
- `leaderboard/page.js` — fetch errors are silently swallowed; page just appears empty.
- Home page — doesn't check `isHydrating` from the store; initial render shows empty/default data.

---

## Sweep 9 — Hardcoded Values

- Google Fonts URL hardcoded in 2+ places (should be `layout.js` + `next/font/google`).
- Brand colors `#C8FF00`, `#0D0D0D`, `#1A1A1A` scattered hundreds of times. Need a `lib/theme.js`.
- Font family strings `"'Anton', sans-serif"` and `"'Inter', sans-serif"` repeated in every inline style.
- `AUTH_TOKEN_MAX_LEN = 12000` defined only in `state-db.js`.

---

## Sweep 10 — Inconsistent Data Normalization

- `vibe_bids` rows appear to store `vibe_id` as a slug in some rows, a UUID in others, and a display name in others. `getRecentBidsForVibe` has a three-tier fallback (ID → ilike name → fuzzy normalized name) which confirms this.
- `vibe-store.js` uses `normalizeKey()` while `state-db.js` uses `normalize()` — same function, different names.
- `getCandidateVibeIds` generates both raw and normalized forms, then queries with both — fragile and slow.

---

## Sweep 11 — Dead Code / Unused Imports

- `react-auction-page.js` and `react-app (9).js` live at the project root with paths like `./app/state/...`. The `(9)` filename is an iteration artifact. Both should be moved into `app/` and renamed.
- `leaderboard/page.js` and `mint/page.js` define their own `customStyles.header` / `customStyles.logo` / nav styles that are never rendered (both use `<NavBar />`).
- `state-db.js` line 1637: `if (!isDirectPurchase && sb) { if (sb) {` — inner `if (sb)` is redundant.

---

## Sweep 12 — Missing Input Validation on API Routes

- `/api/auctions/history` — `search` is passed directly into `.ilike('name', \`%${search}%\`)`. `%` and `_` are not escaped; users can craft wildcard patterns that scan the full table.
- `/api/state/place-bid` — no validation that `body.bid` is a valid object before passing to `placeBidInStore`.
- `/api/markets` — `limit` from query params has no upper bound. Caller can pass `limit=999999`.
- `submitCommentInStore` truncates to 280 chars but doesn't sanitize Unicode.

---

## Sweep 13 — Security Issues

- `getSupabaseAdmin()` silently falls back to anon key if `SUPABASE_SERVICE_ROLE_KEY` is unset. Operations meant to bypass RLS run as anon with no error — silent privilege degradation.
- Multiple API error responses expose raw `error.message` / DB error strings in a `details` field to the client: `state/route.js`, `vibe-social/route.js`, `vibe-comments/route.js`, `auctions/history/route.js`, `markets/route.js`.
- `data/vibe-store.json` file-based store has no file locking. Concurrent serverless invocations can corrupt it (also non-functional on Vercel — ephemeral FS).

---

## Sweep 14 — Overfetching

- `vibe-store.js` fetches `select('*')` on 1000 vibes client-side. Should select only the columns needed for the gallery.
- `vibe-store.js` fetches 4000 bid rows client-side just to compute highest bid per vibe. Should be a server-side aggregation.
- `state-db.js` `fetchVibesFromSupabase()` does `select('*')` with no limit — will fetch every vibe ever created as the dataset grows.
- `/api/auctions/history` fetches 2000 rows just to extract distinct categories. Should be a `distinct` query.

---

## Sweep 15 — Race Conditions

- **`deductAuraFromProfile` is not atomic.** Read balance → check → write is two queries. Two concurrent settlements can both read the same balance, both pass the check, both deduct. Classic TOCTOU. Must be `UPDATE profiles SET aura_balance = aura_balance - $1 WHERE aura_balance >= $1`.
- Vault insert and balance deduction are not in a transaction. Server crash between the two = free item.
- `stateQueue` in `state-db.js` serialises file operations per Node process — useless on Vercel where each invocation is a separate process.
- `auctions/page.js` filter-change double-fetch (also noted in Sweep 4).

---

## Sweep 16 — Inconsistent API Error Response Shapes

Every route returns a different error shape:
- `/api/state` → `{ error, details }`
- `/api/auction/bids` → `{ bids: [], topBid: null }` on error (200 status, no error field)
- `/api/state/vibe-comments` → `{ error, details, comments: [] }`
- `/api/state/vibe-graduation` → `{ graduation: null, error, details }`
- `/api/state/place-bid` → `{ error, details }` (no `accepted` field)

Need a shared `apiError(message, status)` helper used by all routes.

---

## Sweep 17 — Missing DB Indexes

Columns filtered/sorted in queries that likely need indexes:
- `vibe_bids.vibe_id` — filtered everywhere, most critical
- `vibe_bids.amount` — sorted on nearly every bid query
- `vibe_reactions.vibe_id`
- `vibe_comments.vibe_id`
- `vibes.remix_source_slug`
- `vault_items.user_id`
- `auction_predictions.vibe_id` + `auction_predictions.user_id` (compound)
- `vibes.slug` (likely already unique/indexed)

Check these in Supabase → Database → Indexes.

---

## Sweep 18 — Client vs Server Boundary Issues

- `fetchMintedVibesFromClientSupabase` and `fetchHighestBidsFromClientSupabase` in `vibe-store.js` download 1000 vibes + 4000 bids to every client. This work is already done server-side in `getState()`. The client fetch is redundant.
- `supabase-client.js` is imported by both client components and `state-db.js` (server route). The client singleton should never be used server-side.
- Google Fonts loaded via injected `<style>` tags in client components — should be `next/font/google` in `layout.js`.

---

## Sweep 19 — Accessibility

- `auctions/page.js` — `<select>` and `<input>` have no `<label>` or `aria-label`.
- `leaderboard/page.js` — table rows use `onClick` for navigation but have no `tabIndex` or `role="link"`. Table has no `<thead>` column headers.
- No `aria-current="page"` on active nav links in `NavBar.js`.
- Low contrast throughout: `#888` / `#666` text on `#111` background fails WCAG AA.
- No visible focus rings on filter buttons.

---

## Sweep 20 — Mobile/Responsive Bugs

- `mint/page.js` — `gridTemplateColumns: '1fr 340px'` with no responsive breakpoint. 340px sidebar will crush or overflow on mobile.
- Card hover shadows use fixed pixel offsets (`6px 6px 0px`) that can overflow viewport on small screens.
- `react-auction-page.js` base layout is `1fr 400px` grid — relies on JS viewport detection to collapse; pure CSS fallback is missing.

---

## Sweep 21 — Font/Style Inconsistencies

- Fonts loaded three ways: `next/font` (nowhere), Google Fonts `@import` in injected `<style>` (auctions, leaderboard), implicit reliance on other pages (mint, profile). Direct navigation to `/mint` may show fallback fonts.
- Auction cards in `auctions/page.js` use light theme (`#FFFFFF` background, dark text) while rest of app is dark-themed — jarring inconsistency.
- Dead nav style objects in `mint/page.js` and `leaderboard/page.js` define slightly different values than `NavBar.js` — style drift.

---

## Sweep 22 — SEO / Meta Tags

- `/auctions`, `/leaderboard`, `/mint`, `/vault` are all `'use client'` pages with no metadata export. They inherit the generic home page title/description.
- `/profile/[username]` is client-side — no dynamic OG tags for social sharing of profiles.
- Individual auction pages at `/auction/[slug]` DO export metadata (server component) — this is the one page done correctly.

---

## Sweep 23 — State Duplication / Conflicts

- `auctions/page.js` manages its own data entirely, never touches `vibe-store`. The store's `mintedVibes` and the page's `auctions` array represent the same listings in different shapes.
- Balance sourced from two places: `profile.aura_balance` (auth-store) when logged in, `store.balance` (file store) when not. After settlement, `refreshProfile()` updates auth-store but `store.balance` is not updated — both values can diverge.
- `vibe-store.js` maintains `supabaseVaultItems` (line 189) that shadows `store.vaultItems` from the file store. The `value` memo picks one or the other — they can disagree.

---

## Sweep 24 — Graduation / Market Feature

- Logic is correct and the four-state classification (`launching → heating → breakout → graduated`) works as designed.
- **Bug:** `recentBidCount` uses a 24-hour window inside a 7-day graduation window. A vibe created 5 days ago with lots of activity on days 2-4 shows zero recent bids. The window should match the graduation window (7 days) or be removed from scoring.
- **Waste:** `buildGraduationSnapshot` is called twice per vibe in `buildGraduationBoardRows` — once to compute score for sorting, once after sorting to attach rank. Refactor to compute score once, sort, then attach rank.
- `getGraduationBoard` is called redundantly — once in `/api/auctions/history` and separately in `/api/state/vibe-graduation`. Two full board computations per auction detail page load.

---

## Sweep 25 — Overall Architecture: Biggest Problems to Fix Next

**Priority 1 — Non-atomic financial operations (data integrity risk)**
`deductAuraFromProfile` is read-then-write with no transaction. Double-spend is possible under concurrent load. Fix: atomic SQL `UPDATE ... SET aura_balance = aura_balance - $1 WHERE aura_balance >= $1 RETURNING aura_balance`.

**Priority 2 — Remove the file-based store**
`state-db.js` has two code paths for every operation (file fallback + Supabase). The file path doesn't work on Vercel (ephemeral FS). It's 1800+ lines doing double the work. Remove the file fallback entirely, require Supabase.

**Priority 3 — Supabase Realtime (see `docs/supabase-realtime.md`)**
Polling is responsible for most of the Vercel function invocation spend. See separate doc.

**Priority 4 — Shared utilities**
Extract `normalize`, `safeNumber`, `mapSupabaseVibeRow`, `apiRequest`, theme constants, and font loading into shared files. Removes hundreds of lines of duplication.

**Priority 5 — Fix the `vibe_bids` data model**
Bids stored with inconsistent `vibe_id` format (slug vs UUID vs display name) requires a three-tier fuzzy fallback on every lookup. Migrate all rows to use a single canonical `vibe_id` format (slug) and add a DB index.

**Priority 6 — Rename the monolith files and split them**
`react-app (9).js` → `app/home/HomeApp.tsx`
`react-auction-page.js` → extract into `app/auction/[slug]/AuctionDetail.tsx` + sub-components
`state-db.js` → split into domain modules (`bids.ts`, `social.ts`, `graduation.ts`, etc.)

**Priority 7 — Add error boundary + shared API error helper**
One `ErrorBoundary` component wrapping the app. One `apiError(message, status)` helper used by all routes for consistent error shapes.
