create table public.asset_prices (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  asset_id uuid not null references public.assets(id) on delete cascade,
  price_minor bigint not null,
  currency text not null,
  priced_at timestamptz not null,
  source text not null default 'manual',
  created_at timestamptz not null default now(),

  constraint asset_prices_price_minor_positive check (price_minor > 0),
  constraint asset_prices_currency_check check (currency in ('BRL', 'USD')),
  constraint asset_prices_source_check check (
    source in ('manual', 'market-provider')
  )
);

alter table public.asset_prices enable row level security;

create policy "Users can select their own asset prices"
on public.asset_prices
for select
to authenticated
using (user_id = (select auth.uid()));

create policy "Users can insert their own asset prices"
on public.asset_prices
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.assets
    where assets.id = asset_prices.asset_id
      and assets.user_id = (select auth.uid())
  )
);

create policy "Users can update their own asset prices"
on public.asset_prices
for update
to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.assets
    where assets.id = asset_prices.asset_id
      and assets.user_id = (select auth.uid())
  )
);

create policy "Users can delete their own asset prices"
on public.asset_prices
for delete
to authenticated
using (user_id = (select auth.uid()));

create index asset_prices_user_id_idx
on public.asset_prices (user_id);

create index asset_prices_asset_id_idx
on public.asset_prices (asset_id);

create index asset_prices_user_asset_idx
on public.asset_prices (user_id, asset_id);

create index asset_prices_user_priced_at_idx
on public.asset_prices (user_id, priced_at desc);

create index asset_prices_user_asset_priced_at_idx
on public.asset_prices (user_id, asset_id, priced_at desc);
