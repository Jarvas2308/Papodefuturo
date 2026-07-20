import { getUtcTimestampOrder } from '../validation'
import { prepareOfficialEventsBackfillPlanV1 } from './planner'
import type {
  OfficialEventsBackfillJobErrorSummaryV1,
  OfficialEventsBackfillJobResultSummaryV1,
  OfficialEventsBackfillPlanInputV1,
  OfficialEventsBackfillPlanSnapshotV1,
  OfficialEventsBackfillStepDependenciesV1,
  OfficialEventsBackfillStepJobResultV1,
  OfficialEventsBackfillStepResultV1,
} from './types'
import { OFFICIAL_EVENTS_BACKFILL_EXECUTION_V1_VERSION } from './types'
import {
  assertCanonicalUtc,
  assertLeaseDuration,
  assertSafeCounter,
  assertWorkerId,
} from './validation'

function timestamp(now: () => string): string {
  return assertCanonicalUtc(now(), 'clock')
}

function laterTimestamp(now: () => string, previous: string): string {
  const value = timestamp(now)
  if (getUtcTimestampOrder(value) < getUtcTimestampOrder(previous))
    throw new Error('clock moved backwards during backfill step')
  return value
}

function resultSummary(input: {
  fetchedEventCount: number
  rejectedItemCount: number
  persistenceResult: { attempted: number } | null
}): OfficialEventsBackfillJobResultSummaryV1 {
  return {
    fetchedEventCount: input.fetchedEventCount,
    persistedAttemptCount: input.persistenceResult?.attempted ?? 0,
    rejectedItemCount: input.rejectedItemCount,
  }
}

function errorSummary(
  error: { category: string; code: string; message: string } | null
): OfficialEventsBackfillJobErrorSummaryV1 | null {
  return error ? { ...error } : null
}

function hasMoreWork(snapshot: OfficialEventsBackfillPlanSnapshotV1): boolean {
  return (
    snapshot.status !== 'completed' &&
    snapshot.status !== 'completed-with-failures'
  )
}

export async function runOfficialEventsBackfillStepV1(input: {
  plan: OfficialEventsBackfillPlanInputV1
  workerId: string
  maxJobs: number
  leaseDurationSeconds: number
  dependencies: OfficialEventsBackfillStepDependenciesV1
}): Promise<OfficialEventsBackfillStepResultV1> {
  const workerId = assertWorkerId(input.workerId)
  const maxJobs = assertSafeCounter(input.maxJobs, 'maxJobs')
  if (maxJobs < 1 || maxJobs > 100)
    throw new Error('maxJobs must be between 1 and 100')
  const leaseDurationSeconds = assertLeaseDuration(input.leaseDurationSeconds)
  const plan = prepareOfficialEventsBackfillPlanV1(input.plan)
  const startedAt = timestamp(input.dependencies.now)
  await input.dependencies.checkpointStorage.createOrResumePlan({
    plan,
    now: startedAt,
  })
  const claimed = await input.dependencies.checkpointStorage.claimNextJobs({
    planId: plan.planId,
    workerId,
    limit: maxJobs,
    leaseDurationSeconds,
    now: laterTimestamp(input.dependencies.now, startedAt),
  })
  const results: OfficialEventsBackfillStepJobResultV1[] = []
  let stopped = false

  for (let index = 0; index < claimed.length; index += 1) {
    const claimedJob = claimed[index]
    if (!claimedJob) throw new Error('claimed jobs must be dense')
    if (stopped) continue
    let executorResult
    try {
      executorResult = await input.dependencies.executor.execute([
        { ...claimedJob.job },
      ])
    } catch {
      const summary = {
        fetchedEventCount: 0,
        persistedAttemptCount: 0,
        rejectedItemCount: 0,
      }
      const safeError = {
        category: 'contract' as const,
        code: 'executor-step-failed',
        message: 'Official events executor failed before returning a result',
      }
      await input.dependencies.checkpointStorage.failJob({
        planId: plan.planId,
        jobId: claimedJob.jobId,
        workerId,
        now: laterTimestamp(input.dependencies.now, startedAt),
        disposition: 'failed',
        summary,
        error: safeError,
      })
      results.push({
        jobId: claimedJob.jobId,
        ordinal: claimedJob.ordinal,
        provider: claimedJob.provider,
        attemptCount: claimedJob.attemptCount,
        executorStatus: 'failed',
        ...summary,
        checkpointDisposition: 'failed',
        safeError,
      })
      stopped = plan.failureMode === 'stop'
      continue
    }

    const jobResult = executorResult.jobs[0]
    if (
      executorResult.totalJobs !== 1 ||
      executorResult.jobs.length !== 1 ||
      !jobResult ||
      jobResult.jobId !== claimedJob.jobId ||
      jobResult.provider !== claimedJob.provider
    ) {
      const summary = {
        fetchedEventCount: 0,
        persistedAttemptCount: 0,
        rejectedItemCount: 0,
      }
      const safeError = {
        category: 'contract' as const,
        code: 'executor-contract-invalid',
        message: 'Official events executor returned an inconsistent job result',
      }
      await input.dependencies.checkpointStorage.failJob({
        planId: plan.planId,
        jobId: claimedJob.jobId,
        workerId,
        now: laterTimestamp(input.dependencies.now, startedAt),
        disposition: 'failed',
        summary,
        error: safeError,
      })
      results.push({
        jobId: claimedJob.jobId,
        ordinal: claimedJob.ordinal,
        provider: claimedJob.provider,
        attemptCount: claimedJob.attemptCount,
        executorStatus: 'failed',
        ...summary,
        checkpointDisposition: 'failed',
        safeError,
      })
      stopped = plan.failureMode === 'stop'
      continue
    }
    const summary = resultSummary(jobResult)
    if (jobResult.status === 'succeeded')
      await input.dependencies.checkpointStorage.completeJob({
        planId: plan.planId,
        jobId: claimedJob.jobId,
        workerId,
        now: laterTimestamp(input.dependencies.now, startedAt),
        summary,
      })
    else
      await input.dependencies.checkpointStorage.failJob({
        planId: plan.planId,
        jobId: claimedJob.jobId,
        workerId,
        now: laterTimestamp(input.dependencies.now, startedAt),
        disposition: jobResult.status,
        summary,
        error: errorSummary(jobResult.error),
      })
    results.push({
      jobId: claimedJob.jobId,
      ordinal: claimedJob.ordinal,
      provider: claimedJob.provider,
      attemptCount: claimedJob.attemptCount,
      executorStatus: jobResult.status,
      ...summary,
      checkpointDisposition: jobResult.status,
      safeError: jobResult.error ? { ...jobResult.error } : null,
    })
    stopped = plan.failureMode === 'stop' && jobResult.status !== 'succeeded'
  }

  const unstarted = stopped
    ? claimed.slice(results.length).map((job) => job.jobId)
    : []
  if (unstarted.length > 0) {
    const releaseAt = laterTimestamp(input.dependencies.now, startedAt)
    await input.dependencies.checkpointStorage.releaseJobs({
      planId: plan.planId,
      jobIds: unstarted,
      workerId,
      now: releaseAt,
      pausePlan: true,
    })
  } else if (stopped) {
    await input.dependencies.checkpointStorage.pausePlan({
      planId: plan.planId,
      now: laterTimestamp(input.dependencies.now, startedAt),
    })
  }

  const completedAt = laterTimestamp(input.dependencies.now, startedAt)
  const planSnapshot = stopped
    ? await input.dependencies.checkpointStorage.getPlanSnapshot(plan.planId)
    : await input.dependencies.checkpointStorage.finalizePlan({
        planId: plan.planId,
        now: completedAt,
      })
  return {
    backfillVersion: OFFICIAL_EVENTS_BACKFILL_EXECUTION_V1_VERSION,
    planId: plan.planId,
    planHash: plan.planHash,
    workerId,
    startedAt,
    completedAt,
    claimedJobs: claimed.length,
    succeededJobs: results.filter(
      (result) => result.checkpointDisposition === 'succeeded'
    ).length,
    failedJobs: results.filter(
      (result) => result.checkpointDisposition === 'failed'
    ).length,
    conflictJobs: results.filter(
      (result) => result.checkpointDisposition === 'conflict'
    ).length,
    jobs: results,
    planSnapshot,
    hasMoreWork: hasMoreWork(planSnapshot),
  }
}
