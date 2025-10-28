-- Fix RLS policies for otp_tokens table to allow anonymous access
-- This is needed for OTP login to work

-- Enable RLS
ALTER TABLE otp_tokens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can insert OTP tokens" ON otp_tokens;
DROP POLICY IF EXISTS "Anyone can read their own OTP tokens" ON otp_tokens;
DROP POLICY IF EXISTS "Anyone can delete expired OTP tokens" ON otp_tokens;

-- Allow anyone to insert OTP tokens
CREATE POLICY "Anyone can insert OTP tokens" ON otp_tokens
FOR INSERT
WITH CHECK (true);

-- Allow anyone to read OTP tokens (needed for verification)
CREATE POLICY "Anyone can read OTP tokens" ON otp_tokens
FOR SELECT
USING (true);

-- Allow anyone to delete expired OTP tokens
CREATE POLICY "Anyone can delete expired OTP tokens" ON otp_tokens
FOR DELETE
USING (expires_at < NOW());
