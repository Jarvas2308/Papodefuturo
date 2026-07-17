import { describe, expect, it } from 'vitest'
import { getOfficialEventAssetIdentitiesV1 } from './assetIdentities'
import { deduplicateOfficialAssetEventsV1 } from './deduplication'
import { assertOfficialAssetEventV1 } from './eventValidation'
import { analyzeOfficialEventRevisionGraphV1 } from './revisions'
import {
  createDocumentIdentifiers,
  createOfficialEvent,
  createOfficialEventInput,
} from './testFixtures'
import {
  OFFICIAL_EVENT_ASSET_IDENTITIES_V1_VERSION,
  type OfficialAssetEventV1,
} from './types'

type AdversarialMutation = {
  name: string
  mutate: (event: OfficialAssetEventV1) => void
}

const ADVERSARIAL_MUTATIONS: readonly AdversarialMutation[] = [
  {
    name: 'schemaVersion',
    mutate: (event) => Object.assign(event, { schemaVersion: 'forged.v1' }),
  },
  { name: 'eventId', mutate: (event) => (event.eventId = 'forged-event') },
  {
    name: 'deduplicationKey',
    mutate: (event) => (event.deduplicationKey = 'forged-deduplication'),
  },
  {
    name: 'assetIdentity',
    mutate: (event) => (event.assetIdentity.officialName = 'FORGED COMPANY'),
  },
  {
    name: 'regulatoryIdentityKey',
    mutate: (event) =>
      (event.assetIdentity.regulatoryIdentityKey = 'cvm:company:forged'),
  },
  { name: 'source', mutate: (event) => (event.source = 'sec-edgar') },
  {
    name: 'sourceType',
    mutate: (event) => Object.assign(event, { sourceType: 'publisher' }),
  },
  {
    name: 'eventType',
    mutate: (event) => (event.eventType = 'fund-policy-change'),
  },
  {
    name: 'classificationJustification',
    mutate: (event) =>
      (event.classificationJustification = 'Justificativa indevida.'),
  },
  {
    name: 'associationEvidence',
    mutate: (event) =>
      Object.assign(event.associationEvidence[0], {
        observedCnpj: '00000000000192',
      }),
  },
  {
    name: 'publishedAt',
    mutate: (event) => (event.publishedAt.raw = '2026-07-15T99:30-03:00'),
  },
  {
    name: 'occurredAt',
    mutate: (event) => {
      if (event.occurredAt?.precision === 'date') {
        event.occurredAt.date = '2026-07-16'
      }
    },
  },
  {
    name: 'documentIdentity.kind',
    mutate: (event) => (event.documentIdentity.kind = 'fingerprint'),
  },
  {
    name: 'documentIdentity.value',
    mutate: (event) => (event.documentIdentity.value = 'forged-document'),
  },
  {
    name: 'documentIdentity.deduplicationKey',
    mutate: (event) =>
      (event.documentIdentity.deduplicationKey = 'forged-document-key'),
  },
  {
    name: 'documentIdentifiers',
    mutate: (event) =>
      (event.documentIdentifiers.sourceDocumentId = 'cvm:ipe:forged'),
  },
  {
    name: 'top-level sourceDocumentId',
    mutate: (event) => (event.sourceDocumentId = 'cvm:ipe:forged'),
  },
  {
    name: 'top-level canonicalUrl',
    mutate: (event) =>
      (event.canonicalUrl = 'https://www.gov.br/cvm/outro-documento'),
  },
  {
    name: 'originalUrl',
    mutate: (event) => {
      event.originalUrl = `${event.originalUrl}?utm_source=forged`
    },
  },
  { name: 'title', mutate: (event) => (event.title = ` ${event.title} `) },
  {
    name: 'summary',
    mutate: (event) => (event.summary = ` ${event.summary ?? ''} `),
  },
  { name: 'language', mutate: (event) => (event.language = 'en-US') },
  { name: 'jurisdiction', mutate: (event) => (event.jurisdiction = 'US') },
  {
    name: 'status',
    mutate: (event) => Object.assign(event, { status: 'deleted' }),
  },
  {
    name: 'supersedesEventId',
    mutate: (event) => (event.supersedesEventId = 'previous-event'),
  },
  {
    name: 'relatedDocuments',
    mutate: (event) =>
      event.relatedDocuments.push({
        relation: 'references',
        eventId: event.eventId,
      }),
  },
  {
    name: 'ingestedAt',
    mutate: (event) => (event.ingestedAt = '2026-02-30T18:00:00Z'),
  },
  {
    name: 'updatedAt',
    mutate: (event) => (event.updatedAt = '2026-07-15T17:59:59Z'),
  },
  {
    name: 'provenance.sourceSystem',
    mutate: (event) => (event.provenance.sourceSystem = 'sec-edgar'),
  },
  {
    name: 'provenance.sourceType',
    mutate: (event) =>
      Object.assign(event.provenance, { sourceType: 'publisher' }),
  },
  {
    name: 'provenance.mappingVersion',
    mutate: (event) => (event.provenance.mappingVersion = 'forged-mapping'),
  },
  {
    name: 'provenance.sourcePayloadHash',
    mutate: (event) =>
      (event.provenance.sourcePayloadHash = ' padded-payload-hash '),
  },
  {
    name: 'provenance.rawFields',
    mutate: (event) => (event.provenance.rawFields.protocol = '<script>'),
  },
  {
    name: 'extra root property',
    mutate: (event) => Object.assign(event, { unexpected: true }),
  },
  {
    name: 'missing root property',
    mutate: (event) => {
      Reflect.deleteProperty(event, 'summary')
    },
  },
  {
    name: 'extra provenance property',
    mutate: (event) => Object.assign(event.provenance, { unexpected: true }),
  },
  {
    name: 'extra assetIdentity property',
    mutate: (event) => Object.assign(event.assetIdentity, { unexpected: true }),
  },
  {
    name: 'adulterated sparse array',
    mutate: (event) => {
      Reflect.deleteProperty(event.associationEvidence, '0')
    },
  },
  {
    name: 'non-plain prototype',
    mutate: (event) => Object.setPrototypeOf(event.provenance, null),
  },
]

describe('assertOfficialAssetEventV1', () => {
  it('accepts a legitimate builder event deterministically without mutating it', () => {
    const event = createOfficialEvent()
    const snapshot = structuredClone(event)

    expect(() => assertOfficialAssetEventV1(event)).not.toThrow()
    expect(() => assertOfficialAssetEventV1(event)).not.toThrow()
    expect(event).toEqual(snapshot)
  })

  it('accepts independent legitimate events built from the same input', () => {
    const first = createOfficialEvent()
    const second = createOfficialEvent()

    expect(() => assertOfficialAssetEventV1(first)).not.toThrow()
    expect(() => assertOfficialAssetEventV1(second)).not.toThrow()
    expect(first).toEqual(second)
    expect(first).not.toBe(second)
  })

  it('does not depend on object property insertion order', () => {
    const event = createOfficialEvent()
    const originalTitle = event.title
    Reflect.deleteProperty(event, 'title')
    event.title = originalTitle

    expect(() => assertOfficialAssetEventV1(event)).not.toThrow()
  })

  it('accepts builder events for every asset in the closed registry', () => {
    for (const identity of getOfficialEventAssetIdentitiesV1()) {
      const source =
        identity.category === 'brazilian-stock'
          ? 'cvm-ipe'
          : identity.category === 'real-estate-fund'
            ? 'cvm-fund-delivery'
            : 'sec-edgar'
      const event = createOfficialEvent({
        ticker: identity.ticker,
        eventType: 'regulatory-filing',
        associationEvidence: [
          {
            reason: 'exact-ticker-provider-mapping',
            observedTicker: identity.ticker,
            mappingVersion: OFFICIAL_EVENT_ASSET_IDENTITIES_V1_VERSION,
          },
        ],
        source,
        documentIdentifiers: createDocumentIdentifiers({
          sourceDocumentId: `${source}:${identity.ticker}`,
        }),
        provenance: {
          ...createOfficialEventInput().provenance,
          sourceSystem: source,
        },
      })

      expect(() => assertOfficialAssetEventV1(event)).not.toThrow()
    }
  })

  it.each(ADVERSARIAL_MUTATIONS)(
    'rejects adulterated $name before deduplication and revision analysis',
    ({ mutate }) => {
      const event = createOfficialEvent()
      mutate(event)

      expect(() => deduplicateOfficialAssetEventsV1([event])).toThrow()
      expect(() => analyzeOfficialEventRevisionGraphV1([event])).toThrow()
    }
  )
})
