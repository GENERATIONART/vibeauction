import { createClient } from '@supabase/supabase-js';

let _admin = null;

/**
 * Service-role Supabase client for server-side writes/admin calls (bypasses RLS).
 * Shared across state-db.js and the agent API routes so there's one client
 * instance and one place that reads the service-role env var.
 */
export function getSupabaseAdmin() {
  if (_admin) return _admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('[supabase-admin] SUPABASE_SERVICE_ROLE_KEY is not set — server-side DB operations require the service role key');
  }
  _admin = createClient(url, key, {
    auth: { persistSession: false },
    // Next.js patches global fetch with its own Data Cache, which can serve stale
    // reads for supabase-js's internal fetch calls even on force-dynamic routes.
    // Force every request through this client to bypass that cache entirely.
    global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }) },
  });
  return _admin;
}
