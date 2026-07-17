import type {
  OfficialAssetEventV1,
  OfficialEventAssetIdentityV1,
  OfficialEventAssociationEvidenceV1,
  OfficialEventProvenanceScalarV1,
  OfficialEventTemporalValueV1,
} from './types'

export function assertNonEmptyString(value: string, field: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${field} must not be empty`)
  }
}

export function encodeIdentityComponent(value: string): string {
  return `${value.length}:${value}`
}

export function countCodePoints(value: string): number {
  return [...value].length
}

export function assertNoEvidentHtml(value: string, field: string): void {
  if (/<(?:!--|!doctype\b|\/?[a-z][^<>]*>?)/i.test(value)) {
    throw new Error(`${field} must not contain evident HTML`)
  }
}

export function normalizeText(
  value: string,
  field: string,
  maximumLength: number
): string {
  const normalized = value.trim().replace(/\s+/g, ' ')
  const characterCount = countCodePoints(normalized)
  if (characterCount === 0 || characterCount > maximumLength) {
    throw new Error(
      `${field} must contain between 1 and ${maximumLength} characters`
    )
  }
  assertNoEvidentHtml(normalized, field)
  return normalized
}

export function normalizeOptionalText(
  value: string | null,
  field: string,
  maximumLength: number
): string | null {
  if (value === null) return null
  return normalizeText(value, field, maximumLength)
}

export function cloneAssetIdentity(
  identity: OfficialEventAssetIdentityV1
): OfficialEventAssetIdentityV1 {
  return { ...identity }
}

export function cloneTemporalValue(
  value: OfficialEventTemporalValueV1
): OfficialEventTemporalValueV1 {
  return { ...value }
}

export function cloneAssociationEvidence(
  evidence: OfficialEventAssociationEvidenceV1
): OfficialEventAssociationEvidenceV1 {
  return { ...evidence }
}

export function cloneRawFields(
  rawFields: Readonly<Record<string, OfficialEventProvenanceScalarV1>>
): Record<string, OfficialEventProvenanceScalarV1> {
  return Object.fromEntries(Object.entries(rawFields))
}

export function cloneOfficialAssetEventV1(
  event: OfficialAssetEventV1
): OfficialAssetEventV1 {
  return {
    ...event,
    assetIdentity: cloneAssetIdentity(event.assetIdentity),
    associationEvidence: event.associationEvidence.map(
      cloneAssociationEvidence
    ),
    occurredAt: event.occurredAt ? cloneTemporalValue(event.occurredAt) : null,
    publishedAt: { ...event.publishedAt },
    documentIdentity: { ...event.documentIdentity },
    documentIdentifiers: { ...event.documentIdentifiers },
    relatedDocuments: event.relatedDocuments.map((document) => ({
      ...document,
    })),
    provenance: {
      ...event.provenance,
      rawFields: cloneRawFields(event.provenance.rawFields),
    },
  }
}
