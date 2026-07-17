import { encodeIdentityComponent } from './internal'
import {
  OFFICIAL_ASSET_EVENT_V1_SCHEMA_VERSION,
  type OfficialEventDocumentIdentifiersV1,
  type OfficialEventDocumentIdentityKindV1,
  type OfficialEventDocumentIdentityV1,
  type OfficialEventSourceV1,
  type OfficialEventTemporalValueV1,
  type OfficialEventTypeV1,
} from './types'

const TRACKING_PARAMETERS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'gclid',
  'fbclid',
])

function compareCodeUnits(left: string, right: string): number {
  if (left < right) return -1
  if (left > right) return 1
  return 0
}

export function normalizeOfficialEventUrlV1(value: string): string {
  if (value.trim() !== value) {
    throw new Error('Official event URL must not contain outer whitespace')
  }
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new Error('Official event URL must be absolute')
  }
  if (url.protocol !== 'https:')
    throw new Error('Official event URL must use HTTPS')
  if (url.username || url.password) {
    throw new Error('Official event URL must not contain credentials')
  }

  url.hash = ''
  const functionalParameters = [...url.searchParams.entries()]
    .filter(([key]) => !TRACKING_PARAMETERS.has(key.toLowerCase()))
    .sort(([leftKey, leftValue], [rightKey, rightValue]) => {
      const keyOrder = compareCodeUnits(leftKey, rightKey)
      return keyOrder === 0 ? compareCodeUnits(leftValue, rightValue) : keyOrder
    })
  url.search = ''
  for (const [key, parameterValue] of functionalParameters) {
    url.searchParams.append(key, parameterValue)
  }
  return url.toString()
}

function normalizeIdentifier(
  value: string | null,
  field: string
): string | null {
  if (value === null || value.trim().length === 0) return null
  if (value.trim() !== value)
    throw new Error(`${field} must not contain outer whitespace`)
  return value
}

function assertFingerprint(value: string | null): void {
  if (value !== null && !/^fnv1a64:[0-9a-f]{16}$/.test(value)) {
    throw new Error(
      'fingerprint must use fnv1a64 and sixteen lowercase hexadecimal digits'
    )
  }
}

export function normalizeOfficialEventDocumentIdentifiersV1(
  identifiers: OfficialEventDocumentIdentifiersV1
): OfficialEventDocumentIdentifiersV1 {
  const normalized = {
    sourceDocumentId: normalizeIdentifier(
      identifiers.sourceDocumentId,
      'sourceDocumentId'
    ),
    regulatoryDocumentId: normalizeIdentifier(
      identifiers.regulatoryDocumentId,
      'regulatoryDocumentId'
    ),
    accessionNumber: normalizeIdentifier(
      identifiers.accessionNumber,
      'accessionNumber'
    ),
    protocolNumber: normalizeIdentifier(
      identifiers.protocolNumber,
      'protocolNumber'
    ),
    canonicalUrl:
      identifiers.canonicalUrl === null ||
      identifiers.canonicalUrl.trim().length === 0
        ? null
        : normalizeOfficialEventUrlV1(identifiers.canonicalUrl),
    fingerprint: normalizeIdentifier(identifiers.fingerprint, 'fingerprint'),
  }
  assertFingerprint(normalized.fingerprint)
  return normalized
}

export function selectOfficialEventDocumentIdentityV1(
  identifiers: OfficialEventDocumentIdentifiersV1
): OfficialEventDocumentIdentityV1 {
  const normalized = normalizeOfficialEventDocumentIdentifiersV1(identifiers)
  const candidates: readonly [
    OfficialEventDocumentIdentityKindV1,
    string | null,
  ][] = [
    ['source-document-id', normalized.sourceDocumentId],
    ['regulatory-document-id', normalized.regulatoryDocumentId],
    ['accession-number', normalized.accessionNumber],
    ['protocol-number', normalized.protocolNumber],
    ['canonical-url', normalized.canonicalUrl],
    ['fingerprint', normalized.fingerprint],
  ]
  const selected = candidates.find(([, value]) => value !== null)
  if (!selected || selected[1] === null) {
    throw new Error('Official event document requires at least one identifier')
  }
  const [kind, value] = selected
  return {
    kind,
    value,
    deduplicationKey: [kind, value].map(encodeIdentityComponent).join('|'),
  }
}

function temporalFingerprintValue(value: OfficialEventTemporalValueV1): string {
  if (value.precision === 'date') return `date:${value.date}`
  if (value.precision === 'unknown') return `unknown:${value.raw ?? ''}`
  return `${value.precision}:${value.instantUtc}`
}

function fnv1a64(value: string): string {
  let hash = 0xcbf29ce484222325n
  for (const byte of new TextEncoder().encode(value)) {
    hash ^= BigInt(byte)
    hash = BigInt.asUintN(64, hash * 0x100000001b3n)
  }
  return hash.toString(16).padStart(16, '0')
}

export function buildOfficialEventFingerprintV1(input: {
  source: OfficialEventSourceV1
  assetIdentityKey: string
  eventType: OfficialEventTypeV1
  publishedAt: OfficialEventTemporalValueV1
  canonicalUrl: string | null
  title: string
}): string {
  const payload = [
    OFFICIAL_ASSET_EVENT_V1_SCHEMA_VERSION,
    input.source,
    input.assetIdentityKey,
    input.eventType,
    temporalFingerprintValue(input.publishedAt),
    input.canonicalUrl ?? '',
    input.title,
  ]
    .map(encodeIdentityComponent)
    .join('|')
  return `fnv1a64:${fnv1a64(payload)}`
}
