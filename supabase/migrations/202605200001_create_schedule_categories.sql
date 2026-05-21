create table if not exists public.schedule_categories (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null default '',
  color_code text not null default '#6B7280' check (color_code ~ '^#[0-9A-Fa-f]{6}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.schedule_categories enable row level security;

drop policy if exists "schedule_categories_select_own" on public.schedule_categories;
create policy "schedule_categories_select_own"
  on public.schedule_categories
  for select
  using (auth.uid() = user_id);

drop policy if exists "schedule_categories_insert_own" on public.schedule_categories;
create policy "schedule_categories_insert_own"
  on public.schedule_categories
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "schedule_categories_update_own" on public.schedule_categories;
create policy "schedule_categories_update_own"
  on public.schedule_categories
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "schedule_categories_delete_own" on public.schedule_categories;
create policy "schedule_categories_delete_own"
  on public.schedule_categories
  for delete
  using (auth.uid() = user_id);

alter table public.company_schedules
  add column if not exists category_id text references public.schedule_categories (id) on delete set null;

create index if not exists schedule_categories_user_created_at_idx
  on public.schedule_categories (user_id, created_at asc);

create index if not exists company_schedules_user_category_idx
  on public.company_schedules (user_id, category_id);

grant select, insert, update, delete on public.schedule_categories to authenticated;
grant all on public.schedule_categories to service_role;

notify pgrst, 'reload schema';
