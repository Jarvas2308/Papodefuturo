import { getUtcTimestampOrder } from '../validation'
import { assertOfficialEventsServerJobsV1 } from '../validation'
import { prepareOfficialEventsBackfillPlanV1 } from './planner'
import type {
  OfficialEventsBackfillCheckpointStorageV1,
  OfficialEventsBackfillClaimedJobV1,
  OfficialEventsBackfillJobErrorSummaryV1,
  OfficialEventsBackfillJobResultSummaryV1,
  OfficialEventsBackfillJobSnapshotV1,
  OfficialEventsBackfillJsonValueV1,
  OfficialEventsBackfillPlanSnapshotV1,
  OfficialEventsBackfillRpcClientV1,
  PreparedOfficialEventsBackfillPlanV1,
} from './types'
import { OFFICIAL_EVENTS_BACKFILL_PLAN_V1_VERSION } from './types'
import {
  assertCanonicalUtc,
  assertDenseArray,
  assertErrorSummary,
  assertExactKeys,
  assertLeaseDuration,
  assertResultSummary,
  assertSafeCounter,
  assertUnpaddedText,
  assertWorkerId,
} from './validation'

const RUN_STATUSES = [
  'pending',
  'running',
  'completed',
  'completed-with-failures',
  'paused',
] as const
const JOB_STATUSES = [
  'pending',
  'running',
  'succeeded',
  'failed',
  'conflict',
] as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function requireRecord(value: unknown, name: string): Record<string, unknown> {
  if (!isRecord(value)) throw new Error(`${name} must be an object`)
  return value
}

function nullableTimestamp(value: unknown, name: string): string | null {
  return value === null ? null : assertCanonicalUtc(value, name)
}

function nullableSummary(
  value: unknown
): OfficialEventsBackfillJobResultSummaryV1 | null {
  if (value === null) return null
  const summary = requireRecord(value, 'resultSummary')
  assertExactKeys(
    summary,
    ['fetchedEventCount', 'persistedAttemptCount', 'rejectedItemCount'],
    'resultSummary'
  )
  return {
    fetchedEventCount: assertSafeCounter(
      summary.fetchedEventCount,
      'fetchedEventCount'
    ),
    persistedAttemptCount: assertSafeCounter(
      summary.persistedAttemptCount,
      'persistedAttemptCount'
    ),
    rejectedItemCount: assertSafeCounter(
      summary.rejectedItemCount,
      'rejectedItemCount'
    ),
  }
}

function nullableError(
  value: unknown
): OfficialEventsBackfillJobErrorSummaryV1 | null {
  if (value === null) return null
  const error = requireRecord(value, 'errorSummary')
  assertExactKeys(error, ['category', 'code', 'message'], 'errorSummary')
  return {
    category: assertUnpaddedText(error.category, 'error category'),
    code: assertUnpaddedText(error.code, 'error code'),
    message: assertUnpaddedText(error.message, 'error message'),
  }
}

function validateJob(value: unknown): OfficialEventsBackfillJobSnapshotV1 {
  const job = requireRecord(value, 'checkpoint job')
  assertExactKeys(
    job,
    [
      'jobId',
      'ordinal',
      'provider',
      'job',
      'status',
      'attemptCount',
      'leaseOwner',
      'leaseAcquiredAt',
      'leaseExpiresAt',
      'startedAt',
      'completedAt',
      'fetchedEventCount',
      'persistedAttemptCount',
      'rejectedItemCount',
      'resultSummary',
      'errorSummary',
      'updatedAt',
    ],
    'checkpoint job'
  )
  const jobPayload = requireRecord(job.job, 'job payload')
  const validatedJobs: unknown[] = [jobPayload]
  assertOfficialEventsServerJobsV1(validatedJobs)
  const typedJob = validatedJobs[0]
  if (!typedJob) throw new Error('checkpoint job payload is missing')
  const status = JOB_STATUSES.find((candidate) => candidate === job.status)
  if (!status) throw new Error('checkpoint job status is unsupported')
  const jobId = assertUnpaddedText(job.jobId, 'jobId')
  const provider = job.provider
  if (
    provider !== 'cvm-ipe' &&
    provider !== 'cvm-fund-delivery' &&
    provider !== 'sec-edgar'
  )
    throw new Error('checkpoint job provider is unsupported')
  if (jobPayload.jobId !== jobId || jobPayload.provider !== provider)
    throw new Error('checkpoint job payload identity is inconsistent')
  const leaseOwner =
    job.leaseOwner === null
      ? null
      : assertUnpaddedText(job.leaseOwner, 'leaseOwner')
  const leaseAcquiredAt = nullableTimestamp(
    job.leaseAcquiredAt,
    'leaseAcquiredAt'
  )
  const leaseExpiresAt = nullableTimestamp(job.leaseExpiresAt, 'leaseExpiresAt')
  const startedAt = nullableTimestamp(job.startedAt, 'startedAt')
  const completedAt = nullableTimestamp(job.completedAt, 'completedAt')
  if (
    status === 'running' &&
    (!leaseOwner || !leaseAcquiredAt || !leaseExpiresAt || !startedAt)
  )
    throw new Error('running checkpoint job lease is incomplete')
  if (
    status !== 'running' &&
    (leaseOwner !== null || leaseAcquiredAt !== null || leaseExpiresAt !== null)
  )
    throw new Error('non-running checkpoint job contains a lease')
  if (
    leaseAcquiredAt &&
    leaseExpiresAt &&
    getUtcTimestampOrder(leaseExpiresAt) <=
      getUtcTimestampOrder(leaseAcquiredAt)
  )
    throw new Error('checkpoint job lease interval is invalid')
  if (
    (status === 'succeeded' || status === 'failed' || status === 'conflict') &&
    !completedAt
  )
    throw new Error('terminal checkpoint job has no completedAt')
  if ((status === 'pending' || status === 'running') && completedAt)
    throw new Error('non-terminal checkpoint job has completedAt')
  const fetchedEventCount = assertSafeCounter(
    job.fetchedEventCount,
    'fetchedEventCount'
  )
  const persistedAttemptCount = assertSafeCounter(
    job.persistedAttemptCount,
    'persistedAttemptCount'
  )
  const rejectedItemCount = assertSafeCounter(
    job.rejectedItemCount,
    'rejectedItemCount'
  )
  const resultSummary = nullableSummary(job.resultSummary)
  if (
    resultSummary &&
    (resultSummary.fetchedEventCount !== fetchedEventCount ||
      resultSummary.persistedAttemptCount !== persistedAttemptCount ||
      resultSummary.rejectedItemCount !== rejectedItemCount)
  )
    throw new Error('checkpoint job result summary is inconsistent')
  if (
    (status === 'succeeded' || status === 'failed' || status === 'conflict') !==
    (resultSummary !== null)
  )
    throw new Error('checkpoint job result state is inconsistent')
  const updatedAt = assertCanonicalUtc(job.updatedAt, 'updatedAt')
  for (const [name, value] of [
    ['leaseAcquiredAt', leaseAcquiredAt],
    ['startedAt', startedAt],
    ['completedAt', completedAt],
  ] as const)
    if (value && getUtcTimestampOrder(value) > getUtcTimestampOrder(updatedAt))
      throw new Error(`${name} cannot be after updatedAt`)
  return {
    jobId,
    ordinal: assertSafeCounter(job.ordinal, 'ordinal'),
    provider,
    job: { ...typedJob },
    status,
    attemptCount: assertSafeCounter(job.attemptCount, 'attemptCount'),
    leaseOwner,
    leaseAcquiredAt,
    leaseExpiresAt,
    startedAt,
    completedAt,
    fetchedEventCount,
    persistedAttemptCount,
    rejectedItemCount,
    resultSummary,
    errorSummary: nullableError(job.errorSummary),
    updatedAt,
  }
}

function validateSnapshot(
  value: unknown
): OfficialEventsBackfillPlanSnapshotV1 {
  const run = requireRecord(value, 'checkpoint snapshot')
  assertExactKeys(
    run,
    [
      'backfillVersion',
      'planId',
      'planHash',
      'failureMode',
      'retryFailed',
      'maxAttemptsPerJob',
      'status',
      'totalJobs',
      'pendingJobs',
      'runningJobs',
      'succeededJobs',
      'failedJobs',
      'conflictJobs',
      'createdAt',
      'updatedAt',
      'completedAt',
      'jobs',
    ],
    'checkpoint snapshot'
  )
  if (run.backfillVersion !== OFFICIAL_EVENTS_BACKFILL_PLAN_V1_VERSION)
    throw new Error('checkpoint snapshot version is unsupported')
  if (run.failureMode !== 'continue' && run.failureMode !== 'stop')
    throw new Error('checkpoint failureMode is unsupported')
  if (typeof run.retryFailed !== 'boolean')
    throw new Error('checkpoint retryFailed must be boolean')
  const status = RUN_STATUSES.find((candidate) => candidate === run.status)
  if (!status) throw new Error('checkpoint run status is unsupported')
  const maxAttemptsPerJob = assertSafeCounter(
    run.maxAttemptsPerJob,
    'maxAttemptsPerJob'
  )
  if (maxAttemptsPerJob < 1 || maxAttemptsPerJob > 10)
    throw new Error('checkpoint maxAttemptsPerJob is invalid')
  const jobs = assertDenseArray(run.jobs, 'checkpoint jobs').map(validateJob)
  const totalJobs = assertSafeCounter(run.totalJobs, 'totalJobs')
  const counts = {
    pendingJobs: assertSafeCounter(run.pendingJobs, 'pendingJobs'),
    runningJobs: assertSafeCounter(run.runningJobs, 'runningJobs'),
    succeededJobs: assertSafeCounter(run.succeededJobs, 'succeededJobs'),
    failedJobs: assertSafeCounter(run.failedJobs, 'failedJobs'),
    conflictJobs: assertSafeCounter(run.conflictJobs, 'conflictJobs'),
  }
  if (
    jobs.length !== totalJobs ||
    Object.values(counts).reduce((sum, count) => sum + count, 0) !== totalJobs
  )
    throw new Error('checkpoint run counters are inconsistent')
  const actualCounts = {
    pendingJobs: jobs.filter((job) => job.status === 'pending').length,
    runningJobs: jobs.filter((job) => job.status === 'running').length,
    succeededJobs: jobs.filter((job) => job.status === 'succeeded').length,
    failedJobs: jobs.filter((job) => job.status === 'failed').length,
    conflictJobs: jobs.filter((job) => job.status === 'conflict').length,
  }
  if (
    Object.entries(counts).some(
      ([name, count]) =>
        actualCounts[name as keyof typeof actualCounts] !== count
    )
  )
    throw new Error('checkpoint run counters do not match job states')
  if (new Set(jobs.map((job) => job.jobId)).size !== jobs.length)
    throw new Error('checkpoint job identities are duplicated')
  jobs.forEach((job, ordinal) => {
    if (job.ordinal !== ordinal)
      throw new Error('checkpoint job ordinals are inconsistent')
    if (job.attemptCount > maxAttemptsPerJob)
      throw new Error('checkpoint job exceeded its attempt limit')
  })
  const completedAt = nullableTimestamp(run.completedAt, 'completedAt')
  if (
    (status === 'completed' || status === 'completed-with-failures') !==
    (completedAt !== null)
  )
    throw new Error('checkpoint completion state is inconsistent')
  const createdAt = assertCanonicalUtc(run.createdAt, 'createdAt')
  const updatedAt = assertCanonicalUtc(run.updatedAt, 'updatedAt')
  if (getUtcTimestampOrder(updatedAt) < getUtcTimestampOrder(createdAt))
    throw new Error('checkpoint updatedAt cannot be before createdAt')
  if (
    completedAt &&
    getUtcTimestampOrder(completedAt) < getUtcTimestampOrder(updatedAt)
  )
    throw new Error('checkpoint completedAt cannot be before updatedAt')
  if (
    (status === 'paused' ||
      status === 'completed' ||
      status === 'completed-with-failures') &&
    counts.runningJobs > 0
  )
    throw new Error('inactive checkpoint run contains running jobs')
  return {
    backfillVersion: run.backfillVersion,
    planId: assertUnpaddedText(run.planId, 'planId'),
    planHash: assertUnpaddedText(run.planHash, 'planHash'),
    failureMode: run.failureMode,
    retryFailed: run.retryFailed,
    maxAttemptsPerJob,
    status,
    totalJobs,
    ...counts,
    createdAt,
    updatedAt,
    completedAt,
    jobs,
  }
}

function validateClaimed(value: unknown): OfficialEventsBackfillClaimedJobV1[] {
  return assertDenseArray(value, 'claimed jobs').map((item) => {
    const job = validateJob(item)
    if (
      job.status !== 'running' ||
      !job.leaseOwner ||
      !job.leaseAcquiredAt ||
      !job.leaseExpiresAt
    )
      throw new Error('claimed checkpoint job is not running')
    return {
      ...job,
      status: 'running',
      leaseOwner: job.leaseOwner,
      leaseAcquiredAt: job.leaseAcquiredAt,
      leaseExpiresAt: job.leaseExpiresAt,
    }
  })
}

function requireSnapshotPlan(
  value: unknown,
  planId: string
): OfficialEventsBackfillPlanSnapshotV1 {
  const snapshot = validateSnapshot(value)
  if (snapshot.planId !== planId)
    throw new Error('checkpoint snapshot belongs to another plan')
  return snapshot
}

function planPayload(
  plan: PreparedOfficialEventsBackfillPlanV1
): OfficialEventsBackfillJsonValueV1 {
  return {
    backfillVersion: plan.backfillVersion,
    planId: plan.planId,
    planHash: plan.planHash,
    failureMode: plan.failureMode,
    retryFailed: plan.retryFailed,
    maxAttemptsPerJob: plan.maxAttemptsPerJob,
    sources: plan.sources.map((source) => ({ ...source })),
    jobs: plan.jobs.map(({ ordinal, job }) => ({
      ordinal,
      job: { ...job },
    })),
    totalJobs: plan.totalJobs,
  }
}

function summaryPayload(
  summary: OfficialEventsBackfillJobResultSummaryV1
): OfficialEventsBackfillJsonValueV1 {
  assertResultSummary(summary)
  return { ...summary }
}

function errorPayload(
  error: OfficialEventsBackfillJobErrorSummaryV1 | null
): OfficialEventsBackfillJsonValueV1 {
  if (!error) return null
  assertErrorSummary(error)
  return { ...error }
}

async function callRpc(
  client: OfficialEventsBackfillRpcClientV1,
  functionName: string,
  args: Record<string, OfficialEventsBackfillJsonValueV1>
): Promise<unknown> {
  let response
  try {
    response = await client.rpc(functionName, args)
  } catch {
    throw new Error('Official events backfill checkpoint RPC failed')
  }
  if (response.error || response.data === null || response.data === undefined)
    throw new Error('Official events backfill checkpoint RPC failed')
  return response.data
}

function validatePlan(plan: PreparedOfficialEventsBackfillPlanV1): void {
  const rebuilt = prepareOfficialEventsBackfillPlanV1({
    backfillVersion: plan.backfillVersion,
    failureMode: plan.failureMode,
    retryFailed: plan.retryFailed,
    maxAttemptsPerJob: plan.maxAttemptsPerJob,
    sources: plan.sources,
  })
  if (
    JSON.stringify(planPayload(rebuilt)) !== JSON.stringify(planPayload(plan))
  )
    throw new Error('prepared plan is inconsistent')
}

export function createSupabaseOfficialEventsBackfillCheckpointStorageV1(input: {
  client: OfficialEventsBackfillRpcClientV1
}): OfficialEventsBackfillCheckpointStorageV1 {
  if (!input.client || typeof input.client.rpc !== 'function')
    throw new Error('Supabase checkpoint RPC client is required')
  const { client } = input
  return {
    async createOrResumePlan({ plan, now }) {
      validatePlan(plan)
      assertCanonicalUtc(now, 'now')
      const snapshot = requireSnapshotPlan(
        await callRpc(client, 'create_or_resume_official_event_backfill_v1', {
          input_plan: planPayload(plan),
          input_now: now,
        }),
        plan.planId
      )
      if (snapshot.planHash !== plan.planHash)
        throw new Error('checkpoint snapshot has a different plan hash')
      return snapshot
    },
    async claimNextJobs({
      planId,
      workerId,
      limit,
      leaseDurationSeconds,
      now,
    }) {
      assertUnpaddedText(planId, 'planId')
      assertWorkerId(workerId)
      if (assertSafeCounter(limit, 'limit') < 1 || limit > 100)
        throw new Error('limit must be between 1 and 100')
      assertLeaseDuration(leaseDurationSeconds)
      assertCanonicalUtc(now, 'now')
      const claimed = validateClaimed(
        await callRpc(client, 'claim_official_event_backfill_jobs_v1', {
          input_plan_id: planId,
          input_worker_id: workerId,
          input_limit: limit,
          input_lease_duration_seconds: leaseDurationSeconds,
          input_now: now,
        })
      )
      if (
        claimed.length > limit ||
        new Set(claimed.map((job) => job.jobId)).size !== claimed.length ||
        claimed.some((job) => job.leaseOwner !== workerId)
      )
        throw new Error('claimed checkpoint jobs do not match the request')
      return claimed
    },
    async completeJob({ planId, jobId, workerId, now, summary }) {
      const completed = validateJob(
        await callRpc(client, 'complete_official_event_backfill_job_v1', {
          input_plan_id: assertUnpaddedText(planId, 'planId'),
          input_job_id: assertUnpaddedText(jobId, 'jobId'),
          input_worker_id: assertWorkerId(workerId),
          input_now: assertCanonicalUtc(now, 'now'),
          input_summary: summaryPayload(summary),
        })
      )
      if (completed.jobId !== jobId || completed.status !== 'succeeded')
        throw new Error('completed checkpoint job does not match the request')
      return completed
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
      if (disposition !== 'failed' && disposition !== 'conflict')
        throw new Error('failure disposition is unsupported')
      const failed = validateJob(
        await callRpc(client, 'fail_official_event_backfill_job_v1', {
          input_plan_id: assertUnpaddedText(planId, 'planId'),
          input_job_id: assertUnpaddedText(jobId, 'jobId'),
          input_worker_id: assertWorkerId(workerId),
          input_now: assertCanonicalUtc(now, 'now'),
          input_disposition: disposition,
          input_summary: summaryPayload(summary),
          input_error: errorPayload(error),
        })
      )
      if (failed.jobId !== jobId || failed.status !== disposition)
        throw new Error('failed checkpoint job does not match the request')
      return failed
    },
    async releaseJobs({ planId, jobIds, workerId, now, pausePlan }) {
      const ids = assertDenseArray(jobIds, 'jobIds').map((value) =>
        assertUnpaddedText(value, 'jobId')
      )
      if (new Set(ids).size !== ids.length)
        throw new Error('jobIds must be unique')
      if (typeof pausePlan !== 'boolean')
        throw new Error('pausePlan must be boolean')
      const released = assertDenseArray(
        await callRpc(client, 'release_official_event_backfill_jobs_v1', {
          input_plan_id: assertUnpaddedText(planId, 'planId'),
          input_job_ids: [...ids],
          input_worker_id: assertWorkerId(workerId),
          input_now: assertCanonicalUtc(now, 'now'),
          input_pause_plan: pausePlan,
        }),
        'released jobs'
      ).map(validateJob)
      if (
        released.length !== ids.length ||
        released.some(
          (job) => job.status !== 'pending' || !ids.includes(job.jobId)
        ) ||
        new Set(released.map((job) => job.jobId)).size !== ids.length
      )
        throw new Error('released checkpoint jobs do not match the request')
      return released
    },
    async pausePlan({ planId, now }) {
      return requireSnapshotPlan(
        await callRpc(client, 'pause_official_event_backfill_v1', {
          input_plan_id: assertUnpaddedText(planId, 'planId'),
          input_now: assertCanonicalUtc(now, 'now'),
        }),
        planId
      )
    },
    async getPlanSnapshot(planId) {
      return requireSnapshotPlan(
        await callRpc(client, 'get_official_event_backfill_snapshot_v1', {
          input_plan_id: assertUnpaddedText(planId, 'planId'),
        }),
        planId
      )
    },
    async finalizePlan({ planId, now }) {
      return requireSnapshotPlan(
        await callRpc(client, 'finalize_official_event_backfill_v1', {
          input_plan_id: assertUnpaddedText(planId, 'planId'),
          input_now: assertCanonicalUtc(now, 'now'),
        }),
        planId
      )
    },
  }
}
