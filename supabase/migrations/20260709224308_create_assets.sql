create table public.assets (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  ticker text not null,
  name text not null,
  category text not null,
  market text not null,
  currency text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint assets_ticker_not_blank check (btrim(ticker) <> ''),
  constraint assets_name_not_blank check (btrim(name) <> ''),
  constraint assets_category_check check (
    category in (
      'brazilian-stock',
      'real-estate-fund',
      'international-etf',
      'fixed-income',
      'cash'
    )
  ),
  constraint assets_market_check check (
    market in ('BR', 'US', 'INTERNAL')
  ),
  constraint assets_currency_check check (
    currency in ('BRL', 'USD')
  ),
  constraint assets_status_check check (
    status in ('active', 'inactive')
  )
);

create trigger set_assets_updated_at
before update on public.assets
for each row
execute function public.set_updated_at();

alter table public.assets enable row level security;

create policy "Users can select their own assets"
on public.assets
for select
to authenticated
using (user_id = (select auth.uid()));

create policy "Users can insert their own assets"
on public.assets
for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy "Users can update their own assets"
on public.assets
for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "Users can delete their own assets"
on public.assets
for delete
to authenticated
using (user_id = (select auth.uid()));

create index assets_user_id_idx
on public.assets (user_id);

create index assets_user_id_category_idx
on public.assets (user_id, category);

create index assets_user_id_status_idx
on public.assets (user_id, status);
