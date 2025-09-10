
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name text,
  role text,
  city text,
  created_at timestamptz DEFAULT now()
);


-- Function to handle new user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role, city)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name', 
    'OS',  -- Default role: OS
    null
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger that runs whenever a new auth.users row is created
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user(); 
