import { supabase } from '../lib/supabase'

// Generate 6-digit OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Send OTP via Supabase Edge Function
export async function sendOTP(email: string, otp: string, name?: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('send-otp', {
      body: { email, otp, name }
    })

    if (error) {
      console.error('Error sending OTP:', error)
      // Fallback: Show OTP in console for development
      console.log(`📧 OTP for ${email}: ${otp}`)
      return false
    }

    return data?.success || false
  } catch (error) {
    console.error('Failed to send OTP:', error)
    // Fallback: Show OTP in console for development
    console.log(`📧 OTP for ${email}: ${otp}`)
    return false
  }
}

// Store OTP in database with expiry (10 minutes)
export async function storeOTP(email: string, otp: string): Promise<boolean> {
  try {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    const { error } = await supabase
      .from('otp_tokens')
      .upsert({
        email,
        otp,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
      }, {
        onConflict: 'email'
      })

    return !error
  } catch (error) {
    console.error('Error storing OTP:', error)
    return false
  }
}

// Verify OTP from database
export async function verifyOTP(email: string, otp: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('otp_tokens')
      .select('*')
      .eq('email', email)
      .eq('otp', otp)
      .single()

    if (error || !data) {
      return false
    }

    // Check if expired
    const expiresAt = new Date(data.expires_at)
    if (expiresAt < new Date()) {
      return false
    }

    // Delete used OTP
    await supabase
      .from('otp_tokens')
      .delete()
      .eq('email', email)

    return true
  } catch (error) {
    console.error('Error verifying OTP:', error)
    return false
  }
}
