import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import FaceCapture from './FaceCapture'

interface ProfileEditProps {
  userType: 'admin' | 'teacher' | 'student'
}

export default function ProfileEdit({ userType }: ProfileEditProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [updateFace, setUpdateFace] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '', // For teachers and admins
    roll_number: '', // For students only
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    setLoading(true)
    try {
      if (userType === 'admin') {
        const fallbackName = localStorage.getItem('userName') || 'Administrator'
        const fallbackEmail = localStorage.getItem('adminEmail') || 'admin@example.com'

        setFormData({
          name: fallbackName,
          email: fallbackEmail,
          phone: localStorage.getItem('adminPhone') || '',
          department: localStorage.getItem('adminDepartment') || '',
          roll_number: '',
        })
        return
      }

      const userId = localStorage.getItem(`${userType}Id`)
      const userEmail = localStorage.getItem(`${userType}Email`)

      const table = userType === 'teacher' ? 'teachers' : 'students'
      const identifierColumn = userType === 'teacher' ? 'id' : 'id'
      const identifierValue = userId

      if (!identifierValue) {
        setStatus({ type: 'error', message: 'Profile identifier missing. Please log in again.' })
        return
      }

      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq(identifierColumn, identifierValue)
        .single()

      if (error) throw error

      if (data) {
        setFormData({
          name: data.name || '',
          email: data.email || userEmail || '',
          phone: data.phone || '',
          department: data.department || '',
          roll_number: data.roll_number || '',
        })
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error)
      setStatus({ type: 'error', message: 'Error loading profile data' })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (userType === 'admin') {
        localStorage.setItem('userName', formData.name)
        localStorage.setItem('adminEmail', formData.email)
        localStorage.setItem('adminPhone', formData.phone)
        localStorage.setItem('adminDepartment', formData.department)
        setStatus({ type: 'success', message: 'Profile updated locally.' })
        return
      }

      const userId = localStorage.getItem(`${userType}Id`)

      const table = userType === 'teacher' ? 'teachers' : 'students'
      const identifierValue: string | null = userId

      if (!identifierValue) {
        throw new Error('Profile identifier missing. Please log in again.')
      }

      const payload: any = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
      }

      if (userType === 'teacher') {
        payload.department = formData.department
      }

      if (userType === 'student') {
        payload.roll_number = formData.roll_number
      }

      const { error } = await supabase
        .from(table)
        .update(payload)
        .eq('id', identifierValue)

      if (error) throw error

      // Update localStorage
      localStorage.setItem(`${userType}Email`, formData.email)
      localStorage.setItem('userName', formData.name)
      
      setStatus({ type: 'success', message: 'Profile updated successfully!' })
    } catch (error: any) {
      console.error('Error updating profile:', error)
      setStatus({ type: 'error', message: 'Error updating profile: ' + error.message })
    } finally {
      setSaving(false)
    }
  }

  const handleFaceUpdate = async (descriptor: Float32Array) => {
    setSaving(true)
    try {
      if (userType === 'admin') {
        setStatus({ type: 'error', message: 'Face recognition is not available for admin accounts.' })
        setSaving(false)
        return
      }

      const userId = localStorage.getItem(`${userType}Id`)
      if (!userId) {
        setStatus({ type: 'error', message: 'Profile identifier missing. Please log in again.' })
        setSaving(false)
        return
      }

      const table = userType === 'teacher' ? 'teachers' : 'students'

      const { error } = await supabase
        .from(table)
        .update({ face_descriptor: Array.from(descriptor) })
        .eq('id', userId)

      if (error) throw error

      setStatus({ type: 'success', message: 'Face data updated successfully!' })
      setUpdateFace(false)
    } catch (error: any) {
      console.error('Error updating face:', error)
      setStatus({ type: 'error', message: 'Error updating face data: ' + error.message })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-4 theme-muted">Loading profile...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="theme-heading text-2xl font-bold">Edit Profile</h2>

      {status && (
        <div className={`status-banner ${status.type === 'error' ? 'status-banner--error' : 'status-banner--success'}`}>
          <p>{status.message}</p>
        </div>
      )}

      <div className="surface-panel surface-panel--muted">
        <form onSubmit={handleSubmit} className="space-y-4">
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
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="input-field"
            />
          </div>

          {userType !== 'student' && (
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
          )}

          {userType === 'student' && (
            <div>
              <label className="label">
                Roll Number *
              </label>
              <input
                type="text"
                required
                value={formData.roll_number}
                onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
                className="input-field"
              />
            </div>
          )}

          <button type="submit" disabled={saving} className="btn-primary w-full disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {(userType === 'teacher' || userType === 'student') && (
        <div className="surface-panel">
          <h3 className="theme-heading text-xl font-semibold mb-4">
            Update Face Recognition Data
          </h3>
          {!updateFace ? (
            <div>
              <p className="theme-muted mb-4">
                Click below to update your face recognition data. This will replace your existing face data.
              </p>
              <button
                onClick={() => setUpdateFace(true)}
                className="btn-primary"
              >
                Update Face Data
              </button>
            </div>
          ) : (
            <div>
              <FaceCapture onCapture={handleFaceUpdate} />
              <button
                onClick={() => setUpdateFace(false)}
                className="btn-secondary mt-4"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
