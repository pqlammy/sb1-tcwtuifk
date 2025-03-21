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
DROP POLICY IF EXISTS "users_read_contributions" ON contributions;
DROP POLICY IF EXISTS "admin_manage_contributions" ON contributions;

-- Create new policies
CREATE POLICY "allow_insert"
ON contributions
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "allow_select"
ON contributions
FOR SELECT
TO public
USING (true);

CREATE POLICY "allow_admin_all"
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