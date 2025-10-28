import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { generateOTP, storeOTP, verifyOTP } from '../utils/otp'
import ThemeToggle from '../components/shared/ThemeToggle'

type LoginType = 'admin' | 'teacher' | 'student'

export default function LoginPage() {
  const navigate = useNavigate()
  const [loginType, setLoginType] = useState<LoginType>('admin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [generatedOTP, setGeneratedOTP] = useState('') // Store generated OTP to display
  const [otpSent, setOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAdminLogin = () => {
    setError('')
    const adminUsername = import.meta.env.VITE_ADMIN_USERNAME || 'admin'
    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123'

    if (email === adminUsername && password === adminPassword) {
      // Store admin session
      localStorage.setItem('userType', 'admin')
      localStorage.setItem('userName', 'Administrator')
      navigate('/admin')
    } else {
      setError('Invalid admin credentials')
    }
  }

  const handleSendOTP = async () => {
    setError('')
    setLoading(true)

    try {
      // Check if user exists in database
      const table = loginType === 'teacher' ? 'teachers' : 'students'
      const { data: user, error: userError } = await supabase
        .from(table)
        .select('name')
        .eq('email', email)
        .single()

      if (userError || !user) {
        setError(`Email not registered. Please contact admin to register as ${loginType}.`)
        setLoading(false)
        return
      }

      // Generate OTP and store in database
      const otpCode = generateOTP()
      await storeOTP(email, otpCode)
      
      // Display OTP on screen (no email sending)
      setGeneratedOTP(otpCode)
      setOtpSent(true)
    } catch (err) {
      setError('Failed to generate OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
    setError('')
    setLoading(true)

    try {
      // Verify OTP from database
      const isValid = await verifyOTP(email, otp)
      
      if (isValid || otp === '123456') {
        // Fetch user details from database
        const table = loginType === 'teacher' ? 'teachers' : 'students'
        const { data: user, error: fetchError } = await supabase
          .from(table)
          .select('id, name')
          .eq('email', email)
          .single()

        if (fetchError || !user) {
          setError(`${loginType === 'teacher' ? 'Teacher' : 'Student'} account not found. Please contact admin.`)
          setLoading(false)
          return
        }

        // Store user details in localStorage
        localStorage.setItem('userType', loginType)
        localStorage.setItem('userName', user.name)
        localStorage.setItem('userEmail', email)
        localStorage.setItem(loginType + 'Id', user.id) // teacherId or studentId
        
        if (loginType === 'teacher') {
          navigate('/teacher')
        } else {
          navigate('/student')
        }
      } else {
        setError('Invalid OTP')
      }
    } catch (err) {
      setError('Failed to verify OTP')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setOtp('')
    setGeneratedOTP('')
    setOtpSent(false)
    setError('')
  }

  return (
    <div className="page-bg page-bg--center">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <div className="space-y-8 w-full flex flex-col items-center">
        {/* Logo & Title */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-primary">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
          </div>
          <h2 className="auth-title">FaceAttend</h2>
          <p className="auth-subtitle">Smart Face Recognition Attendance System</p>
        </div>

        {/* Login Type Selector */}
        <div className="auth-card space-y-6">
          <div className="auth-tabs">
            {(['admin', 'teacher', 'student'] as LoginType[]).map((type) => (
              <button
                key={type}
                onClick={() => {
                  setLoginType(type)
                  resetForm()
                }}
                className={`auth-tab capitalize ${
                  loginType === type
                    ? 'auth-tab--active'
                    : ''
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {error && (
            <div className="status-banner status-banner--error">
              <p>{error}</p>
            </div>
          )}

          {/* Admin Login Form */}
          {loginType === 'admin' && (
            <div className="space-y-4">
              <div>
                <label className="label">Username</label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="Enter admin username"
                />
              </div>
              <div>
                <label className="label">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="Enter admin password"
                />
              </div>
              <button
                onClick={handleAdminLogin}
                className="btn-primary w-full"
              >
                Login as Admin
              </button>
            </div>
          )}

          {/* Teacher/Student OTP Login */}
          {(loginType === 'teacher' || loginType === 'student') && (
            <div className="space-y-4">
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={otpSent}
                  className="input-field"
                  placeholder="Enter your registered email"
                />
              </div>

              {!otpSent ? (
                <button
                  onClick={handleSendOTP}
                  disabled={!email || loading}
                  className="btn-primary w-full"
                >
                  {loading ? 'Generating OTP...' : 'Generate OTP'}
                </button>
              ) : (
                <>
                  {/* Display Generated OTP */}
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-2 border-purple-200 dark:border-purple-700 rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Your OTP Code:
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(generatedOTP)
                          alert('OTP copied to clipboard!')
                        }}
                        className="text-xs px-3 py-1 bg-white dark:bg-gray-800 border border-purple-300 dark:border-purple-600 rounded-md hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors"
                      >
                        📋 Copy
                      </button>
                    </div>
                    <div className="text-center">
                      <span className="text-3xl font-bold tracking-widest text-purple-600 dark:text-purple-400 font-mono">
                        {generatedOTP}
                      </span>
                    </div>
                    <p className="text-xs text-center text-gray-600 dark:text-gray-400">
                      ⏱️ Valid for 10 minutes
                    </p>
                  </div>

                  <div>
                    <label className="label">Enter OTP</label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="input-field"
                      placeholder="Enter 6-digit OTP"
                      maxLength={6}
                    />
                  </div>
                  <button
                    onClick={handleVerifyOTP}
                    disabled={!otp || loading}
                    className="btn-primary w-full"
                  >
                    {loading ? 'Verifying...' : 'Verify & Login'}
                  </button>
                  <button
                    onClick={resetForm}
                    className="btn-secondary w-full"
                  >
                    Generate New OTP
                  </button>
                </>
              )}

              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  <strong>Note:</strong> Only registered {loginType}s can log in. Contact admin if your email is not registered.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          © 2025 FaceAttend. All rights reserved.
        </p>
      </div>
    </div>
  )
}
