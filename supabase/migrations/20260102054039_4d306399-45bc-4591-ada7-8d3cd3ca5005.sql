-- 1. Create the user_settings table with correct constraints
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text not null default 'light' check (theme in ('light', 'dark')),
  compact_sidebar boolean not null default false,
  reading_direction text not null default 'ltr' check (reading_direction in ('ltr', 'rtl')),
  page_display text not null default 'single' check (page_display in ('single', 'double', 'vertical')),
  auto_next_chapter boolean not null default true,
  dm_notifications boolean not null default true,
  follower_notifications boolean not null default true,
  recommendation_notifications boolean not null default true,
  updated_at timestamp with time zone default now()
);

-- 2. Enable Row Level Security (RLS)
alter table public.user_settings enable row level security;

-- 3. Create Security Policies (CRUD for own user)
create policy "Users can read own settings"
  on public.user_settings for select
  using (auth.uid() = user_id);

create policy "Users can update own settings"
  on public.user_settings for update
  using (auth.uid() = user_id);

create policy "Users can insert own settings"
  on public.user_settings for insert
  with check (auth.uid() = user_id);

-- 4. Create trigger to auto-update updated_at
create trigger update_user_settings_updated_at
  before update on public.user_settings
  for each row
  execute function public.update_updated_at_column();