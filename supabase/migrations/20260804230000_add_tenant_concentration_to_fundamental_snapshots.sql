-- Sprint 16, Fase 2 (DEC-078): concentracao por setor de inquilino de FII,
-- fonte cvm-fii-inf-trimestral. Terceiro sinal extraido do Informe
-- Trimestral Estruturado, tabela `imovel_renda_acabado_inquilino`.
--
-- docs/reference/FII_SEGMENTOS_E_METRICAS.md: CVM nao divulga inquilino
-- nomeado, so setor de atuacao (`Setor_Atuacao`) e participacao na receita
-- do fundo (`Percentual_Receitas_FII`). Valor gravado e' a maior soma de
-- participacao de um unico setor entre os imoveis do fundo no trimestre
-- mais recente - concentracao alta (ex.: 80% da receita de um so setor)
-- e risco, nao qualidade.

alter table public.fundamental_snapshots
add column tenant_concentration_basis_points integer;

alter table public.fundamental_snapshots
add constraint fundamental_snapshots_tenant_concentration_basis_points_check check (
  tenant_concentration_basis_points is null
  or (tenant_concentration_basis_points >= 0 and tenant_concentration_basis_points <= 10000)
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
  )
);
