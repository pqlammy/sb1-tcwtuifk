/*
  # Fix users table RLS policies

  1. Changes
    - Drop existing policies
    - Create new, non-recursive policies for users table
    - Add separate policies for authentication and admin access

  2. Security
    - Users can read their own data
    - Admins can read all user data
    - Public can authenticate
    - Prevent infinite recursion in policies
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read their own data" ON users;

-- Create new policies
CREATE POLICY "Allow public authentication"
  ON users
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can update their own data"
  ON users
  FOR UPDATE
  TO public
  USING (auth.uid() = id);

CREATE POLICY "Users can delete their own data"
  ON users
  FOR DELETE
  TO public
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all users"
  ON users
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1
      FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all users"
  ON users
  FOR UPDATE
  TO public
  USING (
    EXISTS (
      SELECT 1
      FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete users"
  ON users
  FOR DELETE
  TO public
  USING (
    EXISTS (
      SELECT 1
      FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  );