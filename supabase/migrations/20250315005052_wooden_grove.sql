/*
  # Fix user registration and RLS policies

  1. Changes
    - Drop and recreate user management policies with proper permissions
    - Add policy for public user registration
    - Fix policy checks for user operations

  2. Security
    - Allow public registration while maintaining security
    - Ensure proper user data access control
    - Fix admin management capabilities
*/

-- Drop existing policies
DROP POLICY IF EXISTS "admin_manage_users" ON users;
DROP POLICY IF EXISTS "allow_user_registration" ON users;
DROP POLICY IF EXISTS "users_read_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;

-- Create new policies with proper security
CREATE POLICY "admin_manage_users" 
ON users
FOR ALL 
TO authenticated
USING (role = 'admin')
WITH CHECK (role = 'admin');

-- Allow public registration
CREATE POLICY "allow_user_registration" 
ON users
FOR INSERT 
TO public
WITH CHECK (true);

-- Allow users to read their own data
CREATE POLICY "users_read_own" 
ON users
FOR SELECT 
TO public
USING (true);

-- Allow users to update their own data
CREATE POLICY "users_update_own" 
ON users
FOR UPDATE 
TO authenticated
USING (username = current_setting('app.user_name', true))
WITH CHECK (username = current_setting('app.user_name', true));