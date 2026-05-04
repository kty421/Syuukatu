begin;

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

alter table public.companies
  add column if not exists user_id uuid references auth.users (id) on delete cascade,
  add column if not exists type text,
  add column if not exists company_name text,
  add column if not exists aspiration text default 'unset',
  add column if not exists status text,
  add column if not exists login_id text default '',
  add column if not exists my_page_url text,
  add column if not exists industry text,
  add column if not exists role text,
  add column if not exists tags text[] default '{}',
  add column if not exists question_answers jsonb default '[]'::jsonb,
  add column if not exists memo text,
  add column if not exists favorite boolean default false,
  add column if not exists archived boolean default false,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table public.companies
  alter column user_id set not null,
  alter column type set not null,
  alter column company_name set not null,
  alter column aspiration set not null,
  alter column status set not null,
  alter column login_id set not null,
  alter column tags set not null,
  alter column question_answers set not null,
  alter column favorite set not null,
  alter column archived set not null,
  alter column created_at set not null,
  alter column updated_at set not null;

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

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.companies to authenticated;
grant all on public.companies to service_role;

notify pgrst, 'reload schema';

commit;
