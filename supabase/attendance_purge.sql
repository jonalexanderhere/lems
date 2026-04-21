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

-- 2. Manual Purge (Gunakan hanya jika ingin membersihkan data lama)
-- Guru dapat menjalankan ini secara manual di SQL Editor jika database terlalu penuh.
-- Data rekap absensi tidak akan terhapus otomatis kecuali diperintahkan.
-- SELECT purge_old_attendance();

-- 3. Manual trigger for immediate cleanup
-- SELECT purge_old_attendance();
