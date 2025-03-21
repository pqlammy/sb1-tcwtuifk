/*
  # Fix RLS policies for contributions table

  1. Changes
    - Drop existing policies
    - Create new policies that use app.user_name for authentication
    - Allow users to insert contributions
    - Allow proper contribution management
    
  2. Security
    - Maintain proper access control
    - Use correct user identification method
    - Allow contribution management
*/

-- Drop existing policies
DROP POLICY IF EXISTS "contributions_select_policy_v11" ON contributions;
DROP POLICY IF EXISTS "contributions_insert_policy_v11" ON contributions;
DROP POLICY IF EXISTS "contributions_update_policy_v11" ON contributions;
DROP POLICY IF EXISTS "contributions_delete_policy_v11" ON contributions;

-- Enable RLS
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

-- Create new policies using app.user_name for authentication
CREATE POLICY "contributions_select_policy_v12"
ON contributions
FOR SELECT
TO public
USING (true);

CREATE POLICY "contributions_insert_policy_v12"
ON contributions
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "contributions_update_policy_v12"
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

CREATE POLICY "contributions_delete_policy_v12"
ON contributions
FOR DELETE
TO public
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE username = current_setting('app.user_name', true)
    AND role = 'admin'
  )
);