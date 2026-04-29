-- MASTER FINAL SETUP (Run this to fix everything)
-- This script cleans up duplicates and ensures all tables exist with correct structure

-- 1. CLEANUP OLD TABLES
DROP TABLE IF EXISTS quiz_submissions CASCADE;
DROP TABLE IF EXISTS quiz_attempts CASCADE;
DROP TABLE IF EXISTS quiz_questions CASCADE;
DROP TABLE IF EXISTS quizzes CASCADE;
DROP TABLE IF EXISTS attendance_records CASCADE;
DROP TABLE IF EXISTS attendance_logs CASCADE;
DROP TABLE IF EXISTS lesson_progress CASCADE;
DROP TABLE IF EXISTS lessons CASCADE;
DROP TABLE IF EXISTS modules CASCADE;
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 2. CORE TABLES
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'student',
  full_name TEXT,
  username TEXT UNIQUE,
  class_id UUID, -- Will reference classes later
  year_enrolled INT,
  avatar_url TEXT,
  badges JSONB DEFAULT '[]'::JSONB,
  face_descriptor JSONB,
  face_enrolled_at TIMESTAMPTZ,
  xp INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username, class_id, year_enrolled)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'username',
    NULLIF(NEW.raw_user_meta_data->>'class_id', '')::UUID,
    NULLIF(NEW.raw_user_meta_data->>'year_enrolled', '')::INT
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TABLE academic_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  is_current BOOLEAN DEFAULT false,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  grade TEXT NOT NULL,
  section TEXT NOT NULL,
  academic_year_id UUID REFERENCES academic_years(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ADD CONSTRAINT profiles_class_id_fkey FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL;

-- 3. ATTENDANCE SYSTEM
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

-- 4. QUIZ SYSTEM (FLATTENED STRUCTURE)
CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  course_id UUID, -- Will reference courses later
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
  max_score INT DEFAULT 0,
  total_questions INT,
  correct_answers INT,
  started_at TIMESTAMPTZ DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  UNIQUE(quiz_id, student_id)
);

-- 5. COURSES & LESSONS
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  category TEXT,
  level TEXT DEFAULT 'Beginner',
  duration_hours INT DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE quizzes ADD CONSTRAINT quizzes_course_id_fkey FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL;

CREATE TABLE modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  video_url TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  UNIQUE(student_id, lesson_id)
);

-- 6. ASSIGNMENTS & SUBMISSIONS
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  attachment_url TEXT,
  attachment_name TEXT,
  due_date TIMESTAMPTZ,
  max_score INT DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size INT,
  note TEXT,
  score INT,
  feedback TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  graded_at TIMESTAMPTZ,
  UNIQUE(assignment_id, student_id)
);

-- 7. INDEXES FOR SPEED
CREATE INDEX idx_attendance_records_date ON attendance_records(date);
CREATE INDEX idx_attendance_logs_created_at ON attendance_logs(created_at);
CREATE INDEX idx_quiz_questions_quiz_id ON quiz_questions(quiz_id);
CREATE INDEX idx_quiz_attempts_student_id ON quiz_attempts(student_id);

-- 8. RLS POLICIES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Standard Policies
CREATE POLICY "Public read classes" ON classes FOR SELECT USING (true);
CREATE POLICY "Read all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

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

CREATE POLICY "Teacher manage courses" ON courses FOR ALL USING (
  exists (select 1 from profiles where id = auth.uid() and role in ('teacher','admin'))
);
CREATE POLICY "Public read courses" ON courses FOR SELECT USING (is_published = true);

CREATE POLICY "Teacher manage content" ON modules FOR ALL USING (
  exists (select 1 from profiles where id = auth.uid() and role in ('teacher','admin'))
);
CREATE POLICY "Public read content" ON modules FOR SELECT USING (true);

CREATE POLICY "Teacher manage lessons" ON lessons FOR ALL USING (
  exists (select 1 from profiles where id = auth.uid() and role in ('teacher','admin'))
);
CREATE POLICY "Public read lessons" ON lessons FOR SELECT USING (true);

-- 9. SEED INITIAL DATA
INSERT INTO academic_years (label, is_current, start_date, end_date)
VALUES ('2025/2026', true, '2025-07-14', '2026-06-30') ON CONFLICT DO NOTHING;

DO $$
DECLARE yr_id UUID;
BEGIN
  SELECT id INTO yr_id FROM academic_years WHERE is_current = true LIMIT 1;
  INSERT INTO classes (name, grade, section, academic_year_id) VALUES
    ('X TJKT 1', 'X', 'TJKT 1', yr_id),
    ('X TJKT 2', 'X', 'TJKT 2', yr_id),
    ('XI TJKT 1', 'XI', 'TJKT 1', yr_id),
    ('XII TJKT 1', 'XII', 'TJKT 1', yr_id)
  ON CONFLICT DO NOTHING;
END $$;
