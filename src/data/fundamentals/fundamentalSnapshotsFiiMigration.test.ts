import { describe, expect, it } from 'vitest'
import originalMigration from '../../../supabase/migrations/20260715191221_create_fundamental_snapshots.sql?raw'
import migration from '../../../supabase/migrations/20260716114539_generalize_fundamental_snapshots_for_fii.sql?raw'

describe('fundamental_snapshots FII generalization migration', () => {
  it('alters the existing global table without recreating or deleting it', () => {
    expect(migration).toContain('alter table public.fundamental_snapshots')
    expect(migration).not.toContain('create table')
    expect(migration).not.toContain('drop table')
    expect(migration).not.toMatch(/\buser_id\b/)
    expect(migration).not.toContain('references public.assets')
  })

  it('adds the class-specific FII fact columns with scaled shares', () => {
    expect(migration).toContain('net_asset_value_minor bigint')
    expect(migration).toContain('issued_shares_unscaled bigint')
    expect(migration).toContain('issued_shares_scale smallint')
    expect(migration).not.toMatch(/\bissued_shares bigint\b/)
    expect(migration).toContain('shareholder_count bigint')
  })

  it('keeps filing version required and only makes exercise order nullable', () => {
    expect(migration).not.toContain('alter column filing_version drop not null')
    expect(migration).not.toContain(
      'drop constraint fundamental_snapshots_filing_version_check'
    )
    expect(migration).toContain('alter column exercise_order drop not null')
    expect(migration.match(/and filing_version is not null/g)).toHaveLength(2)
    expect(migration.match(/and filing_version > 0/g)).toHaveLength(2)
    expect(migration).toContain('and exercise_order is null')
  })

  it('preserves Brazilian-stock identity, filing and fact semantics', () => {
    expect(migration).toContain("kind = 'brazilian-stock'")
    expect(migration).toContain("category = 'brazilian-stock'")
    expect(migration).toContain("source = 'cvm-dfp'")
    expect(migration).toContain("source = 'cvm-itr'")
    expect(migration).toContain('and filing_version is not null')
    expect(migration).toContain('and filing_version > 0')
    expect(migration).toContain('and net_asset_value_minor is null')
    expect(migration).toContain('and issued_shares_unscaled is null')
    expect(migration).toContain('and issued_shares_scale is null')
    expect(migration).toContain('and shareholder_count is null')
  })

  it('restricts FII records to the official source, category, market and period', () => {
    expect(migration).toContain("kind = 'real-estate-fund'")
    expect(migration).toContain("category = 'real-estate-fund'")
    expect(migration).toContain("market = 'BR'")
    expect(migration).toContain("source = 'cvm-fii-inf-mensal'")
    expect(migration).toContain("period = 'monthly'")
  })

  it('requires stock facts to be null for FII records', () => {
    for (const column of [
      'total_revenue_minor',
      'net_income_minor',
      'total_assets_minor',
      'total_equity_minor',
      'operating_cash_flow_minor',
    ]) {
      expect(migration).toContain(`and ${column} is null`)
    }
  })

  it('requires the scaled share pair to be null or populated together', () => {
    expect(migration).toContain(
      'constraint fundamental_snapshots_issued_shares_presence_check'
    )
    expect(migration).toContain('issued_shares_unscaled is null')
    expect(migration).toContain('issued_shares_scale is null')
    expect(migration).toContain('issued_shares_unscaled is not null')
    expect(migration).toContain('issued_shares_scale is not null')
  })

  it('allows only null or non-negative scaled shares and shareholder counts', () => {
    expect(migration).toContain(
      'constraint fundamental_snapshots_issued_shares_value_check'
    )
    expect(migration).toContain('issued_shares_unscaled >= 0')
    expect(migration).toContain('issued_shares_scale >= 0')
    expect(migration).toContain(
      'shareholder_count is null or shareholder_count >= 0'
    )
  })

  it('leaves the original RLS, grants, trigger and logical identity in place', () => {
    expect(originalMigration).toContain(
      'alter table public.fundamental_snapshots enable row level security'
    )
    expect(originalMigration).toContain(
      'grant select on table public.fundamental_snapshots to authenticated'
    )
    expect(originalMigration).toContain(
      'create trigger set_fundamental_snapshots_updated_at'
    )
    expect(originalMigration).toContain(
      'constraint fundamental_snapshots_logical_identity_unique unique'
    )
    expect(migration).not.toContain('disable row level security')
    expect(migration).not.toContain(
      'drop constraint fundamental_snapshots_logical_identity_unique'
    )
  })
})
