import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import ActiveSessions from './ActiveSessions'
import QRScanner from '../shared/QRScanner'
import FaceCapture from '../shared/FaceCapture'
import { verifyLocationInRange, formatDistance } from '../../utils/gps'
import { findBestMatch } from '../../lib/faceapi'
import type { QRSessionData } from '../../utils/qrcode'

type Step = 'sessions-list' | 'choose' | 'qr-scan' | 'gps-verify' | 'face-verify' | 'success'

interface SelectedSession {
  id: string
  subject_name: string
  class_name: string
  teacher_name: string
  qr_code: string | null
  gps_lat: number | null
  gps_lng: number | null
  gps_radius: number | null
}

export default function MarkAttendance() {
  const [step, setStep] = useState<Step>('sessions-list')
  const [selectedSession, setSelectedSession] = useState<SelectedSession | null>(null)
  const [sessionData, setSessionData] = useState<QRSessionData | null>(null)
  const [verificationMethod, setVerificationMethod] = useState<'qr' | 'gps'>('qr')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSessionSelect = (session: SelectedSession) => {
    setSelectedSession(session)
    setStep('choose')
  }

  const handleMethodChoice = (method: 'qr' | 'gps') => {
    setError('')
    setVerificationMethod(method)
    if (method === 'qr') {
      setStep('qr-scan')
    } else {
      setStep('gps-verify')
      handleGPSVerification()
    }
  }

  const handleQRScan = async (data: QRSessionData) => {
    setSessionData(data)
    
    // Verify session is active
    const { data: session, error } = await supabase
      .from('attendance_sessions')
      .select('*')
      .eq('id', data.session_id)
      .eq('status', 'active')
      .single()

    if (error || !session) {
      setError('Session not found or expired')
      setStep('choose')
      return
    }

    // Check if already marked
    const studentId = localStorage.getItem('studentId')
    const { data: existing } = await supabase
      .from('attendance_records')
      .select('id')
      .eq('session_id', data.session_id)
      .eq('student_id', studentId)
      .single()

    if (existing) {
      setError('You have already marked attendance for this session')
      setStep('choose')
      return
    }

    setStep('face-verify')
  }

  const handleGPSVerification = async () => {
    setLoading(true)
    setError('')

    try {
      if (!selectedSession) {
        throw new Error('No session selected')
      }

      if (!selectedSession.gps_lat || !selectedSession.gps_lng) {
        setError('This session does not require GPS verification. Please use QR code method.')
        setStep('choose')
        setLoading(false)
        return
      }

      // Verify location
      const result = await verifyLocationInRange(
        selectedSession.gps_lat,
        selectedSession.gps_lng,
        selectedSession.gps_radius || 100 // Use session's radius or default to 100m
      )

      if (!result.inRange) {
        const radius = selectedSession.gps_radius || 100
        setError(`You are ${formatDistance(result.distance)} away. You must be within ${radius}m of the classroom.`)
        setStep('choose')
        setLoading(false)
        return
      }

      // Check if already marked
      const studentId = localStorage.getItem('studentId')
      const { data: existing } = await supabase
        .from('attendance_records')
        .select('id')
        .eq('session_id', selectedSession.id)
        .eq('student_id', studentId)
        .single()

      if (existing) {
        setError('You have already marked attendance for this session')
        setStep('choose')
        setLoading(false)
        return
      }

      // Store session data
      setSessionData({
        session_id: selectedSession.id,
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour expiry
        class_id: '',
        subject_id: ''
      })

      // GPS verified successfully - proceed to face verification
      console.log(`✅ GPS verified! Distance: ${formatDistance(result.distance)}`)
      setStep('face-verify')
    } catch (err: any) {
      setError(err.message)
      setStep('choose')
    } finally {
      setLoading(false)
    }
  }

  const handleFaceVerification = async (descriptor: Float32Array) => {
    setLoading(true)
    setError('')

    try {
      const studentId = localStorage.getItem('studentId')
      
      // Get student's registered face
      const { data: student } = await supabase
        .from('students')
        .select('class_id, face_descriptor')
        .eq('id', studentId)
        .single()

      if (!student || !student.face_descriptor) {
        throw new Error('Student face data not found. Please contact admin.')
      }

      // Compare with registered face
      const match = findBestMatch(descriptor, [{
        id: studentId!,
        name: 'You',
        descriptor: student.face_descriptor as number[]
      }])

      if (!match) {
        setError('Face not recognized. Please try again or contact admin.')
        setStep('choose')
        setLoading(false)
        return
      }

      // Mark attendance
      const { error: attendanceError } = await supabase
        .from('attendance_records')
        .insert([{
          session_id: sessionData!.session_id,
          student_id: studentId,
          status: 'present',
          method: verificationMethod + '+face',
          marked_at: new Date().toISOString()
        }])

      if (attendanceError) throw attendanceError

      // Attendance marked successfully
      setStep('success')
    } catch (err: any) {
      setError(err.message || 'Failed to mark attendance')
      setStep('choose')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {step !== 'sessions-list' && (
        <>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Mark Attendance
          </h2>
          {selectedSession && (
            <div className="bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 dark:text-purple-400">Selected Session:</p>
                  <p className="font-semibold text-purple-900 dark:text-purple-100">{selectedSession.subject_name} - {selectedSession.class_name}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedSession(null)
                    setStep('sessions-list')
                  }}
                  className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 text-sm font-medium"
                >
                  Change Session
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Active Sessions List */}
      {step === 'sessions-list' && (
        <ActiveSessions onSelectSession={handleSessionSelect} />
      )}

      {/* Choose Method */}
      {step === 'choose' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            onClick={() => handleMethodChoice('qr')}
            className="card hover:shadow-xl transition-all cursor-pointer group"
          >
            <div className="text-center">
              <div className="text-6xl mb-4">📱</div>
              <h3 className="text-xl font-bold mb-2">Scan QR Code</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Scan the QR code displayed by your teacher
              </p>
            </div>
          </div>

          <div
            onClick={() => handleMethodChoice('gps')}
            className="card hover:shadow-xl transition-all cursor-pointer group"
          >
            <div className="text-center">
              <div className="text-6xl mb-4">📍</div>
              <h3 className="text-xl font-bold mb-2">Use GPS Location</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Verify you're in the classroom using GPS
              </p>
            </div>
          </div>
        </div>
      )}

      {/* QR Scan Step */}
      {step === 'qr-scan' && (
        <div className="card max-w-2xl mx-auto">
          <QRScanner
            onScan={handleQRScan}
            onError={(err) => {
              setError(err)
              setStep('choose')
            }}
          />
          <button
            onClick={() => setStep('choose')}
            className="btn-secondary w-full mt-4"
          >
            Back
          </button>
        </div>
      )}

      {/* GPS Verify Step */}
      {step === 'gps-verify' && loading && (
        <div className="card max-w-2xl mx-auto text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Verifying your location...
          </p>
        </div>
      )}

      {/* Face Verification Step */}
      {step === 'face-verify' && (
        <div className="card max-w-2xl mx-auto">
          <h3 className="text-xl font-bold mb-4 text-center">Face Verification</h3>
          <FaceCapture
            onCapture={handleFaceVerification}
            onError={(err) => {
              setError(err)
              setStep('choose')
            }}
          />
          {loading && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-center text-blue-800 dark:text-blue-200">
                Verifying your face...
              </p>
            </div>
          )}
          <button
            onClick={() => setStep('choose')}
            className="btn-secondary w-full mt-4"
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Success Step */}
      {step === 'success' && (
        <div className="card max-w-2xl mx-auto text-center">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-2xl font-bold mb-2 text-green-600 dark:text-green-400">
            Attendance Marked!
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Your attendance has been recorded successfully.
          </p>
          <button
            onClick={() => {
              setStep('choose')
              setSessionData(null)
            }}
            className="btn-primary"
          >
            Mark Another Class
          </button>
        </div>
      )}

      {error && step !== 'choose' && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg max-w-2xl mx-auto">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
    </div>
  )
}
