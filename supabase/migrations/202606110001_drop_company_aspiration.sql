begin;

alter table public.companies
  drop column if exists aspiration;

notify pgrst, 'reload schema';

commit;
