/*
  # Add RLS policies for contributions table

  1. Security Changes
    - Enable RLS on contributions table if not already enabled
    - Add policies for:
      - Users can insert their own contributions
      - Users can read their own contributions
      - Admins can manage all contributions
*/

-- Enable RLS on contributions table
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can insert their own contributions" ON contributions;
DROP POLICY IF EXISTS "Users can read their own contributions" ON contributions;
DROP POLICY IF EXISTS "Admins can manage all contributions" ON contributions;

-- Create new policies
CREATE POLICY "Users can insert their own contributions"
ON contributions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM users WHERE username = current_setting('app.user_name', true)
  )
);

CREATE POLICY "Users can read their own contributions"
ON contributions
FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM users WHERE username = current_setting('app.user_name', true)
  ) OR 
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