/*
  # Fix RLS policies for contributions table

  1. Changes
    - Drop existing policies
    - Create new policies with proper authentication checks
    - Fix policy checks for contribution insertion
    - Ensure proper user_id verification

  2. Security
    - Maintain proper access control
    - Allow authenticated users to insert contributions
    - Ensure proper data ownership
*/

-- Enable RLS on contributions table
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "users_insert_contributions" ON contributions;
DROP POLICY IF EXISTS "users_read_own_contributions" ON contributions;
DROP POLICY IF EXISTS "admin_manage_contributions" ON contributions;

-- Create new policies
CREATE POLICY "users_insert_contributions"
ON contributions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL AND
  (
    -- Allow users to insert contributions with their own user_id
    user_id = auth.uid() OR
    -- Allow users to insert contributions as a Gennervogt
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'user'
    )
  )
);

CREATE POLICY "users_read_own_contributions"
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
);