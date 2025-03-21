/*
  # Fix user policies to prevent recursion

  1. Changes
    - Simplify admin policy to use direct role check
    - Update read policy to be more specific
    - Add policy for user creation
  
  2. Security
    - Maintain RLS protection
    - Ensure proper access control
    - Prevent policy recursion
*/

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "users_auth_read" ON users;
DROP POLICY IF EXISTS "users_self_update" ON users;
DROP POLICY IF EXISTS "admin_manage_users" ON users;

-- Create specific read policy for authentication
CREATE POLICY "users_read_own"
  ON users
  FOR SELECT
  TO public
  USING (
    username = current_setting('app.user_name', true)::text
    OR role = 'admin'
  );

-- Allow users to update their own data
CREATE POLICY "users_self_update"
  ON users
  FOR UPDATE
  TO public
  USING (
    username = current_setting('app.user_name', true)::text
  );

-- Admin policy for full access
CREATE POLICY "admin_manage_users"
  ON users
  FOR ALL
  TO public
  USING (
    role = 'admin'
  );

-- Allow insertion of new users
CREATE POLICY "allow_user_creation"
  ON users
  FOR INSERT
  TO public
  WITH CHECK (true);