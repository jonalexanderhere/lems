-- Attendance schema cleanup
-- Run this in Supabase SQL Editor after the base schema is deployed.

-- =====================
-- 1. Attendance Sessions
-- =====================
alter table if exists attendance_sessions
  add column if not exists status text default 'scheduled',
  add column if not exists notes text,
  add column if not exists updated_at timestamptz default now();

update attendance_sessions
set status = coalesce(status, 'scheduled');

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'attendance_sessions_status_check'
  ) then
    alter table attendance_sessions
      add constraint attendance_sessions_status_check
      check (status in ('scheduled', 'active', 'closed', 'archived'));
  end if;
end $$;

drop policy if exists "Public read sessions" on attendance_sessions;
drop policy if exists "Teacher manage sessions" on attendance_sessions;

create policy "Students read own sessions"
  on attendance_sessions for select
  using (
    auth.uid() is not null and (
      exists (select 1 from profiles where id = auth.uid() and role in ('teacher', 'admin'))
      or exists (select 1 from profiles where id = auth.uid() and class_id = attendance_sessions.class_id)
      or attendance_sessions.class_id is null
    )
  );

create policy "Teacher manage sessions"
  on attendance_sessions for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role in ('teacher', 'admin'))
  );

create unique index if not exists idx_attendance_sessions_class_date
  on attendance_sessions(class_id, date);
create index if not exists idx_attendance_sessions_date
  on attendance_sessions(date);
create index if not exists idx_attendance_sessions_status
  on attendance_sessions(status);

-- =====================
-- 2. Attendance Records
-- =====================
alter table if exists attendance_records
  add column if not exists session_id uuid references attendance_sessions(id) on delete cascade,
  add column if not exists method text default 'face_ai',
  add column if not exists confidence_score numeric(5,2),
  add column if not exists notes text,
  add column if not exists updated_at timestamptz default now();

create index if not exists idx_attendance_records_session_id
  on attendance_records(session_id);
create index if not exists idx_attendance_records_class_date
  on attendance_records(class_id, date);
create index if not exists idx_attendance_records_student_date
  on attendance_records(student_id, date);

drop policy if exists "Student read own attendance" on attendance_records;
drop policy if exists "Teacher manage attendance" on attendance_records;

create policy "Student read own attendance"
  on attendance_records for select
  using (auth.uid() = student_id);

create policy "Teacher manage attendance"
  on attendance_records for all
  using (exists (select 1 from profiles where id = auth.uid() and role in ('teacher', 'admin')));

-- =====================
-- 3. Attendance Logs
-- =====================
alter table if exists attendance_logs
  add column if not exists session_id uuid references attendance_sessions(id) on delete set null;

create index if not exists idx_attendance_logs_session_id
  on attendance_logs(session_id);
create index if not exists idx_attendance_logs_class_created_at
  on attendance_logs(class_id, created_at desc);

drop policy if exists "Teachers and Admins can view attendance" on attendance_logs;
drop policy if exists "Students can view their own attendance" on attendance_logs;
drop policy if exists "Students can create their own attendance" on attendance_logs;
drop policy if exists "Teacher manage logs" on attendance_logs;
drop policy if exists "Student manage own logs" on attendance_logs;

create policy "Teachers and Admins can view attendance"
  on attendance_logs for select
  using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'teacher')));

create policy "Students can view their own attendance"
  on attendance_logs for select
  using (student_id = auth.uid());

create policy "Students can create their own attendance"
  on attendance_logs for insert
  with check (student_id = auth.uid());

create policy "Teacher manage logs"
  on attendance_logs for all
  using (exists (select 1 from profiles where id = auth.uid() and role in ('teacher', 'admin')));

-- =====================
-- 4. Summary View
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

-- =====================
-- 5. Retention Helper
-- =====================
create or replace function purge_old_attendance_audit(p_keep_days int default 180)
returns void
language plpgsql
as $$
begin
  delete from attendance_logs
  where created_at < now() - make_interval(days => p_keep_days);
end;
$$;

