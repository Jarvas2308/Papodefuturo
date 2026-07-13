create table public.exchange_rates (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  base_currency text not null,
  quote_currency text not null,
  rate_scaled bigint not null,
  rate_scale integer not null default 1000000,
  priced_at timestamptz not null,
  source text not null default 'manual',
  created_at timestamptz not null default now(),

  constraint exchange_rates_base_currency_check check (
    base_currency in ('BRL', 'USD')
  ),
  constraint exchange_rates_quote_currency_check check (
    quote_currency in ('BRL', 'USD')
  ),
  constraint exchange_rates_distinct_currency_check check (
    base_currency <> quote_currency
  ),
  constraint exchange_rates_rate_scaled_positive check (rate_scaled > 0),
  constraint exchange_rates_rate_scale_check check (rate_scale = 1000000),
  constraint exchange_rates_source_check check (
    source in ('manual', 'market-provider')
  )
);

alter table public.exchange_rates enable row level security;

create policy "Users can select their own exchange rates"
on public.exchange_rates
for select
to authenticated
using (user_id = (select auth.uid()));

create policy "Users can insert their own exchange rates"
on public.exchange_rates
for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy "Users can update their own exchange rates"
on public.exchange_rates
for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "Users can delete their own exchange rates"
on public.exchange_rates
for delete
to authenticated
using (user_id = (select auth.uid()));

grant select, insert, update, delete
on table public.exchange_rates
to authenticated;

create index exchange_rates_user_id_idx
on public.exchange_rates (user_id);

create index exchange_rates_user_pair_priced_at_idx
on public.exchange_rates (
  user_id,
  base_currency,
  quote_currency,
  priced_at desc
);