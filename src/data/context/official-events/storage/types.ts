import type {
  OfficialEventAssociationEvidenceV1,
  OfficialEventDocumentIdentityKindV1,
  OfficialEventProvenanceScalarV1,
  OfficialEventRelatedDocumentV1,
  OfficialEventSourceV1,
  OfficialEventStatusV1,
  OfficialEventTemporalValueV1,
  OfficialEventTypeV1,
} from '../../../../domain/context/official-events'

export const OFFICIAL_ASSET_EVENT_STORAGE_RECORD_V1_SCHEMA_VERSION =
  'official-asset-event-storage-record.v1' as const

export type OfficialAssetEventStorageRecordV1 = {
  storageSchemaVersion: typeof OFFICIAL_ASSET_EVENT_STORAGE_RECORD_V1_SCHEMA_VERSION
  eventId: string
  domainSchemaVersion: 'official-asset-event.v1'
  deduplicationKey: string
  assetCategory: 'brazilian-stock' | 'real-estate-fund' | 'international-etf'
  assetMarket: 'BR' | 'US'
  assetTicker: string
  assetOfficialName: string
  assetRegulatoryIdentityKey: string
  cnpj: string | null
  cvmCode: string | null
  isin: string | null
  registrantCik: string | null
  seriesId: string | null
  classContractId: string | null
  eventType: OfficialEventTypeV1
  classificationJustification: string | null
  source: OfficialEventSourceV1
  sourceType: 'regulator'
  language: 'pt-BR' | 'en-US'
  jurisdiction: 'BR' | 'US'
  status: OfficialEventStatusV1
  supersedesEventId: string | null
  documentIdentityKind: OfficialEventDocumentIdentityKindV1
  documentIdentityValue: string
  sourceDocumentId: string | null
  regulatoryDocumentId: string | null
  accessionNumber: string | null
  protocolNumber: string | null
  canonicalUrl: string | null
  fingerprint: string | null
  originalUrl: string | null
  occurredAtPrecision: OfficialEventTemporalValueV1['precision'] | null
  occurredAtDate: string | null
  occurredAtInstantUtc: string | null
  occurredAtRaw: string | null
  occurredAtSourceOffset: string | null
  publishedAtPrecision: Exclude<
    OfficialEventTemporalValueV1['precision'],
    'unknown'
  >
  publishedAtDate: string | null
  publishedAtInstantUtc: string | null
  publishedAtRaw: string
  publishedAtSourceOffset: string | null
  title: string
  summary: string | null
  associationEvidence: OfficialEventAssociationEvidenceV1[]
  relatedDocuments: OfficialEventRelatedDocumentV1[]
  provenanceRawFields: Record<string, OfficialEventProvenanceScalarV1>
  provenanceSourceSystem: OfficialEventSourceV1
  provenanceSourceType: 'regulator'
  rawDocumentType: string
  rawDocumentCategory: string | null
  parserVersion: string
  mappingVersion: string
  termsAuditedAt: string
  attribution: string | null
  sourcePayloadHash: string
  ingestedAt: string
  updatedAt: string
}

export const OFFICIAL_ASSET_EVENT_STORAGE_V1_IMMUTABLE_FIELDS = [
  'eventId',
  'domainSchemaVersion',
  'deduplicationKey',
  'assetCategory',
  'assetMarket',
  'assetTicker',
  'assetOfficialName',
  'assetRegulatoryIdentityKey',
  'cnpj',
  'cvmCode',
  'isin',
  'registrantCik',
  'seriesId',
  'classContractId',
  'source',
  'sourceType',
  'language',
  'jurisdiction',
  'documentIdentityKind',
  'documentIdentityValue',
  'status',
  'supersedesEventId',
] as const satisfies readonly (keyof OfficialAssetEventStorageRecordV1)[]

export type OfficialAssetEventStorageDispositionV1 =
  'inserted' | 'updated' | 'unchanged' | 'stale-ignored' | 'conflict'

export type OfficialAssetEventStorageConflictReasonV1 =
  | 'event-id-collision'
  | 'deduplication-key-collision'
  | 'immutable-identity-change'
  | 'same-version-payload-divergence'
  | 'malformed-adapter-result'

export type OfficialAssetEventStorageItemResultV1 = {
  inputIndex: number
  eventId: string
  deduplicationKey: string
  disposition: OfficialAssetEventStorageDispositionV1
  previousUpdatedAt: string | null
  storedUpdatedAt: string | null
  conflictReason: OfficialAssetEventStorageConflictReasonV1 | null
  duplicateOfInputIndex: number | null
}

export type OfficialAssetEventStorageWriteResultV1 = {
  attempted: number
  inserted: number
  updated: number
  unchanged: number
  staleIgnored: number
  conflicts: number
  items: OfficialAssetEventStorageItemResultV1[]
}

export type OfficialAssetEventStorageV1 = {
  upsertMany(
    records: readonly OfficialAssetEventStorageRecordV1[]
  ): Promise<OfficialAssetEventStorageWriteResultV1>
}

export type OfficialAssetEventStorageBatchDuplicateV1 = {
  inputIndex: number
  duplicateOfInputIndex: number
  eventId: string
  deduplicationKey: string
}

export type PreparedOfficialAssetEventStorageBatchV1 = {
  attempted: number
  uniqueRecords: OfficialAssetEventStorageRecordV1[]
  uniqueInputIndexes: number[]
  duplicates: OfficialAssetEventStorageBatchDuplicateV1[]
}
