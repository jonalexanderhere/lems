-- SELECTIVE UPDATE FOR QUIZ & ATTENDANCE SYSTEM
-- This script only updates the necessary tables for Quiz and Attendance

-- 1. DROP ONLY TARGET TABLES (Warning: Data in these tables will be lost)
DROP TABLE IF EXISTS quiz_attempts CASCADE;
DROP TABLE IF EXISTS quiz_questions CASCADE;
DROP TABLE IF EXISTS quizzes CASCADE;
DROP TABLE IF EXISTS attendance_records CASCADE;
DROP TABLE IF EXISTS attendance_logs CASCADE;

-- 2. CREATE ATTENDANCE TABLES
CREATE TABLE attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'sick', 'permission')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, date)
);

CREATE TABLE attendance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  method TEXT DEFAULT 'face_recognition',
  status TEXT DEFAULT 'present',
  confidence_score FLOAT,
  image_proof_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. CREATE QUIZ TABLES (Flattened Structure for Code Compatibility)
CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'ulangan_harian',
  duration_minutes INT NOT NULL DEFAULT 60,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  is_published BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_option TEXT NOT NULL CHECK (correct_option IN ('a','b','c','d')),
  points INT DEFAULT 1,
  order_num INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  answers JSONB DEFAULT '{}'::JSONB,
  score INT,
  total_questions INT,
  correct_answers INT,
  started_at TIMESTAMPTZ DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  UNIQUE(quiz_id, student_id)
);

-- 4. INDEXES
CREATE INDEX idx_attendance_records_date ON attendance_records(date);
CREATE INDEX idx_attendance_logs_created_at ON attendance_logs(created_at);
CREATE INDEX idx_quiz_questions_quiz_id ON quiz_questions(quiz_id);

-- 5. RLS POLICIES
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teacher manage attendance" ON attendance_records FOR ALL USING (
  exists (select 1 from profiles where id = auth.uid() and role in ('teacher','admin'))
);
CREATE POLICY "Student read own attendance" ON attendance_records FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Teacher manage logs" ON attendance_logs FOR ALL USING (
  exists (select 1 from profiles where id = auth.uid() and role in ('teacher','admin'))
);
CREATE POLICY "Student manage own logs" ON attendance_logs FOR ALL USING (auth.uid() = student_id);

CREATE POLICY "Teacher manage quizzes" ON quizzes FOR ALL USING (
  exists (select 1 from profiles where id = auth.uid() and role in ('teacher','admin'))
);
CREATE POLICY "Student read published quizzes" ON quizzes FOR SELECT USING (is_published = true);

CREATE POLICY "Teacher manage questions" ON quiz_questions FOR ALL USING (
  exists (select 1 from profiles where id = auth.uid() and role in ('teacher','admin'))
);
CREATE POLICY "Student read questions" ON quiz_questions FOR SELECT USING (true);

CREATE POLICY "Student manage own attempts" ON quiz_attempts FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "Teacher view all attempts" ON quiz_attempts FOR SELECT USING (
  exists (select 1 from profiles where id = auth.uid() and role in ('teacher','admin'))
);
