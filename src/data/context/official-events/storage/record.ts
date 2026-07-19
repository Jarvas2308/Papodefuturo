import {
  OFFICIAL_ASSET_EVENT_V1_SCHEMA_VERSION,
  assertOfficialAssetEventV1,
  getOfficialEventAssetIdentityByTicker,
  selectOfficialEventDocumentIdentityV1,
  type OfficialAssetEventV1,
  type OfficialEventAssetIdentityV1,
  type OfficialEventTemporalValueV1,
} from '../../../../domain/context/official-events'
import {
  OFFICIAL_ASSET_EVENT_STORAGE_RECORD_V1_SCHEMA_VERSION,
  type OfficialAssetEventStorageRecordV1,
} from './types'

const RECORD_KEYS = [
  'storageSchemaVersion',
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
  'eventType',
  'classificationJustification',
  'source',
  'sourceType',
  'language',
  'jurisdiction',
  'status',
  'supersedesEventId',
  'documentIdentityKind',
  'documentIdentityValue',
  'sourceDocumentId',
  'regulatoryDocumentId',
  'accessionNumber',
  'protocolNumber',
  'canonicalUrl',
  'fingerprint',
  'originalUrl',
  'occurredAtPrecision',
  'occurredAtDate',
  'occurredAtInstantUtc',
  'occurredAtRaw',
  'occurredAtSourceOffset',
  'publishedAtPrecision',
  'publishedAtDate',
  'publishedAtInstantUtc',
  'publishedAtRaw',
  'publishedAtSourceOffset',
  'title',
  'summary',
  'associationEvidence',
  'relatedDocuments',
  'provenanceRawFields',
  'provenanceSourceSystem',
  'provenanceSourceType',
  'rawDocumentType',
  'rawDocumentCategory',
  'parserVersion',
  'mappingVersion',
  'termsAuditedAt',
  'attribution',
  'sourcePayloadHash',
  'ingestedAt',
  'updatedAt',
] as const satisfies readonly (keyof OfficialAssetEventStorageRecordV1)[]

function assertPlainDataTree(
  value: unknown,
  path: string,
  seen: WeakSet<object>
): void {
  if (
    value === null ||
    ['string', 'number', 'boolean'].includes(typeof value)
  ) {
    if (
      typeof value === 'number' &&
      (!Number.isFinite(value) || Object.is(value, -0))
    ) {
      throw new Error(`${path} must be a finite number other than -0`)
    }
    return
  }
  if (typeof value !== 'object')
    throw new Error(`${path} must contain only plain data`)
  if (seen.has(value))
    throw new Error(`${path} must not contain cycles or shared references`)
  seen.add(value)
  const expected = Array.isArray(value) ? Array.prototype : Object.prototype
  if (Object.getPrototypeOf(value) !== expected)
    throw new Error(`${path} must use a plain prototype`)
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      if (!Object.hasOwn(value, index))
        throw new Error(`${path} must not be sparse`)
    }
  }
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key === 'symbol')
      throw new Error(`${path} must not have symbol keys`)
    const descriptor = Object.getOwnPropertyDescriptor(value, key)
    if (!descriptor || !('value' in descriptor))
      throw new Error(`${path}.${key} must be a data property`)
    if (key !== 'length')
      assertPlainDataTree(descriptor.value, `${path}.${key}`, seen)
  }
}

function assertExactRecordKeys(
  record: OfficialAssetEventStorageRecordV1
): void {
  const keys = Object.keys(record)
  if (
    keys.length !== RECORD_KEYS.length ||
    RECORD_KEYS.some((key) => !Object.hasOwn(record, key))
  ) {
    throw new Error(
      'OfficialAssetEventStorageRecordV1 has unknown or missing fields'
    )
  }
}

function cloneTemporal(
  value: OfficialEventTemporalValueV1
): OfficialEventTemporalValueV1 {
  return { ...value }
}

function flattenTemporal(value: OfficialEventTemporalValueV1 | null) {
  if (value === null)
    return {
      precision: null,
      date: null,
      instantUtc: null,
      raw: null,
      sourceOffset: null,
    }
  if (value.precision === 'date')
    return {
      precision: value.precision,
      date: value.date,
      instantUtc: null,
      raw: value.raw,
      sourceOffset: null,
    }
  if (value.precision === 'unknown')
    return {
      precision: value.precision,
      date: null,
      instantUtc: null,
      raw: value.raw,
      sourceOffset: null,
    }
  return {
    precision: value.precision,
    date: null,
    instantUtc: value.instantUtc,
    raw: value.raw,
    sourceOffset: value.sourceOffset,
  }
}

function restoreTemporal(
  precision: OfficialAssetEventStorageRecordV1['occurredAtPrecision'],
  date: string | null,
  instantUtc: string | null,
  raw: string | null,
  sourceOffset: string | null,
  field: string
): OfficialEventTemporalValueV1 | null {
  if (precision === null) {
    if ([date, instantUtc, raw, sourceOffset].some((value) => value !== null))
      throw new Error(`${field} null precision has incompatible fields`)
    return null
  }
  if (precision === 'date') {
    if (
      date === null ||
      raw === null ||
      instantUtc !== null ||
      sourceOffset !== null
    )
      throw new Error(`${field} date fields are inconsistent`)
    return { precision, date, raw }
  }
  if (precision === 'unknown') {
    if (date !== null || instantUtc !== null || sourceOffset !== null)
      throw new Error(`${field} unknown fields are inconsistent`)
    return { precision, raw }
  }
  if (
    date !== null ||
    instantUtc === null ||
    raw === null ||
    sourceOffset === null
  )
    throw new Error(`${field} instant fields are inconsistent`)
  return { precision, instantUtc, raw, sourceOffset }
}

function restoreIdentity(
  record: OfficialAssetEventStorageRecordV1
): OfficialEventAssetIdentityV1 {
  const identity = getOfficialEventAssetIdentityByTicker(record.assetTicker)
  const commonMatches =
    record.assetCategory === identity.category &&
    record.assetMarket === identity.market &&
    record.assetOfficialName === identity.officialName &&
    record.assetRegulatoryIdentityKey === identity.regulatoryIdentityKey
  if (!commonMatches)
    throw new Error('Asset identity diverges from the official registry')

  if (identity.category === 'brazilian-stock') {
    if (
      record.cnpj !== identity.cnpj ||
      record.cvmCode !== identity.cvmCode ||
      record.isin !== null ||
      record.registrantCik !== null ||
      record.seriesId !== null ||
      record.classContractId !== null
    )
      throw new Error(
        'Brazilian stock regulatory identity fields are inconsistent'
      )
  } else if (identity.category === 'real-estate-fund') {
    if (
      record.cnpj !== identity.cnpj ||
      record.cvmCode !== null ||
      record.isin !== identity.isin ||
      record.registrantCik !== null ||
      record.seriesId !== null ||
      record.classContractId !== null
    )
      throw new Error(
        'Real estate fund regulatory identity fields are inconsistent'
      )
  } else if (
    record.cnpj !== null ||
    record.cvmCode !== null ||
    record.isin !== null ||
    record.registrantCik !== identity.registrantCik ||
    record.seriesId !== identity.seriesId ||
    record.classContractId !== identity.classContractId
  ) {
    throw new Error(
      'International ETF regulatory identity fields are inconsistent'
    )
  }
  return { ...identity }
}

function restoreEvent(
  record: OfficialAssetEventStorageRecordV1
): OfficialAssetEventV1 {
  const occurredAt = restoreTemporal(
    record.occurredAtPrecision,
    record.occurredAtDate,
    record.occurredAtInstantUtc,
    record.occurredAtRaw,
    record.occurredAtSourceOffset,
    'occurredAt'
  )
  const publishedAt = restoreTemporal(
    record.publishedAtPrecision,
    record.publishedAtDate,
    record.publishedAtInstantUtc,
    record.publishedAtRaw,
    record.publishedAtSourceOffset,
    'publishedAt'
  )
  if (publishedAt === null || publishedAt.precision === 'unknown')
    throw new Error('publishedAt must have known precision')
  const documentIdentifiers = {
    sourceDocumentId: record.sourceDocumentId,
    regulatoryDocumentId: record.regulatoryDocumentId,
    accessionNumber: record.accessionNumber,
    protocolNumber: record.protocolNumber,
    canonicalUrl: record.canonicalUrl,
    fingerprint: record.fingerprint,
  }
  const documentIdentity =
    selectOfficialEventDocumentIdentityV1(documentIdentifiers)
  if (
    documentIdentity.kind !== record.documentIdentityKind ||
    documentIdentity.value !== record.documentIdentityValue
  ) {
    throw new Error('Document identity diverges from its canonical identifiers')
  }
  return {
    schemaVersion: record.domainSchemaVersion,
    eventId: record.eventId,
    assetIdentity: restoreIdentity(record),
    eventType: record.eventType,
    classificationJustification: record.classificationJustification,
    associationEvidence: record.associationEvidence.map((item) => ({
      ...item,
    })),
    occurredAt: occurredAt === null ? null : cloneTemporal(occurredAt),
    publishedAt: { ...publishedAt },
    source: record.source,
    sourceType: record.sourceType,
    documentIdentity,
    documentIdentifiers,
    sourceDocumentId: record.sourceDocumentId,
    originalUrl: record.originalUrl,
    canonicalUrl: record.canonicalUrl,
    title: record.title,
    summary: record.summary,
    language: record.language,
    jurisdiction: record.jurisdiction,
    status: record.status,
    supersedesEventId: record.supersedesEventId,
    relatedDocuments: record.relatedDocuments.map((item) => ({ ...item })),
    ingestedAt: record.ingestedAt,
    updatedAt: record.updatedAt,
    deduplicationKey: record.deduplicationKey,
    provenance: {
      sourceSystem: record.provenanceSourceSystem,
      sourceType: record.provenanceSourceType,
      rawDocumentType: record.rawDocumentType,
      rawDocumentCategory: record.rawDocumentCategory,
      parserVersion: record.parserVersion,
      mappingVersion: record.mappingVersion,
      termsAuditedAt: record.termsAuditedAt,
      attribution: record.attribution,
      sourcePayloadHash: record.sourcePayloadHash,
      rawFields: { ...record.provenanceRawFields },
    },
  }
}

export function assertOfficialAssetEventStorageRecordV1(
  record: OfficialAssetEventStorageRecordV1
): void {
  assertPlainDataTree(
    record,
    'OfficialAssetEventStorageRecordV1',
    new WeakSet()
  )
  assertExactRecordKeys(record)
  if (
    record.storageSchemaVersion !==
    OFFICIAL_ASSET_EVENT_STORAGE_RECORD_V1_SCHEMA_VERSION
  )
    throw new Error('Invalid storageSchemaVersion')
  if (record.domainSchemaVersion !== OFFICIAL_ASSET_EVENT_V1_SCHEMA_VERSION)
    throw new Error('Invalid domainSchemaVersion')
  const event = restoreEvent(record)
  assertOfficialAssetEventV1(event)
}

export function toOfficialAssetEventStorageRecordV1(
  event: OfficialAssetEventV1
): OfficialAssetEventStorageRecordV1 {
  assertOfficialAssetEventV1(event)
  const occurred = flattenTemporal(event.occurredAt)
  const published = flattenTemporal(event.publishedAt)
  const stock =
    event.assetIdentity.category === 'brazilian-stock'
      ? event.assetIdentity
      : null
  const fund =
    event.assetIdentity.category === 'real-estate-fund'
      ? event.assetIdentity
      : null
  const etf =
    event.assetIdentity.category === 'international-etf'
      ? event.assetIdentity
      : null
  const record: OfficialAssetEventStorageRecordV1 = {
    storageSchemaVersion: OFFICIAL_ASSET_EVENT_STORAGE_RECORD_V1_SCHEMA_VERSION,
    eventId: event.eventId,
    domainSchemaVersion: event.schemaVersion,
    deduplicationKey: event.deduplicationKey,
    assetCategory: event.assetIdentity.category,
    assetMarket: event.assetIdentity.market,
    assetTicker: event.assetIdentity.ticker,
    assetOfficialName: event.assetIdentity.officialName,
    assetRegulatoryIdentityKey: event.assetIdentity.regulatoryIdentityKey,
    cnpj: stock?.cnpj ?? fund?.cnpj ?? null,
    cvmCode: stock?.cvmCode ?? null,
    isin: fund?.isin ?? null,
    registrantCik: etf?.registrantCik ?? null,
    seriesId: etf?.seriesId ?? null,
    classContractId: etf?.classContractId ?? null,
    eventType: event.eventType,
    classificationJustification: event.classificationJustification,
    source: event.source,
    sourceType: event.sourceType,
    language: event.language,
    jurisdiction: event.jurisdiction,
    status: event.status,
    supersedesEventId: event.supersedesEventId,
    documentIdentityKind: event.documentIdentity.kind,
    documentIdentityValue: event.documentIdentity.value,
    sourceDocumentId: event.documentIdentifiers.sourceDocumentId,
    regulatoryDocumentId: event.documentIdentifiers.regulatoryDocumentId,
    accessionNumber: event.documentIdentifiers.accessionNumber,
    protocolNumber: event.documentIdentifiers.protocolNumber,
    canonicalUrl: event.documentIdentifiers.canonicalUrl,
    fingerprint: event.documentIdentifiers.fingerprint,
    originalUrl: event.originalUrl,
    occurredAtPrecision: occurred.precision,
    occurredAtDate: occurred.date,
    occurredAtInstantUtc: occurred.instantUtc,
    occurredAtRaw: occurred.raw,
    occurredAtSourceOffset: occurred.sourceOffset,
    publishedAtPrecision:
      published.precision as OfficialAssetEventStorageRecordV1['publishedAtPrecision'],
    publishedAtDate: published.date,
    publishedAtInstantUtc: published.instantUtc,
    publishedAtRaw: published.raw as string,
    publishedAtSourceOffset: published.sourceOffset,
    title: event.title,
    summary: event.summary,
    associationEvidence: event.associationEvidence.map((item) => ({ ...item })),
    relatedDocuments: event.relatedDocuments.map((item) => ({ ...item })),
    provenanceRawFields: { ...event.provenance.rawFields },
    provenanceSourceSystem: event.provenance.sourceSystem,
    provenanceSourceType: event.provenance.sourceType,
    rawDocumentType: event.provenance.rawDocumentType,
    rawDocumentCategory: event.provenance.rawDocumentCategory,
    parserVersion: event.provenance.parserVersion,
    mappingVersion: event.provenance.mappingVersion,
    termsAuditedAt: event.provenance.termsAuditedAt,
    attribution: event.provenance.attribution,
    sourcePayloadHash: event.provenance.sourcePayloadHash,
    ingestedAt: event.ingestedAt,
    updatedAt: event.updatedAt,
  }
  assertOfficialAssetEventStorageRecordV1(record)
  return record
}

export function fromOfficialAssetEventStorageRecordV1(
  record: OfficialAssetEventStorageRecordV1
): OfficialAssetEventV1 {
  assertOfficialAssetEventStorageRecordV1(record)
  return restoreEvent(record)
}
