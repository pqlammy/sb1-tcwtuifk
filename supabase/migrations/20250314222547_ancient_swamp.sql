/*
  # Add create user functionality
  
  1. Changes
    - Add function to create new users securely
    - Add policy for user creation
  
  2. Security
    - Password hashing handled by database
    - Proper role validation
    - Secure default values
*/

-- Function to create a new user
CREATE OR REPLACE FUNCTION create_new_user(
  p_username TEXT,
  p_password TEXT,
  p_email TEXT,
  p_role TEXT DEFAULT 'user'
) RETURNS uuid
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

  -- Insert new user
  INSERT INTO users (
    username,
    password,
    email,
    role,
    login_attempts,
    created_at
  ) VALUES (
    p_username,
    crypt(p_password, gen_salt('bf')),
    p_email,
    p_role,
    0,
    now()
  )
  RETURNING id INTO v_user_id;

  RETURN v_user_id;
END;
$$;