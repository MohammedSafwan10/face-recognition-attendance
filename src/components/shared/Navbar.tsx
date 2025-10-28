import { Link } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'

interface NavbarProps {
  userType?: 'admin' | 'teacher' | 'student'
  userName?: string
  onLogout?: () => void
}

export default function Navbar({ userType, userName, onLogout }: NavbarProps) {
  return (
    <nav className="navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="navbar__brand">
            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div className="navbar__brand-text">
              <span className="navbar__title">FaceAttend</span>
              <span className="navbar__subtitle">Smart Attendance System</span>
            </div>
          </Link>

          {/* User Info & Actions */}
          <div className="flex items-center space-x-4">
            {userName && (
              <div className="hidden sm:block">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {userName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="text-sm">
                    <p className="navbar__user-name">
                      {userName}
                    </p>
                    <p className="navbar__user-role">
                      {userType}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <ThemeToggle />

            {onLogout && (
              <button
                onClick={onLogout}
                className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
