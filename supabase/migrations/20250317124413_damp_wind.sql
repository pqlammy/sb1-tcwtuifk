/*
  # Fix RLS policies for contributions table

  1. Changes
    - Drop and recreate RLS policies with unique names
    - Allow authenticated users to insert and view contributions
    - Maintain admin access for all operations

  2. Security
    - Maintain proper access control
    - Allow contribution creation and viewing
    - Enable admin management
*/

-- Enable RLS on contributions table
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "allow_contribution_insert" ON contributions;
DROP POLICY IF EXISTS "allow_contribution_select" ON contributions;
DROP POLICY IF EXISTS "allow_admin_manage" ON contributions;

-- Create new simplified policies with unique names
CREATE POLICY "contributions_insert_policy_v2"
ON contributions
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "contributions_select_policy_v2"
ON contributions
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "contributions_admin_policy_v2"
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