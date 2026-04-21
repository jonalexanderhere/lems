-- SEED DATA FOR TESTING (Run this if your student list is empty)
-- This adds 3 dummy students to 'X TJKT 1'

DO $$
DECLARE 
  class_id_tjkt1 UUID;
  student1_id UUID := gen_random_uuid();
  student2_id UUID := gen_random_uuid();
  student3_id UUID := gen_random_uuid();
BEGIN
  -- Get the ID of X TJKT 1
  SELECT id INTO class_id_tjkt1 FROM classes WHERE name = 'X TJKT 1' LIMIT 1;
  
  IF class_id_tjkt1 IS NOT NULL THEN
    -- Note: This only works for profiles that don't need auth.users match for testing display
    -- Or you should create them via the Register page in the app.
    
    INSERT INTO profiles (id, full_name, username, role, class_id, xp)
    VALUES 
      (student1_id, 'Budi Santoso', 'budi_tjkt', 'student', class_id_tjkt1, 150),
      (student2_id, 'Ani Wijaya', 'ani_tjkt', 'student', class_id_tjkt1, 200),
      (student3_id, 'Dedi Kurniawan', 'dedi_tjkt', 'student', class_id_tjkt1, 50)
    ON CONFLICT (username) DO NOTHING;
    
    RAISE NOTICE 'Seed students added to X TJKT 1';
  ELSE
    RAISE NOTICE 'Class X TJKT 1 not found. Run selective_update.sql first.';
  END IF;
END $$;
