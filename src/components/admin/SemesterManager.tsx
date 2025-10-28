import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

interface Semester {
  id: string
  name: string
  course_id?: string
  created_at?: string
}

interface Course {
  id: string
  name: string
}

export default function SemesterManager() {
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingSemester, setEditingSemester] = useState<Semester | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    course_id: ''
  })

  useEffect(() => {
    fetchSemesters()
    fetchCourses()
  }, [])

  const fetchSemesters = async () => {
    const { data, error } = await supabase
      .from('semesters')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching semesters:', error)
    } else {
      setSemesters(data || [])
    }
  }

  const fetchCourses = async () => {
    const { data } = await supabase
      .from('courses')
      .select('id, name')
      .order('name')
    setCourses(data || [])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const payload = {
      name: formData.name,
      course_id: formData.course_id || null
    }

    if (editingSemester) {
      const { error } = await supabase
        .from('semesters')
        .update(payload)
        .eq('id', editingSemester.id)

      if (error) {
        alert('Error updating semester: ' + error.message)
      } else {
        alert('Semester updated successfully!')
        resetForm()
        fetchSemesters()
      }
    } else {
      const { error } = await supabase
        .from('semesters')
        .insert([payload])

      if (error) {
        alert('Error creating semester: ' + error.message)
      } else {
        alert('Semester created successfully!')
        resetForm()
        fetchSemesters()
      }
    }

    setLoading(false)
  }

  const handleEdit = (semester: Semester) => {
    setEditingSemester(semester)
    setFormData({
      name: semester.name,
      course_id: semester.course_id || ''
    })
    setShowAddForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this semester?')) return

    const { error } = await supabase
      .from('semesters')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Error deleting semester: ' + error.message)
    } else {
      alert('Semester deleted successfully!')
      fetchSemesters()
    }
  }

  const resetForm = () => {
    setFormData({ name: '', course_id: '' })
    setEditingSemester(null)
    setShowAddForm(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="theme-heading text-2xl font-bold">
          Manage Semesters
        </h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary whitespace-nowrap"
        >
          {showAddForm ? 'Cancel' : '+ Add Semester'}
        </button>
      </div>

      {showAddForm && (
        <div className="surface-panel surface-panel--muted">
          <h3 className="theme-heading text-xl font-semibold mb-4">
            {editingSemester ? 'Edit Semester' : 'Add New Semester'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">
                  Semester Name *
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
                  Course (Optional)
                </label>
                <select
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
            </div>
            <div className="flex gap-4 flex-wrap">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
              >
                {loading ? 'Saving...' : editingSemester ? 'Update' : 'Create'}
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
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {semesters.length === 0 ? (
                <tr>
                  <td colSpan={2} className="table-empty">
                    No semesters added yet. Click "Add Semester" to create one.
                  </td>
                </tr>
              ) : (
                semesters.map((semester) => (
                  <tr key={semester.id} className="table-row">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium theme-heading">
                      {semester.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                      <button
                        onClick={() => handleEdit(semester)}
                        className="text-indigo-500 hover:text-indigo-600 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(semester.id)}
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
