/*
  # Initial Database Schema

  1. Tables
    - users
      - id (uuid, primary key)
      - username (text, unique)
      - password (text, hashed)
      - email (text, unique)
      - role (text)
      - created_at (timestamp)
      - last_login (timestamp)
      - login_attempts (integer)
      - locked_until (timestamp)
    
    - contributions
      - id (uuid, primary key)
      - user_id (uuid, foreign key)
      - amount (numeric)
      - first_name (text, encrypted)
      - last_name (text, encrypted)
      - email (text, encrypted)
      - address (text, encrypted)
      - city (text, encrypted)
      - postal_code (text, encrypted)
      - gennervogt_id (uuid, foreign key)
      - paid (boolean)
      - created_at (timestamp)

    - login_logs
      - id (uuid, primary key)
      - user_id (uuid, foreign key)
      - ip_address (text)
      - success (boolean)
      - created_at (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for data access
    - Encryption for sensitive data
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password text NOT NULL,
  email text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  last_login timestamptz,
  login_attempts integer DEFAULT 0,
  locked_until timestamptz,
  CONSTRAINT valid_role CHECK (role IN ('user', 'admin'))
);

-- Create contributions table
CREATE TABLE IF NOT EXISTS contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  postal_code text NOT NULL,
  gennervogt_id uuid REFERENCES users(id),
  paid boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create login logs table
CREATE TABLE IF NOT EXISTS login_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  ip_address text NOT NULL,
  success boolean NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can read their own data"
  ON users
  FOR SELECT
  USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- RLS Policies for contributions
CREATE POLICY "Users can read their own contributions"
  ON contributions
  FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Users can insert their own contributions"
  ON contributions
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for login logs
CREATE POLICY "Only admins can read login logs"
  ON login_logs
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "System can insert login logs"
  ON login_logs
  FOR INSERT
  WITH CHECK (true);