begin;

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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint question_labels_user_name_key unique (user_id, name)
);

create table if not exists public.question_memo_labels (
  question_memo_id text not null references public.question_memos (id) on delete cascade,
  label_id text not null references public.question_labels (id) on delete cascade,
  primary key (question_memo_id, label_id)
);

insert into public.question_memos (
  id,
  user_id,
  company_id,
  question,
  answer,
  created_at,
  updated_at
)
select
  coalesce(nullif(item.value->>'id', ''), 'legacy-' || companies.id || '-' || item.ordinality::text),
  companies.user_id,
  companies.id,
  btrim(coalesce(item.value->>'question', '')),
  btrim(coalesce(item.value->>'answer', '')),
  coalesce(nullif(item.value->>'createdAt', '')::timestamptz, companies.created_at),
  coalesce(nullif(item.value->>'updatedAt', '')::timestamptz, companies.updated_at)
from public.companies
cross join lateral jsonb_array_elements(companies.question_answers) with ordinality as item(value, ordinality)
where
  btrim(coalesce(item.value->>'question', '')) <> ''
  or btrim(coalesce(item.value->>'answer', '')) <> ''
on conflict (id) do nothing;

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

create index if not exists question_memo_labels_label_idx
  on public.question_memo_labels (label_id);

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.question_memos to authenticated;
grant select, insert, update, delete on public.question_labels to authenticated;
grant select, insert, delete on public.question_memo_labels to authenticated;
grant all on public.question_memos to service_role;
grant all on public.question_labels to service_role;
grant all on public.question_memo_labels to service_role;

notify pgrst, 'reload schema';

commit;
