-- NextGenHub: apply this once after the original database/schema.sql.
-- Enforces the intended single-administrator setup at database level.
create or replace function public.enforce_single_nextgenhub_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.is_admin = true and exists (
    select 1 from public.profiles p
    where p.is_admin = true and p.id <> new.id
  ) then
    raise exception 'NextGenHub supports only one administrator account.';
  end if;
  return new;
end;
$$;

drop trigger if exists one_nextgenhub_admin_only on public.profiles;
create trigger one_nextgenhub_admin_only
before insert or update of is_admin on public.profiles
for each row execute function public.enforce_single_nextgenhub_admin();

-- Optional indexes for dashboard sorting and filtering.
create index if not exists inquiries_created_at_idx on public.inquiries (created_at desc);
create index if not exists inquiries_status_idx on public.inquiries (status);
create index if not exists services_active_idx on public.services (active);
create index if not exists projects_active_idx on public.projects (active);
