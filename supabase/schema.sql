create table if not exists public.companies (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('internship', 'fullTime')),
  company_name text not null,
  aspiration text not null default 'unset' check (aspiration in ('high', 'middle', 'low', 'unset')),
  status text not null,
  login_id text not null default '',
  my_page_url text,
  industry text,
  role text,
  tags text[] not null default '{}',
  question_answers jsonb not null default '[]'::jsonb,
  memo text,
  favorite boolean not null default false,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.companies enable row level security;

drop policy if exists "companies_select_own" on public.companies;
create policy "companies_select_own"
  on public.companies
  for select
  using (auth.uid() = user_id);

drop policy if exists "companies_insert_own" on public.companies;
create policy "companies_insert_own"
  on public.companies
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "companies_update_own" on public.companies;
create policy "companies_update_own"
  on public.companies
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "companies_delete_own" on public.companies;
create policy "companies_delete_own"
  on public.companies
  for delete
  using (auth.uid() = user_id);

create index if not exists companies_user_updated_at_idx
  on public.companies (user_id, updated_at desc);
