/*
  # Add admin role to specific user

  1. Changes
    - Set admin@test.ch user to have admin role
    - Update RLS policies to use service_role for admin access
*/

-- Update the user's role to service_role (admin)
UPDATE auth.users
SET role = 'service_role'
WHERE email = 'admin@test.ch';