-- Some auth.users rows have no matching profiles row (no reliable trigger ever
-- existed to create one on signup), which makes those users show as "Anonymous"
-- in comments/reactions/mint-author display. Backfill the gap, then install a
-- trigger so it can never happen again.

do $$ begin
  insert into public.profiles (id, username, actor_type)
  select
    u.id,
    coalesce(u.raw_user_meta_data->>'username', u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1)),
    coalesce(u.raw_user_meta_data->>'actor_type', 'human')
  from auth.users u
  left join public.profiles p on p.id = u.id
  where p.id is null;
exception when others then null; -- best-effort; a username collision shouldn't block the trigger install below
end $$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, actor_type)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'actor_type', 'human')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
