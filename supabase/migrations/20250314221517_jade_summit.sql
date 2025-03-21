/*
  # Add verify_password function

  1. New Functions
    - verify_password: Compares a plain text password with a bcrypt hash
*/

CREATE OR REPLACE FUNCTION verify_password(input_password text, stored_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Use pgcrypto's crypt function to verify the password
  RETURN stored_password = crypt(input_password, stored_password);
END;
$$;