/*
  # Fix RLS policies for contributions table

  1. Changes
    - Drop existing policies
    - Create new policies that:
      - Allow users to insert contributions
      - Allow users to view their own contributions
      - Allow admins to manage all contributions
    - Fix policy checks to use proper auth.uid() comparison

  2. Security
    - Maintain proper access control
    - Allow contribution creation and viewing
    - Enable admin management
*/

-- Enable RLS on contributions table
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "contributions_insert_policy_v2" ON contributions;
DROP POLICY IF EXISTS "contributions_select_policy_v2" ON contributions;
DROP POLICY IF EXISTS "contributions_admin_policy_v2" ON contributions;

-- Create new policies
CREATE POLICY "contributions_insert_policy_v3"
ON contributions
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "contributions_select_policy_v3"
ON contributions
FOR SELECT
TO public
USING (
  user_id = auth.uid()::uuid OR
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()::uuid
    AND role = 'admin'
  )
);

CREATE POLICY "contributions_admin_policy_v3"
ON contributions
FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()::uuid
    AND role = 'admin'
  )
);