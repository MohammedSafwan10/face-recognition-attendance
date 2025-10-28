import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { generateQRCode } from '../../utils/qrcode'
import type { QRSessionData } from '../../utils/qrcode'
import { getCurrentLocation } from '../../utils/gps'

interface Subject {
  id: string
  name: string
}

interface Class {
  id: string
  name: string
}

export default function CreateSession() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedClass, setSelectedClass] = useState('')
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [sessionActive, setSessionActive] = useState(false)
  const [selectedDuration, setSelectedDuration] = useState(10)
  const [timeRemaining, setTimeRemaining] = useState(600)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (sessionActive && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleEndSession()
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [sessionActive, timeRemaining])

  const fetchData = async () => {
    try {
      const [subjectsRes, classesRes] = await Promise.all([
        supabase.from('subjects').select('id, name'),
        supabase.from('classes').select('id, name')
      ])

      if (subjectsRes.data) setSubjects(subjectsRes.data)
      if (classesRes.data) setClasses(classesRes.data)
    } catch (err) {
      console.error(err)
    }
  }

  const handleGetLocation = async () => {
    try {
      setLoading(true)
      const location = await getCurrentLocation()
      setGpsCoords({
        lat: location.latitude,
        lng: location.longitude
      })
      setSuccess(`Location captured: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleStartSession = async () => {
    if (!selectedSubject || !selectedClass) {
      setError('Please select subject and class')
      return
    }

    const teacherId = localStorage.getItem('teacherId')
    if (!teacherId) {
      setError('Teacher ID not found. Please login again.')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const startTime = new Date()
      const endTime = new Date(startTime.getTime() + selectedDuration * 60 * 1000)

      // Create session
      const { data: session, error: sessionError } = await supabase
        .from('attendance_sessions')
        .insert([{
          teacher_id: teacherId,
          subject_id: selectedSubject,
          class_id: selectedClass,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          gps_lat: gpsCoords?.lat || null,
          gps_lng: gpsCoords?.lng || null,
          gps_radius: 50,
          status: 'active'
        }])
        .select()
        .single()

      if (sessionError) throw sessionError

      setSessionId(session.id)
      
      // Generate QR code
      const qrData: QRSessionData = {
        session_id: session.id,
        expires_at: endTime.toISOString(),
        class_id: selectedClass,
        subject_id: selectedSubject
      }

      const qrCodeUrl = await generateQRCode(qrData)
      setQrCode(qrCodeUrl)
      
      setSessionActive(true)
      setTimeRemaining(selectedDuration * 60)
      setSuccess('Session started successfully! Students can now mark attendance.')
    } catch (err: any) {
      setError(err.message || 'Failed to start session')
    } finally {
      setLoading(false)
    }
  }

  const handleEndSession = async () => {
    if (!sessionId) return

    try {
      await supabase
        .from('attendance_sessions')
        .update({ status: 'expired' })
        .eq('id', sessionId)

      setSessionActive(false)
      setSuccess('Session ended successfully. Background job will mark absent students.')
    } catch (err: any) {
      setError(err.message)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        Create Attendance Session
      </h2>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
        </div>
      )}

      {!sessionActive ? (
        <div className="card max-w-2xl">
          <div className="space-y-4">
            <div>
              <label className="label">Select Subject *</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="input-field"
              >
                <option value="">Choose a subject</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Select Class *</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="input-field"
              >
                <option value="">Choose a class</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Session Duration *</label>
              <div className="grid grid-cols-4 gap-2">
                {[15, 30, 45, 60].map((duration) => (
                  <button
                    key={duration}
                    type="button"
                    onClick={() => setSelectedDuration(duration)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      selectedDuration === duration
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {duration}m
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    GPS Location (Optional)
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {gpsCoords 
                      ? `✓ Location set (${gpsCoords.lat.toFixed(4)}, ${gpsCoords.lng.toFixed(4)})` 
                      : 'Students within 50m can mark attendance'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={loading}
                  className="btn-secondary"
                >
                  {gpsCoords ? 'Update' : 'Get Location'}
                </button>
              </div>
            </div>

            <button
              onClick={handleStartSession}
              disabled={loading || !selectedSubject || !selectedClass}
              className="btn-primary w-full"
            >
              {loading ? 'Starting Session...' : 'Start Attendance Session'}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Session Info */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Session Active</h3>
              <div className={`text-3xl font-bold ${timeRemaining < 60 ? 'text-red-600' : 'text-green-600'}`}>
                {formatTime(timeRemaining)}
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Subject</p>
                <p className="font-medium">
                  {subjects.find(s => s.id === selectedSubject)?.name}
                </p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Class</p>
                <p className="font-medium">
                  {classes.find(c => c.id === selectedClass)?.name}
                </p>
              </div>
              {gpsCoords && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm text-green-700 dark:text-green-400">
                    ✓ GPS Enabled (50m radius)
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={handleEndSession}
              className="w-full mt-4 px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              End Session Early
            </button>
          </div>

          {/* QR Code */}
          <div className="card">
            <h3 className="text-xl font-bold mb-4">QR Code for Students</h3>
            <div className="bg-white p-4 rounded-lg flex items-center justify-center">
              {qrCode && (
                <img src={qrCode} alt="Attendance QR Code" className="w-full max-w-sm" />
              )}
            </div>
            <p className="text-sm text-center text-gray-600 dark:text-gray-400 mt-4">
              Display this QR code for students to scan
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
