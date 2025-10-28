import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

interface Subject {
  id: number
  name: string
  code: string
  course_id?: number
  semester_id?: number
  created_at?: string
}

interface Course {
  id: number
  name: string
}

interface Semester {
  id: number
  name: string
  number: number
}

export default function SubjectManager() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    course_id: '',
    semester_id: ''
  })

  useEffect(() => {
    fetchSubjects()
    fetchCourses()
    fetchSemesters()
  }, [])

  const fetchSubjects = async () => {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching subjects:', error)
    } else {
      setSubjects(data || [])
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
      code: formData.code,
      course_id: formData.course_id || null,
      semester_id: formData.semester_id || null
    }

    if (editingSubject) {
      const { error } = await supabase
        .from('subjects')
        .update(payload)
        .eq('id', editingSubject.id)

      if (error) {
        alert('Error updating subject: ' + error.message)
      } else {
        alert('Subject updated successfully!')
        resetForm()
        fetchSubjects()
      }
    } else {
      const { error } = await supabase
        .from('subjects')
        .insert([payload])

      if (error) {
        alert('Error creating subject: ' + error.message)
      } else {
        alert('Subject created successfully!')
        resetForm()
        fetchSubjects()
      }
    }

    setLoading(false)
  }

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject)
    setFormData({
      name: subject.name,
      code: subject.code,
      course_id: subject.course_id?.toString() || '',
      semester_id: subject.semester_id?.toString() || ''
    })
    setShowAddForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this subject?')) return

    // Check if subject is used in any attendance sessions
    const { data: sessions, error: checkError } = await supabase
      .from('attendance_sessions')
      .select('id')
      .eq('subject_id', id)
      .limit(1)

    if (checkError) {
      alert('Error checking subject usage: ' + checkError.message)
      return
    }

    if (sessions && sessions.length > 0) {
      alert('Cannot delete this subject because it is used in attendance sessions. Please delete the sessions first or choose a different subject for those sessions.')
      return
    }

    const { error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Error deleting subject: ' + error.message)
    } else {
      alert('Subject deleted successfully!')
      fetchSubjects()
    }
  }

  const resetForm = () => {
    setFormData({ name: '', code: '', course_id: '', semester_id: '' })
    setEditingSubject(null)
    setShowAddForm(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="theme-heading text-2xl font-bold">Manage Subjects</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary whitespace-nowrap"
        >
          {showAddForm ? 'Cancel' : '+ Add Subject'}
        </button>
      </div>

      {showAddForm && (
        <div className="surface-panel surface-panel--muted">
          <h3 className="theme-heading text-xl font-semibold mb-4">
            {editingSubject ? 'Edit Subject' : 'Add New Subject'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Subject Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">Subject Code *</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">Course (Optional)</label>
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
              <div>
                <label className="label">Semester (Optional)</label>
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
                {loading ? 'Saving...' : editingSubject ? 'Update' : 'Create'}
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
                  Code
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase theme-muted">
                  Name
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase theme-muted">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {subjects.length === 0 ? (
                <tr>
                  <td colSpan={3} className="table-empty">
                    No subjects added yet. Click "Add Subject" to create one.
                  </td>
                </tr>
              ) : (
                subjects.map((subject) => (
                  <tr key={subject.id} className="table-row">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium theme-heading">
                      {subject.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm theme-muted">
                      {subject.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                      <button
                        onClick={() => handleEdit(subject)}
                        className="text-indigo-500 hover:text-indigo-600 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(subject.id)}
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
