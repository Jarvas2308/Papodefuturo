-- Sprint 16, Fase 5 (ação): insumos de dívida líquida/EBITDA
-- (docs/reference/ACOES_BR_SETORES_E_METRICAS.md, seção 3.5), confirmados
-- com dado real do DFP 2025 (`BPP_con` 2.01.04/2.02.01 "Empréstimos e
-- Financiamentos", `BPA_con` 1.01.01 "Caixa e Equivalentes de Caixa",
-- `DRE_con` 3.05 "Resultado Antes do Resultado Financeiro e dos Tributos",
-- `DFC_MI_con` linha de depreciação/amortização em allowlist fechada).
--
-- Todas nullable: null para banco (BBAS3) por regime errado, não dado
-- ausente - o CVM usa os mesmos códigos de conta para conceitos
-- estruturalmente diferentes em banco (Depósitos, não Empréstimos e
-- Financiamentos; Caixa, não Caixa e Equivalentes de Caixa).

alter table public.fundamental_snapshots
add column financial_debt_current_minor bigint,
add column financial_debt_noncurrent_minor bigint,
add column cash_and_equivalents_minor bigint,
add column ebit_minor bigint,
add column depreciation_and_amortization_minor bigint;

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
    and financial_debt_current_minor is null
    and financial_debt_noncurrent_minor is null
    and cash_and_equivalents_minor is null
    and ebit_minor is null
    and depreciation_and_amortization_minor is null
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
    and financial_debt_current_minor is null
    and financial_debt_noncurrent_minor is null
    and cash_and_equivalents_minor is null
    and ebit_minor is null
    and depreciation_and_amortization_minor is null
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
    and financial_debt_current_minor is null
    and financial_debt_noncurrent_minor is null
    and cash_and_equivalents_minor is null
    and ebit_minor is null
    and depreciation_and_amortization_minor is null
  )
);
