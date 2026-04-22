-- Fix signup flow so class assignment is stored in Supabase profile data.
-- Run this in the Supabase SQL Editor or via psql against the project database.

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, username, class_id, year_enrolled)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'username',
    nullif(new.raw_user_meta_data->>'class_id', '')::uuid,
    nullif(new.raw_user_meta_data->>'year_enrolled', '')::int
  )
  on conflict (id) do update
    set full_name = coalesce(excluded.full_name, public.profiles.full_name),
        username = coalesce(excluded.username, public.profiles.username),
        class_id = coalesce(public.profiles.class_id, excluded.class_id),
        year_enrolled = coalesce(public.profiles.year_enrolled, excluded.year_enrolled);
  return new;
end;
$$ language plpgsql security definer;

update public.profiles p
set
  class_id = coalesce(
    p.class_id,
    nullif(u.raw_user_meta_data->>'class_id', '')::uuid
  ),
  year_enrolled = coalesce(
    p.year_enrolled,
    nullif(u.raw_user_meta_data->>'year_enrolled', '')::int
  )
from auth.users u
where u.id = p.id
  and u.raw_user_meta_data is not null
  and (
    p.class_id is null
    or p.year_enrolled is null
  );
