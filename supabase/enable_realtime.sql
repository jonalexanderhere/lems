-- ENABLE REALTIME FOR ATTENDANCE TABLES (Safe Version)
-- This allows the teacher dashboard and student page to receive instant updates

DO $$
BEGIN
    -- Ensure publication exists
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;

    -- Add attendance_records
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'attendance_records'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE attendance_records;
    END IF;

    -- Add attendance_logs
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'attendance_logs'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE attendance_logs;
    END IF;

    -- Add attendance_sessions
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'attendance_sessions'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE attendance_sessions;
    END IF;
END $$;

-- Set replica identity to FULL for tracking all column changes
ALTER TABLE attendance_records REPLICA IDENTITY FULL;
ALTER TABLE attendance_logs REPLICA IDENTITY FULL;
ALTER TABLE attendance_sessions REPLICA IDENTITY FULL;
