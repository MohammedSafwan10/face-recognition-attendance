import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

interface Schedule {
  id: string
  class_id: string
  class_name: string
  subject_id: string
  subject_name: string
  teacher_id: string
  teacher_name: string
  day: string
  start_time: string
  end_time: string
}

interface Class {
  id: string
  name: string
}

interface Subject {
  id: string
  name: string
}

interface Teacher {
  id: number
  name: string
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function ScheduleManager() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    class_id: '',
    subject_id: '',
    teacher_id: '',
    day: 'Monday',
    start_time: '09:00',
    end_time: '10:00'
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [schedulesRes, classesRes, subjectsRes, teachersRes] = await Promise.all([
        supabase.from('class_schedules').select(`
          id,
          class_id,
          subject_id,
          teacher_id,
          day,
          start_time,
          end_time,
          classes(name),
          subjects(name),
          teachers(name)
        `).order('day').order('start_time'),
        supabase.from('classes').select('id, name'),
        supabase.from('subjects').select('id, name'),
        supabase.from('teachers').select('id, name')
      ])

      if (schedulesRes.error) throw schedulesRes.error
      if (classesRes.error) throw classesRes.error
      if (subjectsRes.error) throw subjectsRes.error
      if (teachersRes.error) throw teachersRes.error

      const formattedSchedules = (schedulesRes.data || []).map((s: any) => ({
        id: s.id,
        class_id: s.class_id,
        class_name: s.classes?.name || 'Unknown',
        subject_id: s.subject_id,
        subject_name: s.subjects?.name || 'Unknown',
        teacher_id: s.teacher_id,
        teacher_name: s.teachers?.name || 'Unknown',
        day: s.day,
        start_time: s.start_time,
        end_time: s.end_time
      }))

      setSchedules(formattedSchedules)
      setClasses(classesRes.data || [])
      setSubjects(subjectsRes.data || [])
      setTeachers(teachersRes.data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      const { error: insertError } = await supabase
        .from('class_schedules')
        .insert([{
          class_id: formData.class_id,
          subject_id: formData.subject_id,
          teacher_id: parseInt(formData.teacher_id),
          day: formData.day,
          start_time: formData.start_time,
          end_time: formData.end_time
        }])

      if (insertError) throw insertError

      setSuccess('✅ Class schedule added successfully!')
      setShowForm(false)
      resetForm()
      fetchData()
    } catch (err: any) {
      setError(err.message || 'Failed to add schedule')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this schedule?')) return

    try {
      const { error } = await supabase
        .from('class_schedules')
        .delete()
        .eq('id', id)

      if (error) throw error

      setSuccess('Schedule deleted successfully!')
      fetchData()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const resetForm = () => {
    setFormData({
      class_id: '',
      subject_id: '',
      teacher_id: '',
      day: 'Monday',
      start_time: '09:00',
      end_time: '10:00'
    })
  }

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            📅 Class Schedules
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Create weekly timetables for classes
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary"
        >
          {showForm ? 'Cancel' : '+ Add Schedule'}
        </button>
      </div>

      {error && (
        <div className="status-banner status-banner--error">
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="status-banner status-banner--success">
          <p>{success}</p>
        </div>
      )}

      {/* Add Schedule Form */}
      {showForm && (
        <div className="card">
          <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Add New Schedule
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Class *</label>
                <select
                  required
                  value={formData.class_id}
                  onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                  className="input-field"
                >
                  <option value="">Select Class</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Subject *</label>
                <select
                  required
                  value={formData.subject_id}
                  onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                  className="input-field"
                >
                  <option value="">Select Subject</option>
                  {subjects.map((subj) => (
                    <option key={subj.id} value={subj.id}>
                      {subj.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Teacher *</label>
                <select
                  required
                  value={formData.teacher_id}
                  onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                  className="input-field"
                >
                  <option value="">Select Teacher</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Day *</label>
                <select
                  required
                  value={formData.day}
                  onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                  className="input-field"
                >
                  {DAYS.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Start Time *</label>
                <input
                  type="time"
                  required
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="label">End Time *</label>
                <input
                  type="time"
                  required
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button type="submit" className="btn-primary flex-1">
                Add Schedule
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  resetForm()
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Schedules by Day */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {DAYS.map((day) => {
          const daySchedules = schedules.filter(s => s.day === day)
          return (
            <div key={day} className="card">
              <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                {day}
              </h3>
              {daySchedules.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm italic">
                  No classes scheduled
                </p>
              ) : (
                <div className="space-y-2">
                  {daySchedules.map((schedule) => (
                    <div
                      key={schedule.id}
                      className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {schedule.subject_name}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {schedule.class_name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-500">
                            👨‍🏫 {schedule.teacher_name}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDelete(schedule.id)}
                          className="text-rose-500 hover:text-rose-600 text-sm"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                        {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {schedules.length === 0 && (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
            No Schedules Yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Click "Add Schedule" to create class timetables
          </p>
        </div>
      )}
    </div>
  )
}
