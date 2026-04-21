-- ATTENDANCE MAINTENANCE & PURGE
-- This script handles the automatic cleanup of old attendance records

-- 1. Create the purge function
CREATE OR REPLACE FUNCTION purge_old_attendance()
RETURNS void AS $$
BEGIN
  -- Remove logs older than 7 days
  DELETE FROM attendance_logs 
  WHERE created_at < now() - interval '7 days';
  
  -- Remove daily records older than 7 days
  DELETE FROM attendance_records 
  WHERE date < now()::date - interval '7 days';
  
  RAISE NOTICE 'Old attendance data purged successfully.';
END;
$$ LANGUAGE plpgsql;

-- 2. Schedule the purge (Requires pg_cron enabled in Supabase)
-- If you don't have pg_cron, you can run "SELECT purge_old_attendance();" manually once a week.
-- To enable pg_cron in Supabase: Dashboard -> Database -> Extensions -> Search "pg_cron" -> Enable.

-- This schedules the purge every Sunday at 00:00
-- SELECT cron.schedule('0 0 * * 0', 'SELECT purge_old_attendance()');

-- 3. Manual trigger for immediate cleanup
-- SELECT purge_old_attendance();
