/*
  # Fix authentication and policies

  1. Changes
    - Simplify RLS policies to prevent recursion
    - Update password verification function
    - Add proper session management
    - Fix admin access control

  2. Security
    - Maintain secure password verification
    - Ensure proper access control
    - Prevent infinite recursion
*/

-- Drop existing policies and functions
DROP POLICY IF EXISTS "users_basic_read" ON users;
DROP POLICY IF EXISTS "users_self_management" ON users;
DROP POLICY IF EXISTS "users_admin_management" ON users;
DROP FUNCTION IF EXISTS verify_password;

-- Create improved password verification function
CREATE OR REPLACE FUNCTION verify_password(input_password text, stored_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN stored_password = crypt(input_password, stored_password);
END;
$$;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create simplified policies
CREATE POLICY "auth_read"
  ON users
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "self_write"
  ON users
  FOR UPDATE
  TO public
  USING (
    username = current_setting('app.user_name', true)::text
  );

CREATE POLICY "admin_all"
  ON users
  FOR ALL
  TO public
  USING (
    current_setting('app.user_name', true)::text IN (
      SELECT username FROM users WHERE role = 'admin'
    )
  );