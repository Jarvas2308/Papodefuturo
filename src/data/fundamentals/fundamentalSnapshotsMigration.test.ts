import { describe, expect, it } from 'vitest'
import migration from '../../../supabase/migrations/20260715191221_create_fundamental_snapshots.sql?raw'

describe('fundamental_snapshots migration', () => {
  it('creates a global table without user or per-user asset identity', () => {
    expect(migration).toContain('create table public.fundamental_snapshots')
    expect(migration).not.toMatch(/\buser_id\b/)
    expect(migration).not.toContain('references public.assets')
    expect(migration).toContain('ticker text not null')
    expect(migration).toContain('category text not null')
    expect(migration).toContain('market text not null')
  })

  it('stores every normalized Brazilian-stock fact and factual provenance', () => {
    expect(migration).toContain('total_revenue_minor bigint')
    expect(migration).toContain('net_income_minor bigint')
    expect(migration).toContain('total_assets_minor bigint')
    expect(migration).toContain('total_equity_minor bigint')
    expect(migration).toContain('operating_cash_flow_minor bigint')
    expect(migration).toContain('provenance jsonb not null')
  })

  it('defines the complete idempotent logical identity', () => {
    expect(migration).toContain(
      'constraint fundamental_snapshots_logical_identity_unique unique'
    )
    for (const column of [
      'ticker',
      'category',
      'market',
      'kind',
      'period',
      'source',
      'reference_date',
      'source_document_id',
    ]) {
      expect(migration).toContain(column)
    }
  })

  it('allows authenticated reads but reserves writes for service_role', () => {
    expect(migration).toContain(
      'alter table public.fundamental_snapshots enable row level security'
    )
    expect(migration).toContain('for select\nto authenticated\nusing (true)')
    expect(migration).toContain(
      'grant select on table public.fundamental_snapshots to authenticated'
    )
    expect(migration).not.toMatch(
      /grant\s+(?:insert|update|delete)[\s\S]*to authenticated/i
    )
    expect(migration).toContain(
      'grant select, insert, update, delete\non table public.fundamental_snapshots\nto service_role'
    )
  })
})
