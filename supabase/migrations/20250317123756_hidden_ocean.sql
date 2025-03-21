/*
  # Fix contribution visibility in dashboards

  1. Changes
    - Update RLS policies to ensure proper read access
    - Fix policy checks for both users and admins
    - Maintain insert capabilities while improving read access

  2. Security
    - Keep proper access control
    - Allow users to see their own contributions
    - Allow admins to see all contributions
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
WITH CHECK (true);

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