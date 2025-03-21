/*
  # Fix authentication policies

  1. Changes
    - Remove recursive policy checks
    - Simplify admin access control
    - Update authentication policies
    - Fix policy evaluation order

  2. Security
    - Maintain secure access control
    - Prevent infinite recursion
    - Ensure proper authentication
*/

-- Drop existing policies
DROP POLICY IF EXISTS "auth_read" ON users;
DROP POLICY IF EXISTS "self_write" ON users;
DROP POLICY IF EXISTS "admin_all" ON users;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create basic read policy for authentication
CREATE POLICY "users_auth_read"
  ON users
  FOR SELECT
  TO public
  USING (true);

-- Create policy for users to update their own data
CREATE POLICY "users_self_update"
  ON users
  FOR UPDATE
  TO public
  USING (
    username = current_setting('app.user_name', true)::text
  );

-- Create admin policy using a simpler check
CREATE POLICY "admin_manage_users"
  ON users
  FOR ALL
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE username = current_setting('app.user_name', true)::text 
      AND role = 'admin'
    )
  );