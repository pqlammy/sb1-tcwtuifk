/*
  # Fix RLS policies for contributions table

  1. Changes
    - Drop existing policies
    - Create new simplified policies that properly handle auth
    - Fix policy checks to use proper auth.uid() comparison

  2. Security
    - Maintain proper access control
    - Allow authenticated users to insert contributions
    - Fix admin access policies
*/

-- Enable RLS on contributions table
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "contributions_insert_policy" ON contributions;
DROP POLICY IF EXISTS "contributions_select_policy" ON contributions;
DROP POLICY IF EXISTS "contributions_admin_policy" ON contributions;

-- Create new simplified policies
CREATE POLICY "users_insert_contributions"
ON contributions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "users_read_contributions"
ON contributions
FOR SELECT
TO authenticated
USING (
  auth.uid()::uuid = user_id OR
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

CREATE POLICY "admin_manage_contributions"
ON contributions
FOR ALL
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