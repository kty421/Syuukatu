create table if not exists public.company_schedules (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  company_id text not null references public.companies (id) on delete cascade,
  title text not null default '',
  type text not null default 'その他' check (type in ('面接', 'GD', '説明会', 'ES締切', 'Webテスト', 'インターン', 'OB訪問', '面談', 'その他')),
  start_date date not null,
  end_date date,
  start_time time,
  end_time time,
  is_all_day boolean not null default true,
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint company_schedules_date_order_check check (end_date is null or end_date >= start_date),
  constraint company_schedules_time_fields_check check (
    (is_all_day and start_time is null and end_time is null)
    or (
      not is_all_day
      and start_time is not null
      and end_time is not null
      and end_time > start_time
    )
  )
);

alter table public.company_schedules enable row level security;

drop policy if exists "company_schedules_select_own" on public.company_schedules;
create policy "company_schedules_select_own"
  on public.company_schedules
  for select
  using (auth.uid() = user_id);

drop policy if exists "company_schedules_insert_own" on public.company_schedules;
create policy "company_schedules_insert_own"
  on public.company_schedules
  for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.companies
      where companies.id = company_schedules.company_id
        and companies.user_id = auth.uid()
    )
  );

drop policy if exists "company_schedules_update_own" on public.company_schedules;
create policy "company_schedules_update_own"
  on public.company_schedules
  for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.companies
      where companies.id = company_schedules.company_id
        and companies.user_id = auth.uid()
    )
  );

drop policy if exists "company_schedules_delete_own" on public.company_schedules;
create policy "company_schedules_delete_own"
  on public.company_schedules
  for delete
  using (auth.uid() = user_id);

create index if not exists company_schedules_user_start_date_idx
  on public.company_schedules (user_id, start_date asc, start_time asc);

create index if not exists company_schedules_user_company_idx
  on public.company_schedules (user_id, company_id);

grant select, insert, update, delete on public.company_schedules to authenticated;
grant all on public.company_schedules to service_role;

notify pgrst, 'reload schema';
