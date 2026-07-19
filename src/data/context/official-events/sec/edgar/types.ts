import type { OfficialAssetEventV1 } from '../../../../../domain/context/official-events'
import type {
  OfficialEventConflictV1,
  OfficialEventDuplicateV1,
} from '../../../../../domain/context/official-events/types'

export type SecEdgarFetchRequestV1 = {
  url: string
  headers: Readonly<Record<string, string>>
}

export type SecEdgarFetchResponseV1 = {
  ok: boolean
  status: number
  headers: { get(name: string): string | null }
  arrayBuffer(): Promise<ArrayBuffer>
}

export type SecEdgarFetcherV1 = (
  request: SecEdgarFetchRequestV1
) => Promise<SecEdgarFetchResponseV1>

export type SecEdgarRecentFilingV1 = {
  sourceIndex: number
  accessionNumber: string
  filingDate: string
  reportDate: string
  acceptanceDateTime: string
  act: string
  form: string
  fileNumber: string
  filmNumber: string
  items: string
  coreType: string
  size: number
  isXbrl: number
  isInlineXbrl: number
  isXbrlNumeric: number | null
  primaryDocument: string
  primaryDocDescription: string
}

export type SecEdgarHistoricalSubmissionsFileV1 = {
  name: string
  filingCount: number
  filingFrom: string
  filingTo: string
}

export type SecEdgarSubmissionsV1 = {
  registrantCik: string
  registrantName: string
  recentFilings: readonly SecEdgarRecentFilingV1[]
  historicalFiles: readonly SecEdgarHistoricalSubmissionsFileV1[]
}

export type SecEdgarSeriesClassV1 = {
  seriesId: string
  classes: readonly { classContractId: string }[]
}

export type SecEdgarFilingDetailV1 = {
  accessionNumber: string
  scope: 'series-and-classes' | 'registrant-only'
  series: readonly SecEdgarSeriesClassV1[]
  seriesCount: number
  classCount: number
  documentCount: number
}

export type SecEdgarEtfFilingRejectionReasonV1 =
  | 'invalid-filing-date'
  | 'invalid-report-date'
  | 'invalid-acceptance-datetime'
  | 'invalid-title'
  | 'invalid-event'

export type SecEdgarEtfFilingRejectionV1 = {
  ticker: string
  registrantCik: string
  accessionNumber: string
  form: string
  filingDate: string
  reason: SecEdgarEtfFilingRejectionReasonV1
  message: string
}

export type SecEdgarEtfEventResultV1 = {
  providerVersion: 'sec-edgar-etf-events-provider.v1'
  source: 'sec-edgar'
  fromDate: string
  toDate: string
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
  events: OfficialAssetEventV1[]
  duplicates: OfficialEventDuplicateV1[]
  conflicts: OfficialEventConflictV1[]
  rejectedFilings: SecEdgarEtfFilingRejectionV1[]
}

export type ExtractSecEdgarEtfEventsInputV1 = {
  fromDate: string
  toDate: string
  submissions: readonly SecEdgarSubmissionsV1[]
  filingDetailsByUrl: ReadonlyMap<string, SecEdgarFilingDetailV1>
  ingestedAt: string
  updatedAt: string
  requestCount: number
  submissionsRequestCount: number
  detailRequestCount: number
  cacheHitCount: number
}

export type FetchSecEdgarEtfEventsInputV1 = {
  fromDate: string
  toDate: string
  fetcher: SecEdgarFetcherV1
  userAgent: string
  ingestedAt: string
  updatedAt: string
}
