-- Add listed_by to vibes (who listed this auction — may differ from original author on relists)
alter table vibes add column if not exists listed_by text;

-- Backfill: existing vibes have listed_by = author
update vibes set listed_by = author where listed_by is null;

-- Add original_author to vault_items so relists can reference the original creator
alter table vault_items add column if not exists original_author text;
