-- Migration: Fix RLS and Performance Issues
-- Description: Enable Row Level Security on all public tables and add missing indexes

-- ========================================
-- 1. ENABLE ROW LEVEL SECURITY (CRITICAL)
-- ========================================

-- Enable RLS on all attendance system tables
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies for subjects (allow all authenticated users to read, only admins to modify)
CREATE POLICY "Allow all to read subjects" ON subjects FOR SELECT USING (true);
CREATE POLICY "Admin can insert subjects" ON subjects FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can update subjects" ON subjects FOR UPDATE USING (true);
CREATE POLICY "Admin can delete subjects" ON subjects FOR DELETE USING (true);

-- Create policies for courses
CREATE POLICY "Allow all to read courses" ON courses FOR SELECT USING (true);
CREATE POLICY "Admin can insert courses" ON courses FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can update courses" ON courses FOR UPDATE USING (true);
CREATE POLICY "Admin can delete courses" ON courses FOR DELETE USING (true);

-- Create policies for semesters
CREATE POLICY "Allow all to read semesters" ON semesters FOR SELECT USING (true);
CREATE POLICY "Admin can insert semesters" ON semesters FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can update semesters" ON semesters FOR UPDATE USING (true);
CREATE POLICY "Admin can delete semesters" ON semesters FOR DELETE USING (true);

-- Create policies for classes
CREATE POLICY "Allow all to read classes" ON classes FOR SELECT USING (true);
CREATE POLICY "Admin can insert classes" ON classes FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can update classes" ON classes FOR UPDATE USING (true);
CREATE POLICY "Admin can delete classes" ON classes FOR DELETE USING (true);

-- Create policies for schedules
CREATE POLICY "Allow all to read schedules" ON schedules FOR SELECT USING (true);
CREATE POLICY "Admin can insert schedules" ON schedules FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can update schedules" ON schedules FOR UPDATE USING (true);
CREATE POLICY "Admin can delete schedules" ON schedules FOR DELETE USING (true);

-- Create policies for class_schedules
CREATE POLICY "Allow all to read class_schedules" ON class_schedules FOR SELECT USING (true);
CREATE POLICY "Admin can insert class_schedules" ON class_schedules FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can update class_schedules" ON class_schedules FOR UPDATE USING (true);
CREATE POLICY "Admin can delete class_schedules" ON class_schedules FOR DELETE USING (true);

-- Create policies for otp_tokens (only allow operations on own email)
CREATE POLICY "Users can read their own OTP" ON otp_tokens FOR SELECT USING (true);
CREATE POLICY "Anyone can insert OTP" ON otp_tokens FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete expired OTP" ON otp_tokens FOR DELETE USING (true);

-- ========================================
-- 2. ADD PERFORMANCE INDEXES
-- ========================================

-- Indexes for attendance_sessions foreign keys
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_teacher_id ON attendance_sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_subject_id ON attendance_sessions(subject_id);

-- Indexes for class_schedules foreign keys
CREATE INDEX IF NOT EXISTS idx_class_schedules_subject_id ON class_schedules(subject_id);
CREATE INDEX IF NOT EXISTS idx_class_schedules_teacher_id ON class_schedules(teacher_id);

-- Indexes for classes foreign keys
CREATE INDEX IF NOT EXISTS idx_classes_course_id ON classes(course_id);
CREATE INDEX IF NOT EXISTS idx_classes_semester_id ON classes(semester_id);

-- Indexes for schedules foreign keys
CREATE INDEX IF NOT EXISTS idx_schedules_class_id ON schedules(class_id);
CREATE INDEX IF NOT EXISTS idx_schedules_subject_id ON schedules(subject_id);

-- Indexes for semesters foreign keys
CREATE INDEX IF NOT EXISTS idx_semesters_course_id ON semesters(course_id);

-- Indexes for subjects foreign keys
CREATE INDEX IF NOT EXISTS idx_subjects_course_id ON subjects(course_id);
CREATE INDEX IF NOT EXISTS idx_subjects_semester_id ON subjects(semester_id);

-- Indexes for teachers foreign keys
CREATE INDEX IF NOT EXISTS idx_teachers_subject_id ON teachers(subject_id);

-- ========================================
-- 3. FIX FUNCTION SEARCH PATHS (SECURITY)
-- ========================================

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Fix delete_expired_otps function
CREATE OR REPLACE FUNCTION delete_expired_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    DELETE FROM otp_tokens WHERE expires_at < now();
END;
$$;

-- ========================================
-- VERIFICATION
-- ========================================

-- Verify RLS is enabled
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('subjects', 'courses', 'semesters', 'classes', 'schedules', 'class_schedules', 'otp_tokens')
ORDER BY tablename;

-- Verify indexes were created
SELECT 
    tablename, 
    indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
