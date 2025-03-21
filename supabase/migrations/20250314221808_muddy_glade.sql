/*
  # Fix authentication system

  1. Changes
    - Drop all existing policies
    - Create simplified non-recursive policies
    - Update password verification function
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "users_public_read" ON users;
DROP POLICY IF EXISTS "users_self_write" ON users;

-- Drop existing function
DROP FUNCTION IF EXISTS verify_password;

-- Create new password verification function
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

-- Create new simplified policies
CREATE POLICY "allow_read"
  ON users
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "allow_update_self"
  ON users
  FOR UPDATE
  TO public
  USING (
    username = current_setting('app.user_name', true)::text
  );

CREATE POLICY "allow_admin_all"
  ON users
  FOR ALL
  TO public
  USING (
    EXISTS (
      SELECT 1 
      FROM users admin 
      WHERE admin.username = current_setting('app.user_name', true)::text 
      AND admin.role = 'admin'
      AND admin.id != users.id  -- Prevent recursion
    )
  );

-- Ensure admin password is set correctly
UPDATE users 
SET password = crypt('admin123', gen_salt('bf', 12))
WHERE username = 'admin';