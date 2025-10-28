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
export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: result, error } = await supabase.functions.invoke('send-welcome-email', {
      body: data
    })

    if (error) {
      console.error('❌ Edge Function error:', error)
      // Extract actual error message from Edge Function response
      const errorMsg = typeof error === 'object' && error.message 
        ? error.message 
        : JSON.stringify(error)
      
      // Fallback: Log details in console for manual sending
      console.log(`📧 Welcome Email Details:
        Name: ${data.name}
        Email: ${data.email}
        Type: ${data.userType}
        ${data.rollNumber ? `Roll Number: ${data.rollNumber}` : ''}
        ${data.department ? `Department: ${data.department}` : ''}
        
        Error: ${errorMsg}
      `)
      return { success: false, error: `Edge Function error: ${errorMsg}` }
    }

    if (result?.success) {
      console.log('✅ Welcome email sent successfully to:', data.email)
      return { success: true }
    } else {
      const resultError = result?.error || 'Email sending failed'
      console.error('Email API error:', resultError)
      return { success: false, error: resultError }
    }
  } catch (error: any) {
    console.error('Failed to send welcome email:', error)
    const errorMsg = error.message || 'Network error'
    
    // Fallback: Log details
    console.log(`📧 Welcome Email Details:
      Name: ${data.name}
      Email: ${data.email}
      Type: ${data.userType}
      Error: ${errorMsg}
    `)
    return { success: false, error: errorMsg }
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
    const result = await sendWelcomeEmail(data)
    
    if (result.success) {
      return {
        success: true,
        message: `✅ Welcome email sent to ${data.email}`
      }
    } else {
      // Show the actual error from Edge Function
      const errorDetail = result.error || 'Unknown error'
      return {
        success: false,
        message: `⚠️ Email failed: ${errorDetail}. User can still login with OTP at: ${data.email}`
      }
    }
  } catch (error: any) {
    return {
      success: false,
      message: `❌ Error: ${error.message || 'Failed to send email'}. User can login with OTP at: ${data.email}`
    }
  }
}
