/*
  # Fix user roles and permissions

  1. Changes
    - Update admin user role
    - Add proper RLS policies for contributions
    - Fix user role handling

  2. Security
    - Ensure proper role assignment
    - Maintain data access control
*/

-- Update admin user role and metadata
UPDATE auth.users
SET 
  role = 'service_role',
  raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{role}',
    '"service_role"'
  )
WHERE email = 'admin@test.ch';

-- Drop existing policies
DROP POLICY IF EXISTS "enable_read_for_users" ON contributions;
DROP POLICY IF EXISTS "enable_insert_for_users" ON contributions;
DROP POLICY IF EXISTS "enable_update_for_admins" ON contributions;
DROP POLICY IF EXISTS "enable_delete_for_admins" ON contributions;

-- Create new policies
CREATE POLICY "enable_read_for_users"
ON contributions
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR
  auth.uid() = gennervogt_id OR
  auth.role() = 'service_role'
);

CREATE POLICY "enable_insert_for_users"
ON contributions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id OR
  auth.role() = 'service_role'
);

CREATE POLICY "enable_update_for_admins"
ON contributions
FOR UPDATE
TO authenticated
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "enable_delete_for_admins"
ON contributions
FOR DELETE
TO authenticated
USING (auth.role() = 'service_role');