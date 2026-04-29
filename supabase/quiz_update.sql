-- RE-FIX QUIZ SYSTEM TO MATCH CODE AND ADD AUTO-EXPIRATION
-- Execute this in Supabase SQL Editor

-- Drop existing if any (CAUTION: This will delete existing quiz data)
DROP TABLE IF EXISTS quiz_attempts CASCADE;
DROP TABLE IF EXISTS quiz_questions CASCADE;
DROP TABLE IF EXISTS quizzes CASCADE;

-- 1. Quizzes Table
CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'ulangan_harian', -- ulangan_harian, ulangan_semester
  duration_minutes INT DEFAULT 60,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Questions Table (Matching flattened code structure)
CREATE TABLE quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_option CHAR(1) NOT NULL, -- 'a', 'b', 'c', 'd'
  points INT DEFAULT 1,
  order_num INT DEFAULT 0
);

-- 3. Attempts Table
CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  score INT,
  max_score INT DEFAULT 0,
  total_questions INT,
  correct_answers INT,
  started_at TIMESTAMPTZ DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  unique(quiz_id, student_id)
);

-- Enable RLS
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public read quizzes" ON quizzes FOR SELECT USING (true);
CREATE POLICY "Teacher manage quizzes" ON quizzes FOR ALL USING (
  exists (select 1 from profiles where id = auth.uid() and role in ('teacher','admin'))
);

CREATE POLICY "Public read questions" ON quiz_questions FOR SELECT USING (true);
CREATE POLICY "Teacher manage questions" ON quiz_questions FOR ALL USING (
  exists (select 1 from profiles where id = auth.uid() and role in ('teacher','admin'))
);

CREATE POLICY "Student view own attempts" ON quiz_attempts FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Student start attempt" ON quiz_attempts FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Student update attempt" ON quiz_attempts FOR UPDATE USING (auth.uid() = student_id);
CREATE POLICY "Teacher view all attempts" ON quiz_attempts FOR SELECT USING (
  exists (select 1 from profiles where id = auth.uid() and role in ('teacher','admin'))
);

-- AUTO-EXPIRATION LOGIC
-- Instead of hard-deleting (which loses scores), we can use a View for "Active Quizzes"
-- Or we can add a 'deleted' flag.
-- But the user specifically asked for "terhapus" (deleted) when time is up.

-- SQL for Auto-Cleanup (requires pg_cron or manual trigger on access)
-- A safer way is to just filter them in the application logic (end_at < now()).

-- If you want to physically delete them, you can run this query periodically:
-- DELETE FROM quizzes WHERE end_at < now();

-- To ensure scores are "rekap" (recorded) even if quiz is gone, we might need a separate 'results' table.
-- But since quiz_attempts references quizzes(id) ON DELETE CASCADE, deleting the quiz deletes the attempts.
-- BETTER APPROACH: Mark as 'finished' or 'archived' instead of delete.

-- Let's add an 'is_archived' column
ALTER TABLE quizzes ADD COLUMN is_archived BOOLEAN DEFAULT false;

-- Function to archive expired quizzes
CREATE OR REPLACE FUNCTION archive_expired_quizzes()
RETURNS void AS $$
BEGIN
  UPDATE quizzes SET is_archived = true WHERE end_at < now() AND is_archived = false;
END;
$$ LANGUAGE plpgsql;
