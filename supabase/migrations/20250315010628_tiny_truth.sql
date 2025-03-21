/*
  # Fix RLS policies for contributions table

  1. Security Changes
    - Enable RLS on contributions table
    - Drop existing policies to avoid conflicts
    - Create new policies with proper permissions:
      - Allow authenticated users to insert contributions with their user_id
      - Allow users to read their own contributions
      - Allow admins to manage all contributions
*/

-- Enable RLS on contributions table
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert their own contributions" ON contributions;
DROP POLICY IF EXISTS "Users can read their own contributions" ON contributions;
DROP POLICY IF EXISTS "Admins can manage all contributions" ON contributions;

-- Create new policies with proper auth checks
CREATE POLICY "Users can insert their own contributions"
ON contributions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL AND
  user_id = auth.uid()
);

CREATE POLICY "Users can read their own contributions"
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

CREATE POLICY "Admins can manage all contributions"
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