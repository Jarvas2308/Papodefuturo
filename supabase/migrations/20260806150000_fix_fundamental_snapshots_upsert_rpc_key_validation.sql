-- Corrige upsert_fundamental_snapshots_v1: a validacao de chaves ficou
-- travada em v_key_count = 24 desde a migration original
-- (20260728120000), mas 6 migrations depois adicionaram 13 colunas novas
-- (vacancia/indexador/concentracao/WALE pra FII - DEC-085 -, dívida
-- líquida/EBITDA pra ação - DEC-094) sem tocar a RPC. Resultado real:
-- desde 04/08/2026 nenhum desses campos podia ser escrito pela RPC (nem
-- pelo pipeline de ingestao real, que so passa por ela) - toda vez que
-- esses campos foram populados em producao foi via UPDATE SQL direto
-- (ver DEC-094, docs/ROADMAP.md), nunca pelo caminho automatizado
-- pretendido. Descoberto ao tentar rodar
-- scripts/run-fundamentals-ingestion.ts --provider=cvm-stocks
-- --source=DFP --year=2025 (buscar FY2024 pra viabilizar comparacao ano
-- contra ano do sinal de payout, DEC-097) e receber "fundamental
-- snapshot record has invalid fields".
--
-- Os 3 writers TypeScript (supabaseFundamentalSnapshots.ts,
-- supabaseRealEstateFundSnapshots(Trimestral).ts,
-- supabaseInternationalEtfSnapshots.ts) mandam conjuntos de chaves
-- diferentes por `kind`, sempre os mesmos all-or-nothing dentro de cada
-- kind (confirmado lendo os 3 arquivos):
--   brazilian-stock   -> 24 originais + 5 campos de dívida/EBITDA = 29
--   real-estate-fund  -> 24 originais + 8 campos de FII (mensal e
--                        trimestral mandam o mesmo conjunto de chaves,
--                        só diferem em quais ficam null) = 32
--   international-etf -> 24 originais, inalterado = 24
-- A validacao vira condicional por `kind`, espelhando exatamente os 3
-- ramos do CHECK constraint da tabela (nunca inventado, é o mesmo
-- particionamento que a tabela já impõe).

create or replace function public.upsert_fundamental_snapshots_v1(records jsonb)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_record_count integer;
  v_item jsonb;
  v_key_count integer;
  v_kind text;
  v_upserted_count integer;
begin
  if records is null or pg_catalog.jsonb_typeof(records) <> 'array' then
    raise exception using
      errcode = '22023',
      message = 'fundamental snapshots batch must be an array';
  end if;

  v_record_count := pg_catalog.jsonb_array_length(records);
  if v_record_count > 500 then
    raise exception using
      errcode = '22023',
      message = 'fundamental snapshots batch exceeds 500 records';
  end if;

  if v_record_count = 0 then
    return pg_catalog.jsonb_build_object('attempted', 0, 'upserted', 0);
  end if;

  for v_item in
    select value
    from pg_catalog.jsonb_array_elements(records)
  loop
    if pg_catalog.jsonb_typeof(v_item) <> 'object' then
      raise exception using
        errcode = '22023',
        message = 'fundamental snapshot record must be an object';
    end if;

    if v_item ? 'id' or v_item ? 'created_at' or v_item ? 'updated_at' then
      raise exception using
        errcode = '22023',
        message =
          'fundamental snapshot record must not set id, created_at, or updated_at';
    end if;

    select pg_catalog.count(*)
    into v_key_count
    from pg_catalog.jsonb_object_keys(v_item);

    v_kind := v_item->>'kind';

    if v_kind = 'brazilian-stock' then
      if v_key_count <> 29
        or not (
          v_item ? 'ticker'
          and v_item ? 'category'
          and v_item ? 'market'
          and v_item ? 'kind'
          and v_item ? 'period'
          and v_item ? 'source'
          and v_item ? 'reference_date'
          and v_item ? 'source_document_id'
          and v_item ? 'source_archive'
          and v_item ? 'filing_version'
          and v_item ? 'exercise_order'
          and v_item ? 'currency'
          and v_item ? 'total_revenue_minor'
          and v_item ? 'net_income_minor'
          and v_item ? 'total_assets_minor'
          and v_item ? 'total_equity_minor'
          and v_item ? 'operating_cash_flow_minor'
          and v_item ? 'provenance'
          and v_item ? 'net_asset_value_minor'
          and v_item ? 'issued_shares_unscaled'
          and v_item ? 'issued_shares_scale'
          and v_item ? 'shareholder_count'
          and v_item ? 'total_liabilities_minor'
          and v_item ? 'net_assets_minor'
          and v_item ? 'financial_debt_current_minor'
          and v_item ? 'financial_debt_noncurrent_minor'
          and v_item ? 'cash_and_equivalents_minor'
          and v_item ? 'ebit_minor'
          and v_item ? 'depreciation_and_amortization_minor'
        )
      then
        raise exception using
          errcode = '22023',
          message = 'fundamental snapshot record has invalid fields';
      end if;
    elsif v_kind = 'real-estate-fund' then
      if v_key_count <> 32
        or not (
          v_item ? 'ticker'
          and v_item ? 'category'
          and v_item ? 'market'
          and v_item ? 'kind'
          and v_item ? 'period'
          and v_item ? 'source'
          and v_item ? 'reference_date'
          and v_item ? 'source_document_id'
          and v_item ? 'source_archive'
          and v_item ? 'filing_version'
          and v_item ? 'exercise_order'
          and v_item ? 'currency'
          and v_item ? 'total_revenue_minor'
          and v_item ? 'net_income_minor'
          and v_item ? 'total_assets_minor'
          and v_item ? 'total_equity_minor'
          and v_item ? 'operating_cash_flow_minor'
          and v_item ? 'provenance'
          and v_item ? 'net_asset_value_minor'
          and v_item ? 'issued_shares_unscaled'
          and v_item ? 'issued_shares_scale'
          and v_item ? 'shareholder_count'
          and v_item ? 'total_liabilities_minor'
          and v_item ? 'net_assets_minor'
          and v_item ? 'vacancy_basis_points'
          and v_item ? 'ipca_revenue_share_basis_points'
          and v_item ? 'igpm_revenue_share_basis_points'
          and v_item ? 'inpc_revenue_share_basis_points'
          and v_item ? 'incc_revenue_share_basis_points'
          and v_item ? 'tenant_concentration_basis_points'
          and v_item ? 'quarterly_net_financial_result_minor'
          and v_item ? 'wale_months_x100'
        )
      then
        raise exception using
          errcode = '22023',
          message = 'fundamental snapshot record has invalid fields';
      end if;
    elsif v_kind = 'international-etf' then
      if v_key_count <> 24
        or not (
          v_item ? 'ticker'
          and v_item ? 'category'
          and v_item ? 'market'
          and v_item ? 'kind'
          and v_item ? 'period'
          and v_item ? 'source'
          and v_item ? 'reference_date'
          and v_item ? 'source_document_id'
          and v_item ? 'source_archive'
          and v_item ? 'filing_version'
          and v_item ? 'exercise_order'
          and v_item ? 'currency'
          and v_item ? 'total_revenue_minor'
          and v_item ? 'net_income_minor'
          and v_item ? 'total_assets_minor'
          and v_item ? 'total_equity_minor'
          and v_item ? 'operating_cash_flow_minor'
          and v_item ? 'provenance'
          and v_item ? 'net_asset_value_minor'
          and v_item ? 'issued_shares_unscaled'
          and v_item ? 'issued_shares_scale'
          and v_item ? 'shareholder_count'
          and v_item ? 'total_liabilities_minor'
          and v_item ? 'net_assets_minor'
        )
      then
        raise exception using
          errcode = '22023',
          message = 'fundamental snapshot record has invalid fields';
      end if;
    else
      raise exception using
        errcode = '22023',
        message = 'fundamental snapshot record has an unknown kind';
    end if;
  end loop;

  -- Stable contract-specific key: fundamental_snapshots.upsert.v1.
  perform pg_catalog.pg_advisory_xact_lock(4188732654013927442);

  insert into public.fundamental_snapshots (
    ticker,
    category,
    market,
    kind,
    period,
    source,
    reference_date,
    source_document_id,
    source_archive,
    filing_version,
    exercise_order,
    currency,
    total_revenue_minor,
    net_income_minor,
    total_assets_minor,
    total_equity_minor,
    operating_cash_flow_minor,
    provenance,
    net_asset_value_minor,
    issued_shares_unscaled,
    issued_shares_scale,
    shareholder_count,
    total_liabilities_minor,
    net_assets_minor,
    financial_debt_current_minor,
    financial_debt_noncurrent_minor,
    cash_and_equivalents_minor,
    ebit_minor,
    depreciation_and_amortization_minor,
    vacancy_basis_points,
    ipca_revenue_share_basis_points,
    igpm_revenue_share_basis_points,
    inpc_revenue_share_basis_points,
    incc_revenue_share_basis_points,
    tenant_concentration_basis_points,
    quarterly_net_financial_result_minor,
    wale_months_x100
  )
  select
    populated.ticker,
    populated.category,
    populated.market,
    populated.kind,
    populated.period,
    populated.source,
    populated.reference_date,
    populated.source_document_id,
    populated.source_archive,
    populated.filing_version,
    populated.exercise_order,
    populated.currency,
    populated.total_revenue_minor,
    populated.net_income_minor,
    populated.total_assets_minor,
    populated.total_equity_minor,
    populated.operating_cash_flow_minor,
    populated.provenance,
    populated.net_asset_value_minor,
    populated.issued_shares_unscaled,
    populated.issued_shares_scale,
    populated.shareholder_count,
    populated.total_liabilities_minor,
    populated.net_assets_minor,
    populated.financial_debt_current_minor,
    populated.financial_debt_noncurrent_minor,
    populated.cash_and_equivalents_minor,
    populated.ebit_minor,
    populated.depreciation_and_amortization_minor,
    populated.vacancy_basis_points,
    populated.ipca_revenue_share_basis_points,
    populated.igpm_revenue_share_basis_points,
    populated.inpc_revenue_share_basis_points,
    populated.incc_revenue_share_basis_points,
    populated.tenant_concentration_basis_points,
    populated.quarterly_net_financial_result_minor,
    populated.wale_months_x100
  from pg_catalog.jsonb_populate_recordset(
    null::public.fundamental_snapshots,
    records
  ) as populated
  on conflict (
    ticker,
    category,
    market,
    kind,
    period,
    source,
    reference_date,
    source_document_id
  )
  do update set
    source_archive = excluded.source_archive,
    filing_version = excluded.filing_version,
    exercise_order = excluded.exercise_order,
    currency = excluded.currency,
    total_revenue_minor = excluded.total_revenue_minor,
    net_income_minor = excluded.net_income_minor,
    total_assets_minor = excluded.total_assets_minor,
    total_equity_minor = excluded.total_equity_minor,
    operating_cash_flow_minor = excluded.operating_cash_flow_minor,
    provenance = excluded.provenance,
    net_asset_value_minor = excluded.net_asset_value_minor,
    issued_shares_unscaled = excluded.issued_shares_unscaled,
    issued_shares_scale = excluded.issued_shares_scale,
    shareholder_count = excluded.shareholder_count,
    total_liabilities_minor = excluded.total_liabilities_minor,
    net_assets_minor = excluded.net_assets_minor,
    financial_debt_current_minor = excluded.financial_debt_current_minor,
    financial_debt_noncurrent_minor = excluded.financial_debt_noncurrent_minor,
    cash_and_equivalents_minor = excluded.cash_and_equivalents_minor,
    ebit_minor = excluded.ebit_minor,
    depreciation_and_amortization_minor = excluded.depreciation_and_amortization_minor,
    vacancy_basis_points = excluded.vacancy_basis_points,
    ipca_revenue_share_basis_points = excluded.ipca_revenue_share_basis_points,
    igpm_revenue_share_basis_points = excluded.igpm_revenue_share_basis_points,
    inpc_revenue_share_basis_points = excluded.inpc_revenue_share_basis_points,
    incc_revenue_share_basis_points = excluded.incc_revenue_share_basis_points,
    tenant_concentration_basis_points = excluded.tenant_concentration_basis_points,
    quarterly_net_financial_result_minor = excluded.quarterly_net_financial_result_minor,
    wale_months_x100 = excluded.wale_months_x100;

  get diagnostics v_upserted_count = row_count;

  return pg_catalog.jsonb_build_object(
    'attempted', v_record_count,
    'upserted', v_upserted_count
  );
end;
$$;

comment on function public.upsert_fundamental_snapshots_v1(jsonb) is
'Atomically upserts global fundamental snapshot batches for server-side callers, keyed by logical identity. Key validation is conditional on kind (brazilian-stock=29, real-estate-fund=32, international-etf=24 keys), mirroring the table CHECK constraint.';
