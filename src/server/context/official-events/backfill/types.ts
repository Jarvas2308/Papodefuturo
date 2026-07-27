import type {
  OfficialEventsServerExecutorV1,
  OfficialEventsServerJobV1,
  OfficialEventsServerSafeErrorV1,
} from '../types'

export const OFFICIAL_EVENTS_BACKFILL_PLAN_V1_VERSION =
  'official-events-backfill-plan.v1' as const
export const OFFICIAL_EVENTS_BACKFILL_EXECUTION_V1_VERSION =
  'official-events-backfill-execution.v1' as const

export type OfficialEventsBackfillProviderV1 =
  'cvm-ipe' | 'cvm-fund-delivery' | 'sec-edgar'

export type OfficialEventsBackfillSourceV1 =
  | { provider: 'cvm-ipe'; fromYear: number; toYear: number }
  | {
      provider: 'cvm-fund-delivery'
      fromMonth: string
      toMonth: string
    }
  | {
      provider: 'sec-edgar'
      fromDate: string
      toDate: string
      windowDays: number
    }

export type OfficialEventsBackfillPlanInputV1 = {
  backfillVersion: typeof OFFICIAL_EVENTS_BACKFILL_PLAN_V1_VERSION
  failureMode: 'continue' | 'stop'
  retryFailed: boolean
  maxAttemptsPerJob: number
  sources: readonly OfficialEventsBackfillSourceV1[]
}

export type OfficialEventsBackfillPlannedJobV1 = {
  ordinal: number
  job: OfficialEventsServerJobV1
}

export type PreparedOfficialEventsBackfillPlanV1 = {
  backfillVersion: typeof OFFICIAL_EVENTS_BACKFILL_PLAN_V1_VERSION
  planId: string
  planHash: string
  failureMode: 'continue' | 'stop'
  retryFailed: boolean
  maxAttemptsPerJob: number
  sources: OfficialEventsBackfillSourceV1[]
  jobs: OfficialEventsBackfillPlannedJobV1[]
  totalJobs: number
}

export type OfficialEventsBackfillPreviewWarningV1 = {
  code: 'sec-recent-filings-only'
  message: string
}

export type OfficialEventsBackfillPreviewV1 = {
  backfillVersion: typeof OFFICIAL_EVENTS_BACKFILL_PLAN_V1_VERSION
  planId: string
  planHash: string
  totalJobs: number
  jobsByProvider: Record<OfficialEventsBackfillProviderV1, number>
  firstJob: OfficialEventsBackfillPlannedJobV1
  lastJob: OfficialEventsBackfillPlannedJobV1
  coveredSources: OfficialEventsBackfillSourceV1[]
  warnings: OfficialEventsBackfillPreviewWarningV1[]
  executed: false
}

export type OfficialEventsBackfillRunStatusV1 =
  'pending' | 'running' | 'completed' | 'completed-with-failures' | 'paused'

export type OfficialEventsBackfillJobStatusV1 =
  'pending' | 'running' | 'succeeded' | 'failed' | 'conflict'

export type OfficialEventsBackfillJsonValueV1 =
  | null
  | boolean
  | number
  | string
  | OfficialEventsBackfillJsonValueV1[]
  | { [key: string]: OfficialEventsBackfillJsonValueV1 }

export type OfficialEventsBackfillJobResultSummaryV1 = {
  fetchedEventCount: number
  persistedAttemptCount: number
  rejectedItemCount: number
}

export type OfficialEventsBackfillJobErrorSummaryV1 = {
  category: string
  code: string
  message: string
}

export type OfficialEventsBackfillJobSnapshotV1 = {
  jobId: string
  ordinal: number
  provider: OfficialEventsBackfillProviderV1
  job: OfficialEventsServerJobV1
  status: OfficialEventsBackfillJobStatusV1
  attemptCount: number
  leaseOwner: string | null
  leaseAcquiredAt: string | null
  leaseExpiresAt: string | null
  startedAt: string | null
  completedAt: string | null
  fetchedEventCount: number
  persistedAttemptCount: number
  rejectedItemCount: number
  resultSummary: OfficialEventsBackfillJobResultSummaryV1 | null
  errorSummary: OfficialEventsBackfillJobErrorSummaryV1 | null
  updatedAt: string
}

export type OfficialEventsBackfillPlanSnapshotV1 = {
  backfillVersion: typeof OFFICIAL_EVENTS_BACKFILL_PLAN_V1_VERSION
  planId: string
  planHash: string
  failureMode: 'continue' | 'stop'
  retryFailed: boolean
  maxAttemptsPerJob: number
  status: OfficialEventsBackfillRunStatusV1
  totalJobs: number
  pendingJobs: number
  runningJobs: number
  succeededJobs: number
  failedJobs: number
  conflictJobs: number
  createdAt: string
  updatedAt: string
  completedAt: string | null
  jobs: OfficialEventsBackfillJobSnapshotV1[]
}

export type OfficialEventsBackfillClaimedJobV1 =
  OfficialEventsBackfillJobSnapshotV1 & {
    status: 'running'
    leaseOwner: string
    leaseAcquiredAt: string
    leaseExpiresAt: string
  }

export type OfficialEventsBackfillCheckpointStorageV1 = {
  createOrResumePlan(input: {
    plan: PreparedOfficialEventsBackfillPlanV1
    now: string
  }): Promise<OfficialEventsBackfillPlanSnapshotV1>
  claimNextJobs(input: {
    planId: string
    workerId: string
    limit: number
    leaseDurationSeconds: number
    now: string
  }): Promise<OfficialEventsBackfillClaimedJobV1[]>
  completeJob(input: {
    planId: string
    jobId: string
    workerId: string
    now: string
    summary: OfficialEventsBackfillJobResultSummaryV1
  }): Promise<OfficialEventsBackfillJobSnapshotV1>
  failJob(input: {
    planId: string
    jobId: string
    workerId: string
    now: string
    disposition: 'failed' | 'conflict'
    summary: OfficialEventsBackfillJobResultSummaryV1
    error: OfficialEventsBackfillJobErrorSummaryV1 | null
  }): Promise<OfficialEventsBackfillJobSnapshotV1>
  releaseJobs(input: {
    planId: string
    jobIds: readonly string[]
    workerId: string
    now: string
    pausePlan: boolean
  }): Promise<OfficialEventsBackfillJobSnapshotV1[]>
  pausePlan(input: {
    planId: string
    now: string
  }): Promise<OfficialEventsBackfillPlanSnapshotV1>
  getPlanSnapshot(planId: string): Promise<OfficialEventsBackfillPlanSnapshotV1>
  finalizePlan(input: {
    planId: string
    now: string
  }): Promise<OfficialEventsBackfillPlanSnapshotV1>
}

export type OfficialEventsBackfillRpcResponseV1 = {
  data: unknown
  error: { message?: unknown; code?: unknown } | null
}

export type OfficialEventsBackfillRpcClientV1 = {
  rpc(
    functionName: string,
    args: Record<string, OfficialEventsBackfillJsonValueV1>
  ): PromiseLike<OfficialEventsBackfillRpcResponseV1>
}

export type OfficialEventsBackfillStepJobResultV1 = {
  jobId: string
  ordinal: number
  provider: OfficialEventsBackfillProviderV1
  attemptCount: number
  executorStatus: 'succeeded' | 'failed' | 'conflict'
  fetchedEventCount: number
  persistedAttemptCount: number
  rejectedItemCount: number
  checkpointDisposition: 'succeeded' | 'failed' | 'conflict'
  safeError: OfficialEventsServerSafeErrorV1 | null
}

export type OfficialEventsBackfillStepResultV1 = {
  backfillVersion: typeof OFFICIAL_EVENTS_BACKFILL_EXECUTION_V1_VERSION
  planId: string
  planHash: string
  workerId: string
  startedAt: string
  completedAt: string
  claimedJobs: number
  succeededJobs: number
  failedJobs: number
  conflictJobs: number
  jobs: OfficialEventsBackfillStepJobResultV1[]
  planSnapshot: OfficialEventsBackfillPlanSnapshotV1
  hasMoreWork: boolean
}

export type OfficialEventsBackfillStepDependenciesV1 = {
  checkpointStorage: OfficialEventsBackfillCheckpointStorageV1
  executor: OfficialEventsServerExecutorV1
  now: () => string
}
