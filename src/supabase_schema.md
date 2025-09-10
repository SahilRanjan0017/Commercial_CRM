# Supabase Schema for User Profiles

This file contains the complete SQL needed to set up the `public.profiles` table, the corresponding trigger to handle new signups, and the necessary Row Level Security (RLS) policies.

## Instructions

Run the following SQL code in your Supabase project's SQL Editor. This single script will configure everything needed for user profiles.

```sql
-- 1. Create the 'profiles' table
-- This table stores public user data that is separate from the private
-- authentication data in 'auth.users'. It is linked via a foreign key.
CREATE TABLE public.profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  role text,
  city text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT role_check CHECK (role IN ('OS', 'Business Head', 'Admin'))
);

-- 2. Create a function to handle new user creation
-- This function will be triggered automatically when a new user signs up.
-- It copies the user's ID and metadata from auth.users into the 'profiles' table.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, city)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'role',
    new.raw_user_meta_data->>'city'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create a trigger to call the function after a new user is created
-- This trigger ensures that 'handle_new_user()' is executed every time
-- a new record is inserted into the 'auth.users' table.
-- It is dropped first to ensure the script can be re-run without errors.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Enable Row Level Security (RLS) on the 'profiles' table
-- This is a critical security step. By default, no one can access the table
-- until we define specific policies.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for the 'profiles' table
-- These policies define who can view, insert, or update data.

-- Drop existing policies to ensure a clean setup
DROP POLICY IF EXISTS "Enable profile creation for all users" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Policy 1: Allow any authenticated user to create their own profile.
-- The trigger function 'handle_new_user' handles this, so this policy allows the trigger to work.
CREATE POLICY "Enable profile creation for all users" ON public.profiles
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy 2: Allow users to view their own profile.
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Policy 3: Allow users to update their own profile.
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

```
