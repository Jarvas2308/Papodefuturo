create table public.purchases (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  asset_id uuid not null references public.assets(id) on delete restrict,
  quantity numeric(28, 8) not null,
  unit_price_minor bigint not null,
  total_amount_minor bigint not null,
  currency text not null,
  purchased_at date not null,
  status text not null default 'confirmed',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint purchases_quantity_positive check (quantity > 0),
  constraint purchases_unit_price_minor_non_negative check (unit_price_minor >= 0),
  constraint purchases_total_amount_minor_non_negative check (total_amount_minor >= 0),
  constraint purchases_currency_check check (currency in ('BRL', 'USD')),
  constraint purchases_status_check check (
    status in ('planned', 'confirmed', 'cancelled')
  ),
  constraint purchases_notes_not_blank check (
    notes is null or btrim(notes) <> ''
  )
);

create trigger set_purchases_updated_at
before update on public.purchases
for each row
execute function public.set_updated_at();

alter table public.purchases enable row level security;

create policy "Users can select their own purchases"
on public.purchases
for select
to authenticated
using (user_id = (select auth.uid()));

create policy "Users can insert their own purchases"
on public.purchases
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.assets
    where assets.id = purchases.asset_id
      and assets.user_id = (select auth.uid())
  )
);

create policy "Users can update their own purchases"
on public.purchases
for update
to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.assets
    where assets.id = purchases.asset_id
      and assets.user_id = (select auth.uid())
  )
);

create policy "Users can delete their own purchases"
on public.purchases
for delete
to authenticated
using (user_id = (select auth.uid()));

create index purchases_user_id_idx
on public.purchases (user_id);

create index purchases_asset_id_idx
on public.purchases (asset_id);

create index purchases_user_asset_idx
on public.purchases (user_id, asset_id);

create index purchases_user_purchased_at_idx
on public.purchases (user_id, purchased_at desc);

create index purchases_user_status_idx
on public.purchases (user_id, status);
