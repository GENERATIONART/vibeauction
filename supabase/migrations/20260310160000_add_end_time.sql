-- Add end_time to vibes so auction timers persist across page loads
ALTER TABLE vibes ADD COLUMN IF NOT EXISTS end_time timestamptz;
