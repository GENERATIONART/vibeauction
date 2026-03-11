-- Add original_author to vault_items (missing from original migration)
ALTER TABLE vault_items ADD COLUMN IF NOT EXISTS original_author text;

-- Public read policy for vibes table (needed for profile page + homepage queries)
ALTER TABLE vibes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone can read vibes"
    ON vibes FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can insert vibes"
    ON vibes FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Public read for vibe_bids (needed for bid history on auction page)
DO $$ BEGIN
  CREATE POLICY "Anyone can read vibe_bids"
    ON vibe_bids FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Public read for profiles (needed for leaderboard + profile pages)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone can read profiles"
    ON profiles FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
