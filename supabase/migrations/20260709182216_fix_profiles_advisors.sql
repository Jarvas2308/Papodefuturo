create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop policy "Users can select their own profile" on public.profiles;
drop policy "Users can insert their own profile" on public.profiles;
drop policy "Users can update their own profile" on public.profiles;
drop policy "Users can delete their own profile" on public.profiles;

create policy "Users can select their own profile"
on public.profiles
for select
to authenticated
using (id = (select auth.uid()));

create policy "Users can insert their own profile"
on public.profiles
for insert
to authenticated
with check (id = (select auth.uid()));

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy "Users can delete their own profile"
on public.profiles
for delete
to authenticated
using (id = (select auth.uid()));

do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'rls_auto_enable'
      and p.pronargs = 0
  ) then
    execute 'revoke execute on function public.rls_auto_enable() from anon';
    execute 'revoke execute on function public.rls_auto_enable() from authenticated';
  end if;
end;
$$;
