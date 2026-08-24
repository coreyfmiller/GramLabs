-- ============================================
-- Early Adopter Tracking
-- ============================================

-- Add user_number to profiles (auto-incrementing signup order)
-- This gives us "Early Adopter #247" badges and tier logic.

-- Create a sequence for user numbering
create sequence if not exists user_number_seq start 1;

-- Add columns to profiles
alter table profiles add column if not exists user_number int unique default nextval('user_number_seq');
alter table profiles add column if not exists tier text default 'free';
-- tier: 'early-adopter' (first 1000), 'free', 'pro'

-- Update the handle_new_user trigger to assign tier based on count
create or replace function public.handle_new_user()
returns trigger as $$
declare
  current_number int;
begin
  -- Get the next user number
  current_number := nextval('user_number_seq');

  insert into public.profiles (id, display_name, user_number, tier, plan)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    current_number,
    case when current_number <= 1000 then 'early-adopter' else 'free' end,
    case when current_number <= 1000 then 'early-adopter' else 'free' end
  );
  return new;
end;
$$ language plpgsql security definer;

-- Note: The trigger `on_auth_user_created` already exists and calls handle_new_user().
-- This just updates the function body — no need to recreate the trigger.
