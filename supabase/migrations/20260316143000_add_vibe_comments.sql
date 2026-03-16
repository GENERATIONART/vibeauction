create table if not exists vibe_comments (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  vibe_id text not null,
  vibe_name text,
  body text not null,
  created_at timestamptz default now()
);

create index if not exists vibe_comments_vibe_id_idx on vibe_comments(vibe_id);
create index if not exists vibe_comments_user_id_idx on vibe_comments(user_id);

alter table vibe_comments enable row level security;

do $$ begin
  create policy "Anyone can read vibe comments"
    on vibe_comments for select using (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Service role can insert vibe comments"
    on vibe_comments for insert with check (true);
exception when duplicate_object then null;
end $$;
