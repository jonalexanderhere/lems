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
  badges jsonb default '[]'::jsonb,
  face_descriptor jsonb,
  face_enrolled_at timestamptz,
  xp int default 0,
  created_at timestamptz default now()
);

-- Auto-create profile on signup
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

-- Backfill existing profiles from stored auth metadata when available
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

-- =====================
-- 12. STORAGE BUCKETS
-- =====================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'Public read avatars'
  ) then
    create policy "Public read avatars"
      on storage.objects for select
      using (bucket_id = 'avatars');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'Authenticated upload avatars'
  ) then
    create policy "Authenticated upload avatars"
      on storage.objects for insert
      to authenticated
      with check (
        bucket_id = 'avatars'
        and auth.uid()::text = (storage.foldername(name))[1]
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'Authenticated update avatars'
  ) then
    create policy "Authenticated update avatars"
      on storage.objects for update
      to authenticated
      using (
        bucket_id = 'avatars'
        and auth.uid()::text = (storage.foldername(name))[1]
      );
  end if;
end;
$$;

-- =====================
-- 13. QUIZZES / UJIAN
-- =====================
create table if not exists quizzes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references profiles(id) on delete set null,
  class_id uuid references classes(id) on delete set null,
  title text not null,
  description text,
  type text not null default 'ulangan_harian', -- 'ulangan_harian' | 'ulangan_semester'
  duration_minutes int not null default 60,
  start_at timestamptz,
  end_at timestamptz,
  is_published boolean default false,
  created_at timestamptz default now()
);

create table if not exists quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid references quizzes(id) on delete cascade,
  question_text text not null,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,
  correct_option text not null check (correct_option in ('a','b','c','d')),
  points int default 1,
  order_num int default 0,
  created_at timestamptz default now()
);

create table if not exists quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid references quizzes(id) on delete cascade,
  student_id uuid references profiles(id) on delete cascade,
  answers jsonb default '{}'::jsonb,  -- { question_id: 'a'|'b'|'c'|'d' }
  score int,
  total_questions int,
  correct_answers int,
  started_at timestamptz default now(),
  submitted_at timestamptz,
  unique(quiz_id, student_id)
);

-- RLS
alter table quizzes enable row level security;
alter table quiz_questions enable row level security;
alter table quiz_attempts enable row level security;

-- Quizzes: published visible to assigned class; teacher manages own
create policy "Students read published quizzes"
  on quizzes for select
  using (
    is_published = true and (
      class_id is null or
      exists (select 1 from profiles where id = auth.uid() and class_id = quizzes.class_id)
    )
  );

create policy "Teachers manage own quizzes"
  on quizzes for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role in ('teacher','admin'))
  );

-- Quiz questions: students in class can read if quiz published; teachers manage
create policy "Students read quiz questions"
  on quiz_questions for select
  using (
    exists (
      select 1 from quizzes q
      join profiles p on p.id = auth.uid()
      where q.id = quiz_questions.quiz_id
        and q.is_published = true
        and (q.class_id is null or p.class_id = q.class_id)
    )
  );

create policy "Teachers manage quiz questions"
  on quiz_questions for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role in ('teacher','admin'))
  );

-- Quiz attempts: students manage own; teachers see all
create policy "Students manage own attempts"
  on quiz_attempts for all
  using (auth.uid() = student_id);

create policy "Teachers view all attempts"
  on quiz_attempts for select
  using (
    exists (select 1 from profiles where id = auth.uid() and role in ('teacher','admin'))
  );

-- =====================
-- 14. COURSE MODULES & LESSONS
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

create table if not exists attendance_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references profiles(id) on delete cascade,
  class_id uuid references classes(id) on delete set null,
  date date not null,
  status text not null check (status in ('present', 'absent', 'late', 'sick', 'permission')),
  notes text,
  created_at timestamptz default now(),
  unique(student_id, date)
);

alter table modules enable row level security;
alter table lessons enable row level security;
alter table lesson_progress enable row level security;
alter table attendance_records enable row level security;

create policy "Public read modules" on modules for select using (true);
create policy "Teacher manage modules" on modules for all using (exists (select 1 from profiles where id = auth.uid() and role in ('teacher','admin')));

create policy "Public read lessons" on lessons for select using (true);
create policy "Teacher manage lessons" on lessons for all using (exists (select 1 from profiles where id = auth.uid() and role in ('teacher','admin')));

create policy "Student own progress" on lesson_progress for select using (auth.uid() = student_id);
create policy "Student manage own progress" on lesson_progress for all using (auth.uid() = student_id);
create policy "Teacher read all progress" on lesson_progress for select using (exists (select 1 from profiles where id = auth.uid() and role in ('teacher','admin')));

create policy "Student read own attendance" on attendance_records for select using (auth.uid() = student_id);
create policy "Teacher manage attendance" on attendance_records for all using (exists (select 1 from profiles where id = auth.uid() and role in ('teacher','admin')));

-- 5. Quizzes System
create table if not exists quizzes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id) on delete cascade,
  title text not null,
  description text,
  time_limit_minutes int default 60,
  passing_score int default 75,
  is_published boolean default false,
  created_at timestamptz default now()
);

create table if not exists quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid references quizzes(id) on delete cascade,
  content text not null,
  options jsonb not null, -- Array of strings
  correct_option_index int not null,
  explanation text,
  sort_order int default 0
);

create table if not exists quiz_submissions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid references quizzes(id) on delete cascade,
  student_id uuid references profiles(id) on delete cascade,
  score int not null,
  passed boolean not null,
  answers jsonb, -- Map of question_id -> selected_index
  submitted_at timestamptz default now()
);

alter table quizzes enable row level security;
alter table quiz_questions enable row level security;
alter table quiz_submissions enable row level security;

create policy "Public read quizzes" on quizzes for select using (true);
create policy "Teacher manage quizzes" on quizzes for all using (exists (select 1 from profiles where id = auth.uid() and role in ('teacher','admin')));
create policy "Public read questions" on quiz_questions for select using (true);
create policy "Teacher manage questions" on quiz_questions for all using (exists (select 1 from profiles where id = auth.uid() and role in ('teacher','admin')));
create policy "Student view own submissions" on quiz_submissions for select using (auth.uid() = student_id);
create policy "Student submit quiz" on quiz_submissions for insert with check (auth.uid() = student_id);
create policy "Teacher view all submissions" on quiz_submissions for select using (exists (select 1 from profiles where id = auth.uid() and role in ('teacher','admin')));
