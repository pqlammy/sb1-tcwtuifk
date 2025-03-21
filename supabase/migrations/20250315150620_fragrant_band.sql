/*
  # Fix RLS policies for contributions table

  1. Changes
    - Drop existing policies
    - Create new simplified policies that allow:
      - Authenticated users to insert contributions
      - Users to read their own contributions
      - Admins to manage all contributions

  2. Security
    - Maintain proper access control
    - Allow authenticated users to create contributions
    - Ensure data privacy
*/

-- Enable RLS on contributions table
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert their own contributions" ON contributions;
DROP POLICY IF EXISTS "Users can read their own contributions" ON contributions;
DROP POLICY IF EXISTS "Admins can manage all contributions" ON contributions;

-- Create new policies
CREATE POLICY "allow_authenticated_insert"
ON contributions
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "allow_read_own_contributions"
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

CREATE POLICY "allow_admin_all"
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