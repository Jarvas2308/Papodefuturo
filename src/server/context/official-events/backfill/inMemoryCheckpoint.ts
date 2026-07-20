import { getUtcTimestampOrder } from '../validation'
import { prepareOfficialEventsBackfillPlanV1 } from './planner'
import type {
  OfficialEventsBackfillCheckpointStorageV1,
  OfficialEventsBackfillClaimedJobV1,
  OfficialEventsBackfillJobSnapshotV1,
  OfficialEventsBackfillPlanSnapshotV1,
  PreparedOfficialEventsBackfillPlanV1,
} from './types'
import {
  addSecondsPreservingPrecision,
  assertCanonicalUtc,
  assertDenseArray,
  assertErrorSummary,
  assertLeaseDuration,
  assertResultSummary,
  assertSafeCounter,
  assertUnpaddedText,
  assertWorkerId,
} from './validation'

type MutableJob = OfficialEventsBackfillJobSnapshotV1
type MutableRun = {
  plan: PreparedOfficialEventsBackfillPlanV1
  status: OfficialEventsBackfillPlanSnapshotV1['status']
  createdAt: string
  updatedAt: string
  completedAt: string | null
  jobs: MutableJob[]
}

function copyPlan(
  plan: PreparedOfficialEventsBackfillPlanV1
): PreparedOfficialEventsBackfillPlanV1 {
  return {
    ...plan,
    sources: plan.sources.map((source) => ({ ...source })),
    jobs: plan.jobs.map(({ ordinal, job }) => ({
      ordinal,
      job: { ...job },
    })),
  }
}

function copyJob(job: MutableJob): OfficialEventsBackfillJobSnapshotV1 {
  return {
    ...job,
    job: { ...job.job },
    resultSummary: job.resultSummary ? { ...job.resultSummary } : null,
    errorSummary: job.errorSummary ? { ...job.errorSummary } : null,
  }
}

function counters(jobs: readonly MutableJob[]) {
  return {
    pendingJobs: jobs.filter((job) => job.status === 'pending').length,
    runningJobs: jobs.filter((job) => job.status === 'running').length,
    succeededJobs: jobs.filter((job) => job.status === 'succeeded').length,
    failedJobs: jobs.filter((job) => job.status === 'failed').length,
    conflictJobs: jobs.filter((job) => job.status === 'conflict').length,
  }
}

function snapshot(run: MutableRun): OfficialEventsBackfillPlanSnapshotV1 {
  return {
    backfillVersion: run.plan.backfillVersion,
    planId: run.plan.planId,
    planHash: run.plan.planHash,
    failureMode: run.plan.failureMode,
    retryFailed: run.plan.retryFailed,
    maxAttemptsPerJob: run.plan.maxAttemptsPerJob,
    status: run.status,
    totalJobs: run.jobs.length,
    ...counters(run.jobs),
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
    completedAt: run.completedAt,
    jobs: run.jobs.map(copyJob),
  }
}

function samePlan(
  left: PreparedOfficialEventsBackfillPlanV1,
  right: PreparedOfficialEventsBackfillPlanV1
): boolean {
  if (
    left.planId !== right.planId ||
    left.planHash !== right.planHash ||
    left.failureMode !== right.failureMode ||
    left.retryFailed !== right.retryFailed ||
    left.maxAttemptsPerJob !== right.maxAttemptsPerJob ||
    left.totalJobs !== right.totalJobs ||
    left.sources.length !== right.sources.length ||
    left.jobs.length !== right.jobs.length
  )
    return false
  return (
    left.sources.every((source, index) => {
      const other = right.sources[index]
      if (!other || source.provider !== other.provider) return false
      if (source.provider === 'cvm-ipe' && other.provider === 'cvm-ipe')
        return (
          source.fromYear === other.fromYear && source.toYear === other.toYear
        )
      if (
        source.provider === 'cvm-fund-delivery' &&
        other.provider === 'cvm-fund-delivery'
      )
        return (
          source.fromMonth === other.fromMonth &&
          source.toMonth === other.toMonth
        )
      return (
        source.provider === 'sec-edgar' &&
        other.provider === 'sec-edgar' &&
        source.fromDate === other.fromDate &&
        source.toDate === other.toDate &&
        source.windowDays === other.windowDays
      )
    }) &&
    left.jobs.every(({ ordinal, job }, index) => {
      const other = right.jobs[index]
      if (!other || ordinal !== other.ordinal) return false
      if (job.jobId !== other.job.jobId || job.provider !== other.job.provider)
        return false
      if (job.provider === 'cvm-ipe' && other.job.provider === 'cvm-ipe')
        return job.year === other.job.year
      if (
        job.provider === 'cvm-fund-delivery' &&
        other.job.provider === 'cvm-fund-delivery'
      )
        return job.year === other.job.year && job.month === other.job.month
      return (
        job.provider === 'sec-edgar' &&
        other.job.provider === 'sec-edgar' &&
        job.fromDate === other.job.fromDate &&
        job.toDate === other.job.toDate
      )
    })
  )
}

function validatePreparedPlan(
  plan: PreparedOfficialEventsBackfillPlanV1
): PreparedOfficialEventsBackfillPlanV1 {
  const rebuilt = prepareOfficialEventsBackfillPlanV1({
    backfillVersion: plan.backfillVersion,
    failureMode: plan.failureMode,
    retryFailed: plan.retryFailed,
    maxAttemptsPerJob: plan.maxAttemptsPerJob,
    sources: plan.sources,
  })
  if (!samePlan(plan, rebuilt)) throw new Error('prepared plan is inconsistent')
  return rebuilt
}

function requireRun(runs: Map<string, MutableRun>, planId: string): MutableRun {
  assertUnpaddedText(planId, 'planId')
  const run = runs.get(planId)
  if (!run) throw new Error('backfill plan was not found')
  return run
}

function requireMonotonic(run: MutableRun, now: string): void {
  assertCanonicalUtc(now, 'now')
  if (getUtcTimestampOrder(now) < getUtcTimestampOrder(run.updatedAt))
    throw new Error('clock moved backwards')
}

function requireJob(run: MutableRun, jobId: string): MutableJob {
  assertUnpaddedText(jobId, 'jobId')
  const job = run.jobs.find((item) => item.jobId === jobId)
  if (!job) throw new Error('backfill job was not found')
  return job
}

function requireLease(
  run: MutableRun,
  job: MutableJob,
  workerId: string,
  now: string
): void {
  requireMonotonic(run, now)
  assertWorkerId(workerId)
  if (
    job.status !== 'running' ||
    job.leaseOwner !== workerId ||
    !job.leaseExpiresAt
  )
    throw new Error('backfill job lease is not owned by worker')
  if (getUtcTimestampOrder(now) >= getUtcTimestampOrder(job.leaseExpiresAt))
    throw new Error('backfill job lease has expired')
}

function claimed(job: MutableJob): OfficialEventsBackfillClaimedJobV1 {
  if (
    job.status !== 'running' ||
    !job.leaseOwner ||
    !job.leaseAcquiredAt ||
    !job.leaseExpiresAt
  )
    throw new Error('claimed job state is inconsistent')
  return {
    ...copyJob(job),
    status: 'running',
    leaseOwner: job.leaseOwner,
    leaseAcquiredAt: job.leaseAcquiredAt,
    leaseExpiresAt: job.leaseExpiresAt,
  }
}

function isRetryable(run: MutableRun, job: MutableJob): boolean {
  return (
    job.status === 'failed' &&
    run.plan.retryFailed &&
    job.attemptCount < run.plan.maxAttemptsPerJob
  )
}

export function createInMemoryOfficialEventsBackfillCheckpointStorageV1(): OfficialEventsBackfillCheckpointStorageV1 {
  const runs = new Map<string, MutableRun>()

  return {
    async createOrResumePlan({ plan, now }) {
      const validPlan = validatePreparedPlan(plan)
      assertCanonicalUtc(now, 'now')
      const current = runs.get(validPlan.planId)
      if (current) {
        if (!samePlan(current.plan, validPlan))
          throw new Error('planId conflicts with a different plan payload')
        requireMonotonic(current, now)
        if (current.status === 'paused') {
          current.status = 'running'
          current.updatedAt = now
        }
        return snapshot(current)
      }
      const run: MutableRun = {
        plan: copyPlan(validPlan),
        status: 'pending',
        createdAt: now,
        updatedAt: now,
        completedAt: null,
        jobs: validPlan.jobs.map(({ ordinal, job }) => ({
          jobId: job.jobId,
          ordinal,
          provider: job.provider,
          job: { ...job },
          status: 'pending',
          attemptCount: 0,
          leaseOwner: null,
          leaseAcquiredAt: null,
          leaseExpiresAt: null,
          startedAt: null,
          completedAt: null,
          fetchedEventCount: 0,
          persistedAttemptCount: 0,
          rejectedItemCount: 0,
          resultSummary: null,
          errorSummary: null,
          updatedAt: now,
        })),
      }
      runs.set(validPlan.planId, run)
      return snapshot(run)
    },

    async claimNextJobs({
      planId,
      workerId,
      limit,
      leaseDurationSeconds,
      now,
    }) {
      const run = requireRun(runs, planId)
      requireMonotonic(run, now)
      assertWorkerId(workerId)
      const claimLimit = assertSafeCounter(limit, 'limit')
      if (claimLimit < 1 || claimLimit > 100)
        throw new Error('limit must be between 1 and 100')
      assertLeaseDuration(leaseDurationSeconds)
      if (
        run.status === 'completed' ||
        run.status === 'completed-with-failures' ||
        run.status === 'paused'
      )
        return []
      const selected: MutableJob[] = []
      for (const job of run.jobs) {
        if (selected.length >= claimLimit) break
        const expired =
          job.status === 'running' &&
          job.leaseExpiresAt !== null &&
          getUtcTimestampOrder(job.leaseExpiresAt) <= getUtcTimestampOrder(now)
        const eligible =
          job.status === 'pending' || expired || isRetryable(run, job)
        if (!eligible || job.attemptCount >= run.plan.maxAttemptsPerJob)
          continue
        job.status = 'running'
        job.attemptCount += 1
        job.leaseOwner = workerId
        job.leaseAcquiredAt = now
        job.leaseExpiresAt = addSecondsPreservingPrecision(
          now,
          leaseDurationSeconds
        )
        job.startedAt = now
        job.completedAt = null
        job.resultSummary = null
        job.errorSummary = null
        job.updatedAt = now
        selected.push(job)
      }
      if (selected.length > 0) {
        run.status = 'running'
        run.completedAt = null
        run.updatedAt = now
      }
      return selected.map(claimed)
    },

    async completeJob({ planId, jobId, workerId, now, summary }) {
      const run = requireRun(runs, planId)
      const job = requireJob(run, jobId)
      requireLease(run, job, workerId, now)
      assertResultSummary(summary)
      job.status = 'succeeded'
      job.completedAt = now
      job.fetchedEventCount = summary.fetchedEventCount
      job.persistedAttemptCount = summary.persistedAttemptCount
      job.rejectedItemCount = summary.rejectedItemCount
      job.resultSummary = { ...summary }
      job.errorSummary = null
      job.leaseOwner = null
      job.leaseAcquiredAt = null
      job.leaseExpiresAt = null
      job.updatedAt = now
      run.updatedAt = now
      return copyJob(job)
    },

    async failJob({
      planId,
      jobId,
      workerId,
      now,
      disposition,
      summary,
      error,
    }) {
      const run = requireRun(runs, planId)
      const job = requireJob(run, jobId)
      requireLease(run, job, workerId, now)
      if (disposition !== 'failed' && disposition !== 'conflict')
        throw new Error('failure disposition is unsupported')
      assertResultSummary(summary)
      if (error) assertErrorSummary(error)
      job.status = disposition
      job.completedAt = now
      job.fetchedEventCount = summary.fetchedEventCount
      job.persistedAttemptCount = summary.persistedAttemptCount
      job.rejectedItemCount = summary.rejectedItemCount
      job.resultSummary = { ...summary }
      job.errorSummary = error ? { ...error } : null
      job.leaseOwner = null
      job.leaseAcquiredAt = null
      job.leaseExpiresAt = null
      job.updatedAt = now
      run.updatedAt = now
      return copyJob(job)
    },

    async releaseJobs({ planId, jobIds, workerId, now, pausePlan }) {
      const run = requireRun(runs, planId)
      requireMonotonic(run, now)
      assertWorkerId(workerId)
      const ids = assertDenseArray(jobIds, 'jobIds').map((value) =>
        assertUnpaddedText(value, 'jobId')
      )
      if (new Set(ids).size !== ids.length)
        throw new Error('jobIds must be unique')
      if (typeof pausePlan !== 'boolean')
        throw new Error('pausePlan must be boolean')
      const jobs = ids.map((jobId) => requireJob(run, jobId))
      for (const job of jobs) requireLease(run, job, workerId, now)
      for (const job of jobs) {
        job.status = 'pending'
        job.attemptCount -= 1
        job.leaseOwner = null
        job.leaseAcquiredAt = null
        job.leaseExpiresAt = null
        job.startedAt = null
        job.updatedAt = now
      }
      run.updatedAt = now
      if (pausePlan) run.status = 'paused'
      return jobs.map(copyJob)
    },

    async pausePlan({ planId, now }) {
      const run = requireRun(runs, planId)
      requireMonotonic(run, now)
      if (run.jobs.some((job) => job.status === 'running'))
        throw new Error('plan cannot pause while jobs are running')
      if (run.status === 'running' || run.status === 'pending') {
        run.status = 'paused'
        run.updatedAt = now
      }
      return snapshot(run)
    },

    async getPlanSnapshot(planId) {
      return snapshot(requireRun(runs, planId))
    },

    async finalizePlan({ planId, now }) {
      const run = requireRun(runs, planId)
      requireMonotonic(run, now)
      if (
        run.status === 'completed' ||
        run.status === 'completed-with-failures'
      )
        return snapshot(run)
      const hasEligible = run.jobs.some(
        (job) =>
          job.status === 'pending' ||
          job.status === 'running' ||
          isRetryable(run, job)
      )
      if (!hasEligible) {
        const counts = counters(run.jobs)
        run.status =
          counts.failedJobs > 0 || counts.conflictJobs > 0
            ? 'completed-with-failures'
            : 'completed'
        run.completedAt = now
        run.updatedAt = now
      }
      return snapshot(run)
    },
  }
}
