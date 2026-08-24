-- ============================================
-- Affiliate Link Infrastructure
-- ============================================

-- Add affiliate URL column to gear_items
-- This stores the tracked affiliate link (REI, Amazon, brand direct)
-- Falls back to the regular `url` if no affiliate link is set.
alter table gear_items add column if not exists affiliate_url text;

-- Track which affiliate program each link belongs to (for reporting)
alter table gear_items add column if not exists affiliate_source text;
-- Values: 'rei', 'amazon', 'avantlink', 'brand-direct', null

-- Track clicks for revenue attribution
create table if not exists affiliate_clicks (
  id uuid primary key default gen_random_uuid(),
  gear_item_id text references gear_items(id),
  user_id uuid references profiles(id) on delete set null,
  source text, -- which affiliate program
  clicked_at timestamptz default now(),
  -- No PII stored — just item + timestamp for conversion tracking
  ip_hash text -- hashed IP for deduplication, not identification
);

-- Index for reporting
create index if not exists idx_affiliate_clicks_item on affiliate_clicks(gear_item_id);
create index if not exists idx_affiliate_clicks_date on affiliate_clicks(clicked_at);

-- RLS: clicks are insert-only from authenticated users, read by admin
alter table affiliate_clicks enable row level security;

create policy "Anyone can insert clicks"
  on affiliate_clicks for insert with check (true);
-- Reading clicks is admin-only (no policy = no public read)
