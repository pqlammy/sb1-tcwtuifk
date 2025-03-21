/*
  # Fix admin role assignment

  1. Changes
    - Update admin user role to service_role
    - Ensure proper role is set in auth.users table
*/

-- Update the admin user's role
UPDATE auth.users
SET role = 'service_role'
WHERE email = 'admin@test.ch';

-- Ensure the role is properly set in user metadata
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"service_role"'
)
WHERE email = 'admin@test.ch';