import { buildOfficialAssetEventV1 } from './buildOfficialAssetEventV1'
import {
  OFFICIAL_ASSET_EVENT_V1_SCHEMA_VERSION,
  type OfficialEventAssociationEvidenceV1,
  type OfficialEventTemporalInputV1,
  type OfficialEventTemporalValueV1,
  type OfficialAssetEventV1,
} from './types'

function assertPlainDataTree(
  value: unknown,
  path: string,
  seen: WeakSet<object>
): void {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return
  }
  if (typeof value !== 'object') {
    throw new Error(`${path} must contain only canonical data values`)
  }
  if (seen.has(value)) {
    throw new Error(`${path} must not contain cycles or shared references`)
  }
  seen.add(value)

  const expectedPrototype = Array.isArray(value)
    ? Array.prototype
    : Object.prototype
  if (Object.getPrototypeOf(value) !== expectedPrototype) {
    throw new Error(`${path} must use a canonical plain prototype`)
  }
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      if (!Object.hasOwn(value, index)) {
        throw new Error(`${path} must not contain missing array items`)
      }
    }
  }

  for (const key of Reflect.ownKeys(value)) {
    if (typeof key === 'symbol') {
      throw new Error(`${path} must not contain symbol properties`)
    }
    const descriptor = Object.getOwnPropertyDescriptor(value, key)
    if (!descriptor || !('value' in descriptor)) {
      throw new Error(`${path}.${key} must be a plain data property`)
    }
    if (key !== 'length') {
      assertPlainDataTree(descriptor.value, `${path}.${key}`, seen)
    }
  }
}

function haveSameCanonicalStructure(
  actual: unknown,
  expected: unknown
): boolean {
  if (Object.is(actual, expected)) return true
  if (
    actual === null ||
    expected === null ||
    typeof actual !== 'object' ||
    typeof expected !== 'object' ||
    Array.isArray(actual) !== Array.isArray(expected)
  ) {
    return false
  }

  const actualKeys = Reflect.ownKeys(actual)
  const expectedKeys = Reflect.ownKeys(expected)
  if (
    actualKeys.some((key) => typeof key === 'symbol') ||
    expectedKeys.some((key) => typeof key === 'symbol') ||
    actualKeys.length !== expectedKeys.length
  ) {
    return false
  }
  const expectedKeySet = new Set(expectedKeys)
  if (actualKeys.some((key) => !expectedKeySet.has(key))) return false

  return actualKeys.every((key) => {
    const actualDescriptor = Object.getOwnPropertyDescriptor(actual, key)
    const expectedDescriptor = Object.getOwnPropertyDescriptor(expected, key)
    return (
      actualDescriptor !== undefined &&
      expectedDescriptor !== undefined &&
      'value' in actualDescriptor &&
      'value' in expectedDescriptor &&
      haveSameCanonicalStructure(
        actualDescriptor.value,
        expectedDescriptor.value
      )
    )
  })
}

function toTemporalInput(
  value: OfficialEventTemporalValueV1
): OfficialEventTemporalInputV1 {
  if (value.precision === 'date') {
    return { precision: 'date', value: value.date }
  }
  if (value.precision === 'minute') {
    return { precision: 'minute', value: value.raw }
  }
  if (value.precision === 'second') {
    return { precision: 'second', value: value.raw }
  }
  if (value.precision === 'unknown') {
    return { precision: 'unknown', raw: value.raw }
  }
  throw new Error('Unsupported official event temporal precision')
}

function toAssociationEvidenceInput(
  evidence: OfficialEventAssociationEvidenceV1
): OfficialEventAssociationEvidenceV1 {
  if (evidence.reason === 'exact-regulatory-identity') {
    return {
      reason: evidence.reason,
      observedRegulatoryIdentityKey: evidence.observedRegulatoryIdentityKey,
    }
  }
  if (evidence.reason === 'exact-ticker-provider-mapping') {
    return {
      reason: evidence.reason,
      observedTicker: evidence.observedTicker,
      mappingVersion: evidence.mappingVersion,
    }
  }
  if (evidence.reason === 'exact-cnpj') {
    return { reason: evidence.reason, observedCnpj: evidence.observedCnpj }
  }
  if (evidence.reason === 'exact-cik-series-class') {
    return {
      reason: evidence.reason,
      observedRegistrantCik: evidence.observedRegistrantCik,
      observedSeriesId: evidence.observedSeriesId,
      observedClassContractId: evidence.observedClassContractId,
    }
  }
  if (evidence.reason === 'exact-isin') {
    return { reason: evidence.reason, observedIsin: evidence.observedIsin }
  }
  if (evidence.reason === 'issuer-official-source') {
    return {
      reason: evidence.reason,
      observedOfficialSource: evidence.observedOfficialSource,
    }
  }
  throw new Error('Unsupported official event association evidence')
}

export function assertOfficialAssetEventV1(event: OfficialAssetEventV1): void {
  assertPlainDataTree(event, 'OfficialAssetEventV1', new WeakSet())
  if (event.schemaVersion !== OFFICIAL_ASSET_EVENT_V1_SCHEMA_VERSION) {
    throw new Error('Invalid OfficialAssetEventV1 schemaVersion')
  }

  const publishedAt = toTemporalInput(event.publishedAt)
  if (publishedAt.precision === 'unknown') {
    throw new Error('publishedAt cannot have unknown precision')
  }
  const canonicalEvent = buildOfficialAssetEventV1({
    ticker: event.assetIdentity.ticker,
    eventType: event.eventType,
    classificationJustification: event.classificationJustification,
    associationEvidence: event.associationEvidence.map(
      toAssociationEvidenceInput
    ),
    occurredAt:
      event.occurredAt === null ? null : toTemporalInput(event.occurredAt),
    publishedAt,
    source: event.source,
    documentIdentifiers: {
      sourceDocumentId: event.documentIdentifiers.sourceDocumentId,
      regulatoryDocumentId: event.documentIdentifiers.regulatoryDocumentId,
      accessionNumber: event.documentIdentifiers.accessionNumber,
      protocolNumber: event.documentIdentifiers.protocolNumber,
      canonicalUrl: event.documentIdentifiers.canonicalUrl,
      fingerprint: event.documentIdentifiers.fingerprint,
    },
    originalUrl: event.originalUrl,
    title: event.title,
    summary: event.summary,
    status: event.status,
    supersedesEventId: event.supersedesEventId,
    relatedDocuments: event.relatedDocuments.map(({ relation, eventId }) => ({
      relation,
      eventId,
    })),
    ingestedAt: event.ingestedAt,
    updatedAt: event.updatedAt,
    provenance: {
      sourceSystem: event.provenance.sourceSystem,
      sourceType: event.provenance.sourceType,
      rawDocumentType: event.provenance.rawDocumentType,
      rawDocumentCategory: event.provenance.rawDocumentCategory,
      parserVersion: event.provenance.parserVersion,
      mappingVersion: event.provenance.mappingVersion,
      termsAuditedAt: event.provenance.termsAuditedAt,
      attribution: event.provenance.attribution,
      sourcePayloadHash: event.provenance.sourcePayloadHash,
      rawFields: event.provenance.rawFields,
    },
  })

  if (!haveSameCanonicalStructure(event, canonicalEvent)) {
    throw new Error(
      'OfficialAssetEventV1 diverges from its canonical domain representation'
    )
  }
}
