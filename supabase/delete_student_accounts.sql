-- Delete every non-staff account, keeping only admin and teacher users.
-- Run this in the Supabase SQL Editor after verifying the target project.

begin;

with student_ids as (
  select id
  from public.profiles
  where coalesce(role, 'student') not in ('admin', 'teacher')
)
delete from auth.users u
using student_ids s
where u.id = s.id;

commit;
