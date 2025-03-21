/*
  # Migrate to Supabase Auth

  1. Changes
    - Drop custom users table and related policies
    - Update contributions table to use auth.uid()
    - Add new RLS policies using Supabase auth roles
    - Fix admin access using proper role checks

  2. Security
    - Use Supabase built-in authentication
    - Maintain proper access control
    - Ensure data integrity
*/

-- Drop existing policies
DROP POLICY IF EXISTS "contributions_update_policy_v13" ON contributions;
DROP POLICY IF EXISTS "contributions_insert_policy_v12" ON contributions;
DROP POLICY IF EXISTS "contributions_select_policy_v12" ON contributions;
DROP POLICY IF EXISTS "contributions_delete_policy_v12" ON contributions;

-- Drop users table and all its dependencies
DROP TABLE IF EXISTS users CASCADE;

-- Modify contributions table to use auth.uid()
ALTER TABLE contributions
DROP CONSTRAINT IF EXISTS contributions_user_id_fkey,
DROP CONSTRAINT IF EXISTS contributions_gennervogt_id_fkey;

ALTER TABLE contributions
ALTER COLUMN user_id TYPE uuid USING user_id::uuid,
ALTER COLUMN gennervogt_id TYPE uuid USING gennervogt_id::uuid;

-- Create new policies using Supabase auth
CREATE POLICY "Enable read access for own contributions"
ON contributions FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR
  auth.uid() = gennervogt_id OR
  auth.role() = 'service_role'
);

CREATE POLICY "Enable insert access for authenticated users"
ON contributions FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id OR
  auth.role() = 'service_role'
);

CREATE POLICY "Enable update access for admins"
ON contributions FOR UPDATE
TO authenticated
USING (
  auth.role() = 'service_role'
)
WITH CHECK (
  auth.role() = 'service_role'
);

CREATE POLICY "Enable delete access for admins"
ON contributions FOR DELETE
TO authenticated
USING (
  auth.role() = 'service_role'
);