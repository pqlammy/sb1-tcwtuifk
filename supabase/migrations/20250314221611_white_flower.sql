/*
  # Add set_claim function

  1. New Functions
    - set_claim: Sets a session claim for RLS policies
*/

CREATE OR REPLACE FUNCTION set_claim(claim text, value text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF value IS NULL THEN
    PERFORM set_config('app.' || claim, '', true);
  ELSE
    PERFORM set_config('app.' || claim, value, true);
  END IF;
END;
$$;