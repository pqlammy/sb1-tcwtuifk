/*
  # Fix RLS policies for contributions table

  1. Changes
    - Drop existing policies
    - Create new policies that properly handle:
      - Insert permissions
      - Select permissions
      - Admin management permissions
    - Fix policy checks to use proper auth.uid() comparison

  2. Security
    - Maintain proper access control
    - Allow proper data management
    - Fix admin access
*/

-- Enable RLS on contributions table
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "contributions_insert_policy_v6" ON contributions;
DROP POLICY IF EXISTS "contributions_select_policy_v6" ON contributions;
DROP POLICY IF EXISTS "contributions_admin_policy_v6" ON contributions;

-- Create new policies with proper auth checks
CREATE POLICY "contributions_insert_policy_v7"
ON contributions
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "contributions_select_policy_v7"
ON contributions
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "contributions_update_policy_v7"
ON contributions
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "contributions_delete_policy_v7"
ON contributions
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);