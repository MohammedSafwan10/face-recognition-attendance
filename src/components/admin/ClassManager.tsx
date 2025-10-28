import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

interface Class {
  id: number
  name: string
  course_id?: number
  semester_id?: number
  section?: string
  created_at?: string
}

interface Course {
  id: number
  name: string
}

interface Semester {
  id: number
  name: string
}

export default function ClassManager() {
  const [classes, setClasses] = useState<Class[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingClass, setEditingClass] = useState<Class | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    course_id: '',
    semester_id: '',
    section: ''
  })

  useEffect(() => {
    fetchClasses()
    fetchCourses()
    fetchSemesters()
  }, [])

  const fetchClasses = async () => {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching classes:', error)
    } else {
      setClasses(data || [])
    }
  }

  const fetchCourses = async () => {
    const { data } = await supabase
      .from('courses')
      .select('id, name')
      .order('name')
    setCourses(data || [])
  }

  const fetchSemesters = async () => {
    const { data } = await supabase
      .from('semesters')
      .select('*')
      .order('name')
    setSemesters(data || [])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const payload = {
      name: formData.name,
      course_id: formData.course_id || null,
      semester_id: formData.semester_id || null,
      section: formData.section || null
    }

    if (editingClass) {
      const { error } = await supabase
        .from('classes')
        .update(payload)
        .eq('id', editingClass.id)

      if (error) {
        alert('Error updating class: ' + error.message)
      } else {
        alert('Class updated successfully!')
        resetForm()
        fetchClasses()
      }
    } else {
      const { error } = await supabase
        .from('classes')
        .insert([payload])

      if (error) {
        alert('Error creating class: ' + error.message)
      } else {
        alert('Class created successfully!')
        resetForm()
        fetchClasses()
      }
    }

    setLoading(false)
  }

  const handleEdit = (classItem: Class) => {
    setEditingClass(classItem)
    setFormData({
      name: classItem.name,
      course_id: classItem.course_id?.toString() || '',
      semester_id: classItem.semester_id?.toString() || '',
      section: classItem.section || ''
    })
    setShowAddForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this class?')) return

    // Check if class has students
    const { data: students, error: checkError } = await supabase
      .from('students')
      .select('id')
      .eq('class_id', id)
      .limit(1)

    if (checkError) {
      alert('Error checking class usage: ' + checkError.message)
      return
    }

    if (students && students.length > 0) {
      alert('Cannot delete this class because there are students enrolled in it. Please move or delete the students first.')
      return
    }

    // Check if class has attendance sessions
    const { data: sessions, error: sessionError } = await supabase
      .from('attendance_sessions')
      .select('id')
      .eq('class_id', id)
      .limit(1)

    if (sessionError) {
      alert('Error checking class usage: ' + sessionError.message)
      return
    }

    if (sessions && sessions.length > 0) {
      alert('Cannot delete this class because it has attendance sessions. Please delete the sessions first.')
      return
    }

    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Error deleting class: ' + error.message)
    } else {
      alert('Class deleted successfully!')
      fetchClasses()
    }
  }

  const resetForm = () => {
    setFormData({ name: '', course_id: '', semester_id: '', section: '' })
    setEditingClass(null)
    setShowAddForm(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="theme-heading text-2xl font-bold">
          Manage Classes
        </h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary whitespace-nowrap"
        >
          {showAddForm ? 'Cancel' : '+ Add Class'}
        </button>
      </div>

      {showAddForm && (
        <div className="surface-panel surface-panel--muted">
          <h3 className="theme-heading text-xl font-semibold mb-4">
            {editingClass ? 'Edit Class' : 'Add New Class'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">
                  Class Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">
                  Section (Optional)
                </label>
                <input
                  type="text"
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">
                  Course *
                </label>
                <select
                  required
                  value={formData.course_id}
                  onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                  className="input-field"
                >
                  <option value="">Select course</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">
                  Semester (Optional)
                </label>
                <select
                  value={formData.semester_id}
                  onChange={(e) => setFormData({ ...formData, semester_id: e.target.value })}
                  className="input-field"
                >
                  <option value="">Select semester</option>
                  {semesters.map((sem) => (
                    <option key={sem.id} value={sem.id}>
                      {sem.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-4 flex-wrap">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
              >
                {loading ? 'Saving...' : editingClass ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="table-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="px-6 py-3 text-xs font-semibold uppercase theme-muted">
                  Name
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase theme-muted">
                  Section
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase theme-muted">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {classes.length === 0 ? (
                <tr>
                  <td colSpan={3} className="table-empty">
                    No classes added yet. Click "Add Class" to create one.
                  </td>
                </tr>
              ) : (
                classes.map((classItem) => (
                  <tr key={classItem.id} className="table-row">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium theme-heading">
                      {classItem.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm theme-muted">
                      {classItem.section || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                      <button
                        onClick={() => handleEdit(classItem)}
                        className="text-indigo-500 hover:text-indigo-600 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(classItem.id)}
                        className="text-rose-500 hover:text-rose-600 font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
