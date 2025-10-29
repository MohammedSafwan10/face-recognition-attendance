import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

interface Report {
  student_name: string
  student_usn: string
  subject_name: string
  class_name: string
  status: string
  marked_at: string
  method: string
}

interface Props {
  userType: 'admin' | 'teacher' | 'student'
  userEmail?: string
}

export default function AttendanceReports({ userType, userEmail }: Props) {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [studentFilter, setStudentFilter] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [courseFilter, setCourseFilter] = useState('')

  useEffect(() => {
    fetchReports()
  }, [dateFilter, statusFilter, studentFilter, classFilter, subjectFilter, courseFilter])

  const fetchReports = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('attendance_records')
        .select(`
          id,
          status,
          marked_at,
          method,
          students!inner(name, usn, email),
          attendance_sessions!inner(
            subjects(name),
            classes(name)
          )
        `)
        .order('marked_at', { ascending: false })
        .limit(100)

      // Filter by date if provided
      if (dateFilter) {
        const startOfDay = new Date(dateFilter)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(dateFilter)
        endOfDay.setHours(23, 59, 59, 999)
        
        query = query
          .gte('marked_at', startOfDay.toISOString())
          .lte('marked_at', endOfDay.toISOString())
      }

      // Filter by status
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      // Filter by user type
      if (userType === 'student' && userEmail) {
        query = query.eq('students.email', userEmail)
      }

      const { data, error } = await query

      if (error) throw error

      let formatted = data?.map((r: any) => ({
        student_name: r.students?.name || 'Unknown',
        student_usn: r.students?.usn || '-',
        subject_name: r.attendance_sessions?.subjects?.name || 'Unknown Subject',
        class_name: r.attendance_sessions?.classes?.name || 'Unknown Class',
        status: r.status,
        marked_at: r.marked_at,
        method: r.method
      })) || []

      // Apply additional filters (client-side)
      if (studentFilter) {
        formatted = formatted.filter(r => 
          r.student_name.toLowerCase().includes(studentFilter.toLowerCase()) ||
          r.student_usn.toLowerCase().includes(studentFilter.toLowerCase())
        )
      }

      if (classFilter) {
        formatted = formatted.filter(r => 
          r.class_name.toLowerCase().includes(classFilter.toLowerCase())
        )
      }

      if (subjectFilter) {
        formatted = formatted.filter(r => 
          r.subject_name.toLowerCase().includes(subjectFilter.toLowerCase())
        )
      }

      // Note: Course filter would need additional data from database
      // For now, it's not included in the query structure

      setReports(formatted)
    } catch (err) {
      console.error('Error fetching reports:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
  }

  const getStatusBadge = (status: string) => {
    if (status === 'present') {
      return <span className="badge badge--success">✓ Present</span>
    }

    if (status === 'absent') {
      return <span className="badge badge--danger">✗ Absent</span>
    }

    return <span className="badge badge--neutral">{status}</span>
  }

  const getMethodBadge = (method: string) => {
    if (method?.includes('qr')) {
      return <span className="badge badge--neutral">📱 QR</span>
    }
    if (method?.includes('gps')) {
      return <span className="badge badge--neutral">📍 GPS</span>
    }
    return <span className="theme-muted text-xs">-</span>
  }

  const exportToCSV = () => {
    const headers = ['Student Name', 'USN', 'Subject', 'Class', 'Status', 'Date & Time', 'Method']
    const rows = reports.map(r => [
      r.student_name,
      r.student_usn,
      r.subject_name,
      r.class_name,
      r.status,
      formatDate(r.marked_at),
      r.method || '-'
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attendance-report-${new Date().toISOString()}.csv`
    a.click()
  }

  return (
    <div className="space-y-6">
      <div className="surface-toolbar">
        <div>
          <h2 className="theme-heading text-2xl font-bold">Attendance Reports</h2>
          <p className="theme-muted text-sm">Track attendance trends, filter insights, and export CSV summaries.</p>
        </div>
        <button
          onClick={exportToCSV}
          disabled={reports.length === 0}
          className="btn-success whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
        >
          📥 Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="surface-panel surface-panel--muted">
        <h3 className="theme-heading text-lg font-semibold mb-4">📋 Filter Reports</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="label">Date</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="input-field"
              placeholder="Select date"
            />
          </div>
          <div>
            <label className="label">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">All Status</option>
              <option value="present">Present Only</option>
              <option value="absent">Absent Only</option>
            </select>
          </div>
          <div>
            <label className="label">Student (Name or USN)</label>
            <input
              type="text"
              value={studentFilter}
              onChange={(e) => setStudentFilter(e.target.value)}
              className="input-field"
              placeholder="Search by name or USN..."
            />
          </div>
          <div>
            <label className="label">Class</label>
            <input
              type="text"
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="input-field"
              placeholder="Filter by class..."
            />
          </div>
          <div>
            <label className="label">Subject</label>
            <input
              type="text"
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="input-field"
              placeholder="Filter by subject..."
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setDateFilter('')
                setStatusFilter('all')
                setStudentFilter('')
                setClassFilter('')
                setSubjectFilter('')
                setCourseFilter('')
              }}
              className="btn-secondary w-full"
            >
              🔄 Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="metric-card">
          <div className="text-3xl mb-3">📊</div>
          <div className="metric-card__value">{reports.length}</div>
          <div className="metric-card__label">Total Records</div>
        </div>
        <div className="metric-card">
          <div className="text-3xl mb-3">✅</div>
          <div className="metric-card__value text-green-600">
            {reports.filter(r => r.status === 'present').length}
          </div>
          <div className="metric-card__label">Present</div>
        </div>
        <div className="metric-card">
          <div className="text-3xl mb-3">❌</div>
          <div className="metric-card__value text-rose-500">
            {reports.filter(r => r.status === 'absent').length}
          </div>
          <div className="metric-card__label">Absent</div>
        </div>
      </div>

      {/* Table */}
      <div className="table-surface">
        {loading ? (
          <div className="flex justify-center items-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center p-12">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Records Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              No attendance records match your filters
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr>
                  {userType !== 'student' && (
                    <>
                      <th className="px-6 py-3 text-xs font-semibold uppercase theme-muted">
                        Student
                      </th>
                      <th className="px-6 py-3 text-xs font-semibold uppercase theme-muted">
                        USN
                      </th>
                    </>
                  )}
                  <th className="px-6 py-3 text-xs font-semibold uppercase theme-muted">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase theme-muted">
                    Class
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase theme-muted">
                    Status
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase theme-muted">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase theme-muted">
                    Method
                  </th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report, idx) => (
                  <tr key={idx} className="table-row">
                    {userType !== 'student' && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium theme-heading">
                          {report.student_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm theme-muted">
                          {report.student_usn}
                        </td>
                      </>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm theme-muted">
                      {report.subject_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm theme-muted">
                      {report.class_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {getStatusBadge(report.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm theme-muted">
                      {formatDate(report.marked_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {getMethodBadge(report.method)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
