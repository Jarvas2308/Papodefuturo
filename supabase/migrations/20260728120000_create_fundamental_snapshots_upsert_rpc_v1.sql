-- RPC transacional de upsert para public.fundamental_snapshots, fechando a
-- assimetria com os eventos oficiais: ate aqui os tres adapters de fundamentos
-- (acoes brasileiras, FIIs, ETFs internacionais) escreviam direto na tabela via
-- .upsert(...) do client, sem camada de validacao server-side alem das CHECK
-- constraints e do grant de service_role. Eventos oficiais ja usam uma RPC
-- transacional (upsert_official_asset_events_v1); esta migration aplica o
-- mesmo padrao para fundamentos.
--
-- Licao estrutural dos bugs reais de upsert_official_asset_events_v1 (PRs #91
-- e #92, docs/PROJECT_HANDOFF.md secao 8): toda variavel PL/pgSQL usa prefixo
-- v_ para nunca colidir com nome de coluna real da tabela, e COALESCE nunca e
-- qualificado por schema (nao e uma funcao do catalogo, e uma forma especial
-- da gramatica SQL).
--
-- Diferente do record de eventos oficiais (identidade regulatoria com deteccao
-- de colisao entre id e chave de deduplicacao), fundamental_snapshots tem uma
-- unica identidade logica natural, ja usada como onConflict pelos tres
-- adapters: (ticker, category, market, kind, period, source, reference_date,
-- source_document_id). Por isso a RPC pode usar INSERT ... ON CONFLICT DO
-- UPDATE em lote, sem a maquina de classificacao de conflito usada em eventos.

create function public.upsert_fundamental_snapshots_v1(records jsonb)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_record_count integer;
  v_item jsonb;
  v_key_count integer;
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
    net_assets_minor
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
    populated.net_assets_minor
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
    net_assets_minor = excluded.net_assets_minor;

  get diagnostics v_upserted_count = row_count;

  return pg_catalog.jsonb_build_object(
    'attempted', v_record_count,
    'upserted', v_upserted_count
  );
end;
$$;

comment on function public.upsert_fundamental_snapshots_v1(jsonb) is
'Atomically upserts global fundamental snapshot batches for server-side callers, keyed by logical identity.';

revoke all on function public.upsert_fundamental_snapshots_v1(jsonb) from public;
revoke all on function public.upsert_fundamental_snapshots_v1(jsonb) from anon;
revoke all on function public.upsert_fundamental_snapshots_v1(jsonb) from authenticated;
grant execute on function public.upsert_fundamental_snapshots_v1(jsonb) to service_role;

revoke insert, update, delete, truncate
on table public.fundamental_snapshots
from service_role;
