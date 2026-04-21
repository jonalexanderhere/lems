-- RLS FIX FOR ATTENDANCE
-- Allow students to record their own attendance

-- 1. attendance_records
DROP POLICY IF EXISTS "Student read own attendance" ON attendance_records;
CREATE POLICY "Student manage own attendance" ON attendance_records 
FOR ALL USING (auth.uid() = student_id);

-- 2. attendance_logs (Already has ALL, but let's be sure)
DROP POLICY IF EXISTS "Student manage own logs" ON attendance_logs;
CREATE POLICY "Student manage own logs" ON attendance_logs 
FOR ALL USING (auth.uid() = student_id);

-- 3. quiz_attempts (Already has ALL, but let's be sure)
DROP POLICY IF EXISTS "Student manage own attempts" ON quiz_attempts;
CREATE POLICY "Student manage own attempts" ON quiz_attempts 
FOR ALL USING (auth.uid() = student_id);

RAISE NOTICE 'Attendance RLS policies updated successfully.';
