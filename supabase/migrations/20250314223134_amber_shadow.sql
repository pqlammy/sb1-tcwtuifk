/*
  # Fix password verification function

  1. Changes
    - Create a more robust password verification function
    - Update password hashing to use pgcrypto consistently
  
  2. Security
    - Use secure password comparison
    - Maintain password hashing security
*/

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS verify_password(input_password text, stored_password text);

-- Create a new password verification function
CREATE OR REPLACE FUNCTION verify_password(input_password text, stored_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Direct comparison of hashed password with stored hash
  RETURN stored_password = crypt(input_password, stored_password);
END;
$$;

-- Create or replace the user creation function to ensure consistent hashing
CREATE OR REPLACE FUNCTION create_new_user(
  p_username text,
  p_password text,
  p_email text,
  p_role text DEFAULT 'user'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Validate role
  IF p_role NOT IN ('user', 'admin') THEN
    RAISE EXCEPTION 'Invalid role specified';
  END IF;

  -- Insert new user with properly hashed password
  INSERT INTO users (username, password, email, role)
  VALUES (
    p_username,
    crypt(p_password, gen_salt('bf')),
    p_email,
    p_role
  )
  RETURNING id INTO v_user_id;

  RETURN v_user_id;
END;
$$;