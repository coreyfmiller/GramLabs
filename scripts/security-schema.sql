-- ============================================
-- Usage Tracking + Rate Limiting Schema
-- ============================================

-- Track daily AI usage per user per feature
create table if not exists usage_tracking (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  feature text not null, -- 'chat', 'build-kit', 'trip', 'analyze-pack', 'import'
  date date not null default current_date,
  count int not null default 1,
  created_at timestamptz default now(),
  unique(user_id, feature, date)
);

-- RLS: users can only see/modify their own usage
alter table usage_tracking enable row level security;

create policy "Users can view own usage"
  on usage_tracking for select using (auth.uid() = user_id);
create policy "Users can insert own usage"
  on usage_tracking for insert with check (auth.uid() = user_id);
create policy "Users can update own usage"
  on usage_tracking for update using (auth.uid() = user_id);

-- Index for fast lookups
create index idx_usage_user_feature_date on usage_tracking(user_id, feature, date);

-- Add plan column to profiles (if not already added)
alter table profiles add column if not exists plan text default 'free';

-- Atomic increment function (avoids race conditions)
create or replace function increment_usage(
  p_user_id uuid,
  p_feature text,
  p_date date
) returns void as $$
begin
  insert into usage_tracking (user_id, feature, date, count)
  values (p_user_id, p_feature, p_date, 1)
  on conflict (user_id, feature, date)
  do update set count = usage_tracking.count + 1;
end;
$$ language plpgsql security definer;
