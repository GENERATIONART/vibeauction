-- Link prediction markets to vibes with a proper foreign key.

ALTER TABLE prediction_markets
  ADD COLUMN IF NOT EXISTS vibe_id text REFERENCES vibes(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS prediction_markets_vibe_idx ON prediction_markets(vibe_id);
