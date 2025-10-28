import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

interface Session {
  id: string
  subject_name: string
  class_name: string
  teacher_name: string
  end_time: string
  qr_code: string | null
  gps_lat: number | null
  gps_lng: number | null
  gps_radius: number | null
}

interface Props {
  onSelectSession: (session: Session) => void
}

export default function ActiveSessions({ onSelectSession }: Props) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchActiveSessions()
    // Refresh every 30 seconds
    const interval = setInterval(fetchActiveSessions, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchActiveSessions = async () => {
    try {
      const studentEmail = localStorage.getItem('userEmail')
      
      // Get student's class
      const { data: student } = await supabase
        .from('students')
        .select('class_id')
        .eq('email', studentEmail)
        .single()

      if (!student) {
        setLoading(false)
        return
      }

      // Get active sessions for student's class
      const { data: sessionsData, error } = await supabase
        .from('attendance_sessions')
        .select(`
          id,
          end_time,
          qr_code,
          gps_lat,
          gps_lng,
          gps_radius,
          subjects(name),
          classes(name),
          teachers(name)
        `)
        .eq('class_id', student.class_id)
        .eq('status', 'active')
        .gt('end_time', new Date().toISOString())

      if (error) {
        console.error('Error fetching sessions:', error)
        setLoading(false)
        return
      }

      const formatted = sessionsData?.map((s: any) => ({
        id: s.id,
        subject_name: s.subjects?.name || 'Unknown Subject',
        class_name: s.classes?.name || 'Unknown Class',
        teacher_name: s.teachers?.name || 'Unknown Teacher',
        end_time: s.end_time,
        qr_code: s.qr_code,
        gps_lat: s.gps_lat,
        gps_lng: s.gps_lng,
        gps_radius: s.gps_radius
      })) || []

      setSessions(formatted)
      setLoading(false)
    } catch (err) {
      console.error('Error:', err)
      setLoading(false)
    }
  }

  const getTimeRemaining = (endTime: string) => {
    const end = new Date(endTime).getTime()
    const now = new Date().getTime()
    const diff = Math.max(0, end - now)
    const minutes = Math.floor(diff / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center p-12">
        <div className="text-6xl mb-4">📭</div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          No Active Sessions
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          There are no active attendance sessions for your class right now.
          <br />
          Check back when your teacher starts a session.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Active Attendance Sessions
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Select a session to mark your attendance
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-purple-500"
            onClick={() => onSelectSession(session)}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  {session.subject_name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {session.class_name}
                </p>
              </div>
              <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm font-semibold">
                Active
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center text-gray-700 dark:text-gray-300">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-sm">{session.teacher_name}</span>
              </div>
              <div className="flex items-center text-gray-700 dark:text-gray-300">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-semibold">Time left: {getTimeRemaining(session.end_time)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              {session.qr_code && (
                <div className="flex-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-2 rounded-lg text-xs font-medium text-center">
                  📱 QR Available
                </div>
              )}
              {session.gps_lat && session.gps_lng && (
                <div className="flex-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-2 rounded-lg text-xs font-medium text-center">
                  📍 GPS Available
                </div>
              )}
            </div>

            <button className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-semibold">
              Mark Attendance →
            </button>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-semibold mb-1">How to mark attendance:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Click on an active session card</li>
              <li>Choose QR scan or GPS verification</li>
              <li>Complete face recognition</li>
              <li>Your attendance will be marked automatically</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
