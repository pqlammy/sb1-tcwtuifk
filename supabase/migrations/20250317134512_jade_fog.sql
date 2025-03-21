/*
  # Fix RLS policies for table-based authentication

  1. Changes
    - Drop existing policies
    - Create new policies that use username from app.user_name setting
    - Fix contribution policies to work with table-based auth
    
  2. Security
    - Maintain proper access control
    - Use correct user identification method
    - Allow proper contribution management
*/

-- Drop existing policies
DROP POLICY IF EXISTS "contributions_select_policy_v10" ON contributions;
DROP POLICY IF EXISTS "contributions_insert_policy_v10" ON contributions;
DROP POLICY IF EXISTS "contributions_update_policy_v10" ON contributions;
DROP POLICY IF EXISTS "contributions_delete_policy_v10" ON contributions;

-- Enable RLS
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

-- Create new policies using app.user_name for authentication
CREATE POLICY "contributions_select_policy_v11"
ON contributions
FOR SELECT
TO public
USING (
  user_id IN (
    SELECT id FROM users WHERE username = current_setting('app.user_name', true)
  ) OR
  gennervogt_id IN (
    SELECT id FROM users WHERE username = current_setting('app.user_name', true)
  ) OR
  EXISTS (
    SELECT 1 FROM users
    WHERE username = current_setting('app.user_name', true)
    AND role = 'admin'
  )
);

CREATE POLICY "contributions_insert_policy_v11"
ON contributions
FOR INSERT
TO public
WITH CHECK (
  user_id IN (
    SELECT id FROM users WHERE username = current_setting('app.user_name', true)
  )
);

CREATE POLICY "contributions_update_policy_v11"
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

CREATE POLICY "contributions_delete_policy_v11"
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