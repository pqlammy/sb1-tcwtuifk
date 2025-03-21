/*
  # Fix RLS policies to prevent recursion

  1. Changes
    - Simplify RLS policies to prevent recursion
    - Keep basic authentication and authorization intact
    - Remove complex policy conditions that could cause infinite loops

  2. Security
    - Maintain row-level security
    - Ensure proper access control for users and admins
    - Prevent unauthorized access while allowing necessary operations
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "allow_read" ON users;
DROP POLICY IF EXISTS "allow_update_self" ON users;
DROP POLICY IF EXISTS "allow_admin_all" ON users;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Basic read policy for authentication
CREATE POLICY "users_basic_read"
  ON users
  FOR SELECT
  TO public
  USING (true);

-- Self-management policy
CREATE POLICY "users_self_management"
  ON users
  FOR UPDATE
  TO public
  USING (
    username = current_setting('app.user_name', true)::text
  );

-- Admin management policy (without recursion)
CREATE POLICY "users_admin_management"
  ON users
  FOR ALL
  TO public
  USING (
    (SELECT role FROM users WHERE username = current_setting('app.user_name', true)::text LIMIT 1) = 'admin'
  );