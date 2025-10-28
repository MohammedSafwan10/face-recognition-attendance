import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Navbar from '../components/shared/Navbar'
import CreateSession from '../components/teacher/CreateSession'
import SessionHistory from '../components/teacher/SessionHistory'
import AttendanceReports from '../components/shared/AttendanceReports'
import ProfileEdit from '../components/shared/ProfileEdit'

export default function TeacherPortal() {
  const navigate = useNavigate()
  const userName = localStorage.getItem('userName') || 'Teacher'
  const [activeTab, setActiveTab] = useState('dashboard')

  useEffect(() => {
    const userType = localStorage.getItem('userType')
    if (userType !== 'teacher') {
      navigate('/login')
    }
  }, [navigate])

  const handleLogout = () => {
    localStorage.clear()
    navigate('/login')
  }

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: '📊' },
    { id: 'session', name: 'Start Session', icon: '▶️' },
    { id: 'history', name: 'Session History', icon: '📚' },
    { id: 'reports', name: 'Reports', icon: '📈' },
    { id: 'profile', name: 'Profile', icon: '👤' },
  ]

  return (
    <div className="page-bg">
      <Navbar
        userType="teacher"
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
              <h1 className="theme-heading text-3xl font-bold">Teacher Dashboard</h1>
              <p className="theme-muted max-w-2xl">
                Quickly start attendance sessions, review history, and manage your teaching profile.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                onClick={() => setActiveTab('session')}
                className="card hover:shadow-xl transition-shadow text-left"
              >
                <div className="text-4xl mb-4">▶️</div>
                <h3 className="text-xl font-semibold mb-2 theme-heading">Start Attendance Session</h3>
                <p className="theme-muted">
                  Create a new 10-minute attendance session with QR code
                </p>
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className="card hover:shadow-xl transition-shadow text-left"
              >
                <div className="text-4xl mb-4">📈</div>
                <h3 className="text-xl font-semibold mb-2 theme-heading">View Reports</h3>
                <p className="theme-muted">
                  Check attendance reports for your classes
                </p>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'session' && <CreateSession />}
        {activeTab === 'history' && <SessionHistory />}
        {activeTab === 'reports' && (
          <AttendanceReports userType="teacher" userEmail={localStorage.getItem('userEmail') || undefined} />
        )}
        {activeTab === 'profile' && <ProfileEdit userType="teacher" />}
      </div>
    </div>
  )
}
