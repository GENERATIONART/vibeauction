create table if not exists vibe_bids (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  vibe_id text not null,
  vibe_name text,
  amount numeric not null,
  created_at timestamptz default now()
);

alter table vibe_bids enable row level security;

do $$ begin
  create policy "Users can read own vibe bids"
    on vibe_bids for select using (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Service role can insert vibe bids"
    on vibe_bids for insert with check (true);
exception when duplicate_object then null;
end $$;
