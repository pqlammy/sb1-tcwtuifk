-- Enable RLS on contributions table
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "contributions_insert_policy_v5" ON contributions;
DROP POLICY IF EXISTS "contributions_select_policy_v5" ON contributions;
DROP POLICY IF EXISTS "contributions_admin_policy_v5" ON contributions;

-- Create new policies with unique names
CREATE POLICY "contributions_insert_policy_v6"
ON contributions
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "contributions_select_policy_v6"
ON contributions
FOR SELECT
TO public
USING (true);

CREATE POLICY "contributions_admin_policy_v6"
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