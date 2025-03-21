/*
  # Fix authentication system

  1. Changes
    - Drop and recreate password verification function to use pgcrypto properly
    - Update policies to handle authentication correctly
    - Add missing pgcrypto extension if not exists
*/

-- Enable pgcrypto if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop existing policies
DROP POLICY IF EXISTS "Public can authenticate" ON users;
DROP POLICY IF EXISTS "Users can manage own data" ON users;

-- Drop existing function
DROP FUNCTION IF EXISTS verify_password;

-- Create new password verification function
CREATE OR REPLACE FUNCTION verify_password(input_password text, stored_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN stored_password = crypt(input_password, stored_password);
END;
$$;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "Allow public read for authentication"
  ON users
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow self management"
  ON users
  FOR ALL
  TO public
  USING (
    username = current_setting('app.user_name', true)::text
    OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE username = current_setting('app.user_name', true)::text 
      AND role = 'admin'
    )
  );