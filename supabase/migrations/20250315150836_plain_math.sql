/*
  # Fix contributions RLS policies and auth handling

  1. Changes
    - Drop existing policies
    - Create simplified policies that properly handle auth
    - Allow authenticated users to insert contributions
    - Fix admin access policies

  2. Security
    - Maintain proper access control
    - Ensure authenticated users can only access their data
    - Allow admins full access
*/

-- Enable RLS on contributions table
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "allow_authenticated_insert" ON contributions;
DROP POLICY IF EXISTS "allow_read_own_contributions" ON contributions;
DROP POLICY IF EXISTS "allow_admin_all" ON contributions;

-- Create new simplified policies
CREATE POLICY "contributions_insert_policy"
ON contributions
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "contributions_select_policy"
ON contributions
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

CREATE POLICY "contributions_admin_policy"
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