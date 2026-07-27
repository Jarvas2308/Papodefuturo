import { describe, expect, it, vi } from 'vitest'
import { createInMemoryOfficialEventsBackfillCheckpointStorageV1 } from './inMemoryCheckpoint'
import { prepareOfficialEventsBackfillPlanV1 } from './planner'
import { createSupabaseOfficialEventsBackfillCheckpointStorageV1 } from './supabaseCheckpoint'
import type {
  OfficialEventsBackfillJsonValueV1,
  OfficialEventsBackfillRpcClientV1,
  OfficialEventsBackfillRpcResponseV1,
} from './types'

const NOW = '2026-07-19T12:00:00.123456789Z'

const PLAN = prepareOfficialEventsBackfillPlanV1({
  backfillVersion: 'official-events-backfill-plan.v1',
  failureMode: 'continue',
  retryFailed: true,
  maxAttemptsPerJob: 3,
  sources: [{ provider: 'cvm-ipe', fromYear: 2025, toYear: 2025 }],
})

async function snapshotFixture() {
  const memory = createInMemoryOfficialEventsBackfillCheckpointStorageV1()
  return memory.createOrResumePlan({ plan: PLAN, now: NOW })
}

function clientReturning(data: unknown) {
  const rpc = vi.fn(async (): Promise<OfficialEventsBackfillRpcResponseV1> => ({
    data,
    error: null,
  }))
  return { client: { rpc } satisfies OfficialEventsBackfillRpcClientV1, rpc }
}

describe('Supabase official events backfill checkpoint adapter v1', () => {
  it('maps create/resume to one approved RPC with explicit snake_case args', async () => {
    const fixture = await snapshotFixture()
    const { client, rpc } = clientReturning(fixture)
    const storage = createSupabaseOfficialEventsBackfillCheckpointStorageV1({
      client,
    })
    const result = await storage.createOrResumePlan({ plan: PLAN, now: NOW })
    expect(result).toEqual(fixture)
    expect(rpc).toHaveBeenCalledTimes(1)
    expect(rpc).toHaveBeenCalledWith(
      'create_or_resume_official_event_backfill_v1',
      expect.objectContaining({
        input_now: NOW,
        input_plan: expect.any(Object),
      })
    )
  })

  it('maps claim and deeply validates running lease state', async () => {
    const memory = createInMemoryOfficialEventsBackfillCheckpointStorageV1()
    await memory.createOrResumePlan({ plan: PLAN, now: NOW })
    const fixture = await memory.claimNextJobs({
      planId: PLAN.planId,
      workerId: 'worker-a',
      limit: 1,
      leaseDurationSeconds: 30,
      now: '2026-07-19T12:00:01.123456789Z',
    })
    const { client, rpc } = clientReturning(fixture)
    const storage = createSupabaseOfficialEventsBackfillCheckpointStorageV1({
      client,
    })
    const result = await storage.claimNextJobs({
      planId: PLAN.planId,
      workerId: 'worker-a',
      limit: 1,
      leaseDurationSeconds: 30,
      now: '2026-07-19T12:00:01.123456789Z',
    })
    expect(result).toEqual(fixture)
    expect(rpc).toHaveBeenCalledWith(
      'claim_official_event_backfill_jobs_v1',
      expect.objectContaining({
        input_plan_id: PLAN.planId,
        input_worker_id: 'worker-a',
        input_limit: 1,
        input_lease_duration_seconds: 30,
      })
    )
  })

  it('maps every mutating checkpoint operation to its single versioned RPC', async () => {
    const memory = createInMemoryOfficialEventsBackfillCheckpointStorageV1()
    const pending = await memory.createOrResumePlan({ plan: PLAN, now: NOW })
    const [running] = await memory.claimNextJobs({
      planId: PLAN.planId,
      workerId: 'worker-a',
      limit: 1,
      leaseDurationSeconds: 30,
      now: '2026-07-19T12:00:01.123456789Z',
    })
    const terminal = {
      ...running!,
      status: 'succeeded' as const,
      leaseOwner: null,
      leaseAcquiredAt: null,
      leaseExpiresAt: null,
      completedAt: '2026-07-19T12:00:02.123456789Z',
      fetchedEventCount: 1,
      persistedAttemptCount: 1,
      rejectedItemCount: 0,
      updatedAt: '2026-07-19T12:00:02.123456789Z',
      resultSummary: {
        fetchedEventCount: 1,
        persistedAttemptCount: 1,
        rejectedItemCount: 0,
      },
    }
    const responses = [
      terminal,
      { ...terminal, status: 'failed' },
      [pending.jobs[0]],
      pending,
      pending,
      pending,
    ]
    let index = 0
    const rpc = vi.fn(
      async (
        functionName: string,
        args: Record<string, OfficialEventsBackfillJsonValueV1>
      ) => {
        expect(functionName).not.toBe('')
        expect(args).toBeTypeOf('object')
        return { data: responses[index++], error: null }
      }
    )
    const storage = createSupabaseOfficialEventsBackfillCheckpointStorageV1({
      client: { rpc },
    })
    const summary = {
      fetchedEventCount: 1,
      persistedAttemptCount: 1,
      rejectedItemCount: 0,
    }
    await storage.completeJob({
      planId: PLAN.planId,
      jobId: running!.jobId,
      workerId: 'worker-a',
      now: terminal.completedAt,
      summary,
    })
    await storage.failJob({
      planId: PLAN.planId,
      jobId: running!.jobId,
      workerId: 'worker-a',
      now: terminal.completedAt,
      disposition: 'failed',
      summary,
      error: { category: 'network', code: 'timeout', message: 'Safe timeout' },
    })
    await storage.releaseJobs({
      planId: PLAN.planId,
      jobIds: [running!.jobId],
      workerId: 'worker-a',
      now: terminal.completedAt,
      pausePlan: true,
    })
    await storage.pausePlan({ planId: PLAN.planId, now: terminal.completedAt })
    await storage.getPlanSnapshot(PLAN.planId)
    await storage.finalizePlan({
      planId: PLAN.planId,
      now: terminal.completedAt,
    })
    expect(rpc.mock.calls.map(([name]) => name)).toEqual([
      'complete_official_event_backfill_job_v1',
      'fail_official_event_backfill_job_v1',
      'release_official_event_backfill_jobs_v1',
      'pause_official_event_backfill_v1',
      'get_official_event_backfill_snapshot_v1',
      'finalize_official_event_backfill_v1',
    ])
  })

  it('rejects extra, missing, and internally inconsistent response fields', async () => {
    const fixture = await snapshotFixture()
    for (const data of [
      { ...fixture, extra: true },
      Object.fromEntries(
        Object.entries(fixture).filter(([key]) => key !== 'status')
      ),
      { ...fixture, pendingJobs: 99 },
      {
        ...fixture,
        pendingJobs: 0,
        succeededJobs: 1,
      },
      {
        ...fixture,
        pendingJobs: 0,
        succeededJobs: 1,
        jobs: [
          {
            ...fixture.jobs[0],
            status: 'succeeded',
            startedAt: NOW,
            completedAt: NOW,
            fetchedEventCount: 1,
            resultSummary: {
              fetchedEventCount: 0,
              persistedAttemptCount: 0,
              rejectedItemCount: 0,
            },
          },
        ],
      },
      {
        ...fixture,
        jobs: [{ ...fixture.jobs[0], provider: 'sec-edgar' }],
      },
      { ...fixture, planId: 'official-events-backfill:v1:0000000000000000' },
    ]) {
      const { client } = clientReturning(data)
      const storage = createSupabaseOfficialEventsBackfillCheckpointStorageV1({
        client,
      })
      await expect(storage.getPlanSnapshot(PLAN.planId)).rejects.toThrow()
    }
  })

  it('rejects claimed jobs owned by another worker', async () => {
    const memory = createInMemoryOfficialEventsBackfillCheckpointStorageV1()
    await memory.createOrResumePlan({ plan: PLAN, now: NOW })
    const claimed = await memory.claimNextJobs({
      planId: PLAN.planId,
      workerId: 'worker-b',
      limit: 1,
      leaseDurationSeconds: 30,
      now: '2026-07-19T12:00:01.123456789Z',
    })
    const { client } = clientReturning(claimed)
    const storage = createSupabaseOfficialEventsBackfillCheckpointStorageV1({
      client,
    })
    await expect(
      storage.claimNextJobs({
        planId: PLAN.planId,
        workerId: 'worker-a',
        limit: 1,
        leaseDurationSeconds: 30,
        now: '2026-07-19T12:00:01.123456789Z',
      })
    ).rejects.toThrow(/request/)
  })

  it('sanitizes thrown and returned RPC errors without leaking provider details', async () => {
    const thrown: OfficialEventsBackfillRpcClientV1 = {
      async rpc() {
        throw new Error('service_role secret and raw SQL')
      },
    }
    await expect(
      createSupabaseOfficialEventsBackfillCheckpointStorageV1({
        client: thrown,
      }).getPlanSnapshot(PLAN.planId)
    ).rejects.toThrow('Official events backfill checkpoint RPC failed')
    const returned: OfficialEventsBackfillRpcClientV1 = {
      async rpc() {
        return {
          data: null,
          error: { message: 'raw Supabase error', code: 'P0001' },
        }
      },
    }
    await expect(
      createSupabaseOfficialEventsBackfillCheckpointStorageV1({
        client: returned,
      }).getPlanSnapshot(PLAN.planId)
    ).rejects.toThrow('Official events backfill checkpoint RPC failed')
  })

  it('returns defensive copies instead of RPC-owned references', async () => {
    const fixture = await snapshotFixture()
    const { client } = clientReturning(fixture)
    const result =
      await createSupabaseOfficialEventsBackfillCheckpointStorageV1({
        client,
      }).getPlanSnapshot(PLAN.planId)
    result.jobs[0]!.job.jobId = 'changed'
    expect(fixture.jobs[0]!.job.jobId).not.toBe('changed')
  })

  it('rejects invalid input before calling the RPC', async () => {
    const fixture = await snapshotFixture()
    const { client, rpc } = clientReturning(fixture)
    const storage = createSupabaseOfficialEventsBackfillCheckpointStorageV1({
      client,
    })
    await expect(
      storage.claimNextJobs({
        planId: PLAN.planId,
        workerId: ' worker',
        limit: 101,
        leaseDurationSeconds: 29,
        now: NOW,
      })
    ).rejects.toThrow()
    expect(rpc).not.toHaveBeenCalled()
  })
})
