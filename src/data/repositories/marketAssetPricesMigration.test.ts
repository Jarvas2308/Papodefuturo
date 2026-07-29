import { describe, expect, it } from 'vitest'
import migration from '../../../supabase/migrations/20260729010000_create_market_asset_prices.sql?raw'

describe('market_asset_prices migration', () => {
  it('creates a global table without user_id', () => {
    const tableStart = migration.indexOf(
      'create table public.market_asset_prices'
    )
    const tableEnd = migration.indexOf(');', tableStart)
    expect(tableStart).toBeGreaterThanOrEqual(0)
    const tableBody = migration.slice(tableStart, tableEnd)
    expect(tableBody).not.toMatch(/\buser_id\b/)
  })

  it('enables RLS with a single select-only policy for authenticated', () => {
    expect(migration).toContain(
      'alter table public.market_asset_prices enable row level security'
    )
    expect(migration).toContain(
      'create policy "Authenticated users can read global market asset prices"'
    )
    expect(migration).toContain('for select')
    expect(migration).toContain('to authenticated')
    expect(migration).toContain('using (true)')
  })

  it('revokes anon/authenticated table access and grants writes only to service_role', () => {
    expect(migration).toContain(
      'revoke all on table public.market_asset_prices from anon'
    )
    expect(migration).toContain(
      'revoke all on table public.market_asset_prices from authenticated'
    )
    expect(migration).toContain(
      'grant select on table public.market_asset_prices to authenticated'
    )
    expect(migration).toContain(
      'grant select, insert, update, delete\non table public.market_asset_prices\nto service_role'
    )
  })

  it('defines a single security definer RPC with a fixed search_path', () => {
    expect(migration).toContain(
      'create function public.upsert_market_asset_prices_v1(records jsonb)'
    )
    expect(migration).toContain('security definer')
    expect(migration).toContain('set search_path = pg_catalog, public')
  })

  it('never qualifies coalesce by schema', () => {
    expect(migration).not.toMatch(/pg_catalog\.coalesce/i)
  })

  it('prefixes every PL/pgSQL variable with v_ to avoid column-name collisions', () => {
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

  it('enforces a 100-record batch limit and a dedicated advisory lock', () => {
    expect(migration).toContain('v_record_count > 100')
    expect(migration).toContain('pg_advisory_xact_lock(4826317092550671821)')
  })

  it('rejects records that set id or created_at', () => {
    expect(migration).toContain("v_item ? 'id' or v_item ? 'created_at'")
  })

  it('validates the complete 6-column insertable row shape', () => {
    expect(migration).toContain('v_key_count <> 6')
    for (const column of [
      'ticker',
      'market',
      'currency',
      'price_minor',
      'priced_at',
      'source',
    ]) {
      expect(migration).toContain(`v_item ? '${column}'`)
    }
  })

  it('upserts on ticker + source + priced_at', () => {
    expect(migration).toContain('on conflict (ticker, source, priced_at)')
    expect(migration).toContain('do update set')
  })

  it('revokes public/anon/authenticated execute and grants only service_role', () => {
    expect(migration).toContain(
      'revoke all on function public.upsert_market_asset_prices_v1(jsonb) from public'
    )
    expect(migration).toContain(
      'revoke all on function public.upsert_market_asset_prices_v1(jsonb) from anon'
    )
    expect(migration).toContain(
      'revoke all on function public.upsert_market_asset_prices_v1(jsonb) from authenticated'
    )
    expect(migration).toContain(
      'grant execute on function public.upsert_market_asset_prices_v1(jsonb) to service_role'
    )
  })

  it('revokes direct write access from service_role now that the RPC is the only writer', () => {
    expect(migration).toContain(
      'revoke insert, update, delete, truncate\non table public.market_asset_prices\nfrom service_role'
    )
  })
})
