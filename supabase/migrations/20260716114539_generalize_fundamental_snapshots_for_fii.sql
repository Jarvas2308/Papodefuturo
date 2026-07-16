alter table public.fundamental_snapshots
add column net_asset_value_minor bigint,
add column issued_shares_unscaled bigint,
add column issued_shares_scale smallint,
add column shareholder_count bigint;

alter table public.fundamental_snapshots
alter column exercise_order drop not null;

alter table public.fundamental_snapshots
drop constraint fundamental_snapshots_identity_check,
drop constraint fundamental_snapshots_source_period_check,
drop constraint fundamental_snapshots_exercise_order_check;

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
),
add constraint fundamental_snapshots_kind_metadata_check check (
  (
    kind = 'brazilian-stock'
    and filing_version is not null
    and filing_version > 0
    and exercise_order is not null
    and length(trim(exercise_order)) > 0
    and net_asset_value_minor is null
    and issued_shares_unscaled is null
    and issued_shares_scale is null
    and shareholder_count is null
  )
  or (
    kind = 'real-estate-fund'
    and filing_version is not null
    and filing_version > 0
    and exercise_order is null
    and total_revenue_minor is null
    and net_income_minor is null
    and total_assets_minor is null
    and total_equity_minor is null
    and operating_cash_flow_minor is null
  )
),
add constraint fundamental_snapshots_issued_shares_presence_check check (
  (
    issued_shares_unscaled is null
    and issued_shares_scale is null
  )
  or (
    issued_shares_unscaled is not null
    and issued_shares_scale is not null
  )
),
add constraint fundamental_snapshots_issued_shares_value_check check (
  (
    issued_shares_unscaled is null
    and issued_shares_scale is null
  )
  or (
    issued_shares_unscaled >= 0
    and issued_shares_scale >= 0
  )
),
add constraint fundamental_snapshots_shareholder_count_check check (
  shareholder_count is null or shareholder_count >= 0
);
