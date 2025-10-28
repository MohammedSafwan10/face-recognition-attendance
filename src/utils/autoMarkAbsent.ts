import { supabase } from '../lib/supabase'

/**
 * Auto-mark absent students for expired sessions
 * This function should be called periodically (e.g., every 5 minutes)
 * or can be triggered manually
 */
export async function autoMarkAbsentForExpiredSessions(): Promise<number> {
  try {
    // Find all active sessions that have passed their end time
    const { data: expiredSessions, error: sessionsError } = await supabase
      .from('attendance_sessions')
      .select('id, class_id, end_time')
      .eq('status', 'active')
      .lt('end_time', new Date().toISOString())

    if (sessionsError) {
      console.error('Error fetching expired sessions:', sessionsError)
      return 0
    }

    if (!expiredSessions || expiredSessions.length === 0) {
      return 0
    }

    let totalMarkedAbsent = 0

    // Process each expired session
    for (const session of expiredSessions) {
      // Get all students in this class
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id')
        .eq('class_id', session.class_id)

      if (studentsError || !students) {
        console.error('Error fetching students for session:', session.id)
        continue
      }

      // Get students who already marked attendance
      const { data: presentRecords, error: recordsError } = await supabase
        .from('attendance_records')
        .select('student_id')
        .eq('session_id', session.id)

      if (recordsError) {
        console.error('Error fetching attendance records for session:', session.id)
        continue
      }

      const presentStudentIds = new Set(
        (presentRecords || []).map((record) => record.student_id)
      )

      // Find students who didn't mark attendance
      const absentStudents = students.filter(
        (student) => !presentStudentIds.has(student.id)
      )

      if (absentStudents.length > 0) {
        // Mark them as absent
        const absentRecords = absentStudents.map((student) => ({
          session_id: session.id,
          student_id: student.id,
          status: 'absent',
          method: null,
          marked_at: new Date().toISOString(),
          auto_marked: true
        }))

        const { error: insertError } = await supabase
          .from('attendance_records')
          .insert(absentRecords)

        if (insertError) {
          console.error('Error inserting absent records:', insertError)
        } else {
          totalMarkedAbsent += absentStudents.length
          console.log(`✓ Marked ${absentStudents.length} students absent for session ${session.id}`)
        }
      }

      // Update session status to 'expired'
      const { error: updateError } = await supabase
        .from('attendance_sessions')
        .update({ status: 'expired' })
        .eq('id', session.id)

      if (updateError) {
        console.error('Error updating session status:', updateError)
      }
    }

    console.log(`✅ Auto-marked ${totalMarkedAbsent} students absent across ${expiredSessions.length} expired sessions`)
    return totalMarkedAbsent
  } catch (error) {
    console.error('Error in autoMarkAbsentForExpiredSessions:', error)
    return 0
  }
}

/**
 * Mark a specific session as expired and mark absent students
 */
export async function markSessionExpired(sessionId: string): Promise<boolean> {
  try {
    // Get session details
    const { data: session, error: sessionError } = await supabase
      .from('attendance_sessions')
      .select('id, class_id')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      console.error('Session not found:', sessionId)
      return false
    }

    // Get all students in this class
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id')
      .eq('class_id', session.class_id)

    if (studentsError || !students) {
      console.error('Error fetching students')
      return false
    }

    // Get students who already marked attendance
    const { data: presentRecords, error: recordsError } = await supabase
      .from('attendance_records')
      .select('student_id')
      .eq('session_id', sessionId)

    if (recordsError) {
      console.error('Error fetching attendance records')
      return false
    }

    const presentStudentIds = new Set(
      (presentRecords || []).map((record) => record.student_id)
    )

    // Find students who didn't mark attendance
    const absentStudents = students.filter(
      (student) => !presentStudentIds.has(student.id)
    )

    if (absentStudents.length > 0) {
      // Mark them as absent
      const absentRecords = absentStudents.map((student) => ({
        session_id: sessionId,
        student_id: student.id,
        status: 'absent',
        method: null,
        marked_at: new Date().toISOString(),
        auto_marked: true
      }))

      const { error: insertError } = await supabase
        .from('attendance_records')
        .insert(absentRecords)

      if (insertError) {
        console.error('Error inserting absent records:', insertError)
        return false
      }
    }

    // Update session status to 'expired'
    const { error: updateError } = await supabase
      .from('attendance_sessions')
      .update({ status: 'expired' })
      .eq('id', sessionId)

    if (updateError) {
      console.error('Error updating session status:', updateError)
      return false
    }

    console.log(`✅ Session ${sessionId} marked as expired. ${absentStudents.length} students marked absent.`)
    return true
  } catch (error) {
    console.error('Error in markSessionExpired:', error)
    return false
  }
}

/**
 * Start background job to auto-mark absent students
 * Call this once when the app starts
 */
export function startAutoMarkAbsentJob(intervalMinutes: number = 5) {
  // Run immediately
  autoMarkAbsentForExpiredSessions()

  // Then run periodically
  const intervalMs = intervalMinutes * 60 * 1000
  const intervalId = setInterval(autoMarkAbsentForExpiredSessions, intervalMs)

  console.log(`🚀 Auto-mark absent job started (runs every ${intervalMinutes} minutes)`)

  // Return cleanup function
  return () => {
    clearInterval(intervalId)
    console.log('⏹️ Auto-mark absent job stopped')
  }
}
