import type {
  OfficialAssetEventV1,
  OfficialEventDeduplicationResultV1,
} from '../../../../../domain/context'

export type CvmFundDeliveryArchiveFetchResponse = {
  ok: boolean
  status: number
  headers: {
    get: (name: string) => string | null
  }
  arrayBuffer: () => Promise<ArrayBuffer>
}

export type CvmFundDeliveryArchiveFetcher = (
  url: string
) => Promise<CvmFundDeliveryArchiveFetchResponse>

export type DownloadedCvmFundDeliveryArchive = {
  archiveUrl: string
  archiveFileName: string
  archiveBytes: Uint8Array
}

export type OfficialCvmFundDeliveryCsvDocument = {
  csvFileName: string
  content: string
}

export type CvmFundDeliveryRowV1 = {
  rowNumber: number
  fundClassType: string
  fundClassCnpj: string
  subclassId: string
  documentType: string
  competenceStartDate: string
  competenceEndDate: string
  documentId: string
  deliveryDateTime: string
  presentationType: string
  activeIndicator: string
  sourceSystem: string
}

export type CvmFundDeliveryFiiEventRejectionReasonV1 =
  | 'unsupported-document-type'
  | 'missing-delivery-datetime'
  | 'invalid-delivery-datetime'
  | 'missing-competence-period'
  | 'invalid-competence-period'
  | 'invalid-document-identifiers'
  | 'invalid-title'
  | 'invalid-event'

export type CvmFundDeliveryFiiEventRejectedRowV1 = {
  rowNumber: number
  cnpj: string
  ticker: string
  documentId: string | null
  documentType: string | null
  reason: CvmFundDeliveryFiiEventRejectionReasonV1
  message: string
}

export type CvmFundDeliveryFiiEventsExtractionResultV1 = {
  providerVersion: 'cvm-fund-delivery-fii-events-provider.v1'
  source: 'cvm-fund-delivery'
  year: number
  month: number
  referenceMonth: string
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
  rejectedRows: CvmFundDeliveryFiiEventRejectedRowV1[]
}

export type ExtractCvmFundDeliveryFiiEventsInput = {
  year: number
  month: number
  archiveFileName: string
  csvFileName: string
  csvContent: string
  ingestedAt: string
  updatedAt: string
}

export type FetchCvmFundDeliveryFiiEventsInput = {
  year: number
  month: number
  fetcher: CvmFundDeliveryArchiveFetcher
  ingestedAt: string
  updatedAt: string
}
