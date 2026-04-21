-- ENABLE REALTIME FOR ATTENDANCE TABLES
-- This allows the teacher dashboard to receive instant updates

-- 1. Add tables to the 'supabase_realtime' publication
BEGIN;
  -- Remove existing if any (to avoid duplicates)
  ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS attendance_records;
  ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS attendance_logs;
  ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS attendance_sessions;
  
  -- Add tables
  ALTER PUBLICATION supabase_realtime ADD TABLE attendance_records;
  ALTER PUBLICATION supabase_realtime ADD TABLE attendance_logs;
  ALTER PUBLICATION supabase_realtime ADD TABLE attendance_sessions;
COMMIT;

-- 2. Verify settings
-- Ensure the tables have 'Full' replica identity for detailed change tracking
ALTER TABLE attendance_records REPLICA IDENTITY FULL;
ALTER TABLE attendance_logs REPLICA IDENTITY FULL;
ALTER TABLE attendance_sessions REPLICA IDENTITY FULL;
