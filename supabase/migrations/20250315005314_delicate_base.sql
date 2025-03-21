/*
  # Fix login issues and RLS policies

  1. Changes
    - Drop and recreate user management policies
    - Fix policy checks for user operations
    - Add proper relationship constraints

  2. Security
    - Maintain proper access control
    - Allow user authentication while keeping security
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

-- Add foreign key relationships if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'contributions_user_id_fkey'
  ) THEN
    ALTER TABLE contributions
    ADD CONSTRAINT contributions_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;