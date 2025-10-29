import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Navbar from '../components/shared/Navbar'
import CourseManager from '../components/admin/CourseManager'
import StudentRegistration from '../components/admin/StudentRegistration'
import TeacherManager from '../components/admin/TeacherManager'
import SubjectManager from '../components/admin/SubjectManager'
import ClassManager from '../components/admin/ClassManager'
import SemesterManager from '../components/admin/SemesterManager'
import AttendanceReports from '../components/shared/AttendanceReports'
import ProfileEdit from '../components/shared/ProfileEdit'
import ScheduleManager from '../components/admin/ScheduleManager'

export default function AdminPortal() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('dashboard')

  useEffect(() => {
    const userType = localStorage.getItem('userType')
    if (userType !== 'admin') {
      navigate('/login')
    }
  }, [navigate])

  const handleLogout = () => {
    localStorage.clear()
    navigate('/login')
  }

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: '📊' },
    { id: 'courses', name: 'Courses', icon: '📚' },
    { id: 'semesters', name: 'Semesters', icon: '📅' },
    { id: 'subjects', name: 'Subjects', icon: '📖' },
    { id: 'classes', name: 'Classes', icon: '🎓' },
    { id: 'schedules', name: 'Schedules', icon: '📅' },
    { id: 'students', name: 'Students', icon: '👨‍🎓' },
    { id: 'teachers', name: 'Teachers', icon: '👨‍🏫' },
    { id: 'reports', name: 'Reports', icon: '📈' },
    { id: 'profile', name: 'Profile', icon: '👤' },
  ]

  return (
    <div className="page-bg">
      <Navbar
        userType="admin"
        userName="Administrator"
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
              <h1 className="theme-heading text-3xl font-bold">Admin Dashboard</h1>
              <p className="theme-muted max-w-2xl">
                Manage courses, classes, and attendance flows with a single click.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <button
                onClick={() => setActiveTab('courses')}
                className="card hover:shadow-xl transition-shadow text-left"
              >
                <div className="text-4xl mb-4">📚</div>
                <h3 className="text-xl font-semibold mb-2 theme-heading">Manage Courses</h3>
                <p className="theme-muted">
                  Add, edit, or delete courses
                </p>
              </button>
              <button
                onClick={() => setActiveTab('semesters')}
                className="card hover:shadow-xl transition-shadow text-left"
              >
                <div className="text-4xl mb-4">📅</div>
                <h3 className="text-xl font-semibold mb-2 theme-heading">Manage Semesters</h3>
                <p className="theme-muted">
                  Add custom semesters for courses
                </p>
              </button>
              <button
                onClick={() => setActiveTab('subjects')}
                className="card hover:shadow-xl transition-shadow text-left"
              >
                <div className="text-4xl mb-4">📖</div>
                <h3 className="text-xl font-semibold mb-2 theme-heading">Manage Subjects</h3>
                <p className="theme-muted">
                  Add subjects like Data Structures, Algorithms
                </p>
              </button>
              <button
                onClick={() => setActiveTab('classes')}
                className="card hover:shadow-xl transition-shadow text-left"
              >
                <div className="text-4xl mb-4">🎓</div>
                <h3 className="text-xl font-semibold mb-2 theme-heading">Manage Classes</h3>
                <p className="theme-muted">
                  Add classes like CSE 3rd Year A, B
                </p>
              </button>
              <button
                onClick={() => setActiveTab('students')}
                className="card hover:shadow-xl transition-shadow text-left"
              >
                <div className="text-4xl mb-4">👨‍🎓</div>
                <h3 className="text-xl font-semibold mb-2 theme-heading">Manage Students</h3>
                <p className="theme-muted">
                  Register students with face recognition
                </p>
              </button>
              <button
                onClick={() => setActiveTab('teachers')}
                className="card hover:shadow-xl transition-shadow text-left"
              >
                <div className="text-4xl mb-4">👨‍🏫</div>
                <h3 className="text-xl font-semibold mb-2 theme-heading">Manage Teachers</h3>
                <p className="theme-muted">
                  Register and manage teachers
                </p>
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className="card hover:shadow-xl transition-shadow text-left"
              >
                <div className="text-4xl mb-4">📈</div>
                <h3 className="text-xl font-semibold mb-2 theme-heading">View Reports</h3>
                <p className="theme-muted">
                  Download attendance reports
                </p>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'courses' && <CourseManager />}
        {activeTab === 'semesters' && <SemesterManager />}
        {activeTab === 'subjects' && <SubjectManager />}
        {activeTab === 'classes' && <ClassManager />}
        {activeTab === 'schedules' && <ScheduleManager />}
        {activeTab === 'students' && <StudentRegistration />}
        {activeTab === 'teachers' && <TeacherManager />}
        {activeTab === 'reports' && <AttendanceReports userType="admin" />}
        {activeTab === 'profile' && <ProfileEdit userType="admin" />}
      </div>
    </div>
  )
}
