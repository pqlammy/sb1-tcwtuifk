/*
  # Fix database relationships and foreign keys

  1. Changes
    - Drop existing foreign key constraints
    - Add proper foreign key relationships to auth.users
    - Update RLS policies
*/

-- Drop existing foreign key constraints if they exist
ALTER TABLE contributions 
DROP CONSTRAINT IF EXISTS contributions_user_id_fkey,
DROP CONSTRAINT IF EXISTS contributions_gennervogt_id_fkey;

-- Add proper foreign key relationships to auth.users
ALTER TABLE contributions
ADD CONSTRAINT contributions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
ADD CONSTRAINT contributions_gennervogt_id_fkey 
FOREIGN KEY (gennervogt_id) REFERENCES auth.users(id) ON DELETE SET NULL;