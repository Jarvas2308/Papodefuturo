import { describe, expect, it } from 'vitest'
import sql from '../../../../../supabase/migrations/20260719221733_create_official_events_backfill_checkpoint_v1.sql?raw'

const normalized = sql.toLowerCase().replace(/\s+/g, ' ')

describe('official events controlled backfill checkpoint migration v1', () => {
  it('creates exactly the two global checkpoint tables', () => {
    expect(normalized).toContain(
      'create table public.official_event_backfill_runs'
    )
    expect(normalized).toContain(
      'create table public.official_event_backfill_jobs'
    )
    expect(normalized.match(/create table /g)).toHaveLength(2)
    expect(normalized).not.toContain(
      'create table public.official_asset_events'
    )
  })

  it('keeps runs and jobs global without portfolio or auth ownership', () => {
    expect(normalized).not.toMatch(/\buser_id\b|\bportfolio_id\b|\basset_id\b/)
    expect(normalized).not.toContain('auth.users')
    expect(normalized).not.toContain('auth.uid')
  })

  it('uses deterministic primary and unique identities without cascading deletes', () => {
    expect(normalized).toContain('plan_id text primary key')
    expect(normalized).toContain('plan_hash text not null unique')
    expect(normalized).toContain(
      'constraint official_event_backfill_jobs_pkey primary key (plan_id, job_id)'
    )
    expect(normalized).toContain(
      'constraint official_event_backfill_jobs_plan_ordinal_key unique'
    )
    expect(normalized).toContain('on delete restrict')
    expect(normalized).not.toContain('on delete cascade')
  })

  it('closes versions, providers, statuses, attempts, counters, and payload types', () => {
    for (const value of [
      'official-events-backfill-plan.v1',
      "failure_mode in ('continue', 'stop')",
      "provider in ('cvm-ipe', 'cvm-fund-delivery', 'sec-edgar')",
      "status in ('pending', 'running', 'succeeded', 'failed', 'conflict')",
      'max_attempts_per_job between 1 and 10',
      'attempt_count between 0 and 10',
      "jsonb_typeof(plan_payload) = 'object'",
      "jsonb_typeof(job_payload) = 'object'",
      "jsonb_typeof(result_summary) = 'object'",
      "jsonb_typeof(error_summary) = 'object'",
    ])
      expect(normalized).toContain(value)
    expect(normalized).toContain(
      'pending_jobs + running_jobs + succeeded_jobs + failed_jobs + conflict_jobs = total_jobs'
    )
  })

  it('enforces coherent leases, terminal results, and monotonic timestamps', () => {
    expect(normalized).toContain(
      'lease_expires_at::timestamptz > lease_acquired_at::timestamptz'
    )
    expect(normalized).toContain("status = 'running'")
    expect(normalized).toContain(
      "status in ('succeeded', 'failed', 'conflict')"
    )
    expect(normalized).toContain(
      'completed_at::timestamptz >= started_at::timestamptz'
    )
    expect(normalized).toContain(
      'updated_at::timestamptz >= created_at::timestamptz'
    )
  })

  it('creates useful nonredundant operational indexes', () => {
    for (const index of [
      'official_event_backfill_runs_status_idx',
      'official_event_backfill_runs_updated_at_idx',
      'official_event_backfill_jobs_status_idx',
      'official_event_backfill_jobs_provider_idx',
      'official_event_backfill_jobs_lease_expires_at_idx',
      'official_event_backfill_jobs_updated_at_idx',
    ])
      expect(normalized).toContain(`create index ${index}`)
    expect(normalized).not.toContain(
      'create index official_event_backfill_jobs_plan_ordinal_idx'
    )
  })

  it('enables RLS and denies every direct table privilege', () => {
    expect(normalized).toContain(
      'alter table public.official_event_backfill_runs enable row level security'
    )
    expect(normalized).toContain(
      'alter table public.official_event_backfill_jobs enable row level security'
    )
    expect(normalized).toContain(
      'revoke all on table public.official_event_backfill_runs from public, anon, authenticated, service_role'
    )
    expect(normalized).toContain(
      'revoke all on table public.official_event_backfill_jobs from public, anon, authenticated, service_role'
    )
    expect(normalized).not.toContain('create policy')
    expect(normalized).not.toMatch(
      /grant (select|insert|update|delete|all) on table/
    )
  })

  it('defines every versioned checkpoint operation plus transactional release and pause', () => {
    for (const rpc of [
      'create_or_resume_official_event_backfill_v1',
      'claim_official_event_backfill_jobs_v1',
      'complete_official_event_backfill_job_v1',
      'fail_official_event_backfill_job_v1',
      'release_official_event_backfill_jobs_v1',
      'pause_official_event_backfill_v1',
      'get_official_event_backfill_snapshot_v1',
      'finalize_official_event_backfill_v1',
    ]) {
      expect(normalized).toContain(`create function public.${rpc}`)
      expect(normalized).toContain(`grant execute on function public.${rpc}`)
    }
  })

  it('secures RPCs with definer rights, fixed paths, and service-role-only grants', () => {
    expect(
      normalized.match(/security definer/g)?.length
    ).toBeGreaterThanOrEqual(8)
    expect(
      normalized.match(/set search_path = pg_catalog, public/g)?.length
    ).toBeGreaterThanOrEqual(8)
    expect(normalized).toContain('from public, anon, authenticated')
    expect(normalized).not.toMatch(
      /grant execute .* to (public|anon|authenticated)/
    )
    expect(normalized).not.toMatch(/\bexecute\s+['"]/)
  })

  it('claims with row locks, skip locked, ordinal ordering, leases, and one increment', () => {
    expect(normalized).toContain('for update skip locked')
    expect(normalized).toContain('order by job.ordinal')
    expect(normalized).toContain('attempt_count = job.attempt_count + 1')
    expect(normalized).toContain(
      'job.lease_expires_at::timestamptz <= input_now::timestamptz'
    )
    expect(normalized).toContain("job.status = 'failed' and run.retry_failed")
    expect(normalized).not.toContain("job.status = 'conflict' and")
  })

  it('validates ownership and live leases for terminal operations', () => {
    expect(
      normalized.match(/job\.lease_owner <> input_worker_id/g)
    ).toHaveLength(2)
    expect(
      normalized.match(
        /job\.lease_expires_at::timestamptz <= input_now::timestamptz/g
      )?.length
    ).toBeGreaterThanOrEqual(3)
  })

  it('finalizes only without eligible work and preserves failure outcomes', () => {
    expect(normalized).toContain("job.status in ('pending', 'running')")
    expect(normalized).toContain("then 'completed-with-failures'")
    expect(normalized).toContain("else 'completed'")
  })

  it('stores only summaries rather than events or regulatory payloads', () => {
    expect(normalized).toContain('result_summary jsonb')
    expect(normalized).toContain('error_summary jsonb')
    expect(normalized).not.toMatch(
      /raw_fields|raw_document|html|pdf|csv|zip|user_agent/
    )
  })

  it('does not create unauthorized runtime infrastructure', () => {
    expect(normalized).not.toMatch(
      /create trigger|cron|scheduler|edge function|github action|create policy|create extension/
    )
  })
})
