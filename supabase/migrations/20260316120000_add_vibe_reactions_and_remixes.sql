alter table vibes add column if not exists remix_source_slug text;
alter table vibes add column if not exists remix_source_name text;
alter table vibes add column if not exists remix_source_author text;

create index if not exists vibes_remix_source_slug_idx on vibes(remix_source_slug);

create table if not exists vibe_reactions (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  vibe_id text not null,
  vibe_name text,
  reaction_type text not null,
  created_at timestamptz default now(),
  constraint vibe_reactions_user_vibe_reaction_unique unique (user_id, vibe_id, reaction_type)
);

create index if not exists vibe_reactions_vibe_id_idx on vibe_reactions(vibe_id);
create index if not exists vibe_reactions_user_id_idx on vibe_reactions(user_id);

alter table vibe_reactions enable row level security;

do $$ begin
  create policy "Anyone can read vibe reactions"
    on vibe_reactions for select using (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Service role can insert vibe reactions"
    on vibe_reactions for insert with check (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Service role can delete vibe reactions"
    on vibe_reactions for delete using (true);
exception when duplicate_object then null;
end $$;
