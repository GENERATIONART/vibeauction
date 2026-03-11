-- Align opening behavior with orderbook-style markets:
-- no creator-set initial probability and no required seed liquidity.

ALTER TABLE prediction_markets
  ALTER COLUMN initial_probability DROP NOT NULL;

ALTER TABLE prediction_markets
  ALTER COLUMN initial_probability DROP DEFAULT;

ALTER TABLE prediction_markets
  ALTER COLUMN seed_liquidity SET DEFAULT 0;

UPDATE prediction_markets
SET seed_liquidity = 0
WHERE seed_liquidity IS NULL;

ALTER TABLE prediction_markets
  ALTER COLUMN seed_liquidity SET NOT NULL;

ALTER TABLE prediction_markets
  DROP CONSTRAINT IF EXISTS prediction_markets_initial_probability_check;

ALTER TABLE prediction_markets
  ADD CONSTRAINT prediction_markets_initial_probability_check
  CHECK (initial_probability IS NULL OR (initial_probability > 0 AND initial_probability < 1));

ALTER TABLE prediction_markets
  DROP CONSTRAINT IF EXISTS prediction_markets_seed_liquidity_check;

ALTER TABLE prediction_markets
  ADD CONSTRAINT prediction_markets_seed_liquidity_check
  CHECK (seed_liquidity >= 0);
