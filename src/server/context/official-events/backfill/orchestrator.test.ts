import { describe, expect, it, vi } from 'vitest'
import type {
  OfficialEventsServerExecutionResultV1,
  OfficialEventsServerExecutorV1,
  OfficialEventsServerJobV1,
} from '../types'
import { createInMemoryOfficialEventsBackfillCheckpointStorageV1 } from './inMemoryCheckpoint'
import { runOfficialEventsBackfillStepV1 } from './orchestrator'
import { previewOfficialEventsBackfillV1 } from './planner'
import type {
  OfficialEventsBackfillCheckpointStorageV1,
  OfficialEventsBackfillPlanInputV1,
} from './types'

function clock() {
  let calls = 0
  return () => {
    const value = new Date(Date.UTC(2026, 6, 19, 12, 0, calls)).toISOString()
    calls += 1
    return value
  }
}

function plan(
  failureMode: 'continue' | 'stop' = 'continue'
): OfficialEventsBackfillPlanInputV1 {
  return {
    backfillVersion: 'official-events-backfill-plan.v1',
    failureMode,
    retryFailed: false,
    maxAttemptsPerJob: 2,
    sources: [{ provider: 'cvm-ipe', fromYear: 2023, toYear: 2025 }],
  }
}

function execution(
  job: OfficialEventsServerJobV1,
  status: 'succeeded' | 'failed' | 'conflict'
): OfficialEventsServerExecutionResultV1 {
  const safeError =
    status === 'failed'
      ? {
          category: 'provider' as const,
          code: 'provider-failed',
          message: 'Official event provider failed',
        }
      : null
  return {
    executionVersion: 'official-events-server-execution.v1',
    startedAt: '2026-07-19T12:00:00Z',
    completedAt: '2026-07-19T12:00:01Z',
    totalJobs: 1,
    succeededJobs: status === 'succeeded' ? 1 : 0,
    failedJobs: status === 'failed' ? 1 : 0,
    conflictJobs: status === 'conflict' ? 1 : 0,
    totalFetchedEvents: 4,
    totalPersistedAttempts: status === 'failed' ? 0 : 4,
    jobs: [
      {
        jobId: job.jobId,
        provider: job.provider,
        status,
        startedAt: '2026-07-19T12:00:00Z',
        completedAt: '2026-07-19T12:00:01Z',
        fetchedEventCount: 4,
        rejectedItemCount: 1,
        providerCounters: null,
        rejectedItems: [],
        providerDuplicates: [],
        providerConflicts: [],
        persistenceResult:
          status === 'failed'
            ? null
            : {
                attempted: 4,
                inserted: 4,
                updated: 0,
                unchanged: 0,
                staleIgnored: 0,
                conflicts: status === 'conflict' ? 1 : 0,
                items: [],
              },
        error: safeError,
        warnings: [],
      },
    ],
  }
}

function executor(
  statuses: readonly ('succeeded' | 'failed' | 'conflict')[] = ['succeeded']
) {
  let index = 0
  const execute = vi.fn(async (jobs: readonly OfficialEventsServerJobV1[]) => {
    const job = jobs[0]
    if (!job) throw new Error('missing test job')
    const status = statuses[index] ?? statuses[statuses.length - 1]
    index += 1
    if (!status) throw new Error('missing test status')
    return execution(job, status)
  })
  return { execute } satisfies OfficialEventsServerExecutorV1
}

describe('official events controlled backfill orchestrator v1', () => {
  it('previews without invoking executor, checkpoint, network, or Supabase', () => {
    const preview = previewOfficialEventsBackfillV1(plan())
    expect(preview.executed).toBe(false)
    expect(preview.totalJobs).toBe(3)
  })

  it('executes one claimed job and returns only summarized data', async () => {
    const fakeExecutor = executor()
    const result = await runOfficialEventsBackfillStepV1({
      plan: plan(),
      workerId: 'worker-a',
      maxJobs: 1,
      leaseDurationSeconds: 300,
      dependencies: {
        checkpointStorage:
          createInMemoryOfficialEventsBackfillCheckpointStorageV1(),
        executor: fakeExecutor,
        now: clock(),
      },
    })
    expect(result).toMatchObject({
      claimedJobs: 1,
      succeededJobs: 1,
      failedJobs: 0,
      hasMoreWork: true,
    })
    expect(result.jobs[0]).toEqual(
      expect.objectContaining({
        fetchedEventCount: 4,
        persistedAttemptCount: 4,
        rejectedItemCount: 1,
      })
    )
    expect(result.jobs[0]).not.toHaveProperty('events')
    expect(fakeExecutor.execute).toHaveBeenCalledTimes(1)
  })

  it('limits a step to maxJobs and resumes from the checkpoint', async () => {
    const storage = createInMemoryOfficialEventsBackfillCheckpointStorageV1()
    const fakeExecutor = executor()
    const now = clock()
    const first = await runOfficialEventsBackfillStepV1({
      plan: plan(),
      workerId: 'worker-a',
      maxJobs: 2,
      leaseDurationSeconds: 300,
      dependencies: { checkpointStorage: storage, executor: fakeExecutor, now },
    })
    const second = await runOfficialEventsBackfillStepV1({
      plan: plan(),
      workerId: 'worker-b',
      maxJobs: 2,
      leaseDurationSeconds: 300,
      dependencies: { checkpointStorage: storage, executor: fakeExecutor, now },
    })
    expect(first.jobs.map((job) => job.ordinal)).toEqual([0, 1])
    expect(second.jobs.map((job) => job.ordinal)).toEqual([2])
    expect(second.planSnapshot.status).toBe('completed')
    expect(fakeExecutor.execute).toHaveBeenCalledTimes(3)
  })

  it('never executes succeeded jobs again', async () => {
    const storage = createInMemoryOfficialEventsBackfillCheckpointStorageV1()
    const fakeExecutor = executor()
    const now = clock()
    for (let step = 0; step < 2; step += 1)
      await runOfficialEventsBackfillStepV1({
        plan: plan(),
        workerId: `worker-${step}`,
        maxJobs: 3,
        leaseDurationSeconds: 300,
        dependencies: {
          checkpointStorage: storage,
          executor: fakeExecutor,
          now,
        },
      })
    expect(fakeExecutor.execute).toHaveBeenCalledTimes(3)
  })

  it('continues already claimed jobs after failure in continue mode', async () => {
    const fakeExecutor = executor(['failed', 'succeeded', 'succeeded'])
    const result = await runOfficialEventsBackfillStepV1({
      plan: plan('continue'),
      workerId: 'worker-a',
      maxJobs: 3,
      leaseDurationSeconds: 300,
      dependencies: {
        checkpointStorage:
          createInMemoryOfficialEventsBackfillCheckpointStorageV1(),
        executor: fakeExecutor,
        now: clock(),
      },
    })
    expect(result.jobs.map((job) => job.executorStatus)).toEqual([
      'failed',
      'succeeded',
      'succeeded',
    ])
    expect(result.planSnapshot.status).toBe('completed-with-failures')
  })

  it('stops, releases unstarted jobs, and pauses after failure in stop mode', async () => {
    const fakeExecutor = executor(['failed'])
    const storage = createInMemoryOfficialEventsBackfillCheckpointStorageV1()
    const result = await runOfficialEventsBackfillStepV1({
      plan: plan('stop'),
      workerId: 'worker-a',
      maxJobs: 3,
      leaseDurationSeconds: 300,
      dependencies: {
        checkpointStorage: storage,
        executor: fakeExecutor,
        now: clock(),
      },
    })
    expect(fakeExecutor.execute).toHaveBeenCalledTimes(1)
    expect(result.planSnapshot).toMatchObject({
      status: 'paused',
      pendingJobs: 2,
      runningJobs: 0,
      failedJobs: 1,
    })
  })

  it('preserves conflict instead of converting it to failure', async () => {
    const result = await runOfficialEventsBackfillStepV1({
      plan: plan('stop'),
      workerId: 'worker-a',
      maxJobs: 1,
      leaseDurationSeconds: 300,
      dependencies: {
        checkpointStorage:
          createInMemoryOfficialEventsBackfillCheckpointStorageV1(),
        executor: executor(['conflict']),
        now: clock(),
      },
    })
    expect(result).toMatchObject({
      conflictJobs: 1,
      failedJobs: 0,
      planSnapshot: { status: 'paused' },
    })
    expect(result.jobs[0]?.checkpointDisposition).toBe('conflict')
  })

  it('records a safe failure when executor throws', async () => {
    const throwingExecutor: OfficialEventsServerExecutorV1 = {
      async execute() {
        throw new Error('secret provider payload')
      },
    }
    const result = await runOfficialEventsBackfillStepV1({
      plan: plan(),
      workerId: 'worker-a',
      maxJobs: 1,
      leaseDurationSeconds: 300,
      dependencies: {
        checkpointStorage:
          createInMemoryOfficialEventsBackfillCheckpointStorageV1(),
        executor: throwingExecutor,
        now: clock(),
      },
    })
    expect(result.jobs[0]?.safeError).toEqual({
      category: 'contract',
      code: 'executor-step-failed',
      message: 'Official events executor failed before returning a result',
    })
    expect(JSON.stringify(result)).not.toContain('secret provider payload')
  })

  it('records a safe failure when executor returns another job identity', async () => {
    const mismatchedExecutor: OfficialEventsServerExecutorV1 = {
      async execute(jobs) {
        const result = execution(jobs[0]!, 'succeeded')
        result.jobs[0]!.jobId = 'official-events-job:v1:wrong'
        return result
      },
    }
    const result = await runOfficialEventsBackfillStepV1({
      plan: plan(),
      workerId: 'worker-a',
      maxJobs: 1,
      leaseDurationSeconds: 300,
      dependencies: {
        checkpointStorage:
          createInMemoryOfficialEventsBackfillCheckpointStorageV1(),
        executor: mismatchedExecutor,
        now: clock(),
      },
    })
    expect(result.jobs[0]?.safeError).toEqual({
      category: 'contract',
      code: 'executor-contract-invalid',
      message: 'Official events executor returned an inconsistent job result',
    })
    expect(result.planSnapshot.failedJobs).toBe(1)
  })

  it('interrupts safely when checkpoint persistence fails', async () => {
    const storage = createInMemoryOfficialEventsBackfillCheckpointStorageV1()
    const failingStorage: OfficialEventsBackfillCheckpointStorageV1 = {
      ...storage,
      async completeJob() {
        throw new Error('checkpoint unavailable')
      },
    }
    await expect(
      runOfficialEventsBackfillStepV1({
        plan: plan(),
        workerId: 'worker-a',
        maxJobs: 1,
        leaseDurationSeconds: 300,
        dependencies: {
          checkpointStorage: failingStorage,
          executor: executor(),
          now: clock(),
        },
      })
    ).rejects.toThrow(/checkpoint unavailable/)
  })

  it('does not claim an active lease but recovers it after expiry', async () => {
    const storage = createInMemoryOfficialEventsBackfillCheckpointStorageV1()
    const prepared = await storage.createOrResumePlan({
      plan: (await import('./planner')).prepareOfficialEventsBackfillPlanV1(
        plan()
      ),
      now: '2026-07-19T12:00:00Z',
    })
    await storage.claimNextJobs({
      planId: prepared.planId,
      workerId: 'interrupted-worker',
      limit: 3,
      leaseDurationSeconds: 30,
      now: '2026-07-19T12:00:01Z',
    })
    const active = await runOfficialEventsBackfillStepV1({
      plan: plan(),
      workerId: 'worker-b',
      maxJobs: 3,
      leaseDurationSeconds: 30,
      dependencies: {
        checkpointStorage: storage,
        executor: executor(),
        now: () => '2026-07-19T12:00:02Z',
      },
    })
    expect(active.claimedJobs).toBe(0)
    const recovered = await runOfficialEventsBackfillStepV1({
      plan: plan(),
      workerId: 'worker-b',
      maxJobs: 3,
      leaseDurationSeconds: 30,
      dependencies: {
        checkpointStorage: storage,
        executor: executor(),
        now: () => '2026-07-19T12:00:31Z',
      },
    })
    expect(recovered.claimedJobs).toBe(3)
    expect(recovered.jobs.every((job) => job.attemptCount === 2)).toBe(true)
  })

  it('supports all three provider job types in deterministic order', async () => {
    const mixed: OfficialEventsBackfillPlanInputV1 = {
      ...plan(),
      sources: [
        { provider: 'cvm-ipe', fromYear: 2025, toYear: 2025 },
        {
          provider: 'cvm-fund-delivery',
          fromMonth: '2026-01',
          toMonth: '2026-01',
        },
        {
          provider: 'sec-edgar',
          fromDate: '2026-01-01',
          toDate: '2026-01-01',
          windowDays: 1,
        },
      ],
    }
    const result = await runOfficialEventsBackfillStepV1({
      plan: mixed,
      workerId: 'worker-a',
      maxJobs: 3,
      leaseDurationSeconds: 300,
      dependencies: {
        checkpointStorage:
          createInMemoryOfficialEventsBackfillCheckpointStorageV1(),
        executor: executor(),
        now: clock(),
      },
    })
    expect(result.jobs.map((job) => job.provider)).toEqual([
      'cvm-ipe',
      'cvm-fund-delivery',
      'sec-edgar',
    ])
  })

  it('validates maxJobs, workerId, lease, and nonempty plans before side effects', async () => {
    const dependencies = {
      checkpointStorage:
        createInMemoryOfficialEventsBackfillCheckpointStorageV1(),
      executor: executor(),
      now: clock(),
    }
    await expect(
      runOfficialEventsBackfillStepV1({
        plan: plan(),
        workerId: 'worker-a',
        maxJobs: 0,
        leaseDurationSeconds: 300,
        dependencies,
      })
    ).rejects.toThrow(/maxJobs/)
    await expect(
      runOfficialEventsBackfillStepV1({
        plan: { ...plan(), sources: [] },
        workerId: 'worker-a',
        maxJobs: 1,
        leaseDurationSeconds: 300,
        dependencies,
      })
    ).rejects.toThrow(/empty/)
  })

  it('keeps completion idempotent when a finished plan is stepped again', async () => {
    const storage = createInMemoryOfficialEventsBackfillCheckpointStorageV1()
    const fakeExecutor = executor()
    const now = clock()
    const single = {
      ...plan(),
      sources: [{ provider: 'cvm-ipe' as const, fromYear: 2025, toYear: 2025 }],
    }
    const first = await runOfficialEventsBackfillStepV1({
      plan: single,
      workerId: 'worker-a',
      maxJobs: 1,
      leaseDurationSeconds: 300,
      dependencies: { checkpointStorage: storage, executor: fakeExecutor, now },
    })
    const second = await runOfficialEventsBackfillStepV1({
      plan: single,
      workerId: 'worker-b',
      maxJobs: 1,
      leaseDurationSeconds: 300,
      dependencies: { checkpointStorage: storage, executor: fakeExecutor, now },
    })
    expect(first.planSnapshot.status).toBe('completed')
    expect(second).toMatchObject({ claimedJobs: 0, hasMoreWork: false })
    expect(fakeExecutor.execute).toHaveBeenCalledTimes(1)
  })
})
