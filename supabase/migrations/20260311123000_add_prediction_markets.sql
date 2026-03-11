-- Advanced prediction markets with AURA payouts.

CREATE TABLE IF NOT EXISTS prediction_markets (
  id text PRIMARY KEY,
  creator_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  market_type text NOT NULL DEFAULT 'binary',
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'General',
  outcome_yes_label text NOT NULL DEFAULT 'Yes',
  outcome_no_label text NOT NULL DEFAULT 'No',
  closes_at timestamptz NOT NULL,
  resolves_at timestamptz,
  initial_probability numeric NOT NULL CHECK (initial_probability > 0 AND initial_probability < 1),
  seed_liquidity numeric NOT NULL CHECK (seed_liquidity >= 10),
  yes_pool numeric NOT NULL DEFAULT 0 CHECK (yes_pool >= 0),
  no_pool numeric NOT NULL DEFAULT 0 CHECK (no_pool >= 0),
  total_volume numeric NOT NULL DEFAULT 0 CHECK (total_volume >= 0),
  state text NOT NULL DEFAULT 'open' CHECK (state IN ('open', 'resolved', 'cancelled')),
  resolved_outcome text CHECK (resolved_outcome IN ('yes', 'no', 'cancelled')),
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS prediction_market_positions (
  id text PRIMARY KEY,
  market_id text REFERENCES prediction_markets(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  side text NOT NULL CHECK (side IN ('yes', 'no')),
  stake numeric NOT NULL CHECK (stake > 0),
  shares numeric NOT NULL CHECK (shares > 0),
  entry_probability numeric NOT NULL CHECK (entry_probability > 0 AND entry_probability < 1),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS prediction_market_claims (
  id text PRIMARY KEY,
  market_id text REFERENCES prediction_markets(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL CHECK (amount >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT prediction_market_claims_unique_user_market UNIQUE (market_id, user_id)
);

CREATE INDEX IF NOT EXISTS prediction_markets_state_idx ON prediction_markets(state);
CREATE INDEX IF NOT EXISTS prediction_markets_closes_at_idx ON prediction_markets(closes_at);
CREATE INDEX IF NOT EXISTS prediction_markets_creator_idx ON prediction_markets(creator_id);

CREATE INDEX IF NOT EXISTS prediction_positions_market_idx ON prediction_market_positions(market_id);
CREATE INDEX IF NOT EXISTS prediction_positions_user_idx ON prediction_market_positions(user_id);
CREATE INDEX IF NOT EXISTS prediction_claims_market_idx ON prediction_market_claims(market_id);
CREATE INDEX IF NOT EXISTS prediction_claims_user_idx ON prediction_market_claims(user_id);

ALTER TABLE prediction_markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_market_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_market_claims ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone can read prediction markets"
    ON prediction_markets FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Anyone can read prediction positions"
    ON prediction_market_positions FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Anyone can read prediction claims"
    ON prediction_market_claims FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can insert prediction markets"
    ON prediction_markets FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can update prediction markets"
    ON prediction_markets FOR UPDATE USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can insert prediction positions"
    ON prediction_market_positions FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can insert prediction claims"
    ON prediction_market_claims FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
