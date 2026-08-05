-- Sprint 16, Fase 2 (DEC-076): vacancia ponderada de FII, fonte
-- cvm-fii-inf-trimestral. Distinta de cvm-fii-inf-mensal (mesmo kind
-- real-estate-fund, fonte/periodo diferentes) - mensal continua sem
-- vacancia, trimestral so contribui vacancia, nunca patrimonio/cotas.
--
-- docs/reference/FII_SEGMENTOS_E_METRICAS.md, secao 7.1: vacancia vem da
-- tabela `imovel` do Informe Trimestral Estruturado, uma linha por imovel.
-- Valor gravado aqui e' a media ponderada por receita entre os imoveis do
-- fundo no trimestre mais recente, nao o dado bruto por imovel - o dado
-- por imovel fica so na provenance (jsonb), auditavel mas nao column
-- propria, para nao precisar de tabela relacional nova nesta fatia.

alter table public.fundamental_snapshots
add column vacancy_basis_points integer;

alter table public.fundamental_snapshots
add constraint fundamental_snapshots_vacancy_basis_points_check check (
  vacancy_basis_points is null
  or (vacancy_basis_points >= 0 and vacancy_basis_points <= 10000)
);

alter table public.fundamental_snapshots
drop constraint fundamental_snapshots_kind_identity_check,
drop constraint fundamental_snapshots_kind_metadata_check;

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
    and (
      (source = 'cvm-fii-inf-mensal' and period = 'monthly')
      or (source = 'cvm-fii-inf-trimestral' and period = 'quarterly')
    )
  )
  or (
    kind = 'international-etf'
    and category = 'international-etf'
    and market = 'US'
    and source = 'sec-nport'
    and period = 'monthly'
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
    and vacancy_basis_points is null
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
  )
);
