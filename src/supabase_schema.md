# Supabase Schema for User Profiles

This file contains the complete SQL needed to set up the `public.profiles` table and the corresponding trigger in your Supabase project. This setup is designed to work with the application's sign-up flow.

## Instructions

Run the following SQL code in your Supabase project's SQL Editor to create the table and the necessary functions.

```sql
-- 1. Create the 'profiles' table
-- This table stores public user data that is separate from the private
-- authentication data in 'auth.users'. It is linked via a foreign key.
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name text,
  role text,
  city text,
  created_at timestamptz DEFAULT now()
);

-- 2. Create a function to handle new user creation
-- This function will be triggered automatically when a new user signs up.
-- It copies the user's ID, full name, role, and city into the 'profiles' table.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role, city)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'role',
    new.raw_user_meta_data->>'city'
  );
  return new;
end;
$$ language plpgsql security definer;

-- 3. Create a trigger to call the function after a new user is created
-- This trigger ensures that 'handle_new_user()' is executed every time
-- a new record is inserted into the 'auth.users' table.
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

```
