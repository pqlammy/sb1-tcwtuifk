/*
  # Fix authentication and RLS policies

  1. Changes
    - Drop existing policies
    - Create new policies that properly handle:
      - User authentication
      - Contribution insertion
      - Contribution viewing
      - Admin management
    
  2. Security
    - Maintain proper access control
    - Allow authenticated users to create and view contributions
    - Allow admins to manage all contributions
*/

-- Drop existing policies
DROP POLICY IF EXISTS "contributions_select_policy_v9" ON contributions;
DROP POLICY IF EXISTS "contributions_insert_policy_v9" ON contributions;
DROP POLICY IF EXISTS "contributions_update_policy_v9" ON contributions;
DROP POLICY IF EXISTS "contributions_delete_policy_v9" ON contributions;

-- Enable RLS
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "contributions_select_policy_v10"
ON contributions
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  gennervogt_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

CREATE POLICY "contributions_insert_policy_v10"
ON contributions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "contributions_update_policy_v10"
ON contributions
FOR UPDATE
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

CREATE POLICY "contributions_delete_policy_v10"
ON contributions
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);