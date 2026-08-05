-- Sprint 16, Fase 2 (DEC-080): WALE (prazo medio ponderado de vencimento
-- dos contratos) de FII, fonte cvm-fii-inf-trimestral. Quinto e ultimo
-- sinal desta fatia do Informe Trimestral Estruturado, tabela
-- `complemento` (mesma tabela do indexador - 13 faixas de vencimento de
-- receita, ja ingeridas para o indexador, reaproveitadas aqui).
--
-- Metodologia documentada (nao dado exato da CVM): media ponderada por
-- receita usando o ponto medio de cada faixa. "Acima_36Meses" usa piso
-- conservador (36 meses, subestima o WALE real). "Indeterminado" fica
-- fora do calculo (sem informacao de prazo). Coluna em meses, escala x100
-- (2 casas decimais) - unica escala de duracao desta fatia, diferente dos
-- pontos-base (0-10000) dos demais sinais.

alter table public.fundamental_snapshots
add column wale_months_x100 integer;

alter table public.fundamental_snapshots
add constraint fundamental_snapshots_wale_months_x100_check check (
  wale_months_x100 is null
  or (wale_months_x100 >= 0 and wale_months_x100 <= 120000)
);

alter table public.fundamental_snapshots
drop constraint fundamental_snapshots_kind_metadata_check;

alter table public.fundamental_snapshots
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
