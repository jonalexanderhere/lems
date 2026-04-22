-- Remove the old manual session layer from existing attendance data.
-- Run this after the app is switched to the no-session flow.

begin;

update public.attendance_records
set session_id = null
where session_id is not null;

update public.attendance_logs
set session_id = null
where session_id is not null;

delete from public.attendance_sessions;

commit;
