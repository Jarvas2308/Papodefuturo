import { describe, expect, it } from 'vitest'
import migration from '../../../supabase/migrations/20260728120000_create_fundamental_snapshots_upsert_rpc_v1.sql?raw'

describe('fundamental_snapshots upsert RPC migration', () => {
  it('defines a single security definer function with a fixed search_path', () => {
    expect(migration).toContain(
      'create function public.upsert_fundamental_snapshots_v1(records jsonb)'
    )
    expect(migration).toContain('security definer')
    expect(migration).toContain('set search_path = pg_catalog, public')
  })

  it('never qualifies coalesce by schema', () => {
    // Licao estrutural do PR #91 (docs/PROJECT_HANDOFF.md secao 8):
    // pg_catalog.coalesce nao existe, COALESCE e uma forma especial da
    // gramatica SQL, nao uma funcao do catalogo.
    expect(migration).not.toMatch(/pg_catalog\.coalesce/i)
  })

  it('prefixes every PL/pgSQL variable with v_ to avoid column-name collisions', () => {
    // Licao estrutural do PR #92: variaveis com o mesmo nome de colunas reais
    // (ex.: event_id) sao ambiguas dentro de SQL embutido sob
    // plpgsql.variable_conflict = error (padrao do Postgres).
    const declareBlock = migration.slice(
      migration.indexOf('declare') + 'declare'.length,
      migration.indexOf('begin')
    )
    const declaredNames = declareBlock
      .split('\n')
      .map((line) => /^\s*(\w+)\s+\w+/.exec(line)?.[1])
      .filter((name): name is string => Boolean(name))
    expect(declaredNames.length).toBeGreaterThan(0)
    for (const name of declaredNames) {
      expect(name.startsWith('v_')).toBe(true)
    }
  })

  it('enforces a 500-record batch limit and a dedicated advisory lock', () => {
    expect(migration).toContain('v_record_count > 500')
    expect(migration).toContain('pg_advisory_xact_lock(4188732654013927442)')
  })

  it('rejects records that set id, created_at, or updated_at', () => {
    expect(migration).toContain(
      "v_item ? 'id' or v_item ? 'created_at' or v_item ? 'updated_at'"
    )
  })

  it('validates the complete 24-column insertable row shape', () => {
    expect(migration).toContain('v_key_count <> 24')
    for (const column of [
      'ticker',
      'category',
      'market',
      'kind',
      'period',
      'source',
      'reference_date',
      'source_document_id',
      'source_archive',
      'filing_version',
      'exercise_order',
      'currency',
      'total_revenue_minor',
      'net_income_minor',
      'total_assets_minor',
      'total_equity_minor',
      'operating_cash_flow_minor',
      'provenance',
      'net_asset_value_minor',
      'issued_shares_unscaled',
      'issued_shares_scale',
      'shareholder_count',
      'total_liabilities_minor',
      'net_assets_minor',
    ]) {
      expect(migration).toContain(`v_item ? '${column}'`)
    }
  })

  it('upserts on the complete logical identity used by the three adapters', () => {
    expect(migration).toContain(
      'on conflict (\n    ticker,\n    category,\n    market,\n    kind,\n    period,\n    source,\n    reference_date,\n    source_document_id\n  )'
    )
    expect(migration).toContain('do update set')
  })

  it('revokes public/anon/authenticated execute and grants only service_role', () => {
    expect(migration).toContain(
      'revoke all on function public.upsert_fundamental_snapshots_v1(jsonb) from public'
    )
    expect(migration).toContain(
      'revoke all on function public.upsert_fundamental_snapshots_v1(jsonb) from anon'
    )
    expect(migration).toContain(
      'revoke all on function public.upsert_fundamental_snapshots_v1(jsonb) from authenticated'
    )
    expect(migration).toContain(
      'grant execute on function public.upsert_fundamental_snapshots_v1(jsonb) to service_role'
    )
  })

  it('revokes direct write access from service_role now that the RPC is the only writer', () => {
    expect(migration).toContain(
      'revoke insert, update, delete, truncate\non table public.fundamental_snapshots\nfrom service_role'
    )
  })
})
