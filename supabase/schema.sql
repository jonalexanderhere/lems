-- Run this entire script in Supabase SQL Editor
-- Go to: https://supabase.com/dashboard/project/hbrwwnnekhdaejfjjusw/sql

-- =====================
-- 1. ACADEMIC YEARS
-- =====================
create table if not exists academic_years (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  is_current boolean default false,
  start_date date,
  end_date date,
  created_at timestamptz default now()
);

-- Seed current academic year
insert into academic_years (label, is_current, start_date, end_date)
values ('2025/2026', true, '2025-07-14', '2026-06-30')
on conflict do nothing;

-- =====================
-- 2. CLASSES
-- =====================
create table if not exists classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  grade text not null,
  section text not null,
  academic_year_id uuid references academic_years(id) on delete set null,
  created_at timestamptz default now()
);

-- Seed classes for current year
do $$
declare
  yr_id uuid;
begin
  select id into yr_id from academic_years where is_current = true limit 1;
  insert into classes (name, grade, section, academic_year_id) values
    ('X TJKT 1',   'X',    'TJKT 1', yr_id),
    ('X TJKT 2',   'X',    'TJKT 2', yr_id),
    ('X TJKT 3',   'X',    'TJKT 3', yr_id),
    ('XI TJKT 1',  'XI',   'TJKT 1', yr_id),
    ('XI TJKT 2',  'XI',   'TJKT 2', yr_id),
    ('XI TJKT 3',  'XI',   'TJKT 3', yr_id),
    ('XII TJKT 1', 'XII',  'TJKT 1', yr_id),
    ('XII TJKT 2', 'XII',  'TJKT 2', yr_id),
    ('XII TJKT 3', 'XII',  'TJKT 3', yr_id),
    ('Alumni',     'Alumni','Alumni', yr_id)
  on conflict do nothing;
end;
$$;

-- =====================
-- 3. PROFILES
-- =====================
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'student',
  full_name text,
  username text unique,
  class_id uuid references classes(id) on delete set null,
  year_enrolled int,
  avatar_url text,
  xp int default 0,
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, username)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'username'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- =====================
-- 4. COURSES
-- =====================
create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  thumbnail_url text,
  teacher_id uuid references profiles(id) on delete set null,
  class_id uuid references classes(id) on delete set null,
  category text,
  level text default 'Beginner',
  duration_hours int default 0,
  is_published boolean default true,
  created_at timestamptz default now()
);

-- =====================
-- 5. ASSIGNMENTS
-- =====================
create table if not exists assignments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id) on delete cascade,
  teacher_id uuid references profiles(id) on delete set null,
  class_id uuid references classes(id) on delete set null,
  title text not null,
  description text,
  attachment_url text,
  attachment_name text,
  due_date timestamptz,
  max_score int default 100,
  created_at timestamptz default now()
);

-- =====================
-- 6. SUBMISSIONS
-- =====================
create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid references assignments(id) on delete cascade,
  student_id uuid references profiles(id) on delete cascade,
  file_url text not null,
  file_name text not null,
  file_type text,
  file_size int,
  note text,
  score int,
  feedback text,
  submitted_at timestamptz default now(),
  graded_at timestamptz,
  unique(assignment_id, student_id)
);

-- =====================
-- 7. RLS POLICIES
-- =====================
alter table profiles enable row level security;
alter table classes enable row level security;
alter table academic_years enable row level security;
alter table courses enable row level security;
alter table assignments enable row level security;
alter table submissions enable row level security;

-- Everyone can read classes and academic years
create policy "Public read classes" on classes for select using (true);
create policy "Public read academic_years" on academic_years for select using (true);

-- Profiles: users can read all profiles, update own
create policy "Read all profiles" on profiles for select using (true);
create policy "Update own profile" on profiles for update using (auth.uid() = id);
create policy "Insert own profile" on profiles for insert with check (auth.uid() = id);

-- Courses: published visible to all; teachers manage own
create policy "Read published courses" on courses for select using (is_published = true);
create policy "Teacher manage courses" on courses for all using (
  exists (select 1 from profiles where id = auth.uid() and role in ('teacher','admin'))
);

-- Assignments: students in that class can see them; teachers manage own
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

-- Submissions: student sees own; teacher sees all
create policy "Student own submissions" on submissions for select using (
  auth.uid() = student_id or
  exists (select 1 from profiles where id = auth.uid() and role in ('teacher','admin'))
);
create policy "Student insert submission" on submissions for insert with check (auth.uid() = student_id);
create policy "Student update own submission" on submissions for update using (auth.uid() = student_id);
create policy "Teacher grade submission" on submissions for update using (
  exists (select 1 from profiles where id = auth.uid() and role in ('teacher','admin'))
);

-- =====================
-- 8. STORAGE BUCKETS (run separately if needed)
-- =====================
-- In Supabase Dashboard → Storage → New Bucket:
-- Name: "assignments" → Public: true
-- Name: "submissions" → Public: false

-- =====================
-- 9. GRADE PROMOTION FUNCTION
-- =====================
create or replace function promote_class_grades(academic_year_label text)
returns void as $$
declare
  new_yr_id uuid;
begin
  -- Create new academic year if not exists
  insert into academic_years (label, is_current, start_date, end_date)
  values (academic_year_label, true, now()::date, (now() + interval '1 year')::date)
  returning id into new_yr_id;

  -- Unmark old current year
  update academic_years set is_current = false where id != new_yr_id;

  -- Seed new classes for new year
  insert into classes (name, grade, section, academic_year_id) values
    ('X TJKT 1',   'X',     'TJKT 1', new_yr_id),
    ('X TJKT 2',   'X',     'TJKT 2', new_yr_id),
    ('X TJKT 3',   'X',     'TJKT 3', new_yr_id),
    ('XI TJKT 1',  'XI',    'TJKT 1', new_yr_id),
    ('XI TJKT 2',  'XI',    'TJKT 2', new_yr_id),
    ('XI TJKT 3',  'XI',    'TJKT 3', new_yr_id),
    ('XII TJKT 1', 'XII',   'TJKT 1', new_yr_id),
    ('XII TJKT 2', 'XII',   'TJKT 2', new_yr_id),
    ('XII TJKT 3', 'XII',   'TJKT 3', new_yr_id),
    ('Alumni',     'Alumni','Alumni',  new_yr_id);
end;
$$ language plpgsql security definer;

-- =====================
-- 10. ACTIVITY LOGS (LOG AKTIVITAS)
-- =====================
create table if not exists activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  action text not null,
  metadata jsonb default '{}',
  ip_address text,
  user_agent text,
  created_at timestamptz default now()
);

-- =====================
-- 11. ATTENDANCE LOGS (LOG ABSENSI)
-- =====================
create table if not exists attendance_logs (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references profiles(id) on delete cascade,
  class_id uuid references classes(id) on delete set null,
  method text default 'face_recognition',
  status text default 'present',
  confidence_score float,
  image_proof_url text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table activity_logs enable row level security;
alter table attendance_logs enable row level security;

-- Policies for Activity Logs
create policy "Admins can view all logs"
  on activity_logs for select
  using ( exists (select 1 from profiles where id = auth.uid() and role = 'admin') );

create policy "Users can view their own logs"
  on activity_logs for select
  using ( user_id = auth.uid() );

-- Policies for Attendance Logs
create policy "Teachers and Admins can view attendance"
  on attendance_logs for select
  using ( exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'teacher')) );

create policy "Students can view their own attendance"
  on attendance_logs for select
  using ( student_id = auth.uid() );

create policy "Students can create their own attendance"
  on attendance_logs for insert
  with check ( student_id = auth.uid() );

