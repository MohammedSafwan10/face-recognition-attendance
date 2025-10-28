import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
// Welcome email removed - OTP displayed on login screen

interface Teacher {
  id: number
  name: string
  email: string
  phone?: string
  department?: string
  created_at?: string
}

export default function TeacherManager() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: ''
  })

  useEffect(() => {
    fetchTeachers()
  }, [])

  const fetchTeachers = async () => {
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching teachers:', error)
    } else {
      setTeachers(data || [])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const payload = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone || null,
      department: formData.department || null
    }

    if (editingTeacher) {
      const { error } = await supabase
        .from('teachers')
        .update(payload)
        .eq('id', editingTeacher.id)

      if (error) {
        alert('Error updating teacher: ' + error.message)
      } else {
        alert('Teacher updated successfully!')
        resetForm()
        fetchTeachers()
      }
    } else {
      const { error } = await supabase
        .from('teachers')
        .insert([payload])

      if (error) {
        alert('Error creating teacher: ' + error.message)
      } else {
        alert(`✅ Teacher created successfully!\n\nLogin Details:\nEmail: ${formData.email}\nOTP will be generated on login screen.`)
        resetForm()
        fetchTeachers()
      }
    }

    setLoading(false)
  }

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher)
    setFormData({
      name: teacher.name,
      email: teacher.email,
      phone: teacher.phone || '',
      department: teacher.department || ''
    })
    setShowAddForm(true)
  }

  const handleShowLoginInfo = (teacher: Teacher) => {
    alert(`Login Information for ${teacher.name}:\n\nEmail: ${teacher.email}\n\nInstructions:\n1. Go to login page\n2. Select "Teacher" tab\n3. Enter email: ${teacher.email}\n4. Click "Generate OTP"\n5. OTP will be displayed on screen\n6. Enter OTP and login`)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this teacher?')) return

    const { error } = await supabase
      .from('teachers')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Error deleting teacher: ' + error.message)
    } else {
      alert('Teacher deleted successfully!')
      fetchTeachers()
    }
  }

  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '', department: '' })
    setEditingTeacher(null)
    setShowAddForm(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="theme-heading text-2xl font-bold">
          Manage Teachers
        </h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary whitespace-nowrap"
        >
          {showAddForm ? 'Cancel' : '+ Add Teacher'}
        </button>
      </div>

      {showAddForm && (
        <div className="surface-panel surface-panel--muted">
          <h3 className="theme-heading text-xl font-semibold mb-4">
            {editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">
                  Full Name *
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
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">
                  Department
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>
            <div className="flex gap-4 flex-wrap">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
              >
                {loading ? 'Saving...' : editingTeacher ? 'Update' : 'Create'}
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
                  Email
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase theme-muted">
                  Phone
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase theme-muted">
                  Department
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase theme-muted">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {teachers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="table-empty">
                    No teachers registered yet. Click "Add Teacher" to create one.
                  </td>
                </tr>
              ) : (
                teachers.map((teacher) => (
                  <tr key={teacher.id} className="table-row">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium theme-heading">
                      {teacher.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm theme-muted">
                      {teacher.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm theme-muted">
                      {teacher.phone || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm theme-muted">
                      {teacher.department || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                      <button
                        onClick={() => handleShowLoginInfo(teacher)}
                        className="text-emerald-500 hover:text-emerald-600 font-medium"
                        title="Show login instructions"
                      >
                        🔑 Login Info
                      </button>
                      <button
                        onClick={() => handleEdit(teacher)}
                        className="text-indigo-500 hover:text-indigo-600 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(teacher.id)}
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
