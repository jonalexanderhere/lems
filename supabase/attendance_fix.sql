-- OPTIMIZED ATTENDANCE SYSTEM SQL
-- Improvements for speed and filtering

-- 1. Ensure indexes for faster filtering by date and class
CREATE INDEX IF NOT EXISTS idx_attendance_records_date ON attendance_records(date);
CREATE INDEX IF NOT EXISTS idx_attendance_records_student_date ON attendance_records(student_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_records_class ON attendance_records(class_id);

CREATE INDEX IF NOT EXISTS idx_attendance_logs_created_at ON attendance_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_student_id ON attendance_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_class_id ON attendance_logs(class_id);

-- 2. Add extra columns for better reporting if needed
-- (e.g., captured image metadata is already in attendance_logs)

-- 3. Policy to allow teachers to delete
-- attendance_records already has 'all' for teachers in the previous schema.sql
-- Let's double check/ensure:
DROP POLICY IF EXISTS "Teacher manage attendance" ON attendance_records;
CREATE POLICY "Teacher manage attendance" 
ON attendance_records FOR ALL 
USING (exists (select 1 from profiles where id = auth.uid() and role in ('teacher','admin')));

DROP POLICY IF EXISTS "Teacher manage logs" ON attendance_logs;
CREATE POLICY "Teacher manage logs" 
ON attendance_logs FOR ALL 
USING (exists (select 1 from profiles where id = auth.uid() and role in ('teacher','admin')));

-- 4. Function for Recap (Summary) - Faster for Dashboard
CREATE OR REPLACE FUNCTION get_attendance_summary(p_class_id UUID, p_date DATE)
RETURNS TABLE (
  status TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT ar.status, count(*)
  FROM attendance_records ar
  WHERE ar.date = p_date
    AND (p_class_id IS NULL OR ar.class_id = p_class_id)
  GROUP BY ar.status;
END;
$$ LANGUAGE plpgsql;
