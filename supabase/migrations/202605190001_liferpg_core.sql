create extension if not exists pgcrypto;

create table if not exists public.daily_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  energy int not null default 3 check (energy between 1 and 5),
  mood int not null default 3 check (mood between 1 and 5),
  body int not null default 3 check (body between 1 and 5),
  focus int not null default 3 check (focus between 1 and 5),
  social int not null default 3 check (social between 1 and 5),
  mode text not null default '普通',
  schedule text not null default '',
  review text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, entry_date)
);

create table if not exists public.task_instances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_date date not null,
  task_key text not null,
  title text not null,
  task_type text not null,
  attribute text not null,
  xp int not null default 0,
  time_label text not null default '',
  note text not null default '',
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (user_id, task_date) references public.daily_entries(user_id, entry_date) on delete cascade,
  unique (user_id, task_date, task_key)
);

create table if not exists public.profile_attributes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  level int not null default 1,
  xp int not null default 0,
  next_xp int not null default 100,
  color text not null default '#41d38b',
  sort_order int not null default 0,
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists public.agent_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.weekly_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  range_start date not null,
  range_end date not null,
  summary text not null,
  metrics jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, range_start, range_end)
);

alter table public.daily_entries enable row level security;
alter table public.task_instances enable row level security;
alter table public.profile_attributes enable row level security;
alter table public.agent_events enable row level security;
alter table public.weekly_reports enable row level security;

create policy "daily entries are owner scoped"
  on public.daily_entries for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "task instances are owner scoped"
  on public.task_instances for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "profile attributes are owner scoped"
  on public.profile_attributes for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "agent events are owner scoped"
  on public.agent_events for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "weekly reports are owner scoped"
  on public.weekly_reports for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

do $$
begin
  alter publication supabase_realtime add table public.daily_entries;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.task_instances;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.profile_attributes;
exception when duplicate_object then null;
end $$;
