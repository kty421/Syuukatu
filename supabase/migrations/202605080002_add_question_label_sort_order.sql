begin;

alter table public.question_labels
  add column if not exists sort_order integer not null default 0;

with ordered_labels as (
  select
    id,
    row_number() over (
      partition by user_id
      order by created_at asc, name asc
    ) - 1 as next_sort_order
  from public.question_labels
)
update public.question_labels
set sort_order = ordered_labels.next_sort_order
from ordered_labels
where public.question_labels.id = ordered_labels.id;

create index if not exists question_labels_user_sort_order_idx
  on public.question_labels (user_id, sort_order asc, created_at asc);

notify pgrst, 'reload schema';

commit;
