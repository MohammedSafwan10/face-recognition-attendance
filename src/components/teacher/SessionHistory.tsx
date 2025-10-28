import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

interface Session {
  id: string
  subject_name: string
  class_name: string
  start_time: string
  end_time: string
  status: string
  verification_methods: string[]
  attendance_count: number
  total_students: number
}

export default function SessionHistory() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'completed' | 'expired'>('all')

  useEffect(() => {
    fetchSessions()
  }, [filter])

  const fetchSessions = async () => {
    setLoading(true)
    try {
      const teacherId = localStorage.getItem('teacherId')

      // Fetch all sessions (not just active)
      let query = supabase
        .from('attendance_sessions')
        .select(`
          id,
          class_id,
          start_time,
          end_time,
          status,
          qr_code,
          gps_lat,
          gps_lng,
          subjects:subject_id (name),
          classes:class_id (name)
        `)
        .eq('teacher_id', teacherId)
        .order('start_time', { ascending: false })

      // Apply status filter
      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data: sessionsData, error } = await query

      if (error) throw error

      // Get attendance counts for each session
      const sessionsWithCounts = await Promise.all(
        (sessionsData || []).map(async (session: any) => {
          // Get attendance count
          const { count: attendanceCount } = await supabase
            .from('attendance_records')
            .select('id', { count: 'exact', head: true })
            .eq('session_id', session.id)
            .eq('status', 'present')

          // Get total students in class
          const { count: totalStudents } = await supabase
            .from('students')
            .select('id', { count: 'exact', head: true })
            .eq('class_id', session.class_id)

          // Determine verification methods
          const verificationMethods: string[] = []
          if (session.qr_code) verificationMethods.push('QR')
          if (session.gps_lat && session.gps_lng) verificationMethods.push('GPS')
          verificationMethods.push('Face')

          return {
            id: session.id,
            subject_name: session.subjects?.name || 'Unknown',
            class_name: session.classes?.name || 'Unknown',
            start_time: session.start_time,
            end_time: session.end_time,
            status: session.status,
            verification_methods: verificationMethods,
            attendance_count: attendanceCount || 0,
            total_students: totalStudents || 0
          }
        })
      )

      setSessions(sessionsWithCounts)
    } catch (error: any) {
      console.error('Error fetching sessions:', error)
      alert('Error fetching session history')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      expired: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
    return colors[status as keyof typeof colors] || colors.expired
  }

  const getAttendancePercentage = (attended: number, total: number) => {
    if (total === 0) return 0
    return Math.round((attended / total) * 100)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Session History
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'completed'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setFilter('expired')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'expired'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Expired
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading sessions...</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
            No Sessions Found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {filter === 'all' 
              ? 'You haven\'t created any sessions yet.'
              : `No ${filter} sessions found.`}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="card hover:shadow-lg transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {session.subject_name}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(session.status)}`}>
                      {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Class: <span className="font-medium">{session.class_name}</span>
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div>
                      <span className="font-medium">Started:</span> {formatDate(session.start_time)}
                    </div>
                    <div>
                      <span className="font-medium">Ended:</span> {formatDate(session.end_time)}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    {session.verification_methods.map((method) => (
                      <span
                        key={method}
                        className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded text-xs font-medium"
                      >
                        {method}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-4 min-w-[120px]">
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {getAttendancePercentage(session.attendance_count, session.total_students)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
                    {session.attendance_count}/{session.total_students} Present
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
