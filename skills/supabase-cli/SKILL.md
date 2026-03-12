---
name: supabase-cli
description: Use Supabase CLI for migrations, rollout, and database inspections tailored to Vibe Auction.
---

# Supabase CLI Skill

This skill documents the commands and workflows to run the Supabase CLI in this workspace.
Use it when you need to apply or inspect migrations, push local schema changes, or interact with the Supabase project defined in `/supabase/config.toml`.

## Setup

- The project already declares the Supabase config under `supabase/config.toml`. Use `supabase` binary with that config by setting `SUPABASE_CONFIG_PATH=supabase/config.toml`.
- Run `npm install @supabase/cli` if not already installed (the repo may already include Supabase CLI in lockfile).

## Common Commands

- `supabase db reset --force --project-ref <ref>` resets the database with the local schema (dangerous). Only use in development and after confirming stored data can be discarded.
- `supabase db diff` shows schema differences between local migrations and Supabase. Good before `db push`.
- `supabase db push` applies local migrations to Supabase.
- `supabase gen types typescript --schema public` generates types in TypeScript from the database schema.
- When running CLI commands, export credentials via the `.env.local` file before invoking, e.g., `source .env.local && supabase db push`.

## Workflow Guidelines

1. Use `rg -n` to check existing migrations in `/supabase/migrations`.
2. Add new SQL files named timestamped (`YYYYMMDDHHMMSS_description.sql`) in `/supabase/migrations`.
3. Test migrations locally via `supabase db reset --force` (with config set) before pushing to production.
4. After editing migrations, run `supabase db diff` and `supabase db push` to sync.
5. Document breaking changes in code and update this skill if new commands are required.

## Safety Rules

- Never run `supabase db reset --force` in production environments.
- Confirm `.env.local` contains valid `SUPABASE_SERVICE_ROLE_KEY` before running CLI commands that mutate schema/data.
