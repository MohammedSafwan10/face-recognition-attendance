-- Create OTP tokens table for email-based OTP verification
CREATE TABLE IF NOT EXISTS otp_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  otp VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  INDEX idx_otp_email (email),
  INDEX idx_otp_expires (expires_at)
);

-- Auto-delete expired OTPs (runs every hour)
CREATE OR REPLACE FUNCTION delete_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM otp_tokens WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Optional: Create a cron job to clean up expired OTPs
-- Requires pg_cron extension (available on Supabase)
COMMENT ON TABLE otp_tokens IS 'Stores temporary OTP tokens for email-based login verification';
