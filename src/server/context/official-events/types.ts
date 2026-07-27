import type {
  OfficialEventConflictV1,
  OfficialEventDuplicateV1,
} from '../../../domain/context/official-events/types'
import type {
  OfficialAssetEventStorageV1,
  OfficialAssetEventStorageWriteResultV1,
} from '../../../data/context/official-events/storage'
import type {
  CvmFundDeliveryFiiEventRejectedRowV1,
  CvmFundDeliveryFiiEventsExtractionResultV1,
} from '../../../data/context/official-events/cvm/fund-delivery'
import type {
  CvmIpeStockEventRejectedRowV1,
  CvmIpeStockEventsExtractionResultV1,
} from '../../../data/context/official-events/cvm/ipe'
import type {
  SecEdgarEtfEventResultV1,
  SecEdgarEtfFilingRejectionV1,
} from '../../../data/context/official-events/sec/edgar'

export const OFFICIAL_EVENTS_SERVER_EXECUTION_V1_VERSION =
  'official-events-server-execution.v1' as const

export type OfficialEventsServerJobV1 =
  | { jobId: string; provider: 'cvm-ipe'; year: number }
  | {
      jobId: string
      provider: 'cvm-fund-delivery'
      year: number
      month: number
    }
  | {
      jobId: string
      provider: 'sec-edgar'
      fromDate: string
      toDate: string
    }

export type OfficialEventsServerErrorCategoryV1 =
  'configuration' | 'provider' | 'network' | 'persistence' | 'contract'

export type OfficialEventsServerSafeErrorV1 = {
  category: OfficialEventsServerErrorCategoryV1
  code: string
  message: string
}

export type OfficialEventsProviderCountersV1 =
  | {
      provider: 'cvm-ipe' | 'cvm-fund-delivery'
      totalRows: number
      ignoredNonUniverseRows: number
      targetRows: number
      acceptedRows: number
      exactDuplicateRows: number
      conflictingPayloadRows: number
    }
  | {
      provider: 'sec-edgar'
      requestCount: number
      submissionsRequestCount: number
      detailRequestCount: number
      cacheHitCount: number
      totalFilings: number
      ignoredUnsupportedFormFilings: number
      candidateFilings: number
      ignoredNonTargetIdentityFilings: number
      matchedTargetFilings: number
      acceptedFilings: number
      exactDuplicateFilings: number
      conflictingPayloadFilings: number
    }

export type OfficialEventsProviderRejectedItemV1 =
  | CvmIpeStockEventRejectedRowV1
  | CvmFundDeliveryFiiEventRejectedRowV1
  | SecEdgarEtfFilingRejectionV1

export type OfficialEventsServerJobResultV1 = {
  jobId: string
  provider: OfficialEventsServerJobV1['provider']
  status: 'succeeded' | 'failed' | 'conflict'
  startedAt: string
  completedAt: string
  fetchedEventCount: number
  rejectedItemCount: number
  providerCounters: OfficialEventsProviderCountersV1 | null
  rejectedItems: OfficialEventsProviderRejectedItemV1[]
  providerDuplicates: OfficialEventDuplicateV1[]
  providerConflicts: OfficialEventConflictV1[]
  persistenceResult: OfficialAssetEventStorageWriteResultV1 | null
  error: OfficialEventsServerSafeErrorV1 | null
  warnings: string[]
}

export type OfficialEventsServerExecutionResultV1 = {
  executionVersion: typeof OFFICIAL_EVENTS_SERVER_EXECUTION_V1_VERSION
  startedAt: string
  completedAt: string
  totalJobs: number
  succeededJobs: number
  failedJobs: number
  conflictJobs: number
  totalFetchedEvents: number
  totalPersistedAttempts: number
  jobs: OfficialEventsServerJobResultV1[]
}

export type OfficialEventsProviderRunnersV1 = {
  cvmIpe(input: {
    year: number
    ingestedAt: string
    updatedAt: string
  }): Promise<CvmIpeStockEventsExtractionResultV1>
  cvmFundDelivery(input: {
    year: number
    month: number
    ingestedAt: string
    updatedAt: string
  }): Promise<CvmFundDeliveryFiiEventsExtractionResultV1>
  secEdgar(input: {
    fromDate: string
    toDate: string
    ingestedAt: string
    updatedAt: string
  }): Promise<SecEdgarEtfEventResultV1>
}

export type OfficialEventsServerExecutorDependenciesV1 = {
  providers: OfficialEventsProviderRunnersV1
  storage: OfficialAssetEventStorageV1
  now: () => string
}

export type OfficialEventsServerExecutorV1 = {
  execute(
    jobs: readonly OfficialEventsServerJobV1[]
  ): Promise<OfficialEventsServerExecutionResultV1>
}
