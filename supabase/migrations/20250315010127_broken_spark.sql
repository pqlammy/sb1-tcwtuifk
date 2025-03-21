/*
  # Fix RLS policies for contributions table

  1. Security Changes
    - Drop and recreate RLS policies for contributions table with proper auth checks
    - Ensure users can insert their own contributions
    - Ensure users can read their own contributions
    - Ensure admins can manage all contributions
*/

-- Enable RLS on contributions table if not already enabled
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
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND username = current_setting('app.user_name', true)
  )
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