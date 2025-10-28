import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Navbar from '../components/shared/Navbar'
import MarkAttendance from '../components/student/MarkAttendance'
import StudentSchedule from '../components/student/StudentSchedule'
import AttendanceReports from '../components/shared/AttendanceReports'
import ProfileEdit from '../components/shared/ProfileEdit'

export default function StudentPortal() {
  const navigate = useNavigate()
  const userName = localStorage.getItem('userName') || 'Student'
  const [activeTab, setActiveTab] = useState('dashboard')

  useEffect(() => {
    const userType = localStorage.getItem('userType')
    if (userType !== 'student') {
      navigate('/login')
    }
  }, [navigate])

  const handleLogout = () => {
    localStorage.clear()
    navigate('/login')
  }

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: '📊' },
    { id: 'attendance', name: 'Mark Attendance', icon: '✓' },
    { id: 'schedule', name: 'My Schedule', icon: '📅' },
    { id: 'reports', name: 'My Reports', icon: '📈' },
    { id: 'profile', name: 'Profile', icon: '👤' },
  ]

  return (
    <div className="page-bg">
      <Navbar
        userType="student"
        userName={userName}
        onLogout={handleLogout}
      />
      
      <div className="portal-shell">
        {/* Tab Navigation */}
        <div className="tab-strip" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-button ${activeTab === tab.id ? 'tab-button--active' : ''}`}
              role="tab"
              aria-selected={activeTab === tab.id}
            >
              <span className="tab-icon">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="flex flex-col gap-4">
              <h1 className="theme-heading text-3xl font-bold">Student Dashboard</h1>
              <p className="theme-muted max-w-2xl">
                Access attendance tools, schedules, and performance insights.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <button
                onClick={() => setActiveTab('attendance')}
                className="card hover:shadow-xl transition-shadow text-left"
              >
                <div className="text-4xl mb-4">✓</div>
                <h3 className="text-xl font-semibold mb-2 theme-heading">Mark Attendance</h3>
                <p className="theme-muted">
                  Scan a QR code or use GPS to confirm your presence
                </p>
              </button>
              <button
                onClick={() => setActiveTab('schedule')}
                className="card hover:shadow-xl transition-shadow text-left"
              >
                <div className="text-4xl mb-4">📅</div>
                <h3 className="text-xl font-semibold mb-2 theme-heading">View Schedule</h3>
                <p className="theme-muted">
                  Stay ahead with your latest class timetable
                </p>
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className="card hover:shadow-xl transition-shadow text-left"
              >
                <div className="text-4xl mb-4">📈</div>
                <h3 className="text-xl font-semibold mb-2 theme-heading">My Attendance</h3>
                <p className="theme-muted">
                  Review attendance stats and download reports
                </p>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'attendance' && <MarkAttendance />}
        {activeTab === 'schedule' && <StudentSchedule />}
        {activeTab === 'reports' && (
          <AttendanceReports userType="student" userEmail={localStorage.getItem('userEmail') || undefined} />
        )}
        {activeTab === 'profile' && <ProfileEdit userType="student" />}
      </div>
    </div>
  )
}
