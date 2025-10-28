// Supabase Edge Function for sending OTP emails
// Deploy: supabase functions deploy send-otp
// Set secret: supabase secrets set RESEND_API_KEY=your_key_here

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const { email, otp, name } = await req.json()

    if (!email || !otp) {
      return new Response(
        JSON.stringify({ error: 'Email and OTP are required' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      )
    }

    // Use Resend API (free tier: 100 emails/day)
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Attendance System <onboarding@resend.dev>',
        to: [email],
        subject: `Your Login OTP - ${otp}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <style>
                body { 
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  margin: 0;
                  padding: 0;
                  background-color: #f5f5f5;
                }
                .container { 
                  max-width: 600px;
                  margin: 40px auto;
                  background: white;
                  border-radius: 12px;
                  overflow: hidden;
                  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                }
                .header { 
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white;
                  padding: 40px 30px;
                  text-align: center;
                }
                .header h1 {
                  margin: 0;
                  font-size: 28px;
                  font-weight: 700;
                }
                .content { 
                  padding: 40px 30px;
                }
                .content h2 {
                  margin: 0 0 20px 0;
                  font-size: 24px;
                  color: #333;
                }
                .otp-box { 
                  background: linear-gradient(135deg, #667eea10 0%, #764ba210 100%);
                  border: 2px dashed #667eea;
                  padding: 30px;
                  text-align: center;
                  margin: 30px 0;
                  border-radius: 10px;
                }
                .otp { 
                  font-size: 48px;
                  font-weight: 700;
                  color: #667eea;
                  letter-spacing: 10px;
                  font-family: 'Courier New', monospace;
                }
                .info {
                  background: #f8f9fa;
                  padding: 20px;
                  border-radius: 8px;
                  margin: 20px 0;
                }
                .info p {
                  margin: 5px 0;
                  font-size: 14px;
                  color: #666;
                }
                .footer { 
                  text-align: center;
                  padding: 30px;
                  background: #f8f9fa;
                  color: #666;
                  font-size: 12px;
                  border-top: 1px solid #e9ecef;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🎓 College Attendance System</h1>
                </div>
                <div class="content">
                  <h2>Hello ${name || 'User'}!</h2>
                  <p>Your One-Time Password (OTP) for login is:</p>
                  <div class="otp-box">
                    <div class="otp">${otp}</div>
                  </div>
                  <div class="info">
                    <p><strong>⏱️ Valid for: 10 minutes</strong></p>
                    <p>🔒 Do not share this OTP with anyone</p>
                    <p>📧 If you didn't request this, please ignore this email</p>
                  </div>
                  <p>Thank you for using our attendance system!</p>
                </div>
                <div class="footer">
                  <p>This is an automated email. Please do not reply.</p>
                  <p>&copy; ${new Date().getFullYear()} College Attendance System. All rights reserved.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      }),
    })

    const data = await res.json()

    if (res.ok) {
      console.log('✅ OTP email sent successfully:', data)
      return new Response(
        JSON.stringify({ success: true, message: 'OTP sent successfully' }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      )
    } else {
      console.error('❌ Resend API Error:', data)
      throw new Error(JSON.stringify(data))
    }
  } catch (error: any) {
    console.error('❌ Function Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Check if RESEND_API_KEY is set and from address is valid'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      }
    )
  }
})
