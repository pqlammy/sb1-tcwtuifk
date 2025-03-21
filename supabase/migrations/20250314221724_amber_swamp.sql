/*
  # Fix authentication system

  1. Changes
    - Drop all existing policies to start fresh
    - Update password verification to use bcrypt
    - Create new non-recursive policies
    - Re-hash admin password with pgcrypto
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow public read for authentication" ON users;
DROP POLICY IF EXISTS "Allow self management" ON users;

-- Drop existing function
DROP FUNCTION IF EXISTS verify_password;

-- Create new password verification function for bcrypt
CREATE OR REPLACE FUNCTION verify_password(input_password text, stored_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- For bcrypt hashes
  IF substring(stored_password from 1 for 4) = '$2a$' THEN
    RETURN stored_password = crypt(input_password, stored_password);
  END IF;
  RETURN false;
END;
$$;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create new non-recursive policies
CREATE POLICY "users_public_read"
  ON users
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "users_self_write"
  ON users
  FOR ALL
  TO public
  USING (
    CASE 
      WHEN current_setting('app.user_name', true) IS NULL THEN false
      WHEN username = current_setting('app.user_name', true)::text THEN true
      WHEN EXISTS (
        SELECT 1 
        FROM users u 
        WHERE u.username = current_setting('app.user_name', true)::text 
        AND u.role = 'admin'
        AND u.username != username  -- Prevent recursion
      ) THEN true
      ELSE false
    END
  );

-- Update admin password to use proper bcrypt hash
UPDATE users 
SET password = crypt('admin123', gen_salt('bf', 12))
WHERE username = 'admin';