alter table public.fundamental_snapshots
add column total_liabilities_minor bigint,
add column net_assets_minor bigint,
alter column filing_version drop not null;

alter table public.fundamental_snapshots
drop constraint fundamental_snapshots_kind_identity_check,
drop constraint fundamental_snapshots_kind_metadata_check,
drop constraint fundamental_snapshots_currency_check,
drop constraint fundamental_snapshots_filing_version_check;

alter table public.fundamental_snapshots
add constraint fundamental_snapshots_kind_identity_check check (
  (
    kind = 'brazilian-stock'
    and category = 'brazilian-stock'
    and market = 'BR'
    and (
      (source = 'cvm-dfp' and period = 'annual')
      or (source = 'cvm-itr' and period = 'quarterly')
    )
  )
  or (
    kind = 'real-estate-fund'
    and category = 'real-estate-fund'
    and market = 'BR'
    and source = 'cvm-fii-inf-mensal'
    and period = 'monthly'
  )
  or (
    kind = 'international-etf'
    and category = 'international-etf'
    and market = 'US'
    and source = 'sec-nport'
    and period = 'monthly'
  )
),
add constraint fundamental_snapshots_currency_check check (
  (kind = 'brazilian-stock' and currency = 'BRL')
  or (kind = 'real-estate-fund' and currency = 'BRL')
  or (kind = 'international-etf' and currency = 'USD')
),
add constraint fundamental_snapshots_filing_version_check check (
  (
    kind in ('brazilian-stock', 'real-estate-fund')
    and filing_version is not null
    and filing_version > 0
  )
  or (
    kind = 'international-etf'
    and filing_version is null
  )
),
add constraint fundamental_snapshots_kind_metadata_check check (
  (
    kind = 'brazilian-stock'
    and exercise_order is not null
    and length(trim(exercise_order)) > 0
    and net_asset_value_minor is null
    and issued_shares_unscaled is null
    and issued_shares_scale is null
    and shareholder_count is null
    and total_liabilities_minor is null
    and net_assets_minor is null
  )
  or (
    kind = 'real-estate-fund'
    and exercise_order is null
    and total_revenue_minor is null
    and net_income_minor is null
    and total_assets_minor is null
    and total_equity_minor is null
    and operating_cash_flow_minor is null
    and total_liabilities_minor is null
    and net_assets_minor is null
  )
  or (
    kind = 'international-etf'
    and exercise_order is null
    and total_revenue_minor is null
    and net_income_minor is null
    and total_equity_minor is null
    and operating_cash_flow_minor is null
    and net_asset_value_minor is null
    and issued_shares_unscaled is null
    and issued_shares_scale is null
    and shareholder_count is null
  )
);
