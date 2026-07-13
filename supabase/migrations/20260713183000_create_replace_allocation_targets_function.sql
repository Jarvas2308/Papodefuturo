create function public.replace_allocation_targets(targets jsonb)
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  target jsonb;
begin
  if current_user_id is null then
    raise exception 'Authenticated user is required';
  end if;

  if jsonb_typeof(targets) <> 'array' then
    raise exception 'targets must be a JSON array';
  end if;

  delete from public.allocation_targets
  where user_id = current_user_id;

  for target in
    select value
    from jsonb_array_elements(targets)
  loop
    insert into public.allocation_targets (
      id,
      user_id,
      target_type,
      asset_id,
      category,
      target_basis_points
    )
    values (
      (target ->> 'id')::uuid,
      current_user_id,
      target ->> 'target_type',
      nullif(target ->> 'asset_id', '')::uuid,
      target ->> 'category',
      (target ->> 'target_basis_points')::integer
    );
  end loop;
end;
$$;

revoke all on function public.replace_allocation_targets(jsonb) from public;
revoke all on function public.replace_allocation_targets(jsonb) from anon;
grant execute on function public.replace_allocation_targets(jsonb) to authenticated;
