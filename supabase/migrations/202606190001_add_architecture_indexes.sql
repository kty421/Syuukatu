begin;

create index if not exists companies_user_type_updated_at_idx
  on public.companies (user_id, type, updated_at desc);

create index if not exists company_schedules_user_category_start_date_idx
  on public.company_schedules (user_id, category_id, start_date asc);

create index if not exists question_memo_labels_label_memo_idx
  on public.question_memo_labels (label_id, question_memo_id);

comment on table public.companies is
  'User-owned company/application records. RLS restricts access by user_id = auth.uid().';

comment on table public.company_schedules is
  'User-owned schedules linked to companies. company_id cascades on company delete; category_id is set null on category delete.';

comment on table public.schedule_categories is
  'User-owned schedule color categories. Deleting a category should null company_schedules.category_id.';

comment on table public.question_memos is
  'User-owned question memos. company_id is set null when a company is deleted.';

comment on table public.question_labels is
  'User-owned question labels with per-user unique names.';

comment on table public.question_memo_labels is
  'Join table for question memos and labels. RLS checks ownership through the parent memo/label rows.';

notify pgrst, 'reload schema';

commit;
