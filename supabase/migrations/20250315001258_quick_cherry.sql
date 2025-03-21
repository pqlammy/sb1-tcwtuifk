/*
  # Fix user registration policies

  1. Changes
    - Add policy to allow user registration
    - Update existing policies for better security

  2. Security
    - Allow public registration while maintaining security
    - Keep admin management capabilities
    - Protect user data with proper RLS policies
*/

-- Drop existing policies to recreate them with better security
DROP POLICY IF EXISTS "admin_manage_users" ON users;
DROP POLICY IF EXISTS "allow_user_creation" ON users;
DROP POLICY IF EXISTS "users_read_own" ON users;
DROP POLICY IF EXISTS "users_self_update" ON users;

-- Create new policies with better security
CREATE POLICY "admin_manage_users" 
ON users
FOR ALL 
TO authenticated
USING (role = 'admin')
WITH CHECK (role = 'admin');

CREATE POLICY "allow_user_registration" 
ON users
FOR INSERT 
TO public
WITH CHECK (
  role = 'user' AND 
  login_attempts = 0 AND 
  created_at = now()
);

CREATE POLICY "users_read_own" 
ON users
FOR SELECT 
TO public
USING (
  username = current_setting('app.user_name', true) OR 
  (auth.role() = 'authenticated' AND role = 'admin')
);

CREATE POLICY "users_update_own" 
ON users
FOR UPDATE 
TO authenticated
USING (username = current_setting('app.user_name', true))
WITH CHECK (username = current_setting('app.user_name', true));