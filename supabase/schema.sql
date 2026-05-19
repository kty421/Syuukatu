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

create table if not exists public.question_memos (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  company_id text references public.companies (id) on delete set null,
  question text not null default '',
  answer text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.question_labels (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint question_labels_user_name_key unique (user_id, name)
);

create table if not exists public.question_memo_labels (
  question_memo_id text not null references public.question_memos (id) on delete cascade,
  label_id text not null references public.question_labels (id) on delete cascade,
  primary key (question_memo_id, label_id)
);

alter table public.question_memos enable row level security;
alter table public.question_labels enable row level security;
alter table public.question_memo_labels enable row level security;

drop policy if exists "question_memos_select_own" on public.question_memos;
create policy "question_memos_select_own"
  on public.question_memos
  for select
  using (auth.uid() = user_id);

drop policy if exists "question_memos_insert_own" on public.question_memos;
create policy "question_memos_insert_own"
  on public.question_memos
  for insert
  with check (
    auth.uid() = user_id
    and (
      company_id is null
      or exists (
        select 1
        from public.companies
        where companies.id = question_memos.company_id
          and companies.user_id = auth.uid()
      )
    )
  );

drop policy if exists "question_memos_update_own" on public.question_memos;
create policy "question_memos_update_own"
  on public.question_memos
  for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and (
      company_id is null
      or exists (
        select 1
        from public.companies
        where companies.id = question_memos.company_id
          and companies.user_id = auth.uid()
      )
    )
  );

drop policy if exists "question_memos_delete_own" on public.question_memos;
create policy "question_memos_delete_own"
  on public.question_memos
  for delete
  using (auth.uid() = user_id);

drop policy if exists "question_labels_select_own" on public.question_labels;
create policy "question_labels_select_own"
  on public.question_labels
  for select
  using (auth.uid() = user_id);

drop policy if exists "question_labels_insert_own" on public.question_labels;
create policy "question_labels_insert_own"
  on public.question_labels
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "question_labels_update_own" on public.question_labels;
create policy "question_labels_update_own"
  on public.question_labels
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "question_labels_delete_own" on public.question_labels;
create policy "question_labels_delete_own"
  on public.question_labels
  for delete
  using (auth.uid() = user_id);

drop policy if exists "question_memo_labels_select_own" on public.question_memo_labels;
create policy "question_memo_labels_select_own"
  on public.question_memo_labels
  for select
  using (
    exists (
      select 1
      from public.question_memos
      where question_memos.id = question_memo_labels.question_memo_id
        and question_memos.user_id = auth.uid()
    )
  );

drop policy if exists "question_memo_labels_insert_own" on public.question_memo_labels;
create policy "question_memo_labels_insert_own"
  on public.question_memo_labels
  for insert
  with check (
    exists (
      select 1
      from public.question_memos
      where question_memos.id = question_memo_labels.question_memo_id
        and question_memos.user_id = auth.uid()
    )
    and exists (
      select 1
      from public.question_labels
      where question_labels.id = question_memo_labels.label_id
        and question_labels.user_id = auth.uid()
    )
  );

drop policy if exists "question_memo_labels_delete_own" on public.question_memo_labels;
create policy "question_memo_labels_delete_own"
  on public.question_memo_labels
  for delete
  using (
    exists (
      select 1
      from public.question_memos
      where question_memos.id = question_memo_labels.question_memo_id
        and question_memos.user_id = auth.uid()
    )
  );

create index if not exists question_memos_user_updated_at_idx
  on public.question_memos (user_id, updated_at desc);

create index if not exists question_memos_user_company_idx
  on public.question_memos (user_id, company_id);

create index if not exists question_labels_user_created_at_idx
  on public.question_labels (user_id, created_at asc);

create index if not exists question_labels_user_sort_order_idx
  on public.question_labels (user_id, sort_order asc, created_at asc);

create index if not exists question_memo_labels_label_idx
  on public.question_memo_labels (label_id);

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.companies to authenticated;
grant select, insert, update, delete on public.company_schedules to authenticated;
grant select, insert, update, delete on public.question_memos to authenticated;
grant select, insert, update, delete on public.question_labels to authenticated;
grant select, insert, delete on public.question_memo_labels to authenticated;
grant all on public.companies to service_role;
grant all on public.company_schedules to service_role;
grant all on public.question_memos to service_role;
grant all on public.question_labels to service_role;
grant all on public.question_memo_labels to service_role;

notify pgrst, 'reload schema';
