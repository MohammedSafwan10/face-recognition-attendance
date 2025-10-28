import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import FaceCapture from '../shared/FaceCapture'
import { descriptorToArray } from '../../lib/faceapi'
// Welcome email removed - OTP displayed on login screen

interface Class {
  id: string
  name: string
}

interface Student {
  id: string
  name: string
  email: string
  usn: string
  phone: string | null
  class_id: string
  created_at: string
}

export default function StudentRegistration() {
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showFaceCapture, setShowFaceCapture] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    usn: '',
    phone: '',
    class_id: '',
  })
  const [faceDescriptor, setFaceDescriptor] = useState<Float32Array | null>(null)
  const [faceImage, setFaceImage] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [studentsRes, classesRes] = await Promise.all([
        supabase.from('students').select('*').order('created_at', { ascending: false }),
        supabase.from('classes').select('id, name')
      ])

      if (studentsRes.error) throw studentsRes.error
      if (classesRes.error) throw classesRes.error

      setStudents(studentsRes.data || [])
      setClasses(classesRes.data || [])
    } catch (err) {
      console.error(err)
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleFaceCapture = (descriptor: Float32Array, imageData: string) => {
    setFaceDescriptor(descriptor)
    setFaceImage(imageData)
    setShowFaceCapture(false)
    setSuccess('Face captured successfully!')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!faceDescriptor) {
      setError('Please capture face before submitting')
      return
    }

    try {
      const studentData = {
        ...formData,
        face_descriptor: descriptorToArray(faceDescriptor),
        face_image_url: faceImage,
      }

      const { error } = await supabase
        .from('students')
        .insert([studentData])

      if (error) throw error

      setSuccess(`✅ Student registered successfully!\n\nLogin Details:\nEmail: ${formData.email}\nOTP will be generated on login screen.`)
      setShowForm(false)
      resetForm()
      fetchData()
    } catch (err: any) {
      setError(err.message || 'Failed to register student')
    }
  }

  const handleShowLoginInfo = (student: Student) => {
    alert(`Login Information for ${student.name}:\n\nEmail: ${student.email}\nRoll Number: ${student.usn}\n\nInstructions:\n1. Go to login page\n2. Select "Student" tab\n3. Enter email: ${student.email}\n4. Click "Generate OTP"\n5. OTP will be displayed on screen\n6. Enter OTP and login`)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return

    try {
      // Check if student has attendance records
      const { data: attendanceRecords, error: attendanceError } = await supabase
        .from('attendance_records')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', id)

      if (attendanceError) throw attendanceError

      if (attendanceRecords && attendanceRecords.length > 0) {
        setError('Cannot delete student: Student has attendance records. Please delete attendance records first or keep this student.')
        return
      }

      // Safe to delete
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id)

      if (error) throw error
      setSuccess('Student deleted successfully')
      fetchData()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const resetForm = () => {
    setFormData({ name: '', email: '', usn: '', phone: '', class_id: '' })
    setFaceDescriptor(null)
    setFaceImage(null)
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
        <h2 className="theme-heading text-2xl font-bold">
          Student Registration
        </h2>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary w-full sm:w-auto"
        >
          + Register Student
        </button>
      </div>

      {error && (
        <div className="status-banner status-banner--error">
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="status-banner badge--success" style={{ display: 'flex', justifyContent: 'center' }}>
          <p>{success}</p>
        </div>
      )}

      {/* Registration Form Modal */}
      {showForm && !showFaceCapture && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="card max-w-2xl w-full my-8">
            <h3 className="text-xl font-bold mb-4">Register New Student</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
        
                  />
                </div>
                <div>
                  <label className="label">USN *</label>
                  <input
                    type="text"
                    required
                    value={formData.usn}
                    onChange={(e) => setFormData({ ...formData, usn: e.target.value })}
                    className="input-field"
        
                  />
                </div>
                <div>
                  <label className="label">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-field"
        
                  />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input-field"
        
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="label">Class *</label>
                  <select
                    required
                    value={formData.class_id}
                    onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Select a class</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-100">
                      Face Recognition
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {faceDescriptor ? '✓ Face captured' : 'Not captured yet'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowFaceCapture(true)}
                    className="btn-primary"
                  >
                    {faceDescriptor ? 'Recapture' : 'Capture Face'}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn-primary flex-1">
                  Register Student
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); resetForm(); }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Face Capture Modal */}
      {showFaceCapture && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="card max-w-2xl w-full">
            <h3 className="text-xl font-bold mb-4">Capture Student Face</h3>
            <FaceCapture
              onCapture={handleFaceCapture}
              onError={(err) => setError(err)}
            />
            <button
              onClick={() => setShowFaceCapture(false)}
              className="btn-secondary w-full mt-4"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Students Table */}
      <div className="table-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase theme-muted">Name</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase theme-muted">USN</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase theme-muted hidden md:table-cell">Email</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase theme-muted hidden lg:table-cell">Phone</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase theme-muted text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id} className="table-row">
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium theme-heading">{student.name}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm theme-muted">{student.usn}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm theme-muted hidden md:table-cell">{student.email}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm theme-muted hidden lg:table-cell">{student.phone || '-'}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => handleShowLoginInfo(student)}
                        className="text-indigo-500 hover:text-indigo-600 font-medium"
                        title="Show login instructions"
                      >
                        🔑 Login Info
                      </button>
                      <button
                        onClick={() => handleDelete(student.id)}
                        className="text-rose-500 hover:text-rose-600 font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {students.length === 0 && (
          <div className="table-empty">
            No students registered yet.
          </div>
        )}
      </div>
    </div>
  )
}
