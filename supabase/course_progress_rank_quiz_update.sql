-- Course progress + quiz raw score + improved rank tiers
-- Run in Supabase SQL Editor.

alter table if exists quiz_attempts
  add column if not exists max_score int default 0;

create table if not exists course_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references profiles(id) on delete cascade,
  course_id uuid references courses(id) on delete cascade,
  completed_at timestamptz default now(),
  unique(student_id, course_id)
);

alter table course_progress enable row level security;

drop policy if exists "Student own course progress" on course_progress;
drop policy if exists "Teacher read all course progress" on course_progress;

create policy "Student own course progress" on course_progress for select using (auth.uid() = student_id);
create policy "Student manage own course progress" on course_progress for all using (auth.uid() = student_id);
create policy "Teacher read all course progress" on course_progress for select using (
  exists (select 1 from profiles where id = auth.uid() and role in ('teacher', 'admin'))
);

