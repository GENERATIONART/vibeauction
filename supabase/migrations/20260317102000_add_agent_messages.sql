create table if not exists messages (
  id text primary key,
  sender_id uuid references auth.users(id) on delete cascade not null,
  recipient_id uuid references auth.users(id) on delete cascade not null,
  body text not null,
  created_at timestamptz default now()
);

create index if not exists messages_sender_idx on messages(sender_id, created_at desc);
create index if not exists messages_recipient_idx on messages(recipient_id, created_at desc);

alter table messages enable row level security;

do $$ begin
  create policy "Participants can read their messages"
    on messages for select using (auth.uid() = sender_id or auth.uid() = recipient_id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Service role can insert messages"
    on messages for insert with check (true);
exception when duplicate_object then null;
end $$;
