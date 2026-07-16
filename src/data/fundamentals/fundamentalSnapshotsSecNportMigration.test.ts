import { describe, expect, it } from 'vitest'
import originalMigration from '../../../supabase/migrations/20260715191221_create_fundamental_snapshots.sql?raw'
import fiiMigration from '../../../supabase/migrations/20260716114539_generalize_fundamental_snapshots_for_fii.sql?raw'
import migration from '../../../supabase/migrations/20260716152012_generalize_fundamental_snapshots_for_sec_nport.sql?raw'

describe('fundamental_snapshots SEC N-PORT generalization migration', () => {
  it('alters the global table without recreating, deleting or adding user ownership', () => {
    expect(migration).toContain('alter table public.fundamental_snapshots')
    expect(migration).not.toContain('create table')
    expect(migration).not.toContain('drop table')
    expect(migration).not.toMatch(/\bdelete from\b/)
    expect(migration).not.toMatch(/\buser_id\b/)
    expect(migration).not.toContain('references public.assets')
  })

  it('adds liabilities and net assets while reusing total assets', () => {
    expect(migration).toContain('total_liabilities_minor bigint')
    expect(migration).toContain('net_assets_minor bigint')
    expect(migration).not.toContain('add column total_assets_minor')
  })

  it('makes filing version nullable and discriminates SEC from CVM', () => {
    expect(migration).toContain('alter column filing_version drop not null')
    expect(migration).toContain(
      'drop constraint fundamental_snapshots_filing_version_check'
    )
    expect(migration).toContain(
      "kind in ('brazilian-stock', 'real-estate-fund')"
    )
    expect(migration).toContain('and filing_version > 0')
    expect(migration).toContain("kind = 'international-etf'")
    expect(migration).toContain('and filing_version is null')
  })

  it('permits only the three approved kind identities and sources', () => {
    expect(migration).toContain("kind = 'brazilian-stock'")
    expect(migration).toContain("source = 'cvm-dfp'")
    expect(migration).toContain("source = 'cvm-itr'")
    expect(migration).toContain("kind = 'real-estate-fund'")
    expect(migration).toContain("source = 'cvm-fii-inf-mensal'")
    expect(migration).toContain("kind = 'international-etf'")
    expect(migration).toContain("category = 'international-etf'")
    expect(migration).toContain("market = 'US'")
    expect(migration).toContain("source = 'sec-nport'")
    expect(migration).toContain("period = 'monthly'")
  })

  it('discriminates BRL and USD by kind', () => {
    expect(migration).toContain("kind = 'brazilian-stock' and currency = 'BRL'")
    expect(migration).toContain(
      "kind = 'real-estate-fund' and currency = 'BRL'"
    )
    expect(migration).toContain(
      "kind = 'international-etf' and currency = 'USD'"
    )
  })

  it('preserves stock and FII fact isolation while adding ETF isolation', () => {
    expect(migration).toContain('and total_liabilities_minor is null')
    expect(migration).toContain('and net_assets_minor is null')
    expect(migration.match(/and total_assets_minor is null/g)).toHaveLength(1)
    expect(migration.match(/and net_asset_value_minor is null/g)).toHaveLength(
      2
    )
    expect(migration).toContain('and issued_shares_unscaled is null')
    expect(migration).toContain('and shareholder_count is null')
  })

  it('does not derive or require the three SEC monetary facts', () => {
    expect(migration).not.toMatch(
      /net_assets_minor\s*=\s*total_assets_minor\s*-\s*total_liabilities_minor/
    )
    expect(migration).not.toContain('total_liabilities_minor is not null')
    expect(migration).not.toContain('net_assets_minor is not null')
  })

  it('preserves RLS, grants, trigger and logical uniqueness from prior migrations', () => {
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
    expect(fiiMigration).toContain(
      'constraint fundamental_snapshots_issued_shares_presence_check'
    )
    expect(migration).not.toContain('disable row level security')
    expect(migration).not.toContain('drop policy')
    expect(migration).not.toContain('revoke ')
    expect(migration).not.toContain('grant ')
    expect(migration).not.toContain(
      'drop constraint fundamental_snapshots_logical_identity_unique'
    )
  })
})
