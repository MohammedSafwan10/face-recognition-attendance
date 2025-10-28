import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

interface ScheduleEntry {
  id: string
  day: string
  start_time: string
  end_time: string
  subject_name: string
  teacher_name: string
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function StudentSchedule() {
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week')
  const [selectedDay, setSelectedDay] = useState(DAYS[new Date().getDay() - 1] || DAYS[0])

  useEffect(() => {
    fetchSchedule()
  }, [])

  const fetchSchedule = async () => {
    setLoading(true)
    try {
      const studentId = localStorage.getItem('studentId')

      // Get student's class
      const { data: student } = await supabase
        .from('students')
        .select('class_id')
        .eq('id', studentId)
        .single()

      if (!student) throw new Error('Student data not found')

      // Fetch schedule for the class
      const { data: scheduleData, error } = await supabase
        .from('class_schedules')
        .select(`
          id,
          day,
          start_time,
          end_time,
          subjects:subject_id (name),
          teachers:teacher_id (name)
        `)
        .eq('class_id', student.class_id)
        .order('day')
        .order('start_time')

      if (error) throw error

      const formattedSchedule = (scheduleData || []).map((entry: any) => ({
        id: entry.id,
        day: entry.day,
        start_time: entry.start_time,
        end_time: entry.end_time,
        subject_name: entry.subjects?.name || 'Unknown',
        teacher_name: entry.teachers?.name || 'Unknown'
      }))

      setSchedule(formattedSchedule)
    } catch (error: any) {
      console.error('Error fetching schedule:', error)
      // Don't show alert for missing table, just show empty state
    } finally {
      setLoading(false)
    }
  }

  const getScheduleForDay = (day: string) => {
    return schedule.filter(entry => entry.day === day)
  }

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const getCurrentDay = () => {
    const today = new Date().getDay()
    return DAYS[today - 1] || DAYS[0]
  }

  const isToday = (day: string) => {
    return day === getCurrentDay()
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading schedule...</p>
      </div>
    )
  }

  if (schedule.length === 0) {
    return (
      <div className="card text-center py-12">
        <div className="text-6xl mb-4">📅</div>
        <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
          No Schedule Available
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Your class schedule hasn't been uploaded yet. Please contact your admin.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          My Schedule
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('week')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              viewMode === 'week'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Week View
          </button>
          <button
            onClick={() => setViewMode('day')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              viewMode === 'day'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Day View
          </button>
        </div>
      </div>

      {viewMode === 'day' && (
        <div className="card">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Day
          </label>
          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            className="w-full md:w-auto px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
          >
            {DAYS.map((day) => (
              <option key={day} value={day}>
                {day} {isToday(day) ? '(Today)' : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {viewMode === 'week' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DAYS.map((day) => {
            const daySchedule = getScheduleForDay(day)
            return (
              <div
                key={day}
                className={`card ${isToday(day) ? 'ring-2 ring-purple-500' : ''}`}
              >
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                  {day}
                  {isToday(day) && (
                    <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200 rounded text-xs">
                      Today
                    </span>
                  )}
                </h3>
                {daySchedule.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-sm italic">
                    No classes scheduled
                  </p>
                ) : (
                  <div className="space-y-3">
                    {daySchedule.map((entry) => (
                      <div
                        key={entry.id}
                        className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg"
                      >
                        <div className="font-medium text-gray-900 dark:text-white">
                          {entry.subject_name}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {formatTime(entry.start_time)} - {formatTime(entry.end_time)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          👨‍🏫 {entry.teacher_name}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card">
          <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            {selectedDay} {isToday(selectedDay) && '(Today)'}
          </h3>
          {getScheduleForDay(selectedDay).length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 italic py-8 text-center">
              No classes scheduled for {selectedDay}
            </p>
          ) : (
            <div className="space-y-4">
              {getScheduleForDay(selectedDay).map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {entry.subject_name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        👨‍🏫 {entry.teacher_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-purple-600 dark:text-purple-400">
                        {formatTime(entry.start_time)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        to {formatTime(entry.end_time)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
