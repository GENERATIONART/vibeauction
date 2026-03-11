-- Prediction side-game: users guess final price + winning bid timing for points.
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS prediction_points integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS auction_predictions (
  id text PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vibe_id text NOT NULL,
  vibe_name text,
  predicted_price numeric NOT NULL CHECK (predicted_price > 0),
  predicted_winner_time timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamptz,
  actual_final_price numeric,
  actual_winner_time timestamptz,
  points_awarded integer NOT NULL DEFAULT 0,
  CONSTRAINT auction_predictions_user_vibe_unique UNIQUE (user_id, vibe_id)
);

CREATE INDEX IF NOT EXISTS auction_predictions_vibe_id_idx ON auction_predictions(vibe_id);
CREATE INDEX IF NOT EXISTS auction_predictions_user_id_idx ON auction_predictions(user_id);

ALTER TABLE auction_predictions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone can read auction predictions"
    ON auction_predictions FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can insert auction predictions"
    ON auction_predictions FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can update auction predictions"
    ON auction_predictions FOR UPDATE USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
