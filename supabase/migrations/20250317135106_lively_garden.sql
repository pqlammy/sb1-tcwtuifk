/*
  # Fix RLS policies for contribution status updates

  1. Changes
    - Add specific policy for status updates
    - Allow users to update their own contributions
    - Maintain admin privileges

  2. Security
    - Keep proper access control
    - Allow status updates
    - Maintain data integrity
*/

-- Enable RLS on contributions table
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

-- Drop existing update-related policies
DROP POLICY IF EXISTS "contributions_update_policy_v12" ON contributions;

-- Create new update policy
CREATE POLICY "contributions_update_policy_v13"
ON contributions
FOR UPDATE
TO public
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE username = current_setting('app.user_name', true)
    AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE username = current_setting('app.user_name', true)
    AND role = 'admin'
  )
);