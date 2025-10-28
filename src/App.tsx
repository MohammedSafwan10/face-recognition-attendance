import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { ThemeProvider } from './contexts/ThemeContext'
import LoginPage from './pages/LoginPage'
import AdminPortal from './pages/AdminPortal'
import TeacherPortal from './pages/TeacherPortal'
import StudentPortal from './pages/StudentPortal'
import { startAutoMarkAbsentJob } from './utils/autoMarkAbsent'

function App() {
  // Start auto-mark absent background job
  useEffect(() => {
    const cleanup = startAutoMarkAbsentJob(5) // Run every 5 minutes
    return cleanup
  }, [])

  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen transition-colors duration-500 text-inherit">
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin/*" element={<AdminPortal />} />
            <Route path="/teacher/*" element={<TeacherPortal />} />
            <Route path="/student/*" element={<StudentPortal />} />
          </Routes>
        </div>
      </Router>
      <Analytics />
    </ThemeProvider>
  )
}

export default App
