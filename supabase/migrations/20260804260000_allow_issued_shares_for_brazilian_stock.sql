-- Sprint 16, Fase 3 (DEC-081): cotas emitidas (composicao_capital) de acao
-- brasileira, insumo de LPA/P-L (Fase 5). Reaproveita as colunas
-- `issued_shares_unscaled`/`issued_shares_scale` ja existentes (usadas por
-- cvm-fii-inf-mensal) - mesma representacao ExactDecimalQuantity, dominio
-- diferente. So remove a exigencia de NULL do ramo brazilian-stock; os
-- outros ramos continuam exigindo NULL como antes.

alter table public.fundamental_snapshots
drop constraint fundamental_snapshots_kind_metadata_check;

alter table public.fundamental_snapshots
add constraint fundamental_snapshots_kind_metadata_check check (
  (
    kind = 'brazilian-stock'
    and exercise_order is not null
    and length(trim(exercise_order)) > 0
    and net_asset_value_minor is null
    and shareholder_count is null
    and total_liabilities_minor is null
    and net_assets_minor is null
    and vacancy_basis_points is null
    and ipca_revenue_share_basis_points is null
    and igpm_revenue_share_basis_points is null
    and inpc_revenue_share_basis_points is null
    and incc_revenue_share_basis_points is null
    and tenant_concentration_basis_points is null
    and quarterly_net_financial_result_minor is null
    and wale_months_x100 is null
  )
  or (
    kind = 'real-estate-fund'
    and source = 'cvm-fii-inf-mensal'
    and exercise_order is null
    and total_revenue_minor is null
    and net_income_minor is null
    and total_assets_minor is null
    and total_equity_minor is null
    and operating_cash_flow_minor is null
    and total_liabilities_minor is null
    and net_assets_minor is null
    and vacancy_basis_points is null
    and ipca_revenue_share_basis_points is null
    and igpm_revenue_share_basis_points is null
    and inpc_revenue_share_basis_points is null
    and incc_revenue_share_basis_points is null
    and tenant_concentration_basis_points is null
    and quarterly_net_financial_result_minor is null
    and wale_months_x100 is null
  )
  or (
    kind = 'real-estate-fund'
    and source = 'cvm-fii-inf-trimestral'
    and exercise_order is null
    and total_revenue_minor is null
    and net_income_minor is null
    and total_assets_minor is null
    and total_equity_minor is null
    and operating_cash_flow_minor is null
    and total_liabilities_minor is null
    and net_assets_minor is null
    and net_asset_value_minor is null
    and issued_shares_unscaled is null
    and issued_shares_scale is null
    and shareholder_count is null
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
    and vacancy_basis_points is null
    and ipca_revenue_share_basis_points is null
    and igpm_revenue_share_basis_points is null
    and inpc_revenue_share_basis_points is null
    and incc_revenue_share_basis_points is null
    and tenant_concentration_basis_points is null
    and quarterly_net_financial_result_minor is null
    and wale_months_x100 is null
  )
);
