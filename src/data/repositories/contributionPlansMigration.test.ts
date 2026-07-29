import { describe, expect, it } from 'vitest'
import migration from '../../../supabase/migrations/20260729130000_create_contribution_plans.sql?raw'

describe('contribution_plans/contribution_plan_items migration', () => {
  it('creates per-user tables with user_id referencing auth.users', () => {
    expect(migration).toContain('create table public.contribution_plans')
    expect(migration).toContain('create table public.contribution_plan_items')
    expect(migration).toMatch(
      /user_id uuid not null references auth\.users\(id\) on delete cascade/
    )
  })

  it('constrains contribution_plans status to the full lifecycle', () => {
    expect(migration).toContain(
      "status in ('draft', 'presented', 'accepted', 'rejected', 'confirmed')"
    )
  })

  it('links items to plans and assets with restrict/cascade semantics', () => {
    expect(migration).toContain(
      'references public.contribution_plans(id) on delete cascade'
    )
    expect(migration).toContain(
      'references public.assets(id) on delete restrict'
    )
    expect(migration).toContain(
      'references public.purchases(id) on delete set null'
    )
  })

  it('enforces one item per asset per plan', () => {
    expect(migration).toContain(
      'constraint contribution_plan_items_plan_asset_unique unique (\n    contribution_plan_id,\n    asset_id\n  )'
    )
  })

  it('enables RLS on both tables with (select auth.uid()) ownership', () => {
    expect(migration).toContain(
      'alter table public.contribution_plans enable row level security'
    )
    expect(migration).toContain(
      'alter table public.contribution_plan_items enable row level security'
    )
    expect(
      migration.match(/\(select auth\.uid\(\)\)/g)?.length
    ).toBeGreaterThan(4)
  })

  it('validates ownership of both the parent plan and the asset on item writes', () => {
    const insertPolicyStart = migration.indexOf(
      'create policy "Users can insert their own contribution plan items"'
    )
    const insertPolicyEnd = migration.indexOf(');', insertPolicyStart)
    const insertPolicy = migration.slice(insertPolicyStart, insertPolicyEnd)
    expect(insertPolicy).toContain('from public.contribution_plans')
    expect(insertPolicy).toContain('from public.assets')
  })

  it('grants contribution_plans full CRUD but contribution_plan_items no delete', () => {
    expect(migration).toContain(
      'grant select, insert, update, delete\non table public.contribution_plans\nto authenticated'
    )
    expect(migration).toContain(
      'grant select, insert, update\non table public.contribution_plan_items\nto authenticated'
    )
  })
})
