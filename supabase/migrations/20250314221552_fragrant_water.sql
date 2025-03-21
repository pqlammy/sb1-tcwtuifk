/*
  # Fix user policies and authentication

  1. Changes
    - Drop existing policies that cause recursion
    - Create new simplified policies for authentication
    - Add enable RLS statement
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow public authentication" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Users can delete their own data" ON users;
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create new simplified policies
CREATE POLICY "Public can authenticate"
  ON users
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can manage own data"
  ON users
  FOR ALL
  TO public
  USING (
    id = COALESCE(
      (SELECT id FROM users WHERE username = current_setting('app.user_name', true)::text),
      '00000000-0000-0000-0000-000000000000'
    )
  );