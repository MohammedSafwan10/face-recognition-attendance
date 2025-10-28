-- Seed Database with Sample Data
-- Run this in Supabase SQL Editor

-- Insert Semesters
INSERT INTO semesters (name, number) VALUES
('Semester 1', 1),
('Semester 2', 2),
('Semester 3', 3),
('Semester 4', 4),
('Semester 5', 5),
('Semester 6', 6)
ON CONFLICT DO NOTHING;

-- Insert Subjects
INSERT INTO subjects (name, code, course_id, semester_id) VALUES
('Data Structures', 'CS301', 1, 3),
('Algorithms', 'CS302', 1, 3),
('Database Management Systems', 'CS303', 1, 4),
('Web Development', 'CS304', 1, 4),
('Operating Systems', 'CS401', 1, 5),
('Computer Networks', 'CS402', 1, 5),
('Artificial Intelligence', 'CS501', 1, 6),
('Machine Learning', 'CS502', 1, 6),
('Software Engineering', 'IT301', 2, 3),
('Cloud Computing', 'IT302', 2, 4)
ON CONFLICT DO NOTHING;

-- Insert Classes  
INSERT INTO classes (name, course_id, semester_id, section) VALUES
('CSE 3rd Year', 1, 3, 'A'),
('CSE 3rd Year', 1, 3, 'B'),
('CSE 4th Year', 1, 5, 'A'),
('IT 3rd Year', 2, 3, 'A'),
('IT 2nd Year', 2, 2, 'A')
ON CONFLICT DO NOTHING;

-- Insert Teachers
INSERT INTO teachers (name, email, phone, department) VALUES
('Dr. John Smith', 'john.smith@college.edu', '+1234567890', 'Computer Science'),
('Prof. Sarah Johnson', 'sarah.johnson@college.edu', '+1234567891', 'Computer Science'),
('Dr. Michael Brown', 'michael.brown@college.edu', '+1234567892', 'Information Technology'),
('Prof. Emily Davis', 'emily.davis@college.edu', '+1234567893', 'Computer Science')
ON CONFLICT DO NOTHING;

SELECT 'Sample data inserted successfully!' as message;
