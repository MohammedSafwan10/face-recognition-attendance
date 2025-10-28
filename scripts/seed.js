import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function seedDatabase() {
  console.log('🌱 Starting database seeding...\n')

  try {
    // Insert Semesters
    console.log('📚 Inserting semesters...')
    const { error: semError } = await supabase.from('semesters').insert([
      { name: 'Semester 1', number: 1 },
      { name: 'Semester 2', number: 2 },
      { name: 'Semester 3', number: 3 },
      { name: 'Semester 4', number: 4 },
      { name: 'Semester 5', number: 5 },
      { name: 'Semester 6', number: 6 }
    ])
    if (semError && !semError.message.includes('duplicate')) {
      console.error('Error inserting semesters:', semError)
    } else {
      console.log('✓ Semesters inserted')
    }

    // Get course IDs
    const { data: courses } = await supabase.from('courses').select('id, name')
    const csId = courses?.find(c => c.name === 'Computer Science')?.id
    const itId = courses?.find(c => c.name === 'Information Technology')?.id

    // Insert Subjects
    console.log('📖 Inserting subjects...')
    const { error: subjError } = await supabase.from('subjects').insert([
      { name: 'Data Structures', code: 'CS301', course_id: csId, semester_id: 3 },
      { name: 'Algorithms', code: 'CS302', course_id: csId, semester_id: 3 },
      { name: 'Database Management Systems', code: 'CS303', course_id: csId, semester_id: 4 },
      { name: 'Web Development', code: 'CS304', course_id: csId, semester_id: 4 },
      { name: 'Operating Systems', code: 'CS401', course_id: csId, semester_id: 5 },
      { name: 'Computer Networks', code: 'CS402', course_id: csId, semester_id: 5 },
      { name: 'Artificial Intelligence', code: 'CS501', course_id: csId, semester_id: 6 },
      { name: 'Machine Learning', code: 'CS502', course_id: csId, semester_id: 6 },
      { name: 'Software Engineering', code: 'IT301', course_id: itId, semester_id: 3 },
      { name: 'Cloud Computing', code: 'IT302', course_id: itId, semester_id: 4 }
    ])
    if (subjError && !subjError.message.includes('duplicate')) {
      console.error('Error inserting subjects:', subjError)
    } else {
      console.log('✓ Subjects inserted')
    }

    // Insert Classes
    console.log('🎓 Inserting classes...')
    const { error: classError } = await supabase.from('classes').insert([
      { name: 'CSE 3rd Year', course_id: csId, semester_id: 3, section: 'A' },
      { name: 'CSE 3rd Year', course_id: csId, semester_id: 3, section: 'B' },
      { name: 'CSE 4th Year', course_id: csId, semester_id: 5, section: 'A' },
      { name: 'IT 3rd Year', course_id: itId, semester_id: 3, section: 'A' },
      { name: 'IT 2nd Year', course_id: itId, semester_id: 2, section: 'A' }
    ])
    if (classError && !classError.message.includes('duplicate')) {
      console.error('Error inserting classes:', classError)
    } else {
      console.log('✓ Classes inserted')
    }

    // Insert Teachers
    console.log('👨‍🏫 Inserting teachers...')
    const { error: teachError } = await supabase.from('teachers').insert([
      { name: 'Dr. John Smith', email: 'john.smith@college.edu', phone: '+1234567890', department: 'Computer Science' },
      { name: 'Prof. Sarah Johnson', email: 'sarah.johnson@college.edu', phone: '+1234567891', department: 'Computer Science' },
      { name: 'Dr. Michael Brown', email: 'michael.brown@college.edu', phone: '+1234567892', department: 'Information Technology' },
      { name: 'Prof. Emily Davis', email: 'emily.davis@college.edu', phone: '+1234567893', department: 'Computer Science' }
    ])
    if (teachError && !teachError.message.includes('duplicate')) {
      console.error('Error inserting teachers:', teachError)
    } else {
      console.log('✓ Teachers inserted')
    }

    console.log('\n✅ Database seeding completed successfully!')
    console.log('\n📊 Summary:')
    console.log('  - 6 Semesters')
    console.log('  - 10 Subjects')
    console.log('  - 5 Classes')
    console.log('  - 4 Teachers')
    console.log('\n🚀 Your system is now ready for testing!')

  } catch (error) {
    console.error('❌ Error seeding database:', error)
    process.exit(1)
  }
}

seedDatabase()
