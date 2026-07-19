import { buildWriteResult, getUtcTimestampOrder } from './internal'
import { assertOfficialAssetEventStorageRecordV1 } from './record'
import { assertOfficialAssetEventStorageWriteResultV1 } from './resultValidation'
import type {
  OfficialAssetEventStorageConflictReasonV1,
  OfficialAssetEventStorageDispositionV1,
  OfficialAssetEventStorageItemResultV1,
  OfficialAssetEventStorageRecordV1,
  OfficialAssetEventStorageV1,
  OfficialAssetEventStorageWriteResultV1,
} from './types'

export const OFFICIAL_ASSET_EVENTS_UPSERT_RPC_V1 =
  'upsert_official_asset_events_v1' as const
export const OFFICIAL_ASSET_EVENTS_UPSERT_BATCH_LIMIT_V1 = 500

export type OfficialAssetEventSupabaseRowV1 = {
  storage_schema_version: OfficialAssetEventStorageRecordV1['storageSchemaVersion']
  domain_schema_version: OfficialAssetEventStorageRecordV1['domainSchemaVersion']
  event_id: string
  deduplication_key: string
  asset_category: OfficialAssetEventStorageRecordV1['assetCategory']
  asset_market: OfficialAssetEventStorageRecordV1['assetMarket']
  asset_ticker: string
  asset_official_name: string
  asset_regulatory_identity_key: string
  cnpj: string | null
  cvm_code: string | null
  isin: string | null
  registrant_cik: string | null
  series_id: string | null
  class_contract_id: string | null
  event_type: OfficialAssetEventStorageRecordV1['eventType']
  classification_justification: string | null
  source: OfficialAssetEventStorageRecordV1['source']
  source_type: OfficialAssetEventStorageRecordV1['sourceType']
  language: OfficialAssetEventStorageRecordV1['language']
  jurisdiction: OfficialAssetEventStorageRecordV1['jurisdiction']
  status: OfficialAssetEventStorageRecordV1['status']
  supersedes_event_id: string | null
  document_identity_kind: OfficialAssetEventStorageRecordV1['documentIdentityKind']
  document_identity_value: string
  source_document_id: string | null
  regulatory_document_id: string | null
  accession_number: string | null
  protocol_number: string | null
  canonical_url: string | null
  fingerprint: string | null
  original_url: string | null
  occurred_at_precision: OfficialAssetEventStorageRecordV1['occurredAtPrecision']
  occurred_at_date: string | null
  occurred_at_instant_utc: string | null
  occurred_at_raw: string | null
  occurred_at_source_offset: string | null
  published_at_precision: OfficialAssetEventStorageRecordV1['publishedAtPrecision']
  published_at_date: string | null
  published_at_instant_utc: string | null
  published_at_raw: string
  published_at_source_offset: string | null
  title: string
  summary: string | null
  association_evidence: OfficialAssetEventStorageRecordV1['associationEvidence']
  related_documents: OfficialAssetEventStorageRecordV1['relatedDocuments']
  provenance_raw_fields: OfficialAssetEventStorageRecordV1['provenanceRawFields']
  provenance_source_system: OfficialAssetEventStorageRecordV1['provenanceSourceSystem']
  provenance_source_type: OfficialAssetEventStorageRecordV1['provenanceSourceType']
  raw_document_type: string
  raw_document_category: string | null
  parser_version: string
  mapping_version: string
  terms_audited_at: string
  attribution: string | null
  source_payload_hash: string
  ingested_at: string
  updated_at: string
}

export type OfficialAssetEventsSupabaseRpcBatchItemV1 = {
  inputIndex: number
  record: OfficialAssetEventSupabaseRowV1
}

export type OfficialAssetEventsSupabaseRpcClientV1 = {
  rpc(
    functionName: typeof OFFICIAL_ASSET_EVENTS_UPSERT_RPC_V1,
    args: { input_batch: readonly OfficialAssetEventsSupabaseRpcBatchItemV1[] }
  ): PromiseLike<{ data: unknown; error: unknown }>
}

export type OfficialAssetEventsSupabaseAdapterErrorKindV1 =
  | 'invalid-input'
  | 'batch-limit'
  | 'transport'
  | 'rpc-error'
  | 'malformed-response'

export class OfficialAssetEventsSupabaseAdapterErrorV1 extends Error {
  readonly kind: OfficialAssetEventsSupabaseAdapterErrorKindV1
  readonly functionName = OFFICIAL_ASSET_EVENTS_UPSERT_RPC_V1
  readonly itemCount: number
  readonly code: string | null
  readonly status: number | null

  constructor(input: {
    kind: OfficialAssetEventsSupabaseAdapterErrorKindV1
    message: string
    itemCount: number
    code?: string | null
    status?: number | null
  }) {
    super(input.message)
    this.name = 'OfficialAssetEventsSupabaseAdapterErrorV1'
    this.kind = input.kind
    this.itemCount = input.itemCount
    this.code = input.code ?? null
    this.status = input.status ?? null
  }
}

function cloneAssociationEvidence(
  value: OfficialAssetEventStorageRecordV1['associationEvidence']
): OfficialAssetEventStorageRecordV1['associationEvidence'] {
  return value.map((item) => ({ ...item }))
}

function cloneRelatedDocuments(
  value: OfficialAssetEventStorageRecordV1['relatedDocuments']
): OfficialAssetEventStorageRecordV1['relatedDocuments'] {
  return value.map((item) => ({ ...item }))
}

export function toOfficialAssetEventSupabaseRowV1(
  record: OfficialAssetEventStorageRecordV1
): OfficialAssetEventSupabaseRowV1 {
  assertOfficialAssetEventStorageRecordV1(record)
  return {
    storage_schema_version: record.storageSchemaVersion,
    domain_schema_version: record.domainSchemaVersion,
    event_id: record.eventId,
    deduplication_key: record.deduplicationKey,
    asset_category: record.assetCategory,
    asset_market: record.assetMarket,
    asset_ticker: record.assetTicker,
    asset_official_name: record.assetOfficialName,
    asset_regulatory_identity_key: record.assetRegulatoryIdentityKey,
    cnpj: record.cnpj,
    cvm_code: record.cvmCode,
    isin: record.isin,
    registrant_cik: record.registrantCik,
    series_id: record.seriesId,
    class_contract_id: record.classContractId,
    event_type: record.eventType,
    classification_justification: record.classificationJustification,
    source: record.source,
    source_type: record.sourceType,
    language: record.language,
    jurisdiction: record.jurisdiction,
    status: record.status,
    supersedes_event_id: record.supersedesEventId,
    document_identity_kind: record.documentIdentityKind,
    document_identity_value: record.documentIdentityValue,
    source_document_id: record.sourceDocumentId,
    regulatory_document_id: record.regulatoryDocumentId,
    accession_number: record.accessionNumber,
    protocol_number: record.protocolNumber,
    canonical_url: record.canonicalUrl,
    fingerprint: record.fingerprint,
    original_url: record.originalUrl,
    occurred_at_precision: record.occurredAtPrecision,
    occurred_at_date: record.occurredAtDate,
    occurred_at_instant_utc: record.occurredAtInstantUtc,
    occurred_at_raw: record.occurredAtRaw,
    occurred_at_source_offset: record.occurredAtSourceOffset,
    published_at_precision: record.publishedAtPrecision,
    published_at_date: record.publishedAtDate,
    published_at_instant_utc: record.publishedAtInstantUtc,
    published_at_raw: record.publishedAtRaw,
    published_at_source_offset: record.publishedAtSourceOffset,
    title: record.title,
    summary: record.summary,
    association_evidence: cloneAssociationEvidence(record.associationEvidence),
    related_documents: cloneRelatedDocuments(record.relatedDocuments),
    provenance_raw_fields: { ...record.provenanceRawFields },
    provenance_source_system: record.provenanceSourceSystem,
    provenance_source_type: record.provenanceSourceType,
    raw_document_type: record.rawDocumentType,
    raw_document_category: record.rawDocumentCategory,
    parser_version: record.parserVersion,
    mapping_version: record.mappingVersion,
    terms_audited_at: record.termsAuditedAt,
    attribution: record.attribution,
    source_payload_hash: record.sourcePayloadHash,
    ingested_at: record.ingestedAt,
    updated_at: record.updatedAt,
  }
}

export function fromOfficialAssetEventSupabaseRowV1(
  row: OfficialAssetEventSupabaseRowV1
): OfficialAssetEventStorageRecordV1 {
  const record: OfficialAssetEventStorageRecordV1 = {
    storageSchemaVersion: row.storage_schema_version,
    domainSchemaVersion: row.domain_schema_version,
    eventId: row.event_id,
    deduplicationKey: row.deduplication_key,
    assetCategory: row.asset_category,
    assetMarket: row.asset_market,
    assetTicker: row.asset_ticker,
    assetOfficialName: row.asset_official_name,
    assetRegulatoryIdentityKey: row.asset_regulatory_identity_key,
    cnpj: row.cnpj,
    cvmCode: row.cvm_code,
    isin: row.isin,
    registrantCik: row.registrant_cik,
    seriesId: row.series_id,
    classContractId: row.class_contract_id,
    eventType: row.event_type,
    classificationJustification: row.classification_justification,
    source: row.source,
    sourceType: row.source_type,
    language: row.language,
    jurisdiction: row.jurisdiction,
    status: row.status,
    supersedesEventId: row.supersedes_event_id,
    documentIdentityKind: row.document_identity_kind,
    documentIdentityValue: row.document_identity_value,
    sourceDocumentId: row.source_document_id,
    regulatoryDocumentId: row.regulatory_document_id,
    accessionNumber: row.accession_number,
    protocolNumber: row.protocol_number,
    canonicalUrl: row.canonical_url,
    fingerprint: row.fingerprint,
    originalUrl: row.original_url,
    occurredAtPrecision: row.occurred_at_precision,
    occurredAtDate: row.occurred_at_date,
    occurredAtInstantUtc: row.occurred_at_instant_utc,
    occurredAtRaw: row.occurred_at_raw,
    occurredAtSourceOffset: row.occurred_at_source_offset,
    publishedAtPrecision: row.published_at_precision,
    publishedAtDate: row.published_at_date,
    publishedAtInstantUtc: row.published_at_instant_utc,
    publishedAtRaw: row.published_at_raw,
    publishedAtSourceOffset: row.published_at_source_offset,
    title: row.title,
    summary: row.summary,
    associationEvidence: cloneAssociationEvidence(row.association_evidence),
    relatedDocuments: cloneRelatedDocuments(row.related_documents),
    provenanceRawFields: { ...row.provenance_raw_fields },
    provenanceSourceSystem: row.provenance_source_system,
    provenanceSourceType: row.provenance_source_type,
    rawDocumentType: row.raw_document_type,
    rawDocumentCategory: row.raw_document_category,
    parserVersion: row.parser_version,
    mappingVersion: row.mapping_version,
    termsAuditedAt: row.terms_audited_at,
    attribution: row.attribution,
    sourcePayloadHash: row.source_payload_hash,
    ingestedAt: row.ingested_at,
    updatedAt: row.updated_at,
  }
  assertOfficialAssetEventStorageRecordV1(record)
  return record
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  )
}

function hasExactKeys(
  value: Record<string, unknown>,
  keys: readonly string[]
): boolean {
  return (
    Object.keys(value).length === keys.length &&
    keys.every((key) => Object.hasOwn(value, key))
  )
}

function readCounter(value: unknown, field: string, itemCount: number): number {
  if (
    typeof value !== 'number' ||
    !Number.isSafeInteger(value) ||
    value < 0 ||
    Object.is(value, -0)
  ) {
    throw malformed(`${field} is invalid`, itemCount)
  }
  return value
}

function readNullableTimestamp(
  value: unknown,
  field: string,
  itemCount: number
): string | null {
  if (value === null) return null
  if (typeof value !== 'string')
    throw malformed(`${field} is invalid`, itemCount)
  try {
    getUtcTimestampOrder(value)
  } catch {
    throw malformed(`${field} is invalid`, itemCount)
  }
  return value
}

function readDisposition(
  value: unknown,
  itemCount: number
): OfficialAssetEventStorageDispositionV1 {
  if (
    value === 'inserted' ||
    value === 'updated' ||
    value === 'unchanged' ||
    value === 'stale-ignored' ||
    value === 'conflict'
  ) {
    return value
  }
  throw malformed('RPC item disposition is invalid', itemCount)
}

function readConflictReason(
  value: unknown,
  itemCount: number
): OfficialAssetEventStorageConflictReasonV1 | null {
  if (value === null) return null
  if (
    value === 'event-id-collision' ||
    value === 'deduplication-key-collision' ||
    value === 'immutable-identity-change' ||
    value === 'same-version-payload-divergence'
  ) {
    return value
  }
  throw malformed('RPC item conflictReason is invalid', itemCount)
}

function malformed(
  detail: string,
  itemCount: number
): OfficialAssetEventsSupabaseAdapterErrorV1 {
  return new OfficialAssetEventsSupabaseAdapterErrorV1({
    kind: 'malformed-response',
    message: `Malformed official asset events RPC response: ${detail}`,
    itemCount,
  })
}

const RESULT_KEYS = [
  'attempted',
  'inserted',
  'updated',
  'unchanged',
  'staleIgnored',
  'conflicts',
  'items',
] as const
const ITEM_KEYS = [
  'inputIndex',
  'eventId',
  'deduplicationKey',
  'disposition',
  'previousUpdatedAt',
  'storedUpdatedAt',
  'conflictReason',
  'duplicateOfInputIndex',
] as const

function parseRpcItem(
  value: unknown,
  inputIndex: number,
  record: OfficialAssetEventStorageRecordV1,
  itemCount: number
): OfficialAssetEventStorageItemResultV1 {
  if (!isPlainObject(value) || !hasExactKeys(value, ITEM_KEYS)) {
    throw malformed('RPC item shape is invalid', itemCount)
  }
  const parsedInputIndex = readCounter(
    value.inputIndex,
    'inputIndex',
    itemCount
  )
  if (parsedInputIndex !== inputIndex) {
    throw malformed('RPC item order or inputIndex is invalid', itemCount)
  }
  if (
    value.eventId !== record.eventId ||
    value.deduplicationKey !== record.deduplicationKey
  ) {
    throw malformed('RPC item identity diverges from input', itemCount)
  }
  const disposition = readDisposition(value.disposition, itemCount)
  const conflictReason = readConflictReason(value.conflictReason, itemCount)
  const previousUpdatedAt = readNullableTimestamp(
    value.previousUpdatedAt,
    'previousUpdatedAt',
    itemCount
  )
  const storedUpdatedAt = readNullableTimestamp(
    value.storedUpdatedAt,
    'storedUpdatedAt',
    itemCount
  )
  if (value.duplicateOfInputIndex !== null) {
    throw malformed('RPC must not return duplicate metadata', itemCount)
  }
  if ((disposition === 'conflict') !== (conflictReason !== null)) {
    throw malformed('RPC conflict reason is incoherent', itemCount)
  }
  if (disposition === 'inserted') {
    if (previousUpdatedAt !== null || storedUpdatedAt !== record.updatedAt) {
      throw malformed('inserted timestamps are incoherent', itemCount)
    }
  } else if (disposition === 'updated') {
    if (previousUpdatedAt === null || storedUpdatedAt !== record.updatedAt) {
      throw malformed('updated timestamps are incoherent', itemCount)
    }
  } else if (
    previousUpdatedAt === null ||
    storedUpdatedAt !== previousUpdatedAt
  ) {
    throw malformed('stored timestamps are incoherent', itemCount)
  }

  return {
    inputIndex,
    eventId: record.eventId,
    deduplicationKey: record.deduplicationKey,
    disposition,
    previousUpdatedAt,
    storedUpdatedAt,
    conflictReason,
    duplicateOfInputIndex: null,
  }
}

function parseRpcResult(
  data: unknown,
  records: readonly OfficialAssetEventStorageRecordV1[]
): OfficialAssetEventStorageWriteResultV1 {
  const itemCount = records.length
  if (!isPlainObject(data) || !hasExactKeys(data, RESULT_KEYS)) {
    throw malformed('top-level shape is invalid', itemCount)
  }
  if (!Array.isArray(data.items) || data.items.length !== itemCount) {
    throw malformed('items must match the input length', itemCount)
  }
  const result: OfficialAssetEventStorageWriteResultV1 = {
    attempted: readCounter(data.attempted, 'attempted', itemCount),
    inserted: readCounter(data.inserted, 'inserted', itemCount),
    updated: readCounter(data.updated, 'updated', itemCount),
    unchanged: readCounter(data.unchanged, 'unchanged', itemCount),
    staleIgnored: readCounter(data.staleIgnored, 'staleIgnored', itemCount),
    conflicts: readCounter(data.conflicts, 'conflicts', itemCount),
    items: data.items.map((item, index) =>
      parseRpcItem(item, index, records[index], itemCount)
    ),
  }
  try {
    assertOfficialAssetEventStorageWriteResultV1(result, records)
  } catch {
    throw malformed('contract validation failed', itemCount)
  }
  return result
}

function safeErrorCode(error: unknown): string | null {
  if (!isPlainObject(error) || typeof error.code !== 'string') return null
  return /^[A-Za-z0-9_.-]{1,64}$/.test(error.code) ? error.code : null
}

function safeErrorStatus(error: unknown): number | null {
  if (!isPlainObject(error) || typeof error.status !== 'number') return null
  return Number.isSafeInteger(error.status) &&
    error.status >= 100 &&
    error.status <= 599
    ? error.status
    : null
}

function assertDenseRecordArray(
  records: readonly OfficialAssetEventStorageRecordV1[]
): void {
  if (!Array.isArray(records)) {
    throw new OfficialAssetEventsSupabaseAdapterErrorV1({
      kind: 'invalid-input',
      message: 'Official asset events input must be an array',
      itemCount: 0,
    })
  }
  for (let index = 0; index < records.length; index += 1) {
    if (!Object.hasOwn(records, index)) {
      throw new OfficialAssetEventsSupabaseAdapterErrorV1({
        kind: 'invalid-input',
        message: 'Official asset events input must be dense',
        itemCount: records.length,
      })
    }
    try {
      assertOfficialAssetEventStorageRecordV1(records[index])
    } catch {
      throw new OfficialAssetEventsSupabaseAdapterErrorV1({
        kind: 'invalid-input',
        message: `Official asset event record ${index} is invalid`,
        itemCount: records.length,
      })
    }
  }
}

export function createSupabaseOfficialAssetEventStorageV1(input: {
  client: OfficialAssetEventsSupabaseRpcClientV1
}): OfficialAssetEventStorageV1 {
  return {
    async upsertMany(records) {
      assertDenseRecordArray(records)
      if (records.length > OFFICIAL_ASSET_EVENTS_UPSERT_BATCH_LIMIT_V1) {
        throw new OfficialAssetEventsSupabaseAdapterErrorV1({
          kind: 'batch-limit',
          message: `Official asset events batch exceeds ${OFFICIAL_ASSET_EVENTS_UPSERT_BATCH_LIMIT_V1} records`,
          itemCount: records.length,
        })
      }
      if (records.length === 0) return buildWriteResult([])

      const inputBatch = records.map((record, inputIndex) => ({
        inputIndex,
        record: toOfficialAssetEventSupabaseRowV1(record),
      }))
      let response: { data: unknown; error: unknown }
      try {
        response = await input.client.rpc(OFFICIAL_ASSET_EVENTS_UPSERT_RPC_V1, {
          input_batch: inputBatch,
        })
      } catch {
        throw new OfficialAssetEventsSupabaseAdapterErrorV1({
          kind: 'transport',
          message: 'Official asset events RPC transport failed',
          itemCount: records.length,
        })
      }
      if (response.error !== null) {
        throw new OfficialAssetEventsSupabaseAdapterErrorV1({
          kind: 'rpc-error',
          message: 'Official asset events RPC failed',
          itemCount: records.length,
          code: safeErrorCode(response.error),
          status: safeErrorStatus(response.error),
        })
      }
      return parseRpcResult(response.data, records)
    },
  }
}
