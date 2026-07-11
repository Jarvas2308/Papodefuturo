create table public.allocation_targets (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null,
  asset_id uuid references public.assets(id) on delete cascade,
  category text not null,
  target_basis_points integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint allocation_targets_target_type_check check (
    target_type in ('category', 'asset')
  ),
  constraint allocation_targets_category_check check (
    category in (
      'brazilian-stock',
      'real-estate-fund',
      'international-etf',
      'fixed-income',
      'cash'
    )
  ),
  constraint allocation_targets_basis_points_check check (
    target_basis_points >= 0
    and target_basis_points <= 10000
  ),
  constraint allocation_targets_scope_asset_check check (
    (
      target_type = 'category'
      and asset_id is null
    )
    or
    (
      target_type = 'asset'
      and asset_id is not null
    )
  )
);

create trigger set_allocation_targets_updated_at
before update on public.allocation_targets
for each row
execute function public.set_updated_at();

alter table public.allocation_targets enable row level security;

create policy "Users can select their own allocation targets"
on public.allocation_targets
for select
to authenticated
using (user_id = (select auth.uid()));

create policy "Users can insert their own allocation targets"
on public.allocation_targets
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and (
    (
      target_type = 'category'
      and asset_id is null
    )
    or
    (
      target_type = 'asset'
      and exists (
        select 1
        from public.assets
        where assets.id = allocation_targets.asset_id
          and assets.user_id = (select auth.uid())
          and assets.category = allocation_targets.category
      )
    )
  )
);

create policy "Users can update their own allocation targets"
on public.allocation_targets
for update
to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and (
    (
      target_type = 'category'
      and asset_id is null
    )
    or
    (
      target_type = 'asset'
      and exists (
        select 1
        from public.assets
        where assets.id = allocation_targets.asset_id
          and assets.user_id = (select auth.uid())
          and assets.category = allocation_targets.category
      )
    )
  )
);

create policy "Users can delete their own allocation targets"
on public.allocation_targets
for delete
to authenticated
using (user_id = (select auth.uid()));

create unique index allocation_targets_user_category_unique
on public.allocation_targets (user_id, category)
where target_type = 'category';

create unique index allocation_targets_user_asset_unique
on public.allocation_targets (user_id, asset_id)
where target_type = 'asset';

create index allocation_targets_user_id_idx
on public.allocation_targets (user_id);

create index allocation_targets_user_target_type_idx
on public.allocation_targets (user_id, target_type);

create index allocation_targets_asset_id_idx
on public.allocation_targets (asset_id)
where asset_id is not null;
