import { supabase } from '../lib/supabase'

export interface WelcomeEmailData {
  email: string
  name: string
  userType: 'student' | 'teacher'
  rollNumber?: string
  department?: string
}

/**
 * Send welcome email to newly registered user
 * Auto-triggered on registration or manually via resend button
 */
export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
  try {
    const { data: result, error } = await supabase.functions.invoke('send-welcome-email', {
      body: data
    })

    if (error) {
      console.error('Error sending welcome email:', error)
      // Fallback: Log details in console for manual sending
      console.log(`📧 Welcome Email Details:
        Name: ${data.name}
        Email: ${data.email}
        Type: ${data.userType}
        ${data.rollNumber ? `Roll Number: ${data.rollNumber}` : ''}
        ${data.department ? `Department: ${data.department}` : ''}
      `)
      return false
    }

    console.log('✅ Welcome email sent successfully to:', data.email)
    return result?.success || false
  } catch (error) {
    console.error('Failed to send welcome email:', error)
    // Fallback: Log details
    console.log(`📧 Welcome Email Details:
      Name: ${data.name}
      Email: ${data.email}
      Type: ${data.userType}
    `)
    return false
  }
}

/**
 * Send welcome email with loading UI feedback
 * Returns { success: boolean, message: string }
 */
export async function sendWelcomeEmailWithFeedback(
  data: WelcomeEmailData
): Promise<{ success: boolean; message: string }> {
  try {
    const success = await sendWelcomeEmail(data)
    
    if (success) {
      return {
        success: true,
        message: `Welcome email sent to ${data.email}`
      }
    } else {
      return {
        success: false,
        message: 'Email service not configured. User can login with OTP at: ' + data.email
      }
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to send email'
    }
  }
}
