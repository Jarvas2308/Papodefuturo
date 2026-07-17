import {
  buildOfficialEventAssetIdentityKey,
  getOfficialEventAssetIdentityByTicker,
} from './assetIdentities'
import {
  buildOfficialEventFingerprintV1,
  normalizeOfficialEventDocumentIdentifiersV1,
  normalizeOfficialEventUrlV1,
  selectOfficialEventDocumentIdentityV1,
} from './documentIdentity'
import {
  assertNoEvidentHtml,
  cloneAssociationEvidence,
  cloneRawFields,
  countCodePoints,
  encodeIdentityComponent,
  normalizeOptionalText,
  normalizeText,
} from './internal'
import { assertOfficialEventTypeCompatibility } from './taxonomy'
import {
  assertCivilDateString,
  assertStrictUtcTimestamp,
  normalizeOfficialEventTemporalValueV1,
} from './temporal'
import {
  OFFICIAL_ASSET_EVENT_V1_SCHEMA_VERSION,
  OFFICIAL_EVENT_ASSET_IDENTITIES_V1_VERSION,
  type BuildOfficialAssetEventV1Input,
  type OfficialAssetEventV1,
  type OfficialEventAssetIdentityV1,
  type OfficialEventAssociationEvidenceV1,
  type OfficialEventDocumentIdentifiersV1,
  type OfficialEventProvenanceV1,
} from './types'

const ASSOCIATION_REASONS = new Set([
  'exact-regulatory-identity',
  'exact-ticker-provider-mapping',
  'exact-cnpj',
  'exact-cik-series-class',
  'exact-isin',
  'issuer-official-source',
])
const EVENT_STATUSES = new Set([
  'original',
  'amendment',
  'correction',
  'replacement',
  'cancellation',
])
const RELATED_DOCUMENT_RELATIONS = new Set([
  'supporting',
  'references',
  'same-official-event',
])

function assertEvidenceMatches(
  evidence: OfficialEventAssociationEvidenceV1,
  identity: OfficialEventAssetIdentityV1
): void {
  if (evidence.reason === 'issuer-official-source') {
    throw new Error(
      'issuer-official-source is not automated in Official Events V1'
    )
  }
  if (
    evidence.reason === 'exact-regulatory-identity' &&
    evidence.observedRegulatoryIdentityKey !== identity.regulatoryIdentityKey
  ) {
    throw new Error('Regulatory identity evidence diverges from the registry')
  }
  if (
    evidence.reason === 'exact-ticker-provider-mapping' &&
    (evidence.observedTicker !== identity.ticker ||
      evidence.mappingVersion !== OFFICIAL_EVENT_ASSET_IDENTITIES_V1_VERSION)
  ) {
    throw new Error('Ticker mapping evidence diverges from the registry')
  }
  if (evidence.reason === 'exact-cnpj') {
    if (
      identity.category === 'international-etf' ||
      evidence.observedCnpj !== identity.cnpj
    ) {
      throw new Error('CNPJ evidence diverges from the registry')
    }
  }
  if (evidence.reason === 'exact-cik-series-class') {
    if (
      identity.category !== 'international-etf' ||
      evidence.observedRegistrantCik !== identity.registrantCik ||
      evidence.observedSeriesId !== identity.seriesId ||
      evidence.observedClassContractId !== identity.classContractId
    ) {
      throw new Error(
        'SEC series and class evidence diverges from the registry'
      )
    }
  }
  if (evidence.reason === 'exact-isin') {
    if (
      identity.category !== 'real-estate-fund' ||
      identity.isin === null ||
      evidence.observedIsin !== identity.isin
    ) {
      throw new Error('ISIN evidence diverges from the registry')
    }
  }
}

function validateAssociationEvidence(
  evidenceList: readonly OfficialEventAssociationEvidenceV1[],
  identity: OfficialEventAssetIdentityV1
): OfficialEventAssociationEvidenceV1[] {
  if (evidenceList.length === 0 || evidenceList.length > 6) {
    throw new Error('associationEvidence must contain between 1 and 6 items')
  }
  const reasons = new Set<string>()
  return evidenceList.map((evidence) => {
    if (!ASSOCIATION_REASONS.has(evidence.reason)) {
      throw new Error(
        `Unsupported association evidence reason: ${evidence.reason}`
      )
    }
    if (reasons.has(evidence.reason)) {
      throw new Error(
        `Duplicate association evidence reason: ${evidence.reason}`
      )
    }
    reasons.add(evidence.reason)
    assertEvidenceMatches(evidence, identity)
    return cloneAssociationEvidence(evidence)
  })
}

function validateProvenance(
  provenance: OfficialEventProvenanceV1,
  source: OfficialAssetEventV1['source']
): OfficialEventProvenanceV1 {
  if (
    provenance.sourceSystem !== source ||
    provenance.sourceType !== 'regulator'
  ) {
    throw new Error('Provenance source identity diverges from the event source')
  }
  const rawDocumentType = normalizeText(
    provenance.rawDocumentType,
    'provenance.rawDocumentType',
    500
  )
  const rawDocumentCategory = normalizeOptionalText(
    provenance.rawDocumentCategory,
    'provenance.rawDocumentCategory',
    500
  )
  const parserVersion = normalizeText(
    provenance.parserVersion,
    'provenance.parserVersion',
    200
  )
  const mappingVersion = normalizeText(
    provenance.mappingVersion,
    'provenance.mappingVersion',
    200
  )
  if (mappingVersion !== OFFICIAL_EVENT_ASSET_IDENTITIES_V1_VERSION) {
    throw new Error(
      'provenance.mappingVersion diverges from the official registry version'
    )
  }
  assertCivilDateString(provenance.termsAuditedAt, 'provenance.termsAuditedAt')
  const attribution = normalizeOptionalText(
    provenance.attribution,
    'provenance.attribution',
    1_000
  )
  if (
    provenance.sourcePayloadHash.trim().length === 0 ||
    provenance.sourcePayloadHash.trim() !== provenance.sourcePayloadHash
  ) {
    throw new Error(
      'provenance.sourcePayloadHash must be non-empty and unpadded'
    )
  }
  const entries = Object.entries(provenance.rawFields)
  if (entries.length > 100)
    throw new Error('provenance.rawFields exceeds 100 keys')
  for (const [key, value] of entries) {
    if (key.trim().length === 0)
      throw new Error('provenance.rawFields keys must not be empty')
    if (
      value !== null &&
      typeof value !== 'string' &&
      typeof value !== 'number' &&
      typeof value !== 'boolean'
    ) {
      throw new Error(`provenance.rawFields.${key} must be scalar`)
    }
    if (typeof value === 'number' && !Number.isFinite(value)) {
      throw new Error(`provenance.rawFields.${key} must be finite`)
    }
    if (typeof value === 'string') {
      if (countCodePoints(value) > 10_000) {
        throw new Error(`provenance.rawFields.${key} exceeds 10000 characters`)
      }
      assertNoEvidentHtml(value, `provenance.rawFields.${key}`)
    }
  }
  return {
    ...provenance,
    rawDocumentType,
    rawDocumentCategory,
    parserVersion,
    mappingVersion,
    attribution,
    rawFields: cloneRawFields(provenance.rawFields),
  }
}

function prepareDocumentIdentifiers(
  input: BuildOfficialAssetEventV1Input,
  assetIdentityKey: string,
  publishedAt: OfficialAssetEventV1['publishedAt'],
  title: string
): OfficialEventDocumentIdentifiersV1 {
  const normalized = normalizeOfficialEventDocumentIdentifiersV1(
    input.documentIdentifiers
  )
  const hasStrongIdentifier = [
    normalized.sourceDocumentId,
    normalized.regulatoryDocumentId,
    normalized.accessionNumber,
    normalized.protocolNumber,
    normalized.canonicalUrl,
  ].some((value) => value !== null)
  if (hasStrongIdentifier) return normalized

  const fingerprint = buildOfficialEventFingerprintV1({
    source: input.source,
    assetIdentityKey,
    eventType: input.eventType,
    publishedAt,
    canonicalUrl: normalized.canonicalUrl,
    title,
  })
  if (
    normalized.fingerprint !== null &&
    normalized.fingerprint !== fingerprint
  ) {
    throw new Error(
      'Provided fallback fingerprint diverges from canonical metadata'
    )
  }
  return { ...normalized, fingerprint }
}

function buildEventId(
  source: OfficialAssetEventV1['source'],
  assetIdentityKey: string,
  documentKind: string,
  documentValue: string
): string {
  return [
    OFFICIAL_ASSET_EVENT_V1_SCHEMA_VERSION,
    source,
    assetIdentityKey,
    documentKind,
    documentValue,
  ]
    .map(encodeIdentityComponent)
    .join('|')
}

function buildDeduplicationKey(
  source: OfficialAssetEventV1['source'],
  assetIdentityKey: string,
  documentKind: string,
  documentValue: string
): string {
  return [
    'official-event-dedup.v1',
    source,
    assetIdentityKey,
    documentKind,
    documentValue,
  ]
    .map(encodeIdentityComponent)
    .join('|')
}

function normalizeEventReference(value: string, field: string): string {
  if (
    value.length === 0 ||
    value.trim() !== value ||
    /\s/.test(value) ||
    countCodePoints(value) > 5_000
  ) {
    throw new Error(`${field} must be a non-empty, unpadded event identifier`)
  }
  return value
}

export function buildOfficialAssetEventV1(
  input: BuildOfficialAssetEventV1Input
): OfficialAssetEventV1 {
  if (!EVENT_STATUSES.has(input.status)) {
    throw new Error(`Unsupported official event status: ${input.status}`)
  }
  const identity = getOfficialEventAssetIdentityByTicker(input.ticker)
  assertOfficialEventTypeCompatibility(input.eventType, identity, input.source)
  const associationEvidence = validateAssociationEvidence(
    input.associationEvidence,
    identity
  )
  const title = normalizeText(input.title, 'title', 500)
  const summary = normalizeOptionalText(input.summary, 'summary', 4_000)
  const classificationJustification = normalizeOptionalText(
    input.classificationJustification ?? null,
    'classificationJustification',
    1_000
  )
  if (
    input.eventType === 'other-official-event' &&
    classificationJustification === null
  ) {
    throw new Error('other-official-event requires classificationJustification')
  }
  if (
    input.eventType !== 'other-official-event' &&
    classificationJustification !== null
  ) {
    throw new Error(
      'classificationJustification is only allowed for other-official-event'
    )
  }

  const normalizedPublishedAt = normalizeOfficialEventTemporalValueV1(
    input.publishedAt
  )
  if (normalizedPublishedAt.precision === 'unknown') {
    throw new Error('publishedAt cannot have unknown precision')
  }
  const occurredAt = input.occurredAt
    ? normalizeOfficialEventTemporalValueV1(input.occurredAt)
    : null
  const assetIdentityKey = buildOfficialEventAssetIdentityKey(identity)
  const documentIdentifiers = prepareDocumentIdentifiers(
    input,
    assetIdentityKey,
    normalizedPublishedAt,
    title
  )
  const documentIdentity =
    selectOfficialEventDocumentIdentityV1(documentIdentifiers)
  const eventId = buildEventId(
    input.source,
    assetIdentityKey,
    documentIdentity.kind,
    documentIdentity.value
  )
  const deduplicationKey = buildDeduplicationKey(
    input.source,
    assetIdentityKey,
    documentIdentity.kind,
    documentIdentity.value
  )

  const supersedesEventId =
    input.supersedesEventId === null
      ? null
      : normalizeEventReference(input.supersedesEventId, 'supersedesEventId')
  if (input.status === 'original' && supersedesEventId !== null) {
    throw new Error('Original event must not supersede another event')
  }
  if (input.status !== 'original' && supersedesEventId === null) {
    throw new Error(`${input.status} event must supersede another event`)
  }
  if (supersedesEventId === eventId)
    throw new Error('Event cannot supersede itself')
  if (input.relatedDocuments.length > 100) {
    throw new Error('relatedDocuments exceeds 100 items')
  }
  const relatedKeys = new Set<string>()
  const relatedDocuments = input.relatedDocuments.map((document) => {
    if (!RELATED_DOCUMENT_RELATIONS.has(document.relation)) {
      throw new Error(
        `Unsupported related document relation: ${document.relation}`
      )
    }
    const relatedEventId = normalizeEventReference(
      document.eventId,
      'relatedDocument.eventId'
    )
    if (relatedEventId === eventId)
      throw new Error('Event cannot relate to itself')
    const key = `${document.relation}\u0000${relatedEventId}`
    if (relatedKeys.has(key))
      throw new Error('Duplicate related document relation')
    relatedKeys.add(key)
    return { relation: document.relation, eventId: relatedEventId }
  })

  const ingestedAtOrder = assertStrictUtcTimestamp(
    input.ingestedAt,
    'ingestedAt'
  )
  const updatedAtOrder = assertStrictUtcTimestamp(input.updatedAt, 'updatedAt')
  if (updatedAtOrder < ingestedAtOrder) {
    throw new Error('updatedAt must not be earlier than ingestedAt')
  }
  const provenance = validateProvenance(input.provenance, input.source)
  const originalUrl =
    input.originalUrl === null
      ? null
      : normalizeOfficialEventUrlV1(input.originalUrl)
  const isBrazilian = input.source !== 'sec-edgar'

  return {
    schemaVersion: OFFICIAL_ASSET_EVENT_V1_SCHEMA_VERSION,
    eventId,
    assetIdentity: { ...identity },
    eventType: input.eventType,
    classificationJustification,
    associationEvidence,
    occurredAt: occurredAt ? { ...occurredAt } : null,
    publishedAt: { ...normalizedPublishedAt },
    source: input.source,
    sourceType: 'regulator',
    documentIdentity: { ...documentIdentity },
    documentIdentifiers: { ...documentIdentifiers },
    sourceDocumentId: documentIdentifiers.sourceDocumentId,
    originalUrl,
    canonicalUrl: documentIdentifiers.canonicalUrl,
    title,
    summary,
    language: isBrazilian ? 'pt-BR' : 'en-US',
    jurisdiction: isBrazilian ? 'BR' : 'US',
    status: input.status,
    supersedesEventId,
    relatedDocuments,
    ingestedAt: input.ingestedAt,
    updatedAt: input.updatedAt,
    deduplicationKey,
    provenance,
  }
}
