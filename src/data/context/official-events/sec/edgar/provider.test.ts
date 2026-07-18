import { describe, expect, it, vi } from 'vitest'

import { OFFICIAL_EVENT_ASSET_IDENTITIES_V1_VERSION } from '../../../../../domain/context/official-events'
import {
  SEC_EDGAR_ETF_EVENTS_PROVIDER_V1_VERSION,
  SEC_EDGAR_TERMS_AUDITED_AT,
} from './constants'
import { extractSecEdgarEtfEvents, fetchSecEdgarEtfEvents } from './provider'
import {
  createFilingDetail,
  createFilingDetailHtml,
  createRecentFiling,
  createSubmissions,
  createSubmissionsJson,
  TEST_IDENTITIES,
} from './testFixtures'
import type {
  ExtractSecEdgarEtfEventsInputV1,
  SecEdgarFetchRequestV1,
  SecEdgarFetchResponseV1,
  SecEdgarFilingDetailV1,
  SecEdgarRecentFilingV1,
} from './types'
import {
  buildSecEdgarFilingDetailUrl,
  buildSecEdgarSubmissionsUrl,
} from './urls'

const INGESTED_AT = '2026-07-17T12:00:00Z'
const UPDATED_AT = '2026-07-17T12:00:00Z'
const USER_AGENT = 'Papo de Futuro contact@example.com'
const SUPPORTED_FORMS = new Set([
  'NPORT-P',
  'N-CEN',
  'N-CSR',
  'N-CSRS',
  'DEF 14A',
  'DEFA14A',
])

function extractionInput(
  filingsByIdentity: readonly (readonly SecEdgarRecentFilingV1[])[] = [
    [
      createRecentFiling({
        accessionNumber: `${TEST_IDENTITIES[0].cik}-26-000001`,
      }),
    ],
    [
      createRecentFiling({
        accessionNumber: `${TEST_IDENTITIES[1].cik}-26-000001`,
      }),
    ],
    [
      createRecentFiling({
        accessionNumber: `${TEST_IDENTITIES[2].cik}-26-000001`,
      }),
    ],
  ]
): ExtractSecEdgarEtfEventsInputV1 {
  const details = new Map<string, SecEdgarFilingDetailV1>()
  filingsByIdentity.forEach((filings, identityIndex) => {
    filings.forEach((filing) => {
      details.set(
        buildSecEdgarFilingDetailUrl({
          accessionNumber: filing.accessionNumber,
        }),
        createFilingDetail(identityIndex, filing.accessionNumber)
      )
    })
  })
  const candidateUrls = filingsByIdentity.flatMap((filings) =>
    filings
      .filter(
        (filing) =>
          filing.filingDate >= '2026-01-01' &&
          filing.filingDate <= '2026-12-31' &&
          SUPPORTED_FORMS.has(filing.form)
      )
      .map((filing) =>
        buildSecEdgarFilingDetailUrl({
          accessionNumber: filing.accessionNumber,
        })
      )
  )
  const uniqueDetailCount = new Set(candidateUrls).size
  return {
    fromDate: '2026-01-01',
    toDate: '2026-12-31',
    submissions: filingsByIdentity.map((filings, index) =>
      createSubmissions(index, filings)
    ),
    filingDetailsByUrl: details,
    ingestedAt: INGESTED_AT,
    updatedAt: UPDATED_AT,
    requestCount: 3 + uniqueDetailCount,
    submissionsRequestCount: 3,
    detailRequestCount: uniqueDetailCount,
    cacheHitCount: candidateUrls.length - uniqueDetailCount,
  }
}

function response(
  text: string,
  contentLength: string | null = null
): SecEdgarFetchResponseV1 {
  const bytes = new TextEncoder().encode(text)
  return {
    ok: true,
    status: 200,
    headers: {
      get: (name) =>
        name.toLowerCase() === 'content-length' ? contentLength : null,
    },
    arrayBuffer: async () => bytes.slice().buffer,
  }
}

function createSharedFilingDetailHtml(
  accessionNumber: string,
  identityIndexes: readonly number[]
): string {
  const rows = identityIndexes
    .map((index) => {
      const identity = TEST_IDENTITIES[index]
      return `<tr><td>${identity.seriesId}</td></tr><tr><td>${identity.classContractId}</td></tr>`
    })
    .join('')
  return createFilingDetailHtml(accessionNumber).replace(
    /<table class="tableSeries">[\s\S]*?<\/table>/,
    `<table class="tableSeries">${rows}</table>`
  )
}

function createManyFilings(count: number): SecEdgarRecentFilingV1[] {
  return Array.from({ length: count }, (_, sourceIndex) =>
    createRecentFiling({
      sourceIndex,
      accessionNumber: `${TEST_IDENTITIES[0].cik}-26-${String(
        sourceIndex + 1
      ).padStart(6, '0')}`,
    })
  )
}

function createHighVolumeFetcher(filings: readonly SecEdgarRecentFilingV1[]) {
  const payloads = [
    createSubmissionsJson(0, filings),
    createSubmissionsJson(1, []),
    createSubmissionsJson(2, []),
  ]
  let submissionsIndex = 0
  return vi.fn(async ({ url }: SecEdgarFetchRequestV1) => {
    if (url.endsWith('.json')) return response(payloads[submissionsIndex++])
    const accessionNumber = /\/(\d{10}-\d{2}-\d{6})-index\.html$/.exec(url)?.[1]
    if (!accessionNumber) throw new Error('Unexpected test URL')
    return response(createFilingDetailHtml(accessionNumber))
  })
}

describe('SEC EDGAR ETF event extraction', () => {
  it('builds events in registry order with exact SEC evidence and provenance', () => {
    const result = extractSecEdgarEtfEvents(extractionInput())
    expect(result.events.map((event) => event.assetIdentity.ticker)).toEqual([
      'VOO',
      'VNQ',
      'VEA',
    ])
    expect(result.providerVersion).toBe(
      SEC_EDGAR_ETF_EVENTS_PROVIDER_V1_VERSION
    )
    expect(result).toMatchObject({
      source: 'sec-edgar',
      fromDate: '2026-01-01',
      toDate: '2026-12-31',
      requestCount: 6,
      submissionsRequestCount: 3,
      detailRequestCount: 3,
      totalFilings: 3,
      candidateFilings: 3,
      matchedTargetFilings: 3,
      acceptedFilings: 3,
    })
    expect(result.events[0]).toMatchObject({
      source: 'sec-edgar',
      sourceType: 'regulator',
      eventType: 'periodic-report',
      status: 'original',
      supersedesEventId: null,
      title: 'NPORT-P \u2014 2026-04-30',
      language: 'en-US',
      jurisdiction: 'US',
      associationEvidence: [
        {
          reason: 'exact-ticker-provider-mapping',
          observedTicker: 'VOO',
          mappingVersion: OFFICIAL_EVENT_ASSET_IDENTITIES_V1_VERSION,
        },
        {
          reason: 'exact-cik-series-class',
          observedRegistrantCik: TEST_IDENTITIES[0].cik,
          observedSeriesId: TEST_IDENTITIES[0].seriesId,
          observedClassContractId: TEST_IDENTITIES[0].classContractId,
        },
      ],
      provenance: {
        termsAuditedAt: SEC_EDGAR_TERMS_AUDITED_AT,
      },
    })
    expect(result.events[0].provenance.sourcePayloadHash).toBe(
      'fnv1a64:031d4de7e78d400d'
    )
    expect(result.events[0].provenance.parserVersion).toBe(
      'sec-edgar-filing-detail-parser.v1'
    )
    expect(result.events[0].provenance.rawDocumentCategory).toBe('40')
    expect(result.events[0].provenance.rawFields).toEqual({
      registrantCikRaw: TEST_IDENTITIES[0].cik,
      accessionNumberRaw: `${TEST_IDENTITIES[0].cik}-26-000001`,
      accessionArchiveCik: '36405',
      filingDateRaw: '2026-05-28',
      reportDateRaw: '2026-04-30',
      acceptanceDateTimeRaw: '2026-05-28T16:39:55.123Z',
      actRaw: '40',
      formRaw: 'NPORT-P',
      fileNumberRaw: '811-02652',
      filmNumberRaw: '261234567',
      itemsRaw: '',
      coreTypeRaw: 'NPORT-P',
      sizeRaw: 12_345,
      isXbrlRaw: 1,
      isInlineXbrlRaw: 0,
      isXbrlNumericRaw: null,
      primaryDocumentRaw: 'primary.htm',
      primaryDocDescriptionRaw: 'FORM NPORT-P',
      matchedSeriesIdRaw: TEST_IDENTITIES[0].seriesId,
      matchedClassContractIdRaw: TEST_IDENTITIES[0].classContractId,
      detailSeriesCount: 1,
      detailClassCount: 1,
      detailDocumentCount: 2,
      occurredDateSource: 'report-date',
    })
  })

  it.each([
    ['NPORT-P', 'periodic-report'],
    ['N-CEN', 'periodic-report'],
    ['N-CSR', 'periodic-report'],
    ['N-CSRS', 'periodic-report'],
    ['DEF 14A', 'shareholder-meeting'],
    ['DEFA14A', 'shareholder-meeting'],
  ] as const)('maps exact form %s to %s', (form, eventType) => {
    const input = extractionInput([
      [
        createRecentFiling({
          accessionNumber: `${TEST_IDENTITIES[0].cik}-26-000001`,
          form,
        }),
      ],
      [],
      [],
    ])
    expect(extractSecEdgarEtfEvents(input).events[0].eventType).toBe(eventType)
  })

  it.each([
    'NPORT-P/A',
    'NPORT-PX',
    'NPORT-P ',
    '10-K',
    '8-K',
    'DEF 14A/A',
    'DEF  14A',
    'DEFA14A/A',
    'N-PX',
    '24F-2NT',
    '485BPOS',
    '497',
    '497J',
    '497K',
    'nport-p',
    ' NPORT-P',
  ])('ignores unsupported or non-exact form %j', (form) => {
    const filing = createRecentFiling({
      accessionNumber: `${TEST_IDENTITIES[0].cik}-26-000001`,
      form,
    })
    const result = extractSecEdgarEtfEvents(extractionInput([[filing], [], []]))
    expect(result.events).toEqual([])
    expect(result.ignoredUnsupportedFormFilings).toBe(1)
    expect(result.candidateFilings).toBe(0)
  })

  it('ignores registrant-only and non-target series without inventing association evidence', () => {
    const input = extractionInput()
    const details = new Map(input.filingDetailsByUrl)
    const vooUrl = buildSecEdgarFilingDetailUrl({
      accessionNumber: input.submissions[0].recentFilings[0].accessionNumber,
    })
    details.set(vooUrl, {
      accessionNumber: input.submissions[0].recentFilings[0].accessionNumber,
      scope: 'registrant-only',
      series: [],
      seriesCount: 0,
      classCount: 0,
      documentCount: 1,
    })
    const result = extractSecEdgarEtfEvents({
      ...input,
      filingDetailsByUrl: details,
    })
    expect(result.events.map((event) => event.assetIdentity.ticker)).toEqual([
      'VNQ',
      'VEA',
    ])
    expect(result.ignoredNonTargetIdentityFilings).toBe(1)
    expect(result.candidateFilings).toBe(3)
  })

  it('aborts if the target class is observed under the wrong series', () => {
    const input = extractionInput()
    const details = new Map(input.filingDetailsByUrl)
    const filing = input.submissions[0].recentFilings[0]
    details.set(
      buildSecEdgarFilingDetailUrl({ accessionNumber: filing.accessionNumber }),
      {
        accessionNumber: filing.accessionNumber,
        scope: 'series-and-classes',
        series: [
          {
            seriesId: 'S000000001',
            classes: [{ classContractId: TEST_IDENTITIES[0].classContractId }],
          },
        ],
        seriesCount: 1,
        classCount: 1,
        documentCount: 1,
      }
    )
    expect(() =>
      extractSecEdgarEtfEvents({ ...input, filingDetailsByUrl: details })
    ).toThrow(/wrong series/)
  })

  it('uses reportDate and falls back to filingDate without timezone invention', () => {
    const filing = createRecentFiling({
      accessionNumber: `${TEST_IDENTITIES[0].cik}-26-000001`,
      reportDate: '',
    })
    const event = extractSecEdgarEtfEvents(extractionInput([[filing], [], []]))
      .events[0]
    expect(event.occurredAt).toEqual({
      precision: 'date',
      date: filing.filingDate,
      raw: filing.filingDate,
    })
    expect(event.publishedAt).toMatchObject({
      precision: 'second',
      raw: filing.acceptanceDateTime,
      sourceOffset: 'Z',
    })
  })

  it.each([
    [{ filingDate: '2026-02-30' }, 'invalid-filing-date'],
    [{ reportDate: '2026-02-30' }, 'invalid-report-date'],
    [
      { acceptanceDateTime: '2026-05-28T16:39:55.1234Z' },
      'invalid-acceptance-datetime',
    ],
  ] as const)(
    'returns a closed individual rejection for %s',
    (overrides, reason) => {
      const filing = createRecentFiling({
        accessionNumber: `${TEST_IDENTITIES[0].cik}-26-000001`,
        ...overrides,
      })
      const result = extractSecEdgarEtfEvents(
        extractionInput([[filing], [], []])
      )
      expect(result.events).toEqual([])
      expect(result.rejectedFilings).toEqual([
        {
          ticker: 'VOO',
          registrantCik: TEST_IDENTITIES[0].cik,
          accessionNumber: filing.accessionNumber,
          form: filing.form,
          filingDate: filing.filingDate,
          reason,
          message: expect.any(String),
        },
      ])
      expect(result.matchedTargetFilings).toBe(1)
      expect(result.acceptedFilings).toBe(0)
    }
  )

  it('sorts candidates by acceptance time and accession using code units', () => {
    const later = createRecentFiling({
      sourceIndex: 0,
      accessionNumber: `${TEST_IDENTITIES[0].cik}-26-000002`,
      acceptanceDateTime: '2026-05-28T17:00:00.000Z',
    })
    const earlier = createRecentFiling({
      sourceIndex: 1,
      accessionNumber: `${TEST_IDENTITIES[0].cik}-26-000001`,
      acceptanceDateTime: '2026-05-28T16:00:00.000Z',
    })
    const result = extractSecEdgarEtfEvents(
      extractionInput([[later, earlier], [], []])
    )
    expect(
      result.events.map((event) => event.documentIdentifiers.accessionNumber)
    ).toEqual([earlier.accessionNumber, later.accessionNumber])
  })

  it('uses ETF registry order and sourceIndex as deterministic final ties', () => {
    const accessionNumber = `${TEST_IDENTITIES[0].cik}-26-000001`
    const firstVoo = createRecentFiling({ sourceIndex: 2, accessionNumber })
    const secondVoo = createRecentFiling({ sourceIndex: 5, accessionNumber })
    const input = extractionInput([
      [secondVoo, firstVoo],
      [createRecentFiling({ accessionNumber })],
      [createRecentFiling({ accessionNumber })],
    ])
    const details = new Map(input.filingDetailsByUrl)
    details.set(buildSecEdgarFilingDetailUrl({ accessionNumber }), {
      ...createFilingDetail(0, accessionNumber),
      series: TEST_IDENTITIES.map((identity) => ({
        seriesId: identity.seriesId,
        classes: [{ classContractId: identity.classContractId }],
      })),
      seriesCount: 3,
      classCount: 3,
    })
    const result = extractSecEdgarEtfEvents({
      ...input,
      filingDetailsByUrl: details,
    })
    expect(result.events.map((event) => event.assetIdentity.ticker)).toEqual([
      'VOO',
      'VNQ',
      'VEA',
    ])
    expect(result.duplicates).toEqual([
      {
        deduplicationKey: result.events[0].deduplicationKey,
        keptInputIndex: 0,
        duplicateInputIndex: 1,
      },
    ])
  })

  it('does not depend on caller Map insertion order', () => {
    const input = extractionInput()
    const reversedDetails = new Map([...input.filingDetailsByUrl].reverse())
    expect(
      extractSecEdgarEtfEvents({
        ...input,
        filingDetailsByUrl: reversedDetails,
      }).events.map((event) => event.eventId)
    ).toEqual(
      extractSecEdgarEtfEvents(input).events.map((event) => event.eventId)
    )
  })

  it('classifies exact same payload as duplicate and preserves indexes', () => {
    const first = createRecentFiling({
      sourceIndex: 3,
      accessionNumber: `${TEST_IDENTITIES[0].cik}-26-000001`,
    })
    const duplicate = { ...first, sourceIndex: 8 }
    const result = extractSecEdgarEtfEvents(
      extractionInput([[first, duplicate], [], []])
    )
    expect(result.events).toHaveLength(1)
    expect(result.duplicates).toEqual([
      {
        deduplicationKey: result.events[0].deduplicationKey,
        keptInputIndex: 0,
        duplicateInputIndex: 1,
      },
    ])
    expect(result.exactDuplicateFilings).toBe(1)
    expect(result.acceptedFilings).toBe(2)
  })

  it('preserves every index and payload hash in a three-way conflict', () => {
    const base = createRecentFiling({
      accessionNumber: `${TEST_IDENTITIES[0].cik}-26-000001`,
    })
    const result = extractSecEdgarEtfEvents(
      extractionInput([
        [
          base,
          { ...base, sourceIndex: 1, items: 'A' },
          { ...base, sourceIndex: 2, items: 'B' },
        ],
        [],
        [],
      ])
    )
    expect(result.conflicts).toHaveLength(1)
    expect(result.conflicts[0].inputIndexes).toEqual([0, 1, 2])
    expect(result.conflicts[0].sourcePayloadHashes).toHaveLength(3)
    expect(result.conflictingPayloadFilings).toBe(2)
  })

  it('separates an exact duplicate from two conflicting payloads', () => {
    const base = createRecentFiling({
      accessionNumber: `${TEST_IDENTITIES[0].cik}-26-000001`,
    })
    const result = extractSecEdgarEtfEvents(
      extractionInput([
        [
          base,
          { ...base, sourceIndex: 1 },
          { ...base, sourceIndex: 2, items: 'A' },
          { ...base, sourceIndex: 3, items: 'B' },
        ],
        [],
        [],
      ])
    )
    expect(result.duplicates).toEqual([
      {
        deduplicationKey: result.events[0].deduplicationKey,
        keptInputIndex: 0,
        duplicateInputIndex: 1,
      },
    ])
    expect(result.conflicts[0].inputIndexes).toEqual([0, 2, 3])
    expect(result.conflicts[0].sourcePayloadHashes).toHaveLength(3)
    expect(result).toMatchObject({
      acceptedFilings: 4,
      exactDuplicateFilings: 1,
      conflictingPayloadFilings: 2,
    })
  })

  it('keeps equal accessions distinct across asset identities', () => {
    const accessionNumber = `${TEST_IDENTITIES[0].cik}-26-000001`
    const input = extractionInput([
      [createRecentFiling({ accessionNumber })],
      [createRecentFiling({ accessionNumber })],
      [],
    ])
    const url = buildSecEdgarFilingDetailUrl({ accessionNumber })
    const details = new Map(input.filingDetailsByUrl)
    details.set(url, {
      accessionNumber,
      scope: 'series-and-classes',
      series: TEST_IDENTITIES.slice(0, 2).map((identity) => ({
        seriesId: identity.seriesId,
        classes: [{ classContractId: identity.classContractId }],
      })),
      seriesCount: 2,
      classCount: 2,
      documentCount: 2,
    })
    const result = extractSecEdgarEtfEvents({
      ...input,
      filingDetailsByUrl: details,
    })
    expect(
      result.events.map((event) => event.documentIdentifiers.accessionNumber)
    ).toEqual([accessionNumber, accessionNumber])
    expect(
      new Set(result.events.map((event) => event.deduplicationKey)).size
    ).toBe(2)
    expect(result.duplicates).toEqual([])
    expect(result.conflicts).toEqual([])
  })

  it('does not mutate normalized submissions or filing details', () => {
    const input = extractionInput()
    const before = JSON.stringify({
      submissions: input.submissions,
      details: [...input.filingDetailsByUrl],
    })
    extractSecEdgarEtfEvents(input)
    expect(
      JSON.stringify({
        submissions: input.submissions,
        details: [...input.filingDetailsByUrl],
      })
    ).toBe(before)
  })

  it('returns defensive data with no state shared across executions', () => {
    const input = extractionInput()
    const first = extractSecEdgarEtfEvents(input)
    first.events[0].title = 'mutated'
    first.events[0].assetIdentity.ticker = 'VEA'
    first.events[0].associationEvidence.length = 0
    first.events[0].provenance.rawFields.formRaw = 'mutated'
    first.duplicates.push({
      deduplicationKey: 'mutated',
      keptInputIndex: 0,
      duplicateInputIndex: 1,
    })
    first.conflicts.push({
      deduplicationKey: 'mutated',
      inputIndexes: [0, 1],
      sourcePayloadHashes: ['one', 'two'],
    })
    first.rejectedFilings.push({
      ticker: 'VOO',
      registrantCik: TEST_IDENTITIES[0].cik,
      accessionNumber: `${TEST_IDENTITIES[0].cik}-26-000001`,
      form: 'NPORT-P',
      filingDate: '2026-05-28',
      reason: 'invalid-event',
      message: 'mutated',
    })
    const second = extractSecEdgarEtfEvents(input)
    expect(second.events[0].title).toBe('NPORT-P \u2014 2026-04-30')
    expect(second.events[0].assetIdentity.ticker).toBe('VOO')
    expect(second.events[0].associationEvidence).toHaveLength(2)
    expect(second.events[0].provenance.rawFields.formRaw).toBe('NPORT-P')
    expect(second.duplicates).toEqual([])
    expect(second.conflicts).toEqual([])
    expect(second.rejectedFilings).toEqual([])
  })

  it('does not include execution metadata in the deterministic payload hash', () => {
    const first = extractSecEdgarEtfEvents(extractionInput()).events[0]
    const changed = extractionInput()
    changed.ingestedAt = '2026-07-18T12:00:00Z'
    changed.updatedAt = '2026-07-18T12:00:00Z'
    const second = extractSecEdgarEtfEvents(changed).events[0]
    expect(second.provenance.sourcePayloadHash).toBe(
      first.provenance.sourcePayloadHash
    )
  })

  it.each([
    ['accessionNumber', `${TEST_IDENTITIES[0].cik}-26-000002`],
    ['filingDate', '2026-05-29'],
    ['reportDate', '2026-05-01'],
    ['acceptanceDateTime', '2026-05-28T16:39:55.124Z'],
    ['act', 'OTHER'],
    ['form', 'N-CEN'],
    ['fileNumber', '811-99999'],
    ['filmNumber', '269999999'],
    ['items', 'ITEM'],
    ['coreType', 'N-CEN'],
    ['size', 12_346],
    ['isXbrl', 0],
    ['isInlineXbrl', 1],
    ['isXbrlNumeric', 1],
    ['primaryDocument', 'other.htm'],
    ['primaryDocDescription', 'OTHER DESCRIPTION'],
  ] as const)(
    'changes the payload hash when normalized field %s changes',
    (field, value) => {
      const baseline = extractSecEdgarEtfEvents(
        extractionInput([[createRecentFiling()], [], []])
      ).events[0].provenance.sourcePayloadHash
      const changedFiling = createRecentFiling({ [field]: value })
      const changed = extractSecEdgarEtfEvents(
        extractionInput([[changedFiling], [], []])
      ).events[0].provenance.sourcePayloadHash
      expect(changed).not.toBe(baseline)
    }
  )

  it('excludes sourceIndex and unrelated detail identities from the payload hash', () => {
    const filing = createRecentFiling()
    const baselineInput = extractionInput([[filing], [], []])
    const baseline =
      extractSecEdgarEtfEvents(baselineInput).events[0].provenance
        .sourcePayloadHash
    const changedInput = extractionInput([
      [{ ...filing, sourceIndex: 99 }],
      [],
      [],
    ])
    const detailUrl = buildSecEdgarFilingDetailUrl({
      accessionNumber: filing.accessionNumber,
    })
    const detail = changedInput.filingDetailsByUrl.get(detailUrl)
    if (!detail) throw new Error('Missing test detail')
    const details = new Map(changedInput.filingDetailsByUrl)
    details.set(detailUrl, {
      ...detail,
      series: [
        ...detail.series,
        {
          seriesId: 'S000000001',
          classes: [{ classContractId: 'C000000001' }],
        },
      ],
      seriesCount: detail.seriesCount + 1,
      classCount: detail.classCount + 1,
    })
    const changed = extractSecEdgarEtfEvents({
      ...changedInput,
      filingDetailsByUrl: details,
    }).events[0].provenance.sourcePayloadHash
    expect(changed).toBe(baseline)
  })

  it('rejects inconsistent explicit request counters', () => {
    expect(() =>
      extractSecEdgarEtfEvents({
        ...extractionInput(),
        requestCount: 5,
      })
    ).toThrow(/counters are inconsistent/)
  })

  it('accepts coherent zeroed metadata for pure offline extraction', () => {
    const result = extractSecEdgarEtfEvents({
      ...extractionInput(),
      requestCount: 0,
      submissionsRequestCount: 0,
      detailRequestCount: 0,
      cacheHitCount: 0,
    })
    expect(result.requestCount).toBe(0)
  })

  it('rejects structurally impossible detail and cache metadata', () => {
    expect(() =>
      extractSecEdgarEtfEvents({
        ...extractionInput(),
        requestCount: 5,
        detailRequestCount: 2,
        cacheHitCount: 1,
      })
    ).toThrow(/structurally inconsistent/)
  })

  it('rejects offline metadata above the runtime request limit', () => {
    expect(() =>
      extractSecEdgarEtfEvents({
        ...extractionInput(),
        requestCount: 1_001,
        submissionsRequestCount: 3,
        detailRequestCount: 998,
      })
    ).toThrow(/exceeds the request limit/)
  })

  it.each([
    ['2026-02-30', '2026-12-31'],
    ['1993-12-31', '2026-12-31'],
    ['2026-12-31', '2026-01-01'],
  ])('rejects invalid request range %s..%s', (fromDate, toDate) => {
    expect(() =>
      extractSecEdgarEtfEvents({ ...extractionInput(), fromDate, toDate })
    ).toThrow()
  })
})

describe('SEC EDGAR ETF fetch orchestration', () => {
  it('rejects invalid User-Agent before the first request without leaking it', async () => {
    const fetcher = vi.fn()
    await expect(
      fetchSecEdgarEtfEvents({
        fromDate: '2026-01-01',
        toDate: '2026-12-31',
        fetcher,
        userAgent: 'secret-without-contact',
        ingestedAt: INGESTED_AT,
        updatedAt: UPDATED_AT,
      })
    ).rejects.toThrow(/User-Agent/)
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('accepts the exact compact PapoDeFuturo project identity', async () => {
    const payloads = TEST_IDENTITIES.map((_, index) =>
      createSubmissionsJson(index, [])
    )
    let index = 0
    const fetcher = vi.fn(async () => response(payloads[index++]))
    vi.useFakeTimers()
    const promise = fetchSecEdgarEtfEvents({
      fromDate: '2026-01-01',
      toDate: '2026-12-31',
      fetcher,
      userAgent: 'PapoDeFuturo/1.0 contact@example.com',
      ingestedAt: INGESTED_AT,
      updatedAt: UPDATED_AT,
    })
    await vi.runAllTimersAsync()
    await expect(promise).resolves.toMatchObject({ requestCount: 3 })
    vi.useRealTimers()
  })

  it('performs the first request immediately and waits 500 ms before later unique calls', async () => {
    const payloads = TEST_IDENTITIES.map((_, index) =>
      createSubmissionsJson(index, [])
    )
    let index = 0
    const fetcher = vi.fn(async () => response(payloads[index++]))
    vi.useFakeTimers()
    const promise = fetchSecEdgarEtfEvents({
      fromDate: '2026-01-01',
      toDate: '2026-12-31',
      fetcher,
      userAgent: USER_AGENT,
      ingestedAt: INGESTED_AT,
      updatedAt: UPDATED_AT,
    })
    expect(fetcher).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(499)
    expect(fetcher).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1)
    expect(fetcher).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(500)
    expect(fetcher).toHaveBeenCalledTimes(3)
    await expect(promise).resolves.toMatchObject({
      requestCount: 3,
      submissionsRequestCount: 3,
      detailRequestCount: 0,
    })
    vi.useRealTimers()
  })

  it.each([
    '',
    ' Papo de Futuro contact@example.com',
    'Papo de Futuro without-contact',
    'Papo de Futuro contact@example.com\u0000',
    `Papo de Futuro contact@example.com\u0085`,
    `Papo de Futuro ${'x'.repeat(280)}@example.com`,
    'papodefuturo contact@example.com',
    'Papo Futuro contact@example.com',
    'NotPapoDeFuturo contact@example.com',
  ])('rejects invalid User-Agent %j before fetching', async (userAgent) => {
    const fetcher = vi.fn()
    await expect(
      fetchSecEdgarEtfEvents({
        fromDate: '2026-01-01',
        toDate: '2026-12-31',
        fetcher,
        userAgent,
        ingestedAt: INGESTED_AT,
        updatedAt: UPDATED_AT,
      })
    ).rejects.toThrow(/User-Agent/)
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('aborts historical coverage before any filing-detail request', async () => {
    const payloads = TEST_IDENTITIES.map((_, index) =>
      createSubmissionsJson(
        index,
        [
          createRecentFiling({
            accessionNumber: `${TEST_IDENTITIES[index].cik}-26-000001`,
          }),
        ],
        index === 1
          ? [
              {
                name: 'CIK0000734383-submissions-001.json',
                filingCount: 1,
                filingFrom: '2026-01-01',
                filingTo: '2026-06-30',
              },
            ]
          : []
      )
    )
    let index = 0
    const calls: string[] = []
    const fetcher = vi.fn(async (request: SecEdgarFetchRequestV1) => {
      calls.push(request.url)
      return response(payloads[index++])
    })
    vi.useFakeTimers()
    const promise = fetchSecEdgarEtfEvents({
      fromDate: '2026-01-01',
      toDate: '2026-12-31',
      fetcher,
      userAgent: USER_AGENT,
      ingestedAt: INGESTED_AT,
      updatedAt: UPDATED_AT,
    })
    const rejection = expect(promise).rejects.toThrow(
      'SEC EDGAR historical submissions are required but are not supported by this provider version'
    )
    await vi.runAllTimersAsync()
    await rejection
    expect(fetcher).toHaveBeenCalledTimes(3)
    expect(calls).toEqual(
      TEST_IDENTITIES.map((identity) =>
        buildSecEdgarSubmissionsUrl({ registrantCik: identity.cik })
      )
    )
    vi.useRealTimers()
  })

  it.each([
    ['2025-01-01', '2026-01-01'],
    ['2026-12-31', '2027-12-31'],
  ])(
    'treats historical overlap at inclusive boundary %s..%s as required',
    async (filingFrom, filingTo) => {
      const payloads = TEST_IDENTITIES.map((_, index) =>
        createSubmissionsJson(
          index,
          [],
          index === 1
            ? [
                {
                  name: 'CIK0000734383-submissions-001.json',
                  filingCount: 1,
                  filingFrom,
                  filingTo,
                },
              ]
            : []
        )
      )
      let index = 0
      const fetcher = vi.fn(async () => response(payloads[index++]))
      vi.useFakeTimers()
      const promise = fetchSecEdgarEtfEvents({
        fromDate: '2026-01-01',
        toDate: '2026-12-31',
        fetcher,
        userAgent: USER_AGENT,
        ingestedAt: INGESTED_AT,
        updatedAt: UPDATED_AT,
      })
      const rejection = expect(promise).rejects.toThrow(
        /historical submissions/
      )
      await vi.runAllTimersAsync()
      await rejection
      expect(fetcher).toHaveBeenCalledTimes(3)
      vi.useRealTimers()
    }
  )

  it('allows historical files fully outside the requested range', async () => {
    const payloads = TEST_IDENTITIES.map((_, index) =>
      createSubmissionsJson(
        index,
        [],
        [
          {
            name: `CIK${TEST_IDENTITIES[index].cik}-submissions-001.json`,
            filingCount: 1,
            filingFrom: '2020-01-01',
            filingTo: '2025-12-31',
          },
          {
            name: `CIK${TEST_IDENTITIES[index].cik}-submissions-002.json`,
            filingCount: 1,
            filingFrom: '2027-01-01',
            filingTo: '2027-12-31',
          },
        ]
      )
    )
    let index = 0
    const fetcher = vi.fn(async () => response(payloads[index++]))
    vi.useFakeTimers()
    const promise = fetchSecEdgarEtfEvents({
      fromDate: '2026-01-01',
      toDate: '2026-12-31',
      fetcher,
      userAgent: USER_AGENT,
      ingestedAt: INGESTED_AT,
      updatedAt: UPDATED_AT,
    })
    await vi.runAllTimersAsync()
    await expect(promise).resolves.toMatchObject({
      requestCount: 3,
      events: [],
    })
    expect(fetcher).toHaveBeenCalledTimes(3)
    vi.useRealTimers()
  })

  it('uses exact headers and globally canonical detail request order', async () => {
    const filings = [
      createRecentFiling({
        accessionNumber: `${TEST_IDENTITIES[0].cik}-26-000003`,
        acceptanceDateTime: '2026-05-28T18:00:00.000Z',
      }),
      createRecentFiling({
        accessionNumber: `${TEST_IDENTITIES[1].cik}-26-000002`,
        acceptanceDateTime: '2026-05-28T16:00:00.000Z',
      }),
      createRecentFiling({
        accessionNumber: `${TEST_IDENTITIES[2].cik}-26-000001`,
        acceptanceDateTime: '2026-05-28T17:00:00.000Z',
      }),
    ]
    const submissionsByUrl = new Map(
      TEST_IDENTITIES.map((identity, index) => [
        buildSecEdgarSubmissionsUrl({ registrantCik: identity.cik }),
        createSubmissionsJson(index, [filings[index]]),
      ])
    )
    const requests: Array<{
      url: string
      headers: Readonly<Record<string, string>>
    }> = []
    const fetcher = vi.fn(async (request: SecEdgarFetchRequestV1) => {
      requests.push({ url: request.url, headers: { ...request.headers } })
      const submissions = submissionsByUrl.get(request.url)
      if (submissions) return response(submissions)
      const index = filings.findIndex(
        (filing) =>
          buildSecEdgarFilingDetailUrl({
            accessionNumber: filing.accessionNumber,
          }) === request.url
      )
      return response(
        createFilingDetailHtml(
          filings[index].accessionNumber,
          TEST_IDENTITIES[index].seriesId,
          TEST_IDENTITIES[index].classContractId
        )
      )
    })
    vi.useFakeTimers()
    const promise = fetchSecEdgarEtfEvents({
      fromDate: '2026-01-01',
      toDate: '2026-12-31',
      fetcher,
      userAgent: USER_AGENT,
      ingestedAt: INGESTED_AT,
      updatedAt: UPDATED_AT,
    })
    await vi.runAllTimersAsync()
    await expect(promise).resolves.toMatchObject({ requestCount: 6 })
    expect(requests.map((request) => request.url)).toEqual([
      ...TEST_IDENTITIES.map((identity) =>
        buildSecEdgarSubmissionsUrl({ registrantCik: identity.cik })
      ),
      ...[filings[1], filings[2], filings[0]].map((filing) =>
        buildSecEdgarFilingDetailUrl({
          accessionNumber: filing.accessionNumber,
        })
      ),
    ])
    expect(requests.slice(0, 3).map((request) => request.headers)).toEqual(
      Array.from({ length: 3 }, () => ({
        Accept: 'application/json',
        'User-Agent': USER_AGENT,
      }))
    )
    expect(requests.slice(3).map((request) => request.headers)).toEqual(
      Array.from({ length: 3 }, () => ({
        Accept: 'text/html',
        'User-Agent': USER_AGENT,
      }))
    )
    vi.useRealTimers()
  })

  it('shares one detail request across all ETFs and keeps each identity distinct', async () => {
    const accessionNumber = `${TEST_IDENTITIES[0].cik}-26-000001`
    const payloads = TEST_IDENTITIES.map((_, index) =>
      createSubmissionsJson(index, [createRecentFiling({ accessionNumber })])
    )
    let submissionsIndex = 0
    const fetcher = vi.fn(async ({ url }: { url: string }) =>
      url.endsWith('.json')
        ? response(payloads[submissionsIndex++])
        : response(createSharedFilingDetailHtml(accessionNumber, [0, 1, 2]))
    )
    vi.useFakeTimers()
    const promise = fetchSecEdgarEtfEvents({
      fromDate: '2026-01-01',
      toDate: '2026-12-31',
      fetcher,
      userAgent: USER_AGENT,
      ingestedAt: INGESTED_AT,
      updatedAt: UPDATED_AT,
    })
    await vi.advanceTimersByTimeAsync(1_500)
    const result = await promise
    expect(result).toMatchObject({
      requestCount: 4,
      detailRequestCount: 1,
      cacheHitCount: 2,
      ignoredNonTargetIdentityFilings: 0,
    })
    expect(result.events.map((event) => event.assetIdentity.ticker)).toEqual([
      'VOO',
      'VNQ',
      'VEA',
    ])
    expect(new Set(result.events.map((event) => event.eventId)).size).toBe(3)
    expect(result.duplicates).toEqual([])
    expect(result.conflicts).toEqual([])
    expect(vi.getTimerCount()).toBe(0)
    vi.useRealTimers()
  })

  it('counts shared detail cache hits when only VOO is a target', async () => {
    const accessionNumber = `${TEST_IDENTITIES[0].cik}-26-000001`
    const payloads = TEST_IDENTITIES.map((_, index) =>
      createSubmissionsJson(index, [createRecentFiling({ accessionNumber })])
    )
    let submissionsIndex = 0
    const fetcher = vi.fn(async ({ url }: { url: string }) =>
      url.endsWith('.json')
        ? response(payloads[submissionsIndex++])
        : response(createFilingDetailHtml(accessionNumber))
    )
    vi.useFakeTimers()
    const promise = fetchSecEdgarEtfEvents({
      fromDate: '2026-01-01',
      toDate: '2026-12-31',
      fetcher,
      userAgent: USER_AGENT,
      ingestedAt: INGESTED_AT,
      updatedAt: UPDATED_AT,
    })
    await vi.runAllTimersAsync()
    const result = await promise
    expect(result.events.map((event) => event.assetIdentity.ticker)).toEqual([
      'VOO',
    ])
    expect(result.ignoredNonTargetIdentityFilings).toBe(2)
    expect(result.detailRequestCount).toBe(1)
    expect(result.cacheHitCount).toBe(2)
    vi.useRealTimers()
  })

  it('fetches sequentially, waits 500 ms, and reuses duplicate detail URLs', async () => {
    const duplicate = createRecentFiling({
      sourceIndex: 1,
      accessionNumber: `${TEST_IDENTITIES[0].cik}-26-000001`,
    })
    const submissions = [
      createSubmissionsJson(0, [
        createRecentFiling({
          accessionNumber: duplicate.accessionNumber,
        }),
        duplicate,
      ]),
      createSubmissionsJson(1, []),
      createSubmissionsJson(2, []),
    ]
    const calls: string[] = []
    const fetcher = vi.fn(async ({ url }: { url: string }) => {
      calls.push(url)
      if (url.endsWith('.json')) return response(submissions[calls.length - 1])
      return response(createFilingDetailHtml(duplicate.accessionNumber))
    })
    vi.useFakeTimers()
    const promise = fetchSecEdgarEtfEvents({
      fromDate: '2026-01-01',
      toDate: '2026-12-31',
      fetcher,
      userAgent: USER_AGENT,
      ingestedAt: INGESTED_AT,
      updatedAt: UPDATED_AT,
    })
    await vi.runAllTimersAsync()
    const result = await promise
    expect(result.requestCount).toBe(4)
    expect(result.cacheHitCount).toBe(1)
    expect(fetcher).toHaveBeenCalledTimes(4)
    expect(result.duplicates).toHaveLength(1)
    expect(vi.getTimerCount()).toBe(0)
    vi.useRealTimers()
  })

  it('allows exactly 1,000 unique requests', async () => {
    const fetcher = createHighVolumeFetcher(createManyFilings(997))
    vi.useFakeTimers()
    const promise = fetchSecEdgarEtfEvents({
      fromDate: '2026-01-01',
      toDate: '2026-12-31',
      fetcher,
      userAgent: USER_AGENT,
      ingestedAt: INGESTED_AT,
      updatedAt: UPDATED_AT,
    })
    await vi.runAllTimersAsync()
    const result = await promise
    expect(result.requestCount).toBe(1_000)
    expect(result.detailRequestCount).toBe(997)
    expect(result.events).toHaveLength(997)
    expect(fetcher).toHaveBeenCalledTimes(1_000)
    vi.useRealTimers()
  }, 20_000)

  it('rejects unique URL 1,001 before fetch or another delay', async () => {
    const fetcher = createHighVolumeFetcher(createManyFilings(998))
    vi.useFakeTimers()
    const promise = fetchSecEdgarEtfEvents({
      fromDate: '2026-01-01',
      toDate: '2026-12-31',
      fetcher,
      userAgent: USER_AGENT,
      ingestedAt: INGESTED_AT,
      updatedAt: UPDATED_AT,
    })
    const rejection = expect(promise).rejects.toThrow(
      /unique request limit exceeded/
    )
    await vi.runAllTimersAsync()
    await rejection
    expect(fetcher).toHaveBeenCalledTimes(1_000)
    expect(vi.getTimerCount()).toBe(0)
    vi.useRealTimers()
  }, 20_000)

  it('allows a cache hit after reaching 1,000 unique requests', async () => {
    const filings = createManyFilings(997)
    filings.push({ ...filings[0], sourceIndex: 997 })
    const fetcher = createHighVolumeFetcher(filings)
    vi.useFakeTimers()
    const promise = fetchSecEdgarEtfEvents({
      fromDate: '2026-01-01',
      toDate: '2026-12-31',
      fetcher,
      userAgent: USER_AGENT,
      ingestedAt: INGESTED_AT,
      updatedAt: UPDATED_AT,
    })
    await vi.runAllTimersAsync()
    const result = await promise
    expect(result.requestCount).toBe(1_000)
    expect(result.cacheHitCount).toBe(1)
    expect(result.exactDuplicateFilings).toBe(1)
    expect(fetcher).toHaveBeenCalledTimes(1_000)
    vi.useRealTimers()
  }, 20_000)

  it('rejects oversized declared content before reading its body', async () => {
    const arrayBuffer = vi.fn()
    const fetcher = vi.fn(async () => ({
      ok: true,
      status: 200,
      headers: { get: () => String(2 * 1024 * 1024 + 1) },
      arrayBuffer,
    }))
    await expect(
      fetchSecEdgarEtfEvents({
        fromDate: '2026-01-01',
        toDate: '2026-12-31',
        fetcher,
        userAgent: USER_AGENT,
        ingestedAt: INGESTED_AT,
        updatedAt: UPDATED_AT,
      })
    ).rejects.toThrow(/declared byte limit/)
    expect(arrayBuffer).not.toHaveBeenCalled()
  })

  it.each([null, '1'])(
    'rejects an oversized body with Content-Length %j',
    async (contentLength) => {
      const oversized = new Uint8Array(2 * 1024 * 1024 + 1)
      oversized.fill(0x20)
      const fetcher = vi.fn(async () => ({
        ok: true,
        status: 200,
        headers: { get: () => contentLength },
        arrayBuffer: async () => oversized.slice().buffer,
      }))
      await expect(
        fetchSecEdgarEtfEvents({
          fromDate: '2026-01-01',
          toDate: '2026-12-31',
          fetcher,
          userAgent: USER_AGENT,
          ingestedAt: INGESTED_AT,
          updatedAt: UPDATED_AT,
        })
      ).rejects.toThrow(/exceeds the byte limit/)
    }
  )

  it.each([403, 429, 500])(
    'aborts HTTP %i without retry or response content',
    async (status) => {
      const fetcher = vi.fn(async () => ({
        ok: false,
        status,
        headers: { get: () => null },
        arrayBuffer: async () => new ArrayBuffer(0),
      }))
      await expect(
        fetchSecEdgarEtfEvents({
          fromDate: '2026-01-01',
          toDate: '2026-12-31',
          fetcher,
          userAgent: USER_AGENT,
          ingestedAt: INGESTED_AT,
          updatedAt: UPDATED_AT,
        })
      ).rejects.toThrow(`HTTP ${status} for data.sec.gov`)
      expect(fetcher).toHaveBeenCalledTimes(1)
    }
  )

  it.each([
    '-1',
    '+1',
    '01',
    '1.5',
    '1e3',
    ' 1',
    'not-a-number',
    '9007199254740992',
  ])('rejects invalid Content-Length %j', async (contentLength) => {
    const fetcher = vi.fn(async () =>
      response(createSubmissionsJson(0, []), contentLength)
    )
    await expect(
      fetchSecEdgarEtfEvents({
        fromDate: '2026-01-01',
        toDate: '2026-12-31',
        fetcher,
        userAgent: USER_AGENT,
        ingestedAt: INGESTED_AT,
        updatedAt: UPDATED_AT,
      })
    ).rejects.toThrow(/Content-Length|declared byte limit/)
  })

  it('rejects an empty response body', async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      status: 200,
      headers: { get: () => null },
      arrayBuffer: async () => new ArrayBuffer(0),
    }))
    await expect(
      fetchSecEdgarEtfEvents({
        fromDate: '2026-01-01',
        toDate: '2026-12-31',
        fetcher,
        userAgent: USER_AGENT,
        ingestedAt: INGESTED_AT,
        updatedAt: UPDATED_AT,
      })
    ).rejects.toThrow(/body is empty/)
  })

  it('rejects a whitespace-only filing detail body', async () => {
    const payloads = [
      createSubmissionsJson(0),
      createSubmissionsJson(1, []),
      createSubmissionsJson(2, []),
    ]
    let index = 0
    const fetcher = vi.fn(async ({ url }: SecEdgarFetchRequestV1) =>
      url.endsWith('.json') ? response(payloads[index++]) : response(' \r\n\t ')
    )
    vi.useFakeTimers()
    const promise = fetchSecEdgarEtfEvents({
      fromDate: '2026-01-01',
      toDate: '2026-12-31',
      fetcher,
      userAgent: USER_AGENT,
      ingestedAt: INGESTED_AT,
      updatedAt: UPDATED_AT,
    })
    const rejection = expect(promise).rejects.toThrow(/only whitespace/)
    await vi.runAllTimersAsync()
    await rejection
    vi.useRealTimers()
  })

  it('rejects invalid UTF-8 without parsing a partial payload', async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      status: 200,
      headers: { get: () => null },
      arrayBuffer: async () => Uint8Array.from([0xc3, 0x28]).buffer,
    }))
    await expect(
      fetchSecEdgarEtfEvents({
        fromDate: '2026-01-01',
        toDate: '2026-12-31',
        fetcher,
        userAgent: USER_AGENT,
        ingestedAt: INGESTED_AT,
        updatedAt: UPDATED_AT,
      })
    ).rejects.toThrow(/valid UTF-8/)
  })

  it('accepts a single JSON BOM only at payload start', async () => {
    const payloads = TEST_IDENTITIES.map(
      (_, index) => `\ufeff${createSubmissionsJson(index, [])}`
    )
    let index = 0
    const fetcher = vi.fn(async () => response(payloads[index++]))
    vi.useFakeTimers()
    const promise = fetchSecEdgarEtfEvents({
      fromDate: '2026-01-01',
      toDate: '2026-12-31',
      fetcher,
      userAgent: USER_AGENT,
      ingestedAt: INGESTED_AT,
      updatedAt: UPDATED_AT,
    })
    await vi.runAllTimersAsync()
    await expect(promise).resolves.toMatchObject({
      events: [],
      requestCount: 3,
    })
    vi.useRealTimers()
  })

  it.each([
    ['BOM in the middle', `${createSubmissionsJson(0, [])}\ufeff`],
    ['trailing JSON garbage', `${createSubmissionsJson(0, [])}x`],
  ])('rejects submissions payload with %s', async (_label, firstPayload) => {
    const fetcher = vi.fn(async () => response(firstPayload))
    await expect(
      fetchSecEdgarEtfEvents({
        fromDate: '2026-01-01',
        toDate: '2026-12-31',
        fetcher,
        userAgent: USER_AGENT,
        ingestedAt: INGESTED_AT,
        updatedAt: UPDATED_AT,
      })
    ).rejects.toThrow()
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('does not expose User-Agent or contact in the result', async () => {
    const payloads = TEST_IDENTITIES.map((_, index) =>
      createSubmissionsJson(index, [])
    )
    let index = 0
    const fetcher = vi.fn(async () => response(payloads[index++]))
    vi.useFakeTimers()
    const promise = fetchSecEdgarEtfEvents({
      fromDate: '2026-01-01',
      toDate: '2026-12-31',
      fetcher,
      userAgent: USER_AGENT,
      ingestedAt: INGESTED_AT,
      updatedAt: UPDATED_AT,
    })
    await vi.runAllTimersAsync()
    const serialized = JSON.stringify(await promise)
    expect(serialized).not.toContain(USER_AGENT)
    expect(serialized).not.toContain('contact@example.com')
    vi.useRealTimers()
  })

  it('does not share response cache between executions', async () => {
    const payloads = TEST_IDENTITIES.map((_, index) =>
      createSubmissionsJson(index, [])
    )
    let callIndex = 0
    const fetcher = vi.fn(async () => response(payloads[callIndex++ % 3]))
    vi.useFakeTimers()
    const run = () =>
      fetchSecEdgarEtfEvents({
        fromDate: '2026-01-01',
        toDate: '2026-12-31',
        fetcher,
        userAgent: USER_AGENT,
        ingestedAt: INGESTED_AT,
        updatedAt: UPDATED_AT,
      })
    const first = run()
    await vi.runAllTimersAsync()
    expect((await first).requestCount).toBe(3)
    const second = run()
    await vi.runAllTimersAsync()
    expect((await second).requestCount).toBe(3)
    expect(fetcher).toHaveBeenCalledTimes(6)
    vi.useRealTimers()
  })
})
