// Supabase Edge Function for sending welcome emails
// Deploy: supabase functions deploy send-welcome-email

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
    const { email, name, userType, rollNumber, department } = await req.json()

    if (!email || !name || !userType) {
      return new Response(
        JSON.stringify({ error: 'Email, name, and userType are required' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      )
    }

    const userTypeLabel = userType === 'student' ? 'Student' : 'Teacher'
    const loginUrl = 'https://your-app-url.vercel.app/login' // Update this

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
        subject: `Welcome to Attendance System - ${userTypeLabel} Registration Complete`,
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
                .welcome-box { 
                  background: linear-gradient(135deg, #667eea10 0%, #764ba210 100%);
                  border-left: 4px solid #667eea;
                  padding: 20px;
                  margin: 20px 0;
                  border-radius: 8px;
                }
                .info-section {
                  background: #f8f9fa;
                  padding: 20px;
                  border-radius: 8px;
                  margin: 20px 0;
                }
                .info-section h3 {
                  margin: 0 0 10px 0;
                  font-size: 18px;
                  color: #667eea;
                }
                .info-row {
                  display: flex;
                  margin: 10px 0;
                }
                .info-label {
                  font-weight: 600;
                  min-width: 120px;
                  color: #666;
                }
                .info-value {
                  color: #333;
                  font-weight: 500;
                }
                .login-button {
                  display: inline-block;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white;
                  padding: 14px 32px;
                  text-decoration: none;
                  border-radius: 8px;
                  font-weight: 600;
                  margin: 20px 0;
                  text-align: center;
                }
                .steps {
                  list-style: none;
                  padding: 0;
                  counter-reset: step-counter;
                }
                .steps li {
                  position: relative;
                  padding-left: 40px;
                  margin: 15px 0;
                  counter-increment: step-counter;
                }
                .steps li:before {
                  content: counter(step-counter);
                  position: absolute;
                  left: 0;
                  top: 0;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white;
                  width: 28px;
                  height: 28px;
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-weight: 700;
                  font-size: 14px;
                }
                .highlight {
                  background: #fff3cd;
                  padding: 2px 6px;
                  border-radius: 4px;
                  font-weight: 600;
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
                  <h1>🎓 Welcome to Attendance System</h1>
                </div>
                <div class="content">
                  <h2>Hello ${name}!</h2>
                  
                  <div class="welcome-box">
                    <p style="margin: 0; font-size: 16px;">
                      🎉 Your ${userTypeLabel.toLowerCase()} account has been successfully created!<br>
                      You can now use face recognition to mark attendance.
                    </p>
                  </div>

                  <div class="info-section">
                    <h3>📋 Your Registration Details</h3>
                    <div class="info-row">
                      <div class="info-label">Name:</div>
                      <div class="info-value">${name}</div>
                    </div>
                    <div class="info-row">
                      <div class="info-label">Email:</div>
                      <div class="info-value">${email}</div>
                    </div>
                    <div class="info-row">
                      <div class="info-label">User Type:</div>
                      <div class="info-value">${userTypeLabel}</div>
                    </div>
                    ${rollNumber ? `
                    <div class="info-row">
                      <div class="info-label">Roll Number:</div>
                      <div class="info-value">${rollNumber}</div>
                    </div>
                    ` : ''}
                    ${department ? `
                    <div class="info-row">
                      <div class="info-label">Department:</div>
                      <div class="info-value">${department}</div>
                    </div>
                    ` : ''}
                  </div>

                  <div class="info-section">
                    <h3>🔐 How to Login</h3>
                    <ol class="steps">
                      <li>Go to the attendance system login page</li>
                      <li>Select <strong>${userTypeLabel}</strong> as user type</li>
                      <li>Enter your email: <span class="highlight">${email}</span></li>
                      <li>You'll receive a <strong>6-digit OTP</strong> via email</li>
                      <li>Enter the OTP to login</li>
                    </ol>
                  </div>

                  <div style="text-align: center;">
                    <a href="${loginUrl}" class="login-button">
                      Login Now →
                    </a>
                  </div>

                  <div class="info-section">
                    <h3>💡 Important Notes</h3>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                      <li><strong>Use this exact email</strong> (${email}) for login</li>
                      <li>Your <strong>face has been registered</strong> for attendance verification</li>
                      <li>OTP is valid for <strong>10 minutes</strong></li>
                      <li>Contact admin if you have any issues</li>
                    </ul>
                  </div>

                  <p style="color: #666; font-size: 14px; margin-top: 30px;">
                    Need help? Contact your system administrator.
                  </p>
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
      return new Response(
        JSON.stringify({ success: true, message: 'Welcome email sent successfully' }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      )
    } else {
      throw new Error(data.message || 'Failed to send email')
    }
  } catch (error: any) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      }
    )
  }
})
