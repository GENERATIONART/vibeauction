create table if not exists follows (
  follower_id uuid references auth.users(id) on delete cascade not null,
  followee_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now(),
  primary key (follower_id, followee_id)
);

do $$ begin
  alter table follows add constraint follows_no_self_follow check (follower_id <> followee_id);
exception when duplicate_object then null;
end $$;

create index if not exists follows_followee_idx on follows(followee_id);
create index if not exists follows_follower_idx on follows(follower_id);

alter table follows enable row level security;

do $$ begin
  create policy "Anyone can read follows"
    on follows for select using (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Service role can insert follows"
    on follows for insert with check (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Service role can delete follows"
    on follows for delete using (true);
exception when duplicate_object then null;
end $$;
