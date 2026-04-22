-- Full Supabase database sync for the current app.
-- Safe/idempotent: adds missing tables/columns/policies without dropping existing data.

-- =====================
-- 1. Profiles / Signup
-- =====================
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

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

-- =====================
-- 2. Course content tables
-- =====================
create table if not exists modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id) on delete cascade,
  title text not null,
  sort_order int default 0,
  created_at timestamptz default now()
);

create table if not exists lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid references modules(id) on delete cascade,
  title text not null,
  content text,
  video_url text,
  sort_order int default 0,
  created_at timestamptz default now()
);

create table if not exists lesson_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references profiles(id) on delete cascade,
  lesson_id uuid references lessons(id) on delete cascade,
  completed boolean default false,
  completed_at timestamptz,
  unique(student_id, lesson_id)
);

create table if not exists course_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references profiles(id) on delete cascade,
  course_id uuid references courses(id) on delete cascade,
  completed_at timestamptz default now(),
  unique(student_id, course_id)
);

-- =====================
-- 3. Attendance sessions + records + logs
-- =====================
alter table if exists attendance_sessions
  add column if not exists status text default 'scheduled',
  add column if not exists notes text,
  add column if not exists updated_at timestamptz default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'attendance_sessions_status_check'
  ) then
    alter table attendance_sessions
      add constraint attendance_sessions_status_check
      check (status in ('scheduled', 'active', 'closed', 'archived'));
  end if;
end $$;

alter table if exists attendance_records
  add column if not exists session_id uuid references attendance_sessions(id) on delete cascade,
  add column if not exists method text default 'face_ai',
  add column if not exists confidence_score numeric(5,2),
  add column if not exists notes text,
  add column if not exists updated_at timestamptz default now();

alter table if exists attendance_logs
  add column if not exists session_id uuid references attendance_sessions(id) on delete set null;

create index if not exists idx_attendance_sessions_class_date
  on attendance_sessions(class_id, date);
create index if not exists idx_attendance_sessions_date
  on attendance_sessions(date);
create index if not exists idx_attendance_records_session_id
  on attendance_records(session_id);
create index if not exists idx_attendance_records_class_date
  on attendance_records(class_id, date);
create index if not exists idx_attendance_records_student_date
  on attendance_records(student_id, date);
create index if not exists idx_attendance_logs_session_id
  on attendance_logs(session_id);
create index if not exists idx_attendance_logs_class_created_at
  on attendance_logs(class_id, created_at desc);

-- =====================
-- 4. RLS policies
-- =====================
alter table if exists profiles enable row level security;
alter table if exists classes enable row level security;
alter table if exists academic_years enable row level security;
alter table if exists courses enable row level security;
alter table if exists assignments enable row level security;
alter table if exists submissions enable row level security;
alter table if exists attendance_sessions enable row level security;
alter table if exists attendance_records enable row level security;
alter table if exists attendance_logs enable row level security;
alter table if exists quizzes enable row level security;
alter table if exists quiz_questions enable row level security;
alter table if exists quiz_attempts enable row level security;
alter table if exists course_progress enable row level security;
alter table if exists modules enable row level security;
alter table if exists lessons enable row level security;
alter table if exists lesson_progress enable row level security;
alter table if exists activity_logs enable row level security;

alter table if exists quiz_attempts
  add column if not exists max_score int default 0;

drop policy if exists "Public read classes" on classes;
drop policy if exists "Public read academic_years" on academic_years;
drop policy if exists "Read all profiles" on profiles;
drop policy if exists "Update own profile" on profiles;
drop policy if exists "Insert own profile" on profiles;
drop policy if exists "Read published courses" on courses;
drop policy if exists "Teacher manage courses" on courses;
drop policy if exists "Students read assignments" on assignments;
drop policy if exists "Teacher manage assignments" on assignments;
drop policy if exists "Student own submissions" on submissions;
drop policy if exists "Student insert submission" on submissions;
drop policy if exists "Student update own submission" on submissions;
drop policy if exists "Teacher grade submission" on submissions;
drop policy if exists "Students read own sessions" on attendance_sessions;
drop policy if exists "Public read sessions" on attendance_sessions;
drop policy if exists "Teacher manage sessions" on attendance_sessions;
drop policy if exists "Student read own attendance" on attendance_records;
drop policy if exists "Student manage own attendance" on attendance_records;
drop policy if exists "Teacher manage attendance" on attendance_records;
drop policy if exists "Teachers and Admins can view attendance" on attendance_logs;
drop policy if exists "Students can view their own attendance" on attendance_logs;
drop policy if exists "Students can create their own attendance" on attendance_logs;
drop policy if exists "Teacher manage logs" on attendance_logs;
drop policy if exists "Student manage own logs" on attendance_logs;
drop policy if exists "Students read published quizzes" on quizzes;
drop policy if exists "Teachers manage own quizzes" on quizzes;
drop policy if exists "Students read quiz questions" on quiz_questions;
drop policy if exists "Teachers manage quiz questions" on quiz_questions;
drop policy if exists "Students manage own attempts" on quiz_attempts;
drop policy if exists "Teachers view all attempts" on quiz_attempts;
drop policy if exists "Student own course progress" on course_progress;
drop policy if exists "Student manage own course progress" on course_progress;
drop policy if exists "Teacher read all course progress" on course_progress;
drop policy if exists "Public read modules" on modules;
drop policy if exists "Teacher manage modules" on modules;
drop policy if exists "Public read lessons" on lessons;
drop policy if exists "Teacher manage lessons" on lessons;
drop policy if exists "Student own progress" on lesson_progress;
drop policy if exists "Student manage own progress" on lesson_progress;
drop policy if exists "Teacher read all progress" on lesson_progress;
drop policy if exists "Admins can view all logs" on activity_logs;
drop policy if exists "Users can view their own logs" on activity_logs;

create policy "Public read classes" on classes for select using (true);
create policy "Public read academic_years" on academic_years for select using (true);

create policy "Read all profiles" on profiles for select using (true);
create policy "Update own profile" on profiles for update using (auth.uid() = id);
create policy "Insert own profile" on profiles for insert with check (auth.uid() = id);

create policy "Read published courses" on courses for select using (is_published = true);
create policy "Teacher manage courses" on courses for all using (
  exists (select 1 from profiles where id = auth.uid() and role in ('teacher','admin'))
);

create policy "Students read assignments" on assignments for select using (
  exists (
    select 1 from profiles p
    where p.id = auth.uid()
    and (p.class_id = assignments.class_id or p.role in ('teacher','admin'))
  )
);
create policy "Teacher manage assignments" on assignments for all using (
  exists (select 1 from profiles where id = auth.uid() and role in ('teacher','admin'))
);

create policy "Student own submissions" on submissions for select using (
  auth.uid() = student_id or
  exists (select 1 from profiles where id = auth.uid() and role in ('teacher','admin'))
);
create policy "Student insert submission" on submissions for insert with check (auth.uid() = student_id);
create policy "Student update own submission" on submissions for update using (auth.uid() = student_id);
create policy "Teacher grade submission" on submissions for update using (
  exists (select 1 from profiles where id = auth.uid() and role in ('teacher','admin'))
);

create policy "Students read own sessions" on attendance_sessions for select using (
  auth.uid() is not null and (
    exists (select 1 from profiles where id = auth.uid() and role in ('teacher', 'admin'))
    or exists (select 1 from profiles where id = auth.uid() and class_id = attendance_sessions.class_id)
    or attendance_sessions.class_id is null
  )
);
create policy "Teacher manage sessions" on attendance_sessions for all using (
  exists (select 1 from profiles where id = auth.uid() and role in ('teacher', 'admin'))
);

create policy "Student read own attendance" on attendance_records for select using (auth.uid() = student_id);
create policy "Teacher manage attendance" on attendance_records for all using (
  exists (select 1 from profiles where id = auth.uid() and role in ('teacher', 'admin'))
);

create policy "Teachers and Admins can view attendance" on attendance_logs for select using (
  exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'teacher'))
);
create policy "Students can view their own attendance" on attendance_logs for select using (student_id = auth.uid());
create policy "Students can create their own attendance" on attendance_logs for insert with check (student_id = auth.uid());
create policy "Teacher manage logs" on attendance_logs for all using (
  exists (select 1 from profiles where id = auth.uid() and role in ('teacher', 'admin'))
);

create policy "Students read published quizzes" on quizzes for select using (
  is_published = true and (
    class_id is null or
    exists (select 1 from profiles where id = auth.uid() and class_id = quizzes.class_id)
  )
);
create policy "Teachers manage own quizzes" on quizzes for all using (
  exists (select 1 from profiles where id = auth.uid() and role in ('teacher','admin'))
);

create policy "Students read quiz questions" on quiz_questions for select using (
  exists (
    select 1 from quizzes q
    join profiles p on p.id = auth.uid()
    where q.id = quiz_questions.quiz_id
      and q.is_published = true
      and (q.class_id is null or p.class_id = q.class_id)
  )
);
create policy "Teachers manage quiz questions" on quiz_questions for all using (
  exists (select 1 from profiles where id = auth.uid() and role in ('teacher','admin'))
);

create policy "Students manage own attempts" on quiz_attempts for all using (auth.uid() = student_id);
create policy "Teachers view all attempts" on quiz_attempts for select using (
  exists (select 1 from profiles where id = auth.uid() and role in ('teacher','admin'))
);

create policy "Student own course progress" on course_progress for select using (auth.uid() = student_id);
create policy "Student manage own course progress" on course_progress for all using (auth.uid() = student_id);
create policy "Teacher read all course progress" on course_progress for select using (
  exists (select 1 from profiles where id = auth.uid() and role in ('teacher','admin'))
);

create policy "Public read modules" on modules for select using (true);
create policy "Teacher manage modules" on modules for all using (
  exists (select 1 from profiles where id = auth.uid() and role in ('teacher','admin'))
);

create policy "Public read lessons" on lessons for select using (true);
create policy "Teacher manage lessons" on lessons for all using (
  exists (select 1 from profiles where id = auth.uid() and role in ('teacher','admin'))
);

create policy "Student own progress" on lesson_progress for select using (auth.uid() = student_id);
create policy "Student manage own progress" on lesson_progress for all using (auth.uid() = student_id);
create policy "Teacher read all progress" on lesson_progress for select using (
  exists (select 1 from profiles where id = auth.uid() and role in ('teacher','admin'))
);

create policy "Admins can view all logs" on activity_logs for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "Users can view their own logs" on activity_logs for select using (user_id = auth.uid());

-- =====================
-- 5. Helpful view / cleanup helper
-- =====================
create or replace view attendance_session_overview as
select
  s.id,
  s.class_id,
  c.name as class_name,
  s.date,
  s.start_time,
  s.end_time,
  s.teacher_id,
  p.full_name as teacher_name,
  s.status,
  count(r.id) filter (where r.status = 'present') as present_count,
  count(r.id) filter (where r.status = 'late') as late_count,
  count(r.id) filter (where r.status = 'sick') as sick_count,
  count(r.id) filter (where r.status = 'permission') as permission_count,
  count(r.id) filter (where r.status = 'absent') as absent_count
from attendance_sessions s
left join classes c on c.id = s.class_id
left join profiles p on p.id = s.teacher_id
left join attendance_records r on r.session_id = s.id
group by s.id, c.name, p.full_name;

create or replace function purge_old_attendance_audit(p_keep_days int default 180)
returns void
language plpgsql
as $$
begin
  delete from attendance_logs
  where created_at < now() - make_interval(days => p_keep_days);
end;
$$;
