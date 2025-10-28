// This file will be auto-generated from Supabase
// For now, we'll use manual types

export interface Database {
  public: {
    Tables: {
      courses: {
        Row: {
          id: string
          name: string
          duration: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          duration?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          duration?: string | null
          created_at?: string
        }
      }
      semesters: {
        Row: {
          id: string
          name: string
          course_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          course_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          course_id?: string
          created_at?: string
        }
      }
      subjects: {
        Row: {
          id: string
          name: string
          semester_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          semester_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          semester_id?: string
          created_at?: string
        }
      }
      classes: {
        Row: {
          id: string
          name: string
          course_id: string
          semester_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          course_id: string
          semester_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          course_id?: string
          semester_id?: string
          created_at?: string
        }
      }
      teachers: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          class_id: string | null
          subject_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone?: string | null
          class_id?: string | null
          subject_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string | null
          class_id?: string | null
          subject_id?: string | null
          created_at?: string
        }
      }
      students: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          usn: string
          class_id: string
          face_descriptor: number[] | null
          face_image_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone?: string | null
          usn: string
          class_id: string
          face_descriptor?: number[] | null
          face_image_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string | null
          usn?: string
          class_id?: string
          face_descriptor?: number[] | null
          face_image_url?: string | null
          created_at?: string
        }
      }
      attendance_sessions: {
        Row: {
          id: string
          teacher_id: string
          subject_id: string
          class_id: string
          start_time: string
          end_time: string
          qr_code: string | null
          gps_lat: number | null
          gps_lng: number | null
          gps_radius: number
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          teacher_id: string
          subject_id: string
          class_id: string
          start_time: string
          end_time: string
          qr_code?: string | null
          gps_lat?: number | null
          gps_lng?: number | null
          gps_radius?: number
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          teacher_id?: string
          subject_id?: string
          class_id?: string
          start_time?: string
          end_time?: string
          qr_code?: string | null
          gps_lat?: number | null
          gps_lng?: number | null
          gps_radius?: number
          status?: string
          created_at?: string
        }
      }
      attendance_records: {
        Row: {
          id: string
          session_id: string
          student_id: string
          status: string
          method: string | null
          marked_at: string
        }
        Insert: {
          id?: string
          session_id: string
          student_id: string
          status?: string
          method?: string | null
          marked_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          student_id?: string
          status?: string
          method?: string | null
          marked_at?: string
        }
      }
      schedules: {
        Row: {
          id: string
          class_id: string
          subject_id: string
          day_of_week: number
          time_start: string
          time_end: string
          created_at: string
        }
        Insert: {
          id?: string
          class_id: string
          subject_id: string
          day_of_week: number
          time_start: string
          time_end: string
          created_at?: string
        }
        Update: {
          id?: string
          class_id?: string
          subject_id?: string
          day_of_week?: number
          time_start?: string
          time_end?: string
          created_at?: string
        }
      }
    }
  }
}
