/*
  # Fix contributions authentication and policies

  1. Changes
    - Drop existing policies
    - Create new policies that properly handle auth
    - Fix policy checks for contributions

  2. Security
    - Maintain proper access control
    - Allow users to manage their own contributions
    - Allow admins full access
*/

-- Enable RLS on contributions table
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "contributions_select_policy_v8" ON contributions;
DROP POLICY IF EXISTS "contributions_insert_policy_v8" ON contributions;
DROP POLICY IF EXISTS "contributions_update_policy_v8" ON contributions;
DROP POLICY IF EXISTS "contributions_delete_policy_v8" ON contributions;

-- Create new policies
CREATE POLICY "contributions_select_policy_v9"
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

CREATE POLICY "contributions_insert_policy_v9"
ON contributions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL AND
  user_id = auth.uid()
);

CREATE POLICY "contributions_update_policy_v9"
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

CREATE POLICY "contributions_delete_policy_v9"
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