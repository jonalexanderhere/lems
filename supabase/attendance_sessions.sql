-- ATTENDANCE SESSIONS SYSTEM
-- This script adds the ability for teachers to define specific attendance windows

-- 1. Create the attendance_sessions table
CREATE TABLE IF NOT EXISTS attendance_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(class_id, date)
);

-- 2. Enable RLS
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;

-- 3. Policies
CREATE POLICY "Public read sessions" 
ON attendance_sessions FOR SELECT 
USING (true);

CREATE POLICY "Teacher manage sessions" 
ON attendance_sessions FOR ALL 
USING (exists (select 1 from profiles where id = auth.uid() and role in ('teacher','admin')));

-- 4. Index for performance
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_class_date ON attendance_sessions(class_id, date);
