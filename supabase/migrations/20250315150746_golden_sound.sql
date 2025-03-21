/*
  # Fix contributions RLS policies for proper auth handling

  1. Changes
    - Drop existing policies
    - Create new policies that properly handle auth.uid()
    - Allow authenticated users to insert with proper user_id check
    - Fix admin access policies

  2. Security
    - Ensure proper user authentication checks
    - Maintain data privacy
    - Allow admins full access
*/

-- Enable RLS on contributions table
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "allow_authenticated_insert" ON contributions;
DROP POLICY IF EXISTS "allow_read_own_contributions" ON contributions;
DROP POLICY IF EXISTS "allow_admin_all" ON contributions;

-- Create new policies with proper auth handling
CREATE POLICY "allow_authenticated_insert"
ON contributions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid()::text = user_id::text
);

CREATE POLICY "allow_read_own_contributions"
ON contributions
FOR SELECT
TO authenticated
USING (
  auth.uid()::text = user_id::text OR 
  EXISTS (
    SELECT 1 FROM users 
    WHERE id::text = auth.uid()::text 
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
    WHERE id::text = auth.uid()::text 
    AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id::text = auth.uid()::text 
    AND role = 'admin'
  )
);