import {
  OFFICIAL_ASSET_EVENTS_UPSERT_BATCH_LIMIT_V1,
  persistOfficialAssetEventsV1,
} from '../../../data/context/official-events/storage'
import { OfficialEventsSafeFetchErrorV1 } from './safeFetch'
import type {
  OfficialEventsProviderCountersV1,
  OfficialEventsProviderRejectedItemV1,
  OfficialEventsServerErrorCategoryV1,
  OfficialEventsServerExecutionResultV1,
  OfficialEventsServerExecutorDependenciesV1,
  OfficialEventsServerExecutorV1,
  OfficialEventsServerJobResultV1,
  OfficialEventsServerJobV1,
} from './types'
import { OFFICIAL_EVENTS_SERVER_EXECUTION_V1_VERSION } from './types'
import {
  assertOfficialEventsServerJobsV1,
  getUtcTimestampOrder,
} from './validation'

type ProviderResult =
  | Awaited<
      ReturnType<
        OfficialEventsServerExecutorDependenciesV1['providers']['cvmIpe']
      >
    >
  | Awaited<
      ReturnType<
        OfficialEventsServerExecutorDependenciesV1['providers']['cvmFundDelivery']
      >
    >
  | Awaited<
      ReturnType<
        OfficialEventsServerExecutorDependenciesV1['providers']['secEdgar']
      >
    >

class OfficialEventsProviderContractErrorV1 extends Error {}

function assertCounter(value: unknown, name: string): void {
  if (
    typeof value !== 'number' ||
    !Number.isSafeInteger(value) ||
    value < 0 ||
    Object.is(value, -0)
  )
    throw new OfficialEventsProviderContractErrorV1(
      `Provider counter ${name} is invalid`
    )
}

function assertDenseArray(value: readonly unknown[], name: string): void {
  if (!Array.isArray(value))
    throw new OfficialEventsProviderContractErrorV1(
      `Provider ${name} must be an array`
    )
  for (let index = 0; index < value.length; index += 1) {
    if (!(index in value))
      throw new OfficialEventsProviderContractErrorV1(
        `Provider ${name} must be dense`
      )
  }
}

function assertProviderResult(
  job: OfficialEventsServerJobV1,
  result: ProviderResult
): void {
  if (result.source !== job.provider)
    throw new OfficialEventsProviderContractErrorV1(
      'Provider result source does not match the job'
    )
  assertDenseArray(result.events, 'events')
  assertDenseArray(result.duplicates, 'duplicates')
  assertDenseArray(result.conflicts, 'conflicts')
  result.events.forEach((event) => {
    if (event.source !== job.provider)
      throw new OfficialEventsProviderContractErrorV1(
        'Provider event source does not match the job'
      )
  })
  const values = Object.entries(counters(result)).filter(
    ([name]) => name !== 'provider'
  )
  values.forEach(([name, value]) => assertCounter(value, name))
  assertDenseArray(
    result.source === 'sec-edgar'
      ? result.rejectedFilings
      : result.rejectedRows,
    'rejections'
  )
}

function counters(result: ProviderResult): OfficialEventsProviderCountersV1 {
  if (result.source === 'sec-edgar')
    return {
      provider: result.source,
      requestCount: result.requestCount,
      submissionsRequestCount: result.submissionsRequestCount,
      detailRequestCount: result.detailRequestCount,
      cacheHitCount: result.cacheHitCount,
      totalFilings: result.totalFilings,
      ignoredUnsupportedFormFilings: result.ignoredUnsupportedFormFilings,
      candidateFilings: result.candidateFilings,
      ignoredNonTargetIdentityFilings: result.ignoredNonTargetIdentityFilings,
      matchedTargetFilings: result.matchedTargetFilings,
      acceptedFilings: result.acceptedFilings,
      exactDuplicateFilings: result.exactDuplicateFilings,
      conflictingPayloadFilings: result.conflictingPayloadFilings,
    }
  return {
    provider: result.source,
    totalRows: result.totalRows,
    ignoredNonUniverseRows: result.ignoredNonUniverseRows,
    targetRows: result.targetRows,
    acceptedRows: result.acceptedRows,
    exactDuplicateRows: result.exactDuplicateRows,
    conflictingPayloadRows: result.conflictingPayloadRows,
  }
}

function rejected(
  result: ProviderResult
): OfficialEventsProviderRejectedItemV1[] {
  const items =
    result.source === 'sec-edgar' ? result.rejectedFilings : result.rejectedRows
  return items.map((item) => ({ ...item }))
}

function safeError(
  error: unknown,
  fallback: OfficialEventsServerErrorCategoryV1
) {
  if (error instanceof OfficialEventsProviderContractErrorV1)
    return {
      category: 'contract' as const,
      code: 'provider-contract-invalid',
      message: 'Official event provider returned an invalid contract',
    }
  if (error instanceof OfficialEventsSafeFetchErrorV1)
    return {
      category: 'network' as const,
      code: error.code,
      message: error.message,
    }
  return {
    category: fallback,
    code: fallback === 'persistence' ? 'persistence-failed' : 'provider-failed',
    message:
      fallback === 'persistence'
        ? 'Official event persistence failed'
        : 'Official event provider failed',
  }
}

function timestamp(now: () => string): string {
  const value = now()
  getUtcTimestampOrder(value)
  return value
}

function completedTimestamp(now: () => string, startedAt: string): string {
  const value = timestamp(now)
  if (getUtcTimestampOrder(value) < getUtcTimestampOrder(startedAt))
    throw new Error('Clock moved backwards during execution')
  return value
}

function sumCounters(values: readonly number[], name: string): number {
  return values.reduce((sum, value) => {
    const result = sum + value
    if (!Number.isSafeInteger(result))
      throw new Error(`Execution counter ${name} exceeds the safe range`)
    return result
  }, 0)
}

async function runProvider(
  job: OfficialEventsServerJobV1,
  timestampValue: string,
  dependencies: OfficialEventsServerExecutorDependenciesV1
): Promise<ProviderResult> {
  if (job.provider === 'cvm-ipe')
    return dependencies.providers.cvmIpe({
      year: job.year,
      ingestedAt: timestampValue,
      updatedAt: timestampValue,
    })
  if (job.provider === 'cvm-fund-delivery')
    return dependencies.providers.cvmFundDelivery({
      year: job.year,
      month: job.month,
      ingestedAt: timestampValue,
      updatedAt: timestampValue,
    })
  return dependencies.providers.secEdgar({
    fromDate: job.fromDate,
    toDate: job.toDate,
    ingestedAt: timestampValue,
    updatedAt: timestampValue,
  })
}

export function createOfficialEventsServerExecutorCoreV1(
  dependencies: OfficialEventsServerExecutorDependenciesV1
): OfficialEventsServerExecutorV1 {
  return {
    async execute(jobs) {
      assertOfficialEventsServerJobsV1(jobs)
      const startedAt = timestamp(dependencies.now)
      const results: OfficialEventsServerJobResultV1[] = []
      for (const job of jobs) {
        const jobStartedAt = timestamp(dependencies.now)
        let providerResult: ProviderResult
        try {
          providerResult = await runProvider(job, jobStartedAt, dependencies)
          assertProviderResult(job, providerResult)
        } catch (error) {
          const completedAt = completedTimestamp(dependencies.now, jobStartedAt)
          results.push({
            jobId: job.jobId,
            provider: job.provider,
            status: 'failed',
            startedAt: jobStartedAt,
            completedAt,
            fetchedEventCount: 0,
            rejectedItemCount: 0,
            providerCounters: null,
            rejectedItems: [],
            providerDuplicates: [],
            providerConflicts: [],
            persistenceResult: null,
            error: safeError(error, 'provider'),
            warnings: [],
          })
          continue
        }

        const providerCounters = counters(providerResult)
        const rejectedItems = rejected(providerResult)
        const providerDuplicates = providerResult.duplicates.map((item) => ({
          ...item,
        }))
        const providerConflicts = providerResult.conflicts.map((item) => ({
          ...item,
          inputIndexes: [...item.inputIndexes],
          sourcePayloadHashes: [...item.sourcePayloadHashes],
        }))
        try {
          const persistenceResult = await persistOfficialAssetEventsV1({
            storage: dependencies.storage,
            events: providerResult.events,
            maxBatchSize: OFFICIAL_ASSET_EVENTS_UPSERT_BATCH_LIMIT_V1,
          })
          const completedAt = completedTimestamp(dependencies.now, jobStartedAt)
          results.push({
            jobId: job.jobId,
            provider: job.provider,
            status: persistenceResult.conflicts > 0 ? 'conflict' : 'succeeded',
            startedAt: jobStartedAt,
            completedAt,
            fetchedEventCount: providerResult.events.length,
            rejectedItemCount: rejectedItems.length,
            providerCounters,
            rejectedItems,
            providerDuplicates,
            providerConflicts,
            persistenceResult: {
              ...persistenceResult,
              items: persistenceResult.items.map((item) => ({ ...item })),
            },
            error: null,
            warnings:
              providerConflicts.length > 0
                ? ['Provider reported payload conflicts']
                : [],
          })
        } catch (error) {
          const completedAt = completedTimestamp(dependencies.now, jobStartedAt)
          results.push({
            jobId: job.jobId,
            provider: job.provider,
            status: 'failed',
            startedAt: jobStartedAt,
            completedAt,
            fetchedEventCount: providerResult.events.length,
            rejectedItemCount: rejectedItems.length,
            providerCounters,
            rejectedItems,
            providerDuplicates,
            providerConflicts,
            persistenceResult: null,
            error: safeError(error, 'persistence'),
            warnings: [],
          })
        }
      }
      const completedAt = completedTimestamp(dependencies.now, startedAt)
      return {
        executionVersion: OFFICIAL_EVENTS_SERVER_EXECUTION_V1_VERSION,
        startedAt,
        completedAt,
        totalJobs: results.length,
        succeededJobs: results.filter((item) => item.status === 'succeeded')
          .length,
        failedJobs: results.filter((item) => item.status === 'failed').length,
        conflictJobs: results.filter((item) => item.status === 'conflict')
          .length,
        totalFetchedEvents: sumCounters(
          results.map((item) => item.fetchedEventCount),
          'totalFetchedEvents'
        ),
        totalPersistedAttempts: sumCounters(
          results.map((item) => item.persistenceResult?.attempted ?? 0),
          'totalPersistedAttempts'
        ),
        jobs: results,
      } satisfies OfficialEventsServerExecutionResultV1
    },
  }
}
