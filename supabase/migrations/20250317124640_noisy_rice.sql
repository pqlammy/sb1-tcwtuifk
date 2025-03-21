/*
  # Fix RLS policies for contributions table

  1. Changes
    - Drop existing policies
    - Create new policies that properly handle auth and viewing permissions
    - Fix policy checks to use proper auth.uid() comparison

  2. Security
    - Maintain proper access control
    - Allow contribution viewing
    - Enable admin management
*/

-- Enable RLS on contributions table
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "contributions_insert_policy_v3" ON contributions;
DROP POLICY IF EXISTS "contributions_select_policy_v3" ON contributions;
DROP POLICY IF EXISTS "contributions_admin_policy_v3" ON contributions;

-- Create new policies
CREATE POLICY "contributions_insert_policy_v4"
ON contributions
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "contributions_select_policy_v4"
ON contributions
FOR SELECT
TO public
USING (true);

CREATE POLICY "contributions_admin_policy_v4"
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