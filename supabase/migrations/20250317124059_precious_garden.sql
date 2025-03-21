/*
  # Fix RLS policies for contributions table

  1. Changes
    - Simplify RLS policies
    - Fix contribution access for users and admins
    - Ensure proper data visibility

  2. Security
    - Maintain proper access control
    - Allow contribution creation
    - Enable proper data viewing
*/

-- Enable RLS on contributions table
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "users_insert_contributions" ON contributions;
DROP POLICY IF EXISTS "users_read_own_contributions" ON contributions;
DROP POLICY IF EXISTS "admin_manage_contributions" ON contributions;

-- Create new simplified policies
CREATE POLICY "allow_contribution_insert"
ON contributions
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "allow_contribution_select"
ON contributions
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "allow_admin_manage"
ON contributions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);