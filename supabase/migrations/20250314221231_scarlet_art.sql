/*
  # Add test user

  1. Changes
    - Insert test user with encrypted password
    - Username: admin
    - Password: admin123
    - Role: admin

  2. Security
    - Password is hashed
    - User has admin role
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE username = 'admin'
  ) THEN
    INSERT INTO users (
      username,
      password,
      email,
      role,
      created_at,
      login_attempts,
      locked_until
    ) VALUES (
      'admin',
      -- Password: admin123 (hashed)
      '$2a$12$K8HFh3886Hf5q4kJ3bZoKOqCmYZ9LXC9JF6WiVzxNPnR8WDwDAFxW',
      'admin@example.com',
      'admin',
      NOW(),
      0,
      NULL
    );
  END IF;
END $$;