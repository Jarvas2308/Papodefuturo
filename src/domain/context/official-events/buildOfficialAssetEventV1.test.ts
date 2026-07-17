import { describe, expect, it } from 'vitest'
import { buildOfficialAssetEventV1 } from './buildOfficialAssetEventV1'
import {
  createDocumentIdentifiers,
  createOfficialEvent,
  createOfficialEventInput,
} from './testFixtures'
import { OFFICIAL_EVENT_ASSET_IDENTITIES_V1_VERSION } from './types'

describe('buildOfficialAssetEventV1', () => {
  it('builds a valid CVM stock event', () => {
    const event = createOfficialEvent()
    expect(event).toMatchObject({
      schemaVersion: 'official-asset-event.v1',
      source: 'cvm-ipe',
      sourceType: 'regulator',
      language: 'pt-BR',
      jurisdiction: 'BR',
      eventType: 'material-fact',
    })
  })

  it('builds a valid CVM FII event', () => {
    const event = createOfficialEvent({
      ticker: 'KNRI11',
      source: 'cvm-fund-delivery',
      eventType: 'fund-policy-change',
      associationEvidence: [
        { reason: 'exact-isin', observedIsin: 'BRKNRICTF007' },
      ],
      provenance: {
        ...createOfficialEventInput().provenance,
        sourceSystem: 'cvm-fund-delivery',
      },
    })
    expect(event.assetIdentity).toMatchObject({
      ticker: 'KNRI11',
      category: 'real-estate-fund',
    })
  })

  it('builds a valid SEC ETF event', () => {
    const event = createOfficialEvent({
      ticker: 'VOO',
      source: 'sec-edgar',
      eventType: 'regulatory-filing',
      associationEvidence: [
        {
          reason: 'exact-cik-series-class',
          observedRegistrantCik: '0000036405',
          observedSeriesId: 'S000002839',
          observedClassContractId: 'C000092055',
        },
      ],
      provenance: {
        ...createOfficialEventInput().provenance,
        sourceSystem: 'sec-edgar',
      },
    })
    expect(event).toMatchObject({ language: 'en-US', jurisdiction: 'US' })
  })

  it('rejects an incompatible source', () => {
    expect(() =>
      createOfficialEvent({
        source: 'sec-edgar',
        eventType: 'regulatory-filing',
        provenance: {
          ...createOfficialEventInput().provenance,
          sourceSystem: 'sec-edgar',
        },
      })
    ).toThrow(/incompatible/)
  })

  it('attaches a canonical asset identity', () => {
    expect(createOfficialEvent().assetIdentity).toMatchObject({
      ticker: 'BBAS3',
      officialName: 'BCO BRASIL S.A.',
      cnpj: '00000000000191',
    })
  })

  it('creates a stable eventId and deduplicationKey', () => {
    const first = createOfficialEvent()
    const second = createOfficialEvent({ updatedAt: '2026-07-16T00:00:00Z' })
    expect(first.eventId).toBe(second.eventId)
    expect(first.deduplicationKey).toBe(second.deduplicationKey)
  })

  it('uses the exact audited eventId and deduplicationKey component order', () => {
    const event = createOfficialEvent()
    expect(event.eventId).toBe(
      '23:official-asset-event.v1|7:cvm-ipe|94:34:official-event-asset-identities.v1|15:brazilian-stock|2:BR|5:BBAS3|21:00000000000191|001023|18:source-document-id|18:cvm:ipe:document-1'
    )
    expect(event.deduplicationKey).toBe(
      '23:official-event-dedup.v1|7:cvm-ipe|94:34:official-event-asset-identities.v1|15:brazilian-stock|2:BR|5:BBAS3|21:00000000000191|001023|18:source-document-id|18:cvm:ipe:document-1'
    )
  })

  it('namespaces the same source document identifier by asset identity', () => {
    const first = createOfficialEvent()
    const second = createOfficialEvent({
      ticker: 'WEGE3',
      associationEvidence: [
        { reason: 'exact-cnpj', observedCnpj: '84429695000111' },
      ],
    })
    expect(second.eventId).not.toBe(first.eventId)
    expect(second.deduplicationKey).not.toBe(first.deduplicationKey)
  })

  it('keeps eventId stable when the same document is classified differently', () => {
    const first = createOfficialEvent()
    const second = createOfficialEvent({ eventType: 'regulatory-filing' })
    expect(second.eventId).toBe(first.eventId)
    expect(second.deduplicationKey).toBe(first.deduplicationKey)
  })

  it('creates different IDs for different documents even with separator-like values', () => {
    const first = createOfficialEvent({
      documentIdentifiers: createDocumentIdentifiers({
        sourceDocumentId: 'ab|1:c',
      }),
    })
    const second = createOfficialEvent({
      documentIdentifiers: createDocumentIdentifiers({
        sourceDocumentId: 'ab1|:c',
      }),
    })
    expect(first.eventId).not.toBe(second.eventId)
    expect(first.deduplicationKey).not.toBe(second.deduplicationKey)
  })

  it('normalizes text without changing case or accents', () => {
    const event = createOfficialEvent()
    expect(event.title).toBe('Fato relevante oficial')
    expect(event.summary).toBe('Resumo factual.')
    expect(event.provenance.rawDocumentType).toBe('Fato Relevante')
  })

  it('normalizes URLs without sharing references', () => {
    const event = createOfficialEvent()
    expect(event.canonicalUrl).toBe('https://www.gov.br/cvm/documento?id=1')
    expect(event.originalUrl).toBe('https://www.gov.br/cvm/documento?id=1')
  })

  it('accepts exact regulatory identity evidence', () => {
    expect(() =>
      createOfficialEvent({
        associationEvidence: [
          {
            reason: 'exact-regulatory-identity',
            observedRegulatoryIdentityKey: 'cvm:company:001023:00000000000191',
          },
        ],
      })
    ).not.toThrow()
  })

  it('accepts exact ticker mapping evidence', () => {
    expect(() =>
      createOfficialEvent({
        associationEvidence: [
          {
            reason: 'exact-ticker-provider-mapping',
            observedTicker: 'BBAS3',
            mappingVersion: OFFICIAL_EVENT_ASSET_IDENTITIES_V1_VERSION,
          },
        ],
      })
    ).not.toThrow()
  })

  it('accepts exact CNPJ evidence', () => {
    expect(() => createOfficialEvent()).not.toThrow()
  })

  it('accepts exact CIK, series and class evidence', () => {
    expect(() =>
      createOfficialEvent({
        ticker: 'VOO',
        source: 'sec-edgar',
        eventType: 'periodic-report',
        associationEvidence: [
          {
            reason: 'exact-cik-series-class',
            observedRegistrantCik: '0000036405',
            observedSeriesId: 'S000002839',
            observedClassContractId: 'C000092055',
          },
        ],
        provenance: {
          ...createOfficialEventInput().provenance,
          sourceSystem: 'sec-edgar',
        },
      })
    ).not.toThrow()
  })

  it('accepts exact ISIN evidence', () => {
    expect(() =>
      createOfficialEvent({
        ticker: 'KNRI11',
        source: 'cvm-fund-delivery',
        eventType: 'periodic-report',
        associationEvidence: [
          { reason: 'exact-isin', observedIsin: 'BRKNRICTF007' },
        ],
        provenance: {
          ...createOfficialEventInput().provenance,
          sourceSystem: 'cvm-fund-delivery',
        },
      })
    ).not.toThrow()
  })

  it('accepts FII association by exact ticker mapping and exact CNPJ only', () => {
    const event = createOfficialEvent({
      ticker: 'KNRI11',
      source: 'cvm-fund-delivery',
      eventType: 'periodic-report',
      associationEvidence: [
        {
          reason: 'exact-ticker-provider-mapping',
          observedTicker: 'KNRI11',
          mappingVersion: OFFICIAL_EVENT_ASSET_IDENTITIES_V1_VERSION,
        },
        { reason: 'exact-cnpj', observedCnpj: '12005956000165' },
      ],
      provenance: {
        ...createOfficialEventInput().provenance,
        sourceSystem: 'cvm-fund-delivery',
      },
    })

    expect(event.associationEvidence).toEqual([
      {
        reason: 'exact-ticker-provider-mapping',
        observedTicker: 'KNRI11',
        mappingVersion: OFFICIAL_EVENT_ASSET_IDENTITIES_V1_VERSION,
      },
      { reason: 'exact-cnpj', observedCnpj: '12005956000165' },
    ])
  })

  it.each([
    [{ reason: 'exact-cnpj', observedCnpj: '00000000000192' }, 'CNPJ'],
    [
      {
        reason: 'exact-regulatory-identity',
        observedRegulatoryIdentityKey: 'cvm:other',
      },
      'Regulatory',
    ],
  ] as const)('rejects divergent evidence %#', (evidence, message) => {
    expect(() =>
      createOfficialEvent({ associationEvidence: [evidence] })
    ).toThrow(message)
  })

  it.each([
    ['observedRegistrantCik', '0000036406'],
    ['observedSeriesId', 'S000002840'],
    ['observedClassContractId', 'C000092056'],
  ] as const)('rejects divergent SEC %s', (field, value) => {
    const evidence = {
      reason: 'exact-cik-series-class' as const,
      observedRegistrantCik: '0000036405',
      observedSeriesId: 'S000002839',
      observedClassContractId: 'C000092055',
    }
    Object.assign(evidence, { [field]: value })
    expect(() =>
      createOfficialEvent({
        ticker: 'VOO',
        source: 'sec-edgar',
        eventType: 'periodic-report',
        associationEvidence: [evidence],
        provenance: {
          ...createOfficialEventInput().provenance,
          sourceSystem: 'sec-edgar',
        },
      })
    ).toThrow(/SEC series and class/)
  })

  it('rejects divergent ISIN evidence', () => {
    expect(() =>
      createOfficialEvent({
        ticker: 'KNRI11',
        source: 'cvm-fund-delivery',
        eventType: 'periodic-report',
        associationEvidence: [
          { reason: 'exact-isin', observedIsin: 'BRKNRICTF008' },
        ],
        provenance: {
          ...createOfficialEventInput().provenance,
          sourceSystem: 'cvm-fund-delivery',
        },
      })
    ).toThrow(/ISIN/)
  })

  it('rejects exact CNPJ evidence for an ETF', () => {
    expect(() =>
      createOfficialEvent({
        ticker: 'VOO',
        source: 'sec-edgar',
        eventType: 'periodic-report',
        associationEvidence: [
          { reason: 'exact-cnpj', observedCnpj: '00000364050000' },
        ],
        provenance: {
          ...createOfficialEventInput().provenance,
          sourceSystem: 'sec-edgar',
        },
      })
    ).toThrow(/CNPJ/)
  })

  it('rejects exact CIK, series and class evidence for a stock', () => {
    expect(() =>
      createOfficialEvent({
        associationEvidence: [
          {
            reason: 'exact-cik-series-class',
            observedRegistrantCik: '0000036405',
            observedSeriesId: 'S000002839',
            observedClassContractId: 'C000092055',
          },
        ],
      })
    ).toThrow(/SEC series and class/)
  })

  it('rejects exact ISIN evidence for a stock', () => {
    expect(() =>
      createOfficialEvent({
        associationEvidence: [
          { reason: 'exact-isin', observedIsin: 'BRKNRICTF007' },
        ],
      })
    ).toThrow(/ISIN/)
  })

  it('rejects divergent ticker mapping evidence', () => {
    expect(() =>
      createOfficialEvent({
        associationEvidence: [
          {
            reason: 'exact-ticker-provider-mapping',
            observedTicker: 'WEGE3',
            mappingVersion: OFFICIAL_EVENT_ASSET_IDENTITIES_V1_VERSION,
          },
        ],
      })
    ).toThrow(/Ticker mapping/)
  })

  it('rejects divergent mapping version evidence', () => {
    expect(() =>
      createOfficialEvent({
        associationEvidence: [
          {
            reason: 'exact-ticker-provider-mapping',
            observedTicker: 'BBAS3',
            mappingVersion: 'old-version',
          },
        ],
      })
    ).toThrow(/Ticker mapping/)
  })

  it('rejects empty evidence', () => {
    expect(() => createOfficialEvent({ associationEvidence: [] })).toThrow(
      /between 1 and 6/
    )
  })

  it('rejects duplicate evidence reasons', () => {
    expect(() =>
      createOfficialEvent({
        associationEvidence: [
          { reason: 'exact-cnpj', observedCnpj: '00000000000191' },
          { reason: 'exact-cnpj', observedCnpj: '00000000000191' },
        ],
      })
    ).toThrow(/Duplicate/)
  })

  it('rejects more than six association evidences before evaluating contents', () => {
    const evidence = {
      reason: 'exact-cnpj' as const,
      observedCnpj: '00000000000191',
    }
    expect(() =>
      createOfficialEvent({
        associationEvidence: Array.from({ length: 7 }, () => ({ ...evidence })),
      })
    ).toThrow(/between 1 and 6/)
  })

  it('rejects issuer official source automation in V1', () => {
    expect(() =>
      createOfficialEvent({
        associationEvidence: [
          {
            reason: 'issuer-official-source',
            observedOfficialSource: 'issuer.example',
          },
        ],
      })
    ).toThrow(/not automated/)
  })

  it('rejects an unknown association reason at runtime', () => {
    const input = createOfficialEventInput()
    Object.assign(input.associationEvidence[0], { reason: 'similar-name' })
    expect(() => buildOfficialAssetEventV1(input)).toThrow(
      /Unsupported association/
    )
  })

  it('requires justification for other official event', () => {
    expect(() =>
      createOfficialEvent({
        eventType: 'other-official-event',
        classificationJustification: null,
      })
    ).toThrow(/requires classificationJustification/)
  })

  it('accepts normalized justification for other official event', () => {
    expect(
      createOfficialEvent({
        eventType: 'other-official-event',
        classificationJustification: '  Fora   das classes anteriores. ',
      }).classificationJustification
    ).toBe('Fora das classes anteriores.')
  })

  it('rejects justification for every other event type', () => {
    expect(() =>
      createOfficialEvent({
        classificationJustification: 'metadata sem semântica',
      })
    ).toThrow(/only allowed/)
  })

  it('rejects unknown publishedAt precision at runtime', () => {
    const input = createOfficialEventInput()
    Object.assign(input.publishedAt, { precision: 'unknown', raw: null })
    expect(() => buildOfficialAssetEventV1(input)).toThrow(/publishedAt/)
  })

  it('accepts unknown occurredAt precision', () => {
    expect(
      createOfficialEvent({ occurredAt: { precision: 'unknown', raw: null } })
        .occurredAt
    ).toEqual({ precision: 'unknown', raw: null })
  })

  it('generates the canonical fingerprint as final fallback', () => {
    const event = createOfficialEvent({
      documentIdentifiers: createDocumentIdentifiers({
        sourceDocumentId: null,
        regulatoryDocumentId: null,
        accessionNumber: null,
        protocolNumber: null,
        canonicalUrl: null,
        fingerprint: null,
      }),
    })
    expect(event.documentIdentity).toMatchObject({ kind: 'fingerprint' })
    expect(event.documentIdentity.value).toMatch(/^fnv1a64:[0-9a-f]{16}$/)
  })

  it('rejects a caller fingerprint that diverges from canonical metadata', () => {
    expect(() =>
      createOfficialEvent({
        documentIdentifiers: createDocumentIdentifiers({
          sourceDocumentId: null,
          regulatoryDocumentId: null,
          accessionNumber: null,
          protocolNumber: null,
          canonicalUrl: null,
          fingerprint: 'fnv1a64:0000000000000000',
        }),
      })
    ).toThrow(/fingerprint diverges/)
  })

  it('validates and defensively copies provenance', () => {
    const rawFields = { protocol: '123', count: 1 }
    const input = createOfficialEventInput({
      provenance: { ...createOfficialEventInput().provenance, rawFields },
    })
    const event = buildOfficialAssetEventV1(input)
    rawFields.protocol = 'changed'
    expect(event.provenance.rawFields.protocol).toBe('123')
  })

  it.each([
    ['parserVersion', ' '],
    ['mappingVersion', ' '],
    ['sourcePayloadHash', ' '],
  ] as const)('rejects empty provenance %s', (field, value) => {
    const provenance = {
      ...createOfficialEventInput().provenance,
      [field]: value,
    }
    expect(() => createOfficialEvent({ provenance })).toThrow()
  })

  it('rejects a provenance source mismatch', () => {
    expect(() =>
      createOfficialEvent({
        provenance: {
          ...createOfficialEventInput().provenance,
          sourceSystem: 'sec-edgar',
        },
      })
    ).toThrow(/diverges/)
  })

  it('rejects a provenance mapping version different from the registry', () => {
    expect(() =>
      createOfficialEvent({
        provenance: {
          ...createOfficialEventInput().provenance,
          mappingVersion: 'official-event-asset-identities.v0',
        },
      })
    ).toThrow(/mappingVersion diverges/)
  })

  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    'rejects non-finite raw number %s',
    (invalidNumber) => {
      expect(() =>
        createOfficialEvent({
          provenance: {
            ...createOfficialEventInput().provenance,
            rawFields: { invalidNumber },
          },
        })
      ).toThrow(/finite/)
    }
  )

  it('rejects nested raw fields', () => {
    const rawFields = { valid: 'value' }
    Object.assign(rawFields, { nested: { invalid: true } })
    expect(() =>
      createOfficialEvent({
        provenance: { ...createOfficialEventInput().provenance, rawFields },
      })
    ).toThrow(/scalar/)
  })

  it.each([
    ['bigint', 1n],
    ['date', new Date('2026-07-15T00:00:00Z')],
    ['function', () => true],
    ['undefined', undefined],
    ['array', ['invalid']],
  ])('rejects %s in raw fields', (_label, invalid) => {
    const rawFields = { valid: 'value' }
    Object.assign(rawFields, { invalid })
    expect(() =>
      createOfficialEvent({
        provenance: { ...createOfficialEventInput().provenance, rawFields },
      })
    ).toThrow(/scalar/)
  })

  it('rejects HTML in raw fields', () => {
    expect(() =>
      createOfficialEvent({
        provenance: {
          ...createOfficialEventInput().provenance,
          rawFields: { content: '<p>unsafe</p>' },
        },
      })
    ).toThrow(/HTML/)
  })

  it.each(['<p>title</p>', '<!--comment-->', '<strong'])(
    'rejects evident HTML in title: %s',
    (title) => {
      expect(() => createOfficialEvent({ title })).toThrow(/HTML/)
    }
  )

  it.each(['<p>summary</p>', '<!--comment-->', '<em'])(
    'rejects evident HTML in summary: %s',
    (summary) => {
      expect(() => createOfficialEvent({ summary })).toThrow(/HTML/)
    }
  )

  it.each(['<!--comment-->', '<!DOCTYPE html>', '<span'])(
    'rejects evident HTML fragments in raw fields: %s',
    (content) => {
      expect(() =>
        createOfficialEvent({
          provenance: {
            ...createOfficialEventInput().provenance,
            rawFields: { content },
          },
        })
      ).toThrow(/HTML/)
    }
  )

  it('rejects updatedAt earlier than ingestedAt', () => {
    expect(() =>
      createOfficialEvent({ updatedAt: '2026-07-15T17:59:59Z' })
    ).toThrow(/earlier/)
  })

  it('accepts equal ingestedAt and updatedAt', () => {
    expect(() =>
      createOfficialEvent({
        ingestedAt: '2026-07-15T18:00:00.123456789Z',
        updatedAt: '2026-07-15T18:00:00.123456789Z',
      })
    ).not.toThrow()
  })

  it.each([
    '2026-02-30T18:00:00Z',
    '2026-07-15T24:00:00Z',
    '2026-07-15T18:60:00Z',
    '2026-07-15T18:00:60Z',
  ])('rejects invalid ingestedAt civil instant %s', (ingestedAt) => {
    expect(() => createOfficialEvent({ ingestedAt })).toThrow()
  })

  it.each(['2026-07-15T18:00:00-03:00', '2026-07-15 18:00:00Z'])(
    'rejects non-UTC ingestion timestamp %s',
    (ingestedAt) => {
      expect(() => createOfficialEvent({ ingestedAt })).toThrow()
    }
  )

  it.each([
    ['title', 'x'.repeat(501)],
    ['summary', 'x'.repeat(4_001)],
    ['classificationJustification', 'x'.repeat(1_001)],
  ] as const)('rejects oversized %s', (field, value) => {
    expect(() => createOfficialEvent({ [field]: value })).toThrow(/characters/)
  })

  it('counts text limits by Unicode code points instead of UTF-16 code units', () => {
    expect(() => createOfficialEvent({ title: '😀'.repeat(500) })).not.toThrow()
    expect(() => createOfficialEvent({ title: '😀'.repeat(501) })).toThrow(
      /characters/
    )
  })

  it('rejects more than one hundred raw fields', () => {
    const rawFields = Object.fromEntries(
      Array.from({ length: 101 }, (_, index) => [`field${index}`, index])
    )
    expect(() =>
      createOfficialEvent({
        provenance: { ...createOfficialEventInput().provenance, rawFields },
      })
    ).toThrow(/100 keys/)
  })

  it('rejects a raw string over ten thousand characters', () => {
    expect(() =>
      createOfficialEvent({
        provenance: {
          ...createOfficialEventInput().provenance,
          rawFields: { oversized: 'x'.repeat(10_001) },
        },
      })
    ).toThrow(/10000/)
  })

  it('rejects more than one hundred related documents', () => {
    expect(() =>
      createOfficialEvent({
        relatedDocuments: Array.from({ length: 101 }, (_, index) => ({
          relation: 'references',
          eventId: `event-${index}`,
        })),
      })
    ).toThrow(/100 items/)
  })

  it('rejects a duplicated related-document relation', () => {
    expect(() =>
      createOfficialEvent({
        relatedDocuments: [
          { relation: 'references', eventId: 'external-event' },
          { relation: 'references', eventId: 'external-event' },
        ],
      })
    ).toThrow(/Duplicate related document/)
  })

  it('rejects an unknown related document relation at runtime', () => {
    const input = createOfficialEventInput({
      relatedDocuments: [{ relation: 'references', eventId: 'related-event' }],
    })
    Object.assign(input.relatedDocuments[0], { relation: 'similar' })
    expect(() => buildOfficialAssetEventV1(input)).toThrow(
      /Unsupported related/
    )
  })

  it('rejects an unknown status at runtime', () => {
    const input = createOfficialEventInput()
    Object.assign(input, { status: 'deleted' })
    expect(() => buildOfficialAssetEventV1(input)).toThrow(
      /Unsupported official event status/
    )
  })

  it('does not share mutable references with the input', () => {
    const evidence = [
      { reason: 'exact-cnpj' as const, observedCnpj: '00000000000191' },
    ]
    const rawFields = { protocol: '123' }
    const input = createOfficialEventInput({
      associationEvidence: evidence,
      provenance: { ...createOfficialEventInput().provenance, rawFields },
    })
    const event = buildOfficialAssetEventV1(input)
    evidence[0].observedCnpj = 'changed'
    rawFields.protocol = 'changed'
    input.documentIdentifiers.sourceDocumentId = 'changed'
    expect(event.associationEvidence[0]).toMatchObject({
      observedCnpj: '00000000000191',
    })
    expect(event.provenance.rawFields.protocol).toBe('123')
    expect(event.sourceDocumentId).toBe('cvm:ipe:document-1')
  })

  it('does not mutate the input when the output is changed', () => {
    const input = createOfficialEventInput()
    const snapshot = structuredClone(input)
    const event = buildOfficialAssetEventV1(input)
    event.assetIdentity.officialName = 'changed'
    event.associationEvidence.length = 0
    event.provenance.rawFields.protocol = 'changed'
    expect(input).toEqual(snapshot)
  })

  it('keeps related documents deeply independent in both directions', () => {
    const relatedDocuments = [
      { relation: 'references' as const, eventId: 'external-event' },
    ]
    const input = createOfficialEventInput({ relatedDocuments })
    const event = buildOfficialAssetEventV1(input)
    relatedDocuments[0].eventId = 'changed-input'
    expect(event.relatedDocuments[0].eventId).toBe('external-event')
    event.relatedDocuments[0].eventId = 'changed-output'
    expect(input.relatedDocuments[0].eventId).toBe('changed-input')
  })

  it('ignores forged caller values for fields derived by the domain', () => {
    const input = createOfficialEventInput()
    Object.assign(input, {
      schemaVersion: 'forged',
      sourceType: 'publisher',
      language: 'en-US',
      jurisdiction: 'US',
      eventId: 'forged',
      deduplicationKey: 'forged',
      assetIdentity: { ticker: 'FAKE' },
    })
    const event = buildOfficialAssetEventV1(input)
    expect(event).toMatchObject({
      schemaVersion: 'official-asset-event.v1',
      sourceType: 'regulator',
      language: 'pt-BR',
      jurisdiction: 'BR',
    })
    expect(event.eventId).not.toBe('forged')
    expect(event.deduplicationKey).not.toBe('forged')
    expect(event.assetIdentity.ticker).toBe('BBAS3')
  })

  it('keeps sourceDocumentId consistent across document fields', () => {
    const event = createOfficialEvent()
    expect(event.sourceDocumentId).toBe(
      event.documentIdentifiers.sourceDocumentId
    )
    expect(event.documentIdentity).toMatchObject({
      kind: 'source-document-id',
      value: event.sourceDocumentId,
    })
  })

  it('excludes noncanonical metadata from fallback fingerprint and eventId', () => {
    const fallback = createDocumentIdentifiers({
      sourceDocumentId: null,
      regulatoryDocumentId: null,
      accessionNumber: null,
      protocolNumber: null,
      canonicalUrl: null,
      fingerprint: null,
    })
    const first = createOfficialEvent({ documentIdentifiers: fallback })
    const second = createOfficialEvent({
      documentIdentifiers: fallback,
      summary: 'Outro resumo',
      occurredAt: null,
      ingestedAt: '2026-07-16T00:00:00Z',
      updatedAt: '2026-07-16T00:00:00Z',
      provenance: {
        ...createOfficialEventInput().provenance,
        sourcePayloadHash: 'sha256:other',
      },
    })
    expect(second.documentIdentifiers.fingerprint).toBe(
      first.documentIdentifiers.fingerprint
    )
    expect(second.eventId).toBe(first.eventId)
    expect(second.deduplicationKey).toBe(first.deduplicationKey)
  })
})
