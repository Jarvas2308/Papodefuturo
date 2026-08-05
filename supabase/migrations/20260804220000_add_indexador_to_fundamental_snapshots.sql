-- Sprint 16, Fase 2 (DEC-077): indexador da carteira de FII, fonte
-- cvm-fii-inf-trimestral. Segundo sinal extraido da tabela `complemento`
-- do Informe Trimestral Estruturado (1 linha/fundo/trimestre, sem
-- agregacao ponderada, diferente da vacancia).
--
-- docs/reference/FII_SEGMENTOS_E_METRICAS.md, secoes 3.6/7.1: participacao
-- da receita contratual por indice de reajuste (IPCA, IGP-M, INPC, INCC) -
-- indexador mais determinante da protecao de distribuicao contra inflacao.
-- As 4 fracoes NAO somam necessariamente 1 (receita nao indexada ou nao
-- alocada), por isso 4 colunas independentes, nao 1 enum dominante.

alter table public.fundamental_snapshots
add column ipca_revenue_share_basis_points integer,
add column igpm_revenue_share_basis_points integer,
add column inpc_revenue_share_basis_points integer,
add column incc_revenue_share_basis_points integer;

alter table public.fundamental_snapshots
add constraint fundamental_snapshots_ipca_revenue_share_basis_points_check check (
  ipca_revenue_share_basis_points is null
  or (ipca_revenue_share_basis_points >= 0 and ipca_revenue_share_basis_points <= 10000)
),
add constraint fundamental_snapshots_igpm_revenue_share_basis_points_check check (
  igpm_revenue_share_basis_points is null
  or (igpm_revenue_share_basis_points >= 0 and igpm_revenue_share_basis_points <= 10000)
),
add constraint fundamental_snapshots_inpc_revenue_share_basis_points_check check (
  inpc_revenue_share_basis_points is null
  or (inpc_revenue_share_basis_points >= 0 and inpc_revenue_share_basis_points <= 10000)
),
add constraint fundamental_snapshots_incc_revenue_share_basis_points_check check (
  incc_revenue_share_basis_points is null
  or (incc_revenue_share_basis_points >= 0 and incc_revenue_share_basis_points <= 10000)
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
  )
);
