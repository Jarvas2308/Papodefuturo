import type {
  OfficialAssetEventV1,
  OfficialEventDeduplicationResultV1,
} from '../../../../../domain/context'

export type CvmIpeArchiveFetchResponse = {
  ok: boolean
  status: number
  headers: {
    get: (name: string) => string | null
  }
  arrayBuffer: () => Promise<ArrayBuffer>
}

export type CvmIpeArchiveFetcher = (
  url: string
) => Promise<CvmIpeArchiveFetchResponse>

export type DownloadedCvmIpeArchive = {
  archiveUrl: string
  archiveFileName: string
  archiveBytes: Uint8Array
}

export type OfficialCvmIpeCsvDocument = {
  csvFileName: string
  content: string
}

export type CvmIpeRowV1 = {
  rowNumber: number
  companyCnpj: string
  companyName: string
  cvmCode: string
  referenceDate: string
  category: string
  documentType: string
  species: string
  subject: string
  deliveryDate: string
  presentationType: string
  protocolNumber: string
  version: string
  downloadLink: string
}

export type CvmIpeStockEventRejectionReasonV1 =
  | 'unsupported-category'
  | 'unsupported-document-status'
  | 'missing-published-date'
  | 'invalid-published-date'
  | 'invalid-reference-date'
  | 'invalid-document-url'
  | 'unapproved-document-host'
  | 'invalid-document-identifiers'
  | 'invalid-title'
  | 'invalid-event'

export type CvmIpeStockEventRejectedRowV1 = {
  rowNumber: number
  cvmCode: string
  ticker: string | null
  protocolNumber: string | null
  category: string | null
  reason: CvmIpeStockEventRejectionReasonV1
  message: string
}

export type CvmIpeStockEventsExtractionResultV1 = {
  providerVersion: 'cvm-ipe-stock-events-provider.v1'
  source: 'cvm-ipe'
  year: number
  archiveUrl: string
  archiveFileName: string
  csvFileName: string
  totalRows: number
  ignoredNonUniverseRows: number
  targetRows: number
  acceptedRows: number
  exactDuplicateRows: number
  conflictingPayloadRows: number
  events: OfficialAssetEventV1[]
  duplicates: OfficialEventDeduplicationResultV1['duplicates']
  conflicts: OfficialEventDeduplicationResultV1['conflicts']
  rejectedRows: CvmIpeStockEventRejectedRowV1[]
}

export type ExtractCvmIpeStockEventsInput = {
  year: number
  archiveFileName: string
  csvFileName: string
  csvContent: string
  ingestedAt: string
  updatedAt: string
}

export type FetchCvmIpeStockEventsInput = {
  year: number
  fetcher: CvmIpeArchiveFetcher
  ingestedAt: string
  updatedAt: string
}
