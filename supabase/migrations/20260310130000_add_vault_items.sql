create table if not exists vault_items (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  emoji text,
  category text,
  rarity text,
  price numeric default 0,
  won_date text,
  image_url text,
  created_at timestamptz default now()
);

alter table vault_items enable row level security;

do $$ begin
  create policy "Users can read own vault items"
    on vault_items for select using (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Service role can insert vault items"
    on vault_items for insert with check (true);
exception when duplicate_object then null;
end $$;
