import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

interface Course {
  id: string
  name: string
  duration: string | null
  created_at: string
}

export default function CourseManager() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [formData, setFormData] = useState({ name: '', duration: '' })
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCourses(data || [])
    } catch (err) {
      setError('Failed to load courses')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      if (editingCourse) {
        const { error } = await supabase
          .from('courses')
          .update(formData)
          .eq('id', editingCourse.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('courses')
          .insert([formData])

        if (error) throw error
      }

      setShowForm(false)
      setFormData({ name: '', duration: '' })
      setEditingCourse(null)
      fetchCourses()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleEdit = (course: Course) => {
    setEditingCourse(course)
    setFormData({ name: course.name, duration: course.duration || '' })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this course?')) return

    try {
      // Check if course has classes
      const { data: classes, error: classError } = await supabase
        .from('classes')
        .select('id')
        .eq('course_id', id)
        .limit(1)

      if (classError) throw classError

      if (classes && classes.length > 0) {
        setError('Cannot delete this course because it has classes. Please delete the classes first.')
        return
      }

      // Check if course has semesters
      const { data: semesters, error: semesterError } = await supabase
        .from('semesters')
        .select('id')
        .eq('course_id', id)
        .limit(1)

      if (semesterError) throw semesterError

      if (semesters && semesters.length > 0) {
        setError('Cannot delete this course because it has semesters. Please delete the semesters first.')
        return
      }

      // Check if course has subjects
      const { data: subjects, error: subjectError } = await supabase
        .from('subjects')
        .select('id')
        .eq('course_id', id)
        .limit(1)

      if (subjectError) throw subjectError

      if (subjects && subjects.length > 0) {
        setError('Cannot delete this course because it has subjects. Please delete the subjects first.')
        return
      }

      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchCourses()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const resetForm = () => {
    setShowForm(false)
    setEditingCourse(null)
    setFormData({ name: '', duration: '' })
    setError('')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Manage Courses
        </h2>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary w-full sm:w-auto"
        >
          + Add Course
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Course Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="card max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">
              {editingCourse ? 'Edit Course' : 'Add New Course'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Course Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="input-field"

                />
              </div>
              <div>
                <label className="label">Duration</label>
                <input
                  type="text"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({ ...formData, duration: e.target.value })
                  }
                  className="input-field"

                />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex-1">
                  {editingCourse ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map((course) => (
          <div key={course.id} className="card hover:shadow-xl transition-shadow">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {course.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Duration: {course.duration || 'Not specified'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(course)}
                className="flex-1 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors text-sm font-medium"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(course.id)}
                className="flex-1 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors text-sm font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {courses.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
            No courses yet. Click "Add Course" to create one.
          </div>
        )}
      </div>
    </div>
  )
}
