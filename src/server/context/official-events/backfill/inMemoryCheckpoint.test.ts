import { describe, expect, it } from 'vitest'
import { createInMemoryOfficialEventsBackfillCheckpointStorageV1 } from './inMemoryCheckpoint'
import { prepareOfficialEventsBackfillPlanV1 } from './planner'

const T0 = '2026-07-19T12:00:00.123456789Z'
const T1 = '2026-07-19T12:00:01.123456789Z'
const T31 = '2026-07-19T12:00:31.123456789Z'
const T32 = '2026-07-19T12:00:32.123456789Z'

function plan(input?: { retryFailed?: boolean; attempts?: number }) {
  return prepareOfficialEventsBackfillPlanV1({
    backfillVersion: 'official-events-backfill-plan.v1',
    failureMode: 'continue',
    retryFailed: input?.retryFailed ?? true,
    maxAttemptsPerJob: input?.attempts ?? 2,
    sources: [{ provider: 'cvm-ipe', fromYear: 2024, toYear: 2025 }],
  })
}

const SUMMARY = {
  fetchedEventCount: 3,
  persistedAttemptCount: 3,
  rejectedItemCount: 1,
}

async function createAndClaim(input?: {
  retryFailed?: boolean
  attempts?: number
  limit?: number
}) {
  const storage = createInMemoryOfficialEventsBackfillCheckpointStorageV1()
  const prepared = plan(input)
  await storage.createOrResumePlan({ plan: prepared, now: T0 })
  const claimed = await storage.claimNextJobs({
    planId: prepared.planId,
    workerId: 'worker-a',
    limit: input?.limit ?? 1,
    leaseDurationSeconds: 30,
    now: T1,
  })
  return { storage, prepared, claimed }
}

describe('in-memory official events backfill checkpoint v1', () => {
  it('creates a global pending run with deterministic jobs and counters', async () => {
    const storage = createInMemoryOfficialEventsBackfillCheckpointStorageV1()
    const prepared = plan()
    const snapshot = await storage.createOrResumePlan({
      plan: prepared,
      now: T0,
    })
    expect(snapshot).toMatchObject({
      planId: prepared.planId,
      status: 'pending',
      totalJobs: 2,
      pendingJobs: 2,
      runningJobs: 0,
    })
    expect(snapshot.jobs.map((job) => job.ordinal)).toEqual([0, 1])
  })

  it('resumes the same run without creating jobs again', async () => {
    const storage = createInMemoryOfficialEventsBackfillCheckpointStorageV1()
    const prepared = plan()
    await storage.createOrResumePlan({ plan: prepared, now: T0 })
    const resumed = await storage.createOrResumePlan({
      plan: prepared,
      now: T1,
    })
    expect(resumed.createdAt).toBe(T0)
    expect(resumed.jobs).toHaveLength(2)
  })

  it('rejects a tampered prepared plan sharing a deterministic planId', async () => {
    const storage = createInMemoryOfficialEventsBackfillCheckpointStorageV1()
    const prepared = plan()
    await storage.createOrResumePlan({ plan: prepared, now: T0 })
    await expect(
      storage.createOrResumePlan({
        plan: { ...prepared, planHash: 'fnv1a64:0000000000000000' },
        now: T1,
      })
    ).rejects.toThrow(/inconsistent/)
  })

  it('claims in ordinal order and honors the limit', async () => {
    const { claimed } = await createAndClaim({ limit: 1 })
    expect(claimed).toHaveLength(1)
    expect(claimed[0]).toMatchObject({
      ordinal: 0,
      status: 'running',
      attemptCount: 1,
      leaseOwner: 'worker-a',
      leaseAcquiredAt: T1,
      leaseExpiresAt: '2026-07-19T12:00:31.123456789Z',
    })
  })

  it('does not let another worker take an active lease', async () => {
    const { storage, prepared } = await createAndClaim()
    const second = await storage.claimNextJobs({
      planId: prepared.planId,
      workerId: 'worker-b',
      limit: 1,
      leaseDurationSeconds: 30,
      now: '2026-07-19T12:00:02.123456789Z',
    })
    expect(second[0]?.ordinal).toBe(1)
  })

  it('recovers an expired lease and increments attempts exactly once', async () => {
    const { storage, prepared, claimed } = await createAndClaim()
    const recovered = await storage.claimNextJobs({
      planId: prepared.planId,
      workerId: 'worker-b',
      limit: 2,
      leaseDurationSeconds: 30,
      now: T31,
    })
    expect(
      recovered.find((job) => job.jobId === claimed[0]?.jobId)
    ).toMatchObject({ leaseOwner: 'worker-b', attemptCount: 2 })
  })

  it('completes a job only with its current unexpired lease', async () => {
    const { storage, prepared, claimed } = await createAndClaim()
    const completed = await storage.completeJob({
      planId: prepared.planId,
      jobId: claimed[0]!.jobId,
      workerId: 'worker-a',
      now: '2026-07-19T12:00:02.123456789Z',
      summary: SUMMARY,
    })
    expect(completed).toMatchObject({
      status: 'succeeded',
      resultSummary: SUMMARY,
      leaseOwner: null,
    })
  })

  it('rejects completion by a different worker', async () => {
    const { storage, prepared, claimed } = await createAndClaim()
    await expect(
      storage.completeJob({
        planId: prepared.planId,
        jobId: claimed[0]!.jobId,
        workerId: 'worker-b',
        now: '2026-07-19T12:00:02.123456789Z',
        summary: SUMMARY,
      })
    ).rejects.toThrow(/not owned/)
  })

  it('rejects completion at or after lease expiry', async () => {
    const { storage, prepared, claimed } = await createAndClaim()
    await expect(
      storage.completeJob({
        planId: prepared.planId,
        jobId: claimed[0]!.jobId,
        workerId: 'worker-a',
        now: T31,
        summary: SUMMARY,
      })
    ).rejects.toThrow(/expired/)
  })

  it('rejects double completion', async () => {
    const { storage, prepared, claimed } = await createAndClaim()
    const input = {
      planId: prepared.planId,
      jobId: claimed[0]!.jobId,
      workerId: 'worker-a',
      now: '2026-07-19T12:00:02.123456789Z',
      summary: SUMMARY,
    }
    await storage.completeJob(input)
    await expect(
      storage.completeJob({ ...input, now: '2026-07-19T12:00:03.123456789Z' })
    ).rejects.toThrow(/not owned/)
  })

  it('records failed and conflict as distinct terminal states', async () => {
    const { storage, prepared, claimed } = await createAndClaim({ limit: 2 })
    await storage.failJob({
      planId: prepared.planId,
      jobId: claimed[0]!.jobId,
      workerId: 'worker-a',
      now: '2026-07-19T12:00:02.123456789Z',
      disposition: 'failed',
      summary: SUMMARY,
      error: { category: 'network', code: 'timeout', message: 'Safe timeout' },
    })
    await storage.failJob({
      planId: prepared.planId,
      jobId: claimed[1]!.jobId,
      workerId: 'worker-a',
      now: '2026-07-19T12:00:03.123456789Z',
      disposition: 'conflict',
      summary: SUMMARY,
      error: null,
    })
    const snapshot = await storage.getPlanSnapshot(prepared.planId)
    expect(snapshot).toMatchObject({ failedJobs: 1, conflictJobs: 1 })
  })

  it('does not retry failed jobs when retryFailed is false', async () => {
    const { storage, prepared, claimed } = await createAndClaim({
      retryFailed: false,
    })
    await storage.failJob({
      planId: prepared.planId,
      jobId: claimed[0]!.jobId,
      workerId: 'worker-a',
      now: '2026-07-19T12:00:02.123456789Z',
      disposition: 'failed',
      summary: SUMMARY,
      error: null,
    })
    const next = await storage.claimNextJobs({
      planId: prepared.planId,
      workerId: 'worker-b',
      limit: 2,
      leaseDurationSeconds: 30,
      now: '2026-07-19T12:00:03.123456789Z',
    })
    expect(next.map((job) => job.ordinal)).toEqual([1])
  })

  it('retries failed jobs only in a later explicit claim', async () => {
    const { storage, prepared, claimed } = await createAndClaim()
    await storage.failJob({
      planId: prepared.planId,
      jobId: claimed[0]!.jobId,
      workerId: 'worker-a',
      now: '2026-07-19T12:00:02.123456789Z',
      disposition: 'failed',
      summary: SUMMARY,
      error: null,
    })
    const retry = await storage.claimNextJobs({
      planId: prepared.planId,
      workerId: 'worker-b',
      limit: 1,
      leaseDurationSeconds: 30,
      now: '2026-07-19T12:00:03.123456789Z',
    })
    expect(retry[0]).toMatchObject({ ordinal: 0, attemptCount: 2 })
  })

  it('never retries conflicts', async () => {
    const { storage, prepared, claimed } = await createAndClaim()
    await storage.failJob({
      planId: prepared.planId,
      jobId: claimed[0]!.jobId,
      workerId: 'worker-a',
      now: '2026-07-19T12:00:02.123456789Z',
      disposition: 'conflict',
      summary: SUMMARY,
      error: null,
    })
    const next = await storage.claimNextJobs({
      planId: prepared.planId,
      workerId: 'worker-b',
      limit: 2,
      leaseDurationSeconds: 30,
      now: '2026-07-19T12:00:03.123456789Z',
    })
    expect(next.map((job) => job.ordinal)).toEqual([1])
  })

  it('respects maxAttemptsPerJob', async () => {
    const { storage, prepared, claimed } = await createAndClaim({ attempts: 1 })
    await storage.failJob({
      planId: prepared.planId,
      jobId: claimed[0]!.jobId,
      workerId: 'worker-a',
      now: '2026-07-19T12:00:02.123456789Z',
      disposition: 'failed',
      summary: SUMMARY,
      error: null,
    })
    const next = await storage.claimNextJobs({
      planId: prepared.planId,
      workerId: 'worker-b',
      limit: 2,
      leaseDurationSeconds: 30,
      now: '2026-07-19T12:00:03.123456789Z',
    })
    expect(next.map((job) => job.ordinal)).toEqual([1])
  })

  it('releases unstarted claims transactionally without consuming attempts', async () => {
    const { storage, prepared, claimed } = await createAndClaim({ limit: 2 })
    const released = await storage.releaseJobs({
      planId: prepared.planId,
      jobIds: claimed.map((job) => job.jobId),
      workerId: 'worker-a',
      now: '2026-07-19T12:00:02.123456789Z',
      pausePlan: false,
    })
    expect(released.map((job) => [job.status, job.attemptCount])).toEqual([
      ['pending', 0],
      ['pending', 0],
    ])
  })

  it('does not partially release when one lease is invalid', async () => {
    const { storage, prepared, claimed } = await createAndClaim({ limit: 2 })
    await storage.completeJob({
      planId: prepared.planId,
      jobId: claimed[0]!.jobId,
      workerId: 'worker-a',
      now: '2026-07-19T12:00:02.123456789Z',
      summary: SUMMARY,
    })
    await expect(
      storage.releaseJobs({
        planId: prepared.planId,
        jobIds: claimed.map((job) => job.jobId),
        workerId: 'worker-a',
        now: '2026-07-19T12:00:03.123456789Z',
        pausePlan: false,
      })
    ).rejects.toThrow()
    const snapshot = await storage.getPlanSnapshot(prepared.planId)
    expect(snapshot.jobs[1]?.status).toBe('running')
  })

  it('pauses only after all claims have been released and resumes explicitly', async () => {
    const { storage, prepared, claimed } = await createAndClaim()
    await expect(
      storage.pausePlan({ planId: prepared.planId, now: T1 })
    ).rejects.toThrow(/running/)
    await storage.releaseJobs({
      planId: prepared.planId,
      jobIds: [claimed[0]!.jobId],
      workerId: 'worker-a',
      now: '2026-07-19T12:00:02.123456789Z',
      pausePlan: false,
    })
    expect(
      await storage.pausePlan({
        planId: prepared.planId,
        now: '2026-07-19T12:00:03.123456789Z',
      })
    ).toMatchObject({ status: 'paused' })
    expect(
      await storage.createOrResumePlan({
        plan: prepared,
        now: '2026-07-19T12:00:04.123456789Z',
      })
    ).toMatchObject({ status: 'running' })
  })

  it('finalizes completed only after every job succeeded', async () => {
    const { storage, prepared, claimed } = await createAndClaim({ limit: 2 })
    for (let index = 0; index < claimed.length; index += 1)
      await storage.completeJob({
        planId: prepared.planId,
        jobId: claimed[index]!.jobId,
        workerId: 'worker-a',
        now: `2026-07-19T12:00:0${index + 2}.123456789Z`,
        summary: SUMMARY,
      })
    const finalized = await storage.finalizePlan({
      planId: prepared.planId,
      now: '2026-07-19T12:00:04.123456789Z',
    })
    expect(finalized).toMatchObject({
      status: 'completed',
      completedAt: expect.any(String),
    })
  })

  it('finalizes completed-with-failures after terminal failures', async () => {
    const { storage, prepared, claimed } = await createAndClaim({
      retryFailed: false,
      limit: 2,
    })
    await storage.failJob({
      planId: prepared.planId,
      jobId: claimed[0]!.jobId,
      workerId: 'worker-a',
      now: '2026-07-19T12:00:02.123456789Z',
      disposition: 'failed',
      summary: SUMMARY,
      error: null,
    })
    await storage.failJob({
      planId: prepared.planId,
      jobId: claimed[1]!.jobId,
      workerId: 'worker-a',
      now: '2026-07-19T12:00:03.123456789Z',
      disposition: 'conflict',
      summary: SUMMARY,
      error: null,
    })
    const finalized = await storage.finalizePlan({
      planId: prepared.planId,
      now: '2026-07-19T12:00:04.123456789Z',
    })
    expect(finalized.status).toBe('completed-with-failures')
  })

  it('does not finalize while pending, running, or retryable failed work exists', async () => {
    const { storage, prepared, claimed } = await createAndClaim()
    await storage.failJob({
      planId: prepared.planId,
      jobId: claimed[0]!.jobId,
      workerId: 'worker-a',
      now: '2026-07-19T12:00:02.123456789Z',
      disposition: 'failed',
      summary: SUMMARY,
      error: null,
    })
    const current = await storage.finalizePlan({
      planId: prepared.planId,
      now: '2026-07-19T12:00:03.123456789Z',
    })
    expect(current.status).toBe('running')
    expect(current.completedAt).toBeNull()
  })

  it('finalize is idempotent', async () => {
    const storage = createInMemoryOfficialEventsBackfillCheckpointStorageV1()
    const prepared = prepareOfficialEventsBackfillPlanV1({
      backfillVersion: 'official-events-backfill-plan.v1',
      failureMode: 'continue',
      retryFailed: false,
      maxAttemptsPerJob: 1,
      sources: [{ provider: 'cvm-ipe', fromYear: 2025, toYear: 2025 }],
    })
    await storage.createOrResumePlan({ plan: prepared, now: T0 })
    const [job] = await storage.claimNextJobs({
      planId: prepared.planId,
      workerId: 'worker-a',
      limit: 1,
      leaseDurationSeconds: 30,
      now: T1,
    })
    await storage.completeJob({
      planId: prepared.planId,
      jobId: job!.jobId,
      workerId: 'worker-a',
      now: '2026-07-19T12:00:02.123456789Z',
      summary: SUMMARY,
    })
    const first = await storage.finalizePlan({
      planId: prepared.planId,
      now: '2026-07-19T12:00:03.123456789Z',
    })
    const second = await storage.finalizePlan({
      planId: prepared.planId,
      now: T32,
    })
    expect(second).toEqual(first)
  })

  it('returns defensive snapshots', async () => {
    const storage = createInMemoryOfficialEventsBackfillCheckpointStorageV1()
    const prepared = plan()
    const first = await storage.createOrResumePlan({ plan: prepared, now: T0 })
    first.jobs[0]!.job.jobId = 'tampered'
    first.jobs.splice(1)
    const second = await storage.getPlanSnapshot(prepared.planId)
    expect(second.jobs).toHaveLength(2)
    expect(second.jobs[0]?.jobId).not.toBe('tampered')
  })

  it('conceptually serializes concurrent claims without duplicate ownership', async () => {
    const storage = createInMemoryOfficialEventsBackfillCheckpointStorageV1()
    const prepared = plan()
    await storage.createOrResumePlan({ plan: prepared, now: T0 })
    const [first, second] = await Promise.all([
      storage.claimNextJobs({
        planId: prepared.planId,
        workerId: 'worker-a',
        limit: 1,
        leaseDurationSeconds: 30,
        now: T1,
      }),
      storage.claimNextJobs({
        planId: prepared.planId,
        workerId: 'worker-b',
        limit: 1,
        leaseDurationSeconds: 30,
        now: T1,
      }),
    ])
    expect(new Set([...first, ...second].map((job) => job.jobId)).size).toBe(2)
  })

  it.each([
    ['invalid worker', ' worker'],
    ['empty worker', ''],
  ])('rejects %s', async (_name, workerId) => {
    const { storage, prepared } = await createAndClaim()
    await expect(
      storage.claimNextJobs({
        planId: prepared.planId,
        workerId,
        limit: 1,
        leaseDurationSeconds: 30,
        now: T1,
      })
    ).rejects.toThrow()
  })

  it('rejects invalid timestamps, -0 counters, and invalid lease durations', async () => {
    const storage = createInMemoryOfficialEventsBackfillCheckpointStorageV1()
    const prepared = plan()
    await expect(
      storage.createOrResumePlan({ plan: prepared, now: 'not-a-date' })
    ).rejects.toThrow()
    await storage.createOrResumePlan({ plan: prepared, now: T0 })
    await expect(
      storage.claimNextJobs({
        planId: prepared.planId,
        workerId: 'worker-a',
        limit: -0,
        leaseDurationSeconds: 29,
        now: T1,
      })
    ).rejects.toThrow()
  })
})
