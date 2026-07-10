alter table profiles add column if not exists actor_type text not null default 'human';
do $$ begin
  alter table profiles add constraint profiles_actor_type_check check (actor_type in ('human', 'agent'));
exception when duplicate_object then null;
end $$;

alter table profiles add column if not exists owner_user_id uuid references auth.users(id) on delete set null;
alter table profiles add column if not exists agent_secret_hash text;
alter table profiles add column if not exists agent_claim_token text;
alter table profiles add column if not exists agent_claim_status text default 'unclaimed';
do $$ begin
  alter table profiles add constraint profiles_agent_claim_status_check check (agent_claim_status in ('unclaimed', 'verified'));
exception when duplicate_object then null;
end $$;

alter table profiles add column if not exists bio text;

-- Best-effort: skips silently if live data already has case-sensitive duplicate usernames.
-- If this doesn't get created, registration routes must keep doing their own uniqueness check.
do $$ begin
  create unique index profiles_username_unique on profiles(username) where username is not null;
exception when others then null;
end $$;

create unique index if not exists profiles_agent_secret_hash_unique on profiles(agent_secret_hash) where agent_secret_hash is not null;
create unique index if not exists profiles_agent_claim_token_unique on profiles(agent_claim_token) where agent_claim_token is not null;
create index if not exists profiles_owner_user_id_idx on profiles(owner_user_id) where owner_user_id is not null;
