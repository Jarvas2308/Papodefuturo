export const OFFICIAL_ASSET_EVENT_V1_SCHEMA_VERSION =
  'official-asset-event.v1' as const

export const OFFICIAL_EVENT_ASSET_IDENTITIES_V1_VERSION =
  'official-event-asset-identities.v1' as const

export const OFFICIAL_EVENT_TAXONOMY_V1_VERSION =
  'official-event-taxonomy.v1' as const

export type BrazilianStockOfficialEventTickerV1 =
  'BBAS3' | 'ITSA4' | 'TAEE11' | 'WEGE3' | 'PSSA3'

export type RealEstateFundOfficialEventTickerV1 =
  'KNRI11' | 'VISC11' | 'XPLG11' | 'HGRU11'

export type InternationalEtfOfficialEventTickerV1 = 'VOO' | 'VNQ' | 'VEA'

export type OfficialEventAssetTickerV1 =
  | BrazilianStockOfficialEventTickerV1
  | RealEstateFundOfficialEventTickerV1
  | InternationalEtfOfficialEventTickerV1

export type BrazilianStockOfficialEventIdentityV1 = {
  category: 'brazilian-stock'
  market: 'BR'
  ticker: BrazilianStockOfficialEventTickerV1
  officialName: string
  cnpj: string
  cvmCode: string
  regulatoryIdentityKey: string
}

export type RealEstateFundOfficialEventIdentityV1 = {
  category: 'real-estate-fund'
  market: 'BR'
  ticker: RealEstateFundOfficialEventTickerV1
  officialName: string
  cnpj: string
  isin: string | null
  regulatoryIdentityKey: string
}

export type InternationalEtfOfficialEventIdentityV1 = {
  category: 'international-etf'
  market: 'US'
  ticker: InternationalEtfOfficialEventTickerV1
  officialName: string
  registrantCik: string
  seriesId: string
  classContractId: string
  regulatoryIdentityKey: string
}

export type OfficialEventAssetIdentityV1 =
  | BrazilianStockOfficialEventIdentityV1
  | RealEstateFundOfficialEventIdentityV1
  | InternationalEtfOfficialEventIdentityV1

export type OfficialEventSourceV1 =
  'cvm-ipe' | 'cvm-fund-eventual' | 'sec-edgar'

export type OfficialEventTypeV1 =
  | 'regulatory-filing'
  | 'earnings-release'
  | 'periodic-report'
  | 'material-fact'
  | 'market-communication'
  | 'dividend-or-distribution'
  | 'capital-structure-change'
  | 'offering-or-issuance'
  | 'shareholder-meeting'
  | 'management-change'
  | 'merger-acquisition-or-reorganization'
  | 'legal-or-regulatory-action'
  | 'fund-policy-change'
  | 'fund-manager-or-administrator-change'
  | 'other-official-event'

export type OfficialEventTaxonomyDefinitionV1 = {
  type: OfficialEventTypeV1
  description: string
  allowedSources: readonly OfficialEventSourceV1[]
  applicableCategories: readonly OfficialEventAssetIdentityV1['category'][]
  inclusionRule: string
  exclusionRule: string
  requiresHumanReview: boolean
}

export type OfficialEventAssociationReasonV1 =
  | 'exact-regulatory-identity'
  | 'exact-ticker-provider-mapping'
  | 'exact-cnpj'
  | 'exact-cik-series-class'
  | 'exact-isin'
  | 'issuer-official-source'

export type OfficialEventAssociationEvidenceV1 =
  | {
      reason: 'exact-regulatory-identity'
      observedRegulatoryIdentityKey: string
    }
  | {
      reason: 'exact-ticker-provider-mapping'
      observedTicker: string
      mappingVersion: string
    }
  | { reason: 'exact-cnpj'; observedCnpj: string }
  | {
      reason: 'exact-cik-series-class'
      observedRegistrantCik: string
      observedSeriesId: string
      observedClassContractId: string
    }
  | { reason: 'exact-isin'; observedIsin: string }
  | {
      reason: 'issuer-official-source'
      observedOfficialSource: string
    }

export type OfficialEventTemporalInputV1 =
  | { precision: 'date'; value: string }
  | { precision: 'minute'; value: string }
  | { precision: 'second'; value: string }
  | { precision: 'unknown'; raw: string | null }

export type OfficialEventTemporalValueV1 =
  | { precision: 'date'; date: string; raw: string }
  | {
      precision: 'minute'
      instantUtc: string
      raw: string
      sourceOffset: string
    }
  | {
      precision: 'second'
      instantUtc: string
      raw: string
      sourceOffset: string
    }
  | { precision: 'unknown'; raw: string | null }

export type OfficialEventDocumentIdentifiersV1 = {
  sourceDocumentId: string | null
  regulatoryDocumentId: string | null
  accessionNumber: string | null
  protocolNumber: string | null
  canonicalUrl: string | null
  fingerprint: string | null
}

export type OfficialEventDocumentIdentityKindV1 =
  | 'source-document-id'
  | 'regulatory-document-id'
  | 'accession-number'
  | 'protocol-number'
  | 'canonical-url'
  | 'fingerprint'

export type OfficialEventDocumentIdentityV1 = {
  kind: OfficialEventDocumentIdentityKindV1
  value: string
  deduplicationKey: string
}

export type OfficialEventStatusV1 =
  'original' | 'amendment' | 'correction' | 'replacement' | 'cancellation'

export type OfficialEventRelatedDocumentRelationV1 =
  'supporting' | 'references' | 'same-official-event'

export type OfficialEventRelatedDocumentV1 = {
  relation: OfficialEventRelatedDocumentRelationV1
  eventId: string
}

export type OfficialEventProvenanceScalarV1 = string | number | boolean | null

export type OfficialEventProvenanceV1 = {
  sourceSystem: OfficialEventSourceV1
  sourceType: 'regulator'
  rawDocumentType: string
  rawDocumentCategory: string | null
  parserVersion: string
  mappingVersion: string
  termsAuditedAt: string
  attribution: string | null
  sourcePayloadHash: string
  rawFields: Record<string, OfficialEventProvenanceScalarV1>
}

export type OfficialAssetEventV1 = {
  schemaVersion: typeof OFFICIAL_ASSET_EVENT_V1_SCHEMA_VERSION
  eventId: string
  assetIdentity: OfficialEventAssetIdentityV1
  eventType: OfficialEventTypeV1
  classificationJustification: string | null
  associationEvidence: OfficialEventAssociationEvidenceV1[]
  occurredAt: OfficialEventTemporalValueV1 | null
  publishedAt: Exclude<OfficialEventTemporalValueV1, { precision: 'unknown' }>
  source: OfficialEventSourceV1
  sourceType: 'regulator'
  documentIdentity: OfficialEventDocumentIdentityV1
  documentIdentifiers: OfficialEventDocumentIdentifiersV1
  sourceDocumentId: string | null
  originalUrl: string | null
  canonicalUrl: string | null
  title: string
  summary: string | null
  language: 'pt-BR' | 'en-US'
  jurisdiction: 'BR' | 'US'
  status: OfficialEventStatusV1
  supersedesEventId: string | null
  relatedDocuments: OfficialEventRelatedDocumentV1[]
  ingestedAt: string
  updatedAt: string
  deduplicationKey: string
  provenance: OfficialEventProvenanceV1
}

export type BuildOfficialAssetEventV1Input = {
  ticker: string
  eventType: OfficialEventTypeV1
  classificationJustification?: string | null
  associationEvidence: readonly OfficialEventAssociationEvidenceV1[]
  occurredAt: OfficialEventTemporalInputV1 | null
  publishedAt: Exclude<OfficialEventTemporalInputV1, { precision: 'unknown' }>
  source: OfficialEventSourceV1
  documentIdentifiers: OfficialEventDocumentIdentifiersV1
  originalUrl: string | null
  title: string
  summary: string | null
  status: OfficialEventStatusV1
  supersedesEventId: string | null
  relatedDocuments: readonly OfficialEventRelatedDocumentV1[]
  ingestedAt: string
  updatedAt: string
  provenance: OfficialEventProvenanceV1
}

export type OfficialEventDuplicateV1 = {
  deduplicationKey: string
  keptInputIndex: number
  duplicateInputIndex: number
}

export type OfficialEventConflictV1 = {
  deduplicationKey: string
  inputIndexes: number[]
  sourcePayloadHashes: string[]
}

export type OfficialEventDeduplicationResultV1 = {
  uniqueEvents: OfficialAssetEventV1[]
  duplicates: OfficialEventDuplicateV1[]
  conflicts: OfficialEventConflictV1[]
}

export type OfficialEventResolvedRevisionRelationV1 = {
  eventId: string
  supersedesEventId: string
  status: Exclude<OfficialEventStatusV1, 'original'>
}

export type OfficialEventUnresolvedRevisionRelationV1 =
  OfficialEventResolvedRevisionRelationV1

export type OfficialEventRevisionAnalysisV1 = {
  resolvedRelations: OfficialEventResolvedRevisionRelationV1[]
  unresolvedRelations: OfficialEventUnresolvedRevisionRelationV1[]
  roots: string[]
}
