import { describe, expect, expectTypeOf, it } from 'vitest'
import * as officialEventsApi from './index'
import type {
  OfficialAssetEventV1,
  OfficialEventAssetIdentityV1,
  OfficialEventAssociationEvidenceV1,
  OfficialEventAssociationReasonV1,
  OfficialEventDeduplicationResultV1,
  OfficialEventDocumentIdentifiersV1,
  OfficialEventDocumentIdentityV1,
  OfficialEventProvenanceV1,
  OfficialEventRevisionAnalysisV1,
  OfficialEventSourceV1,
  OfficialEventStatusV1,
  OfficialEventTemporalValueV1,
  OfficialEventTypeV1,
} from './index'

type RequiredPublicContract =
  | OfficialAssetEventV1
  | OfficialEventAssetIdentityV1
  | OfficialEventAssociationEvidenceV1
  | OfficialEventAssociationReasonV1
  | OfficialEventDeduplicationResultV1
  | OfficialEventDocumentIdentifiersV1
  | OfficialEventDocumentIdentityV1
  | OfficialEventProvenanceV1
  | OfficialEventRevisionAnalysisV1
  | OfficialEventSourceV1
  | OfficialEventStatusV1
  | OfficialEventTemporalValueV1
  | OfficialEventTypeV1

describe('official events public API', () => {
  it('exports the required closed contracts at compile time', () => {
    expectTypeOf<RequiredPublicContract>().not.toBeNever()
  })

  it('exports only the intentional runtime surface', () => {
    expect(Object.keys(officialEventsApi).sort()).toEqual(
      [
        'OFFICIAL_ASSET_EVENT_V1_SCHEMA_VERSION',
        'OFFICIAL_EVENT_ASSET_IDENTITIES_V1_VERSION',
        'OFFICIAL_EVENT_TAXONOMY_V1_VERSION',
        'analyzeOfficialEventRevisionGraphV1',
        'assertOfficialEventAssetIdentity',
        'assertOfficialEventTypeCompatibility',
        'buildOfficialAssetEventV1',
        'buildOfficialEventAssetIdentityKey',
        'deduplicateOfficialAssetEventsV1',
        'getOfficialEventAssetIdentitiesV1',
        'getOfficialEventAssetIdentityByTicker',
        'getOfficialEventTaxonomyDefinition',
        'getOfficialEventTaxonomyDefinitionsV1',
        'normalizeOfficialEventTemporalValueV1',
        'selectOfficialEventDocumentIdentityV1',
      ].sort()
    )
  })

  it('does not export fixtures or private implementation helpers', () => {
    for (const forbidden of [
      'createOfficialEvent',
      'createOfficialEventInput',
      'createDocumentIdentifiers',
      'cloneOfficialAssetEventV1',
      'buildOfficialEventFingerprintV1',
      'normalizeOfficialEventUrlV1',
      'assertStrictUtcTimestamp',
    ]) {
      expect(officialEventsApi).not.toHaveProperty(forbidden)
    }
  })
})
