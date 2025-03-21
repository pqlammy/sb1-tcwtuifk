-- Drop existing policies
DROP POLICY IF EXISTS "enable_read_for_all" ON contributions;
DROP POLICY IF EXISTS "enable_insert_for_users" ON contributions;
DROP POLICY IF EXISTS "enable_update_for_admins" ON contributions;
DROP POLICY IF EXISTS "enable_delete_for_admins" ON contributions;

-- Create new policies
CREATE POLICY "enable_read_for_all"
ON contributions
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "enable_insert_for_users"
ON contributions
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "enable_update_for_admins"
ON contributions
FOR UPDATE
TO authenticated
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "enable_delete_for_admins"
ON contributions
FOR DELETE
TO authenticated
USING (auth.role() = 'service_role');

-- Drop existing view if it exists
DROP VIEW IF EXISTS user_data;

-- Create view for user data
CREATE OR REPLACE VIEW user_data AS
SELECT 
  id,
  email,
  role
FROM auth.users;

-- Grant access to the view
GRANT SELECT ON user_data TO authenticated;