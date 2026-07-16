import { describe, expect, it, vi } from 'vitest'
import { buildFundamentalFactsV1 } from '../../domain/fundamentals'
import type { Asset } from '../../domain/models'
import {
  buildSecPrimaryDocumentUrl,
  getSecInternationalEtf,
  parseNullableSecUsdMoney,
  SEC_INTERNATIONAL_ETFS,
  SEC_NPORT_XML_NAMESPACE,
  SEC_NPORT_XML_PATHS,
} from './sec/nport'
import { AUDITED_CLASS_IDS, AUDITED_FILINGS } from './sec/nport/testFixtures'
import type {
  SecInternationalEtfFundamentalRecord,
  SecInternationalEtfTicker,
} from './sec/nport/types'
import {
  createSupabaseInternationalEtfSnapshotRepository,
  createSupabaseInternationalEtfSnapshotStorage,
  mapInternationalEtfSnapshotRow,
  type InternationalEtfSnapshotRow,
  type InternationalEtfSnapshotSupabaseClient,
} from './supabaseInternationalEtfSnapshots'

const RAW_FACTS = {
  totalAssets: '1000.00',
  totalLiabilities: '-10.50',
  netAssets: '990.00',
} as const

function createRecord(
  ticker: SecInternationalEtfTicker = 'VOO',
  rawFacts: {
    totalAssets?: string | null
    totalLiabilities?: string | null
    netAssets?: string | null
  } = {}
): SecInternationalEtfFundamentalRecord {
  const fund = getSecInternationalEtf(ticker)
  const filing = AUDITED_FILINGS[ticker]!
  const totalAssetsRaw =
    rawFacts.totalAssets ??
    (rawFacts.totalAssets === null ? null : RAW_FACTS.totalAssets)
  const totalLiabilitiesRaw =
    rawFacts.totalLiabilities ??
    (rawFacts.totalLiabilities === null ? null : RAW_FACTS.totalLiabilities)
  const netAssetsRaw =
    rawFacts.netAssets ??
    (rawFacts.netAssets === null ? null : RAW_FACTS.netAssets)
  const totalAssets = parseNullableSecUsdMoney(totalAssetsRaw, 'total assets')
  const totalLiabilities = parseNullableSecUsdMoney(
    totalLiabilitiesRaw,
    'total liabilities'
  )
  const netAssets = parseNullableSecUsdMoney(netAssetsRaw, 'net assets')
  const sourceDocumentId = [
    'sec-nport',
    fund.registrantCik,
    fund.seriesId,
    fund.classId,
    filing.reportDate,
    filing.accessionNumber,
  ].join(':')

  return {
    ticker,
    fundIdentity: {
      registrantCik: fund.registrantCik,
      registrantName: fund.registrantName,
      seriesId: fund.seriesId,
      seriesName: fund.seriesName,
      classId: fund.classId,
      className: fund.className,
    },
    category: 'international-etf',
    market: 'US',
    kind: 'international-etf',
    referenceDate: filing.reportDate,
    period: 'monthly',
    source: 'sec-nport',
    sourceDocumentId,
    sourceArchive: filing.accessionNumber,
    filingVersion: null,
    exerciseOrder: null,
    facts: { totalAssets, totalLiabilities, netAssets },
    provenance: {
      dataset: 'SEC EDGAR Form N-PORT',
      factualScope: 'series',
      factualIdentity: {
        registrantCik: fund.registrantCik,
        registrantName: fund.registrantName,
        seriesId: fund.seriesId,
        seriesName: fund.seriesName,
        classIds: [...AUDITED_CLASS_IDS[ticker]],
      },
      productMapping: {
        ticker,
        expectedClassId: fund.classId,
        expectedClassName: fund.className,
        category: 'international-etf',
        market: 'US',
        currency: 'USD',
      },
      expectedClassPresent: true,
      form: filing.form,
      accessionNumber: filing.accessionNumber,
      filingDate: filing.filingDate,
      acceptedAt: filing.acceptedAt,
      reportDate: filing.reportDate,
      primaryDocument: filing.primaryDocument,
      documentUrl: buildSecPrimaryDocumentUrl(fund.registrantCik, filing),
      namespace: SEC_NPORT_XML_NAMESPACE,
      isAmendment: filing.form === 'NPORT-P/A',
      currency: 'USD',
      xmlPaths: { ...SEC_NPORT_XML_PATHS },
      facts: {
        totalAssets: {
          path: SEC_NPORT_XML_PATHS.totalAssets,
          rawValue: totalAssetsRaw,
          normalizedAmountInMinorUnits: totalAssets?.amountInMinorUnits ?? null,
          currency: 'USD',
        },
        totalLiabilities: {
          path: SEC_NPORT_XML_PATHS.totalLiabilities,
          rawValue: totalLiabilitiesRaw,
          normalizedAmountInMinorUnits:
            totalLiabilities?.amountInMinorUnits ?? null,
          currency: 'USD',
        },
        netAssets: {
          path: SEC_NPORT_XML_PATHS.netAssets,
          rawValue: netAssetsRaw,
          normalizedAmountInMinorUnits: netAssets?.amountInMinorUnits ?? null,
          currency: 'USD',
        },
      },
    },
  }
}

function createRow(
  record: SecInternationalEtfFundamentalRecord = createRecord()
): InternationalEtfSnapshotRow {
  return {
    id: 1,
    ticker: record.ticker,
    category: record.category,
    market: record.market,
    kind: record.kind,
    reference_date: record.referenceDate,
    period: record.period,
    source: record.source,
    source_document_id: record.sourceDocumentId,
    source_archive: record.sourceArchive,
    filing_version: null,
    exercise_order: null,
    currency: 'USD',
    total_assets_minor: record.facts.totalAssets?.amountInMinorUnits ?? null,
    total_liabilities_minor:
      record.facts.totalLiabilities?.amountInMinorUnits ?? null,
    net_assets_minor: record.facts.netAssets?.amountInMinorUnits ?? null,
    total_revenue_minor: null,
    net_income_minor: null,
    total_equity_minor: null,
    operating_cash_flow_minor: null,
    net_asset_value_minor: null,
    issued_shares_unscaled: null,
    issued_shares_scale: null,
    shareholder_count: null,
    provenance: record.provenance,
    created_at: '2026-07-16T21:00:00.000Z',
    updated_at: '2026-07-16T21:00:00.000Z',
  }
}

function createAsset(
  ticker: SecInternationalEtfTicker,
  id = `asset-${ticker.toLowerCase()}`
): Asset {
  return {
    id,
    ticker,
    name: ticker,
    category: 'international-etf',
    market: 'US',
    status: 'active',
  }
}

function asClient(value: object): InternationalEtfSnapshotSupabaseClient {
  return value as unknown as InternationalEtfSnapshotSupabaseClient
}

function createQueryClient(rows: InternationalEtfSnapshotRow[]) {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    in: vi.fn(),
    order: vi.fn(async () => ({ data: rows, error: null })),
  }
  query.select.mockReturnValue(query)
  query.eq.mockReturnValue(query)
  query.in.mockReturnValue(query)
  return {
    query,
    client: asClient({ from: vi.fn(() => query) }),
  }
}

describe('Supabase international ETF snapshot storage', () => {
  it.each(['VOO', 'VNQ', 'VEA'] as const)(
    'persists a complete official %s record',
    async (ticker) => {
      const upsert = vi.fn(async () => ({ error: null }))
      const storage = createSupabaseInternationalEtfSnapshotStorage(
        asClient({ from: vi.fn(() => ({ upsert })) })
      )

      await storage.upsertMany([createRecord(ticker)])

      expect(upsert).toHaveBeenCalledWith(
        [
          expect.objectContaining({
            ticker,
            kind: 'international-etf',
            currency: 'USD',
            filing_version: null,
            exercise_order: null,
            total_assets_minor: 100_000,
            total_liabilities_minor: -1_050,
            net_assets_minor: 99_000,
          }),
        ],
        {
          onConflict:
            'ticker,category,market,kind,period,source,reference_date,source_document_id',
        }
      )
    }
  )

  it('preserves three absent facts as null and nulls every incompatible column', async () => {
    const upsert = vi.fn(async () => ({ error: null }))
    const storage = createSupabaseInternationalEtfSnapshotStorage(
      asClient({ from: vi.fn(() => ({ upsert })) })
    )

    await storage.upsertMany([
      createRecord('VOO', {
        totalAssets: null,
        totalLiabilities: null,
        netAssets: null,
      }),
    ])

    expect(upsert).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          total_assets_minor: null,
          total_liabilities_minor: null,
          net_assets_minor: null,
          total_revenue_minor: null,
          net_income_minor: null,
          total_equity_minor: null,
          operating_cash_flow_minor: null,
          net_asset_value_minor: null,
          issued_shares_unscaled: null,
          issued_shares_scale: null,
          shareholder_count: null,
        }),
      ],
      expect.any(Object)
    )
  })

  it.each([
    ['totalAssets', -100, '-1.00'],
    ['totalLiabilities', -1_050, '-10.50'],
    ['netAssets', -200, '-2.00'],
  ] as const)('accepts signed safe %s', async (field, value, rawValue) => {
    const upsert = vi.fn(async () => ({ error: null }))
    const record = createRecord()
    record.facts[field] = { amountInMinorUnits: value, currency: 'USD' }
    record.provenance.facts[field].rawValue = rawValue
    record.provenance.facts[field].normalizedAmountInMinorUnits = value
    const storage = createSupabaseInternationalEtfSnapshotStorage(
      asClient({ from: vi.fn(() => ({ upsert })) })
    )

    await storage.upsertMany([record])
    expect(upsert).toHaveBeenCalledOnce()
  })

  it('does not call Supabase for an empty list', async () => {
    const from = vi.fn()
    const storage = createSupabaseInternationalEtfSnapshotStorage(
      asClient({ from })
    )
    await storage.upsertMany([])
    expect(from).not.toHaveBeenCalled()
  })

  it('preserves contextual upsert errors', async () => {
    const storage = createSupabaseInternationalEtfSnapshotStorage(
      asClient({
        from: vi.fn(() => ({
          upsert: vi.fn(async () => ({ error: { message: 'denied' } })),
        })),
      })
    )
    await expect(storage.upsertMany([createRecord()])).rejects.toThrow(
      'Failed to upsert international ETF fundamental snapshots: denied'
    )
  })

  it.each([
    ['sourceDocumentId', 'wrong'],
    ['sourceArchive', '0000036405-26-000999'],
  ] as const)('rejects divergent %s', async (field, value) => {
    const record = createRecord()
    record[field] = value
    const storage = createSupabaseInternationalEtfSnapshotStorage(
      asClient({ from: vi.fn(() => ({ upsert: vi.fn() })) })
    )
    await expect(storage.upsertMany([record])).rejects.toThrow()
  })

  it('rejects divergent official identity', async () => {
    const record = createRecord()
    record.fundIdentity.seriesId = 'S000000000'
    const storage = createSupabaseInternationalEtfSnapshotStorage(
      asClient({ from: vi.fn(() => ({ upsert: vi.fn() })) })
    )
    await expect(storage.upsertMany([record])).rejects.toThrow(
      'Invalid official SEC identity'
    )
  })

  it('rejects unsafe facts and BRL facts', async () => {
    const unsafe = createRecord()
    unsafe.facts.totalAssets!.amountInMinorUnits = Number.MAX_SAFE_INTEGER + 1
    const brl = createRecord()
    brl.facts.netAssets!.currency = 'BRL'
    const upsert = vi.fn()
    const storage = createSupabaseInternationalEtfSnapshotStorage(
      asClient({ from: vi.fn(() => ({ upsert })) })
    )
    await expect(storage.upsertMany([unsafe])).rejects.toThrow('safe minor')
    await expect(storage.upsertMany([brl])).rejects.toThrow('USD currency')
    expect(upsert).not.toHaveBeenCalled()
  })

  it('rejects non-null filingVersion', async () => {
    const record = createRecord()
    Reflect.set(record, 'filingVersion', 1)
    const storage = createSupabaseInternationalEtfSnapshotStorage(
      asClient({ from: vi.fn(() => ({ upsert: vi.fn() })) })
    )
    await expect(storage.upsertMany([record])).rejects.toThrow(
      'Invalid international ETF snapshot contract'
    )
  })
})

describe('International ETF snapshot row mapping and repository', () => {
  it('loads VOO, VNQ and VEA by the exact global identity', async () => {
    const tickers = ['VOO', 'VNQ', 'VEA'] as const
    const { query, client } = createQueryClient(
      tickers.map((ticker) => createRow(createRecord(ticker)))
    )
    const repository = createSupabaseInternationalEtfSnapshotRepository(client)

    const snapshots = await repository.listInternationalEtfSnapshots(
      tickers.map((ticker) => createAsset(ticker))
    )

    expect(snapshots.map((snapshot) => snapshot.assetId)).toEqual([
      'asset-voo',
      'asset-vnq',
      'asset-vea',
    ])
    expect(query.eq).toHaveBeenNthCalledWith(1, 'kind', 'international-etf')
    expect(query.eq).toHaveBeenNthCalledWith(2, 'category', 'international-etf')
    expect(query.eq).toHaveBeenNthCalledWith(3, 'market', 'US')
    expect(query.in).toHaveBeenCalledWith('ticker', tickers)
    expect(query.order).toHaveBeenCalledWith('reference_date', {
      ascending: false,
    })
  })

  it('queries only active US international ETFs', async () => {
    const { query, client } = createQueryClient([createRow()])
    const repository = createSupabaseInternationalEtfSnapshotRepository(client)
    await repository.listInternationalEtfSnapshots([
      createAsset('VOO'),
      { ...createAsset('VNQ'), status: 'inactive' },
      { ...createAsset('VEA'), market: 'BR' },
      { ...createAsset('VNQ'), category: 'brazilian-stock' },
    ])
    expect(query.in).toHaveBeenCalledWith('ticker', ['VOO'])
  })

  it('returns without querying when no asset is eligible', async () => {
    const from = vi.fn()
    const repository = createSupabaseInternationalEtfSnapshotRepository(
      asClient({ from })
    )
    await expect(
      repository.listInternationalEtfSnapshots([
        { ...createAsset('VOO'), status: 'inactive' },
      ])
    ).resolves.toEqual([])
    expect(from).not.toHaveBeenCalled()
  })

  it('rejects duplicate composite identities and unsupported tickers', async () => {
    const from = vi.fn()
    const repository = createSupabaseInternationalEtfSnapshotRepository(
      asClient({ from })
    )
    await expect(
      repository.listInternationalEtfSnapshots([
        createAsset('VOO', 'first'),
        { ...createAsset('VOO', 'second'), ticker: ' voo ' },
      ])
    ).rejects.toThrow('Duplicate international ETF identity')
    await expect(
      repository.listInternationalEtfSnapshots([
        { ...createAsset('VOO'), ticker: 'VT' },
      ])
    ).rejects.toThrow('Unsupported SEC international ETF ticker')
    expect(from).not.toHaveBeenCalled()
  })

  it.each([
    ['ticker', { ticker: 'VT' }],
    ['category', { category: 'brazilian-stock' }],
    ['market', { market: 'BR' }],
  ])(
    'rejects a persisted row without matching %s identity',
    async (_field, patch) => {
      const { client } = createQueryClient([{ ...createRow(), ...patch }])
      const repository =
        createSupabaseInternationalEtfSnapshotRepository(client)
      await expect(
        repository.listInternationalEtfSnapshots([createAsset('VOO')])
      ).rejects.toThrow('unknown international ETF identity')
    }
  )

  it.each([
    ['ticker', { ticker: ' voo ' }],
    ['kind', { kind: 'brazilian-stock' }],
    ['category', { category: 'real-estate-fund' }],
    ['market', { market: 'BR' }],
    ['source', { source: 'cvm-dfp' }],
    ['period', { period: 'annual' }],
    ['currency', { currency: 'BRL' }],
  ])('rejects invalid persisted %s', (_field, patch) => {
    expect(() =>
      mapInternationalEtfSnapshotRow({ ...createRow(), ...patch }, 'asset-voo')
    ).toThrow('Invalid persisted international ETF snapshot contract')
  })

  it('rejects non-null filing version and exercise order', () => {
    expect(() =>
      mapInternationalEtfSnapshotRow(
        { ...createRow(), filing_version: 1 },
        'asset-voo'
      )
    ).toThrow('must remain null')
    expect(() =>
      mapInternationalEtfSnapshotRow(
        { ...createRow(), exercise_order: 'CURRENT' },
        'asset-voo'
      )
    ).toThrow('must remain null')
  })

  it.each([
    'total_revenue_minor',
    'net_income_minor',
    'total_equity_minor',
    'operating_cash_flow_minor',
    'net_asset_value_minor',
    'issued_shares_unscaled',
    'issued_shares_scale',
    'shareholder_count',
  ] as const)('rejects populated incompatible column %s', (column) => {
    expect(() =>
      mapInternationalEtfSnapshotRow(
        { ...createRow(), [column]: 1 },
        'asset-voo'
      )
    ).toThrow('must remain null')
  })

  it.each([
    'total_assets_minor',
    'total_liabilities_minor',
    'net_assets_minor',
  ] as const)('rejects unsafe %s', (column) => {
    expect(() =>
      mapInternationalEtfSnapshotRow(
        { ...createRow(), [column]: Number.MAX_SAFE_INTEGER + 1 },
        'asset-voo'
      )
    ).toThrow('signed safe minor units')
  })

  it('preserves absent facts as null and round-trips complete facts', () => {
    const absent = mapInternationalEtfSnapshotRow(
      createRow(
        createRecord('VOO', {
          totalAssets: null,
          totalLiabilities: null,
          netAssets: null,
        })
      ),
      'asset-voo'
    )
    expect(absent.facts).toEqual({
      totalAssets: null,
      totalLiabilities: null,
      netAssets: null,
    })
    expect(mapInternationalEtfSnapshotRow(createRow(), 'asset-voo')).toEqual({
      assetId: 'asset-voo',
      kind: 'international-etf',
      referenceDate: '2026-03-31',
      period: 'monthly',
      source: 'sec-nport',
      sourceDocumentId:
        'sec-nport:0000036405:S000002839:C000092055:2026-03-31:0000036405-26-000325',
      facts: {
        totalAssets: { amountInMinorUnits: 100_000, currency: 'USD' },
        totalLiabilities: { amountInMinorUnits: -1_050, currency: 'USD' },
        netAssets: { amountInMinorUnits: 99_000, currency: 'USD' },
      },
    })
  })

  it('produces snapshots accepted by Fundamental Facts V1', () => {
    const assets = SEC_INTERNATIONAL_ETFS.map((fund) =>
      createAsset(fund.ticker)
    )
    const snapshots = SEC_INTERNATIONAL_ETFS.map((fund, index) =>
      mapInternationalEtfSnapshotRow(
        createRow(createRecord(fund.ticker)),
        assets[index]!.id
      )
    )
    expect(
      buildFundamentalFactsV1({
        generatedAt: '2026-07-16T21:00:00.000Z',
        assets,
        snapshots,
      }).dataCoverage.internationalEtfSnapshotCount
    ).toBe(3)
  })
})

describe('International ETF persisted provenance', () => {
  it.each([
    '2026-05-28T16:39:55Z',
    '2026-05-28T16:39:55.1Z',
    '2026-05-28T16:39:55.123Z',
    '2026-05-28T16:39:55.123456Z',
    '2026-05-28T16:39:55.123456789Z',
  ])('accepts valid SEC UTC timestamp %s', (acceptedAt) => {
    const record = createRecord()
    record.provenance.acceptedAt = acceptedAt

    expect(() =>
      mapInternationalEtfSnapshotRow(createRow(record), 'asset-voo')
    ).not.toThrow()
  })

  it.each([
    '2026-05-28T16:39:55.1234567890Z',
    '2026-05-28T16:39:55.Z',
    '2026-05-28T16:39:55-03:00',
    '2026-02-30T16:39:55Z',
    '2026-05-28T24:00:00Z',
    '2026-05-28T16:60:00Z',
    '2026-05-28T16:39:60Z',
    '2026-05-28 16:39:55Z',
  ])('rejects invalid SEC UTC timestamp %s', (acceptedAt) => {
    const record = createRecord()
    record.provenance.acceptedAt = acceptedAt

    expect(() =>
      mapInternationalEtfSnapshotRow(createRow(record), 'asset-voo')
    ).toThrow('does not match filing identity')
  })

  it('stores a six-digit timestamp without changing its provenance text', async () => {
    const acceptedAt = '2026-05-28T16:39:55.123456Z'
    const record = createRecord()
    record.provenance.acceptedAt = acceptedAt
    const upsert = vi.fn(async () => ({ error: null }))
    const storage = createSupabaseInternationalEtfSnapshotStorage(
      asClient({ from: vi.fn(() => ({ upsert })) })
    )

    await storage.upsertMany([record])

    expect(upsert).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          provenance: expect.objectContaining({ acceptedAt }),
        }),
      ],
      expect.any(Object)
    )
  })

  it('maps a persisted row with a nine-digit timestamp', () => {
    const record = createRecord()
    record.provenance.acceptedAt = '2026-05-28T16:39:55.123456789Z'

    expect(
      mapInternationalEtfSnapshotRow(createRow(record), 'asset-voo')
    ).toMatchObject({ assetId: 'asset-voo', kind: 'international-etf' })
  })

  it.each([
    [
      'dataset',
      (record: SecInternationalEtfFundamentalRecord) =>
        Reflect.set(record.provenance, 'dataset', 'wrong'),
    ],
    [
      'factualScope',
      (record: SecInternationalEtfFundamentalRecord) =>
        Reflect.set(record.provenance, 'factualScope', 'class'),
    ],
    [
      'registrant CIK',
      (record: SecInternationalEtfFundamentalRecord) => {
        record.provenance.factualIdentity.registrantCik = '0000000000'
      },
    ],
    [
      'registrant name',
      (record: SecInternationalEtfFundamentalRecord) => {
        record.provenance.factualIdentity.registrantName = 'OTHER'
      },
    ],
    [
      'series ID',
      (record: SecInternationalEtfFundamentalRecord) => {
        record.provenance.factualIdentity.seriesId = 'S000000000'
      },
    ],
    [
      'series name',
      (record: SecInternationalEtfFundamentalRecord) => {
        record.provenance.factualIdentity.seriesName = 'Other'
      },
    ],
  ] as const)('rejects invalid %s provenance', (_field, mutate) => {
    const record = createRecord()
    mutate(record)
    expect(() =>
      mapInternationalEtfSnapshotRow(createRow(record), 'asset-voo')
    ).toThrow()
  })

  it.each([
    ['empty', []],
    ['invalid', ['INVALID']],
    ['duplicate', ['C000092055', 'C000092055']],
    ['missing expected', ['C000007773']],
  ] as const)('rejects %s class IDs', (_case, classIds) => {
    const record = createRecord()
    record.provenance.factualIdentity.classIds = [...classIds]
    expect(() =>
      mapInternationalEtfSnapshotRow(createRow(record), 'asset-voo')
    ).toThrow()
  })

  it.each([
    ['ticker', 'VNQ'],
    ['expectedClassId', 'C000000000'],
    ['expectedClassName', 'Other'],
    ['category', 'brazilian-stock'],
    ['market', 'BR'],
    ['currency', 'BRL'],
  ] as const)('rejects divergent product mapping %s', (field, value) => {
    const record = createRecord()
    Reflect.set(record.provenance.productMapping, field, value)
    expect(() =>
      mapInternationalEtfSnapshotRow(createRow(record), 'asset-voo')
    ).toThrow()
  })

  it('rejects false expectedClassPresent', () => {
    const record = createRecord()
    Reflect.set(record.provenance, 'expectedClassPresent', false)
    expect(() =>
      mapInternationalEtfSnapshotRow(createRow(record), 'asset-voo')
    ).toThrow()
  })

  it.each([
    [
      'form',
      (record: SecInternationalEtfFundamentalRecord) =>
        Reflect.set(record.provenance, 'form', '10-K'),
    ],
    [
      'amendment',
      (record: SecInternationalEtfFundamentalRecord) => {
        record.provenance.isAmendment = true
      },
    ],
    [
      'accession format',
      (record: SecInternationalEtfFundamentalRecord) => {
        record.provenance.accessionNumber = 'invalid'
      },
    ],
    [
      'accession identity',
      (record: SecInternationalEtfFundamentalRecord) => {
        record.provenance.accessionNumber = '0000036405-26-000999'
      },
    ],
    [
      'filing date',
      (record: SecInternationalEtfFundamentalRecord) => {
        record.provenance.filingDate = '2026-02-30'
      },
    ],
    [
      'acceptedAt',
      (record: SecInternationalEtfFundamentalRecord) => {
        record.provenance.acceptedAt = '2026-05-28T16:39:55-03:00'
      },
    ],
    [
      'report date',
      (record: SecInternationalEtfFundamentalRecord) => {
        record.provenance.reportDate = '2026-02-28'
      },
    ],
    [
      'primary document',
      (record: SecInternationalEtfFundamentalRecord) => {
        record.provenance.primaryDocument = '../file.xml'
      },
    ],
    [
      'document host',
      (record: SecInternationalEtfFundamentalRecord) => {
        record.provenance.documentUrl = record.provenance.documentUrl.replace(
          'www.sec.gov',
          'example.com'
        )
      },
    ],
    [
      'document path',
      (record: SecInternationalEtfFundamentalRecord) => {
        record.provenance.documentUrl = record.provenance.documentUrl.replace(
          '/Archives/edgar/data/',
          '/wrong/'
        )
      },
    ],
    [
      'namespace',
      (record: SecInternationalEtfFundamentalRecord) => {
        record.provenance.namespace = 'https://example.com'
      },
    ],
  ] as const)('rejects invalid %s provenance', (_field, mutate) => {
    const record = createRecord()
    mutate(record)
    expect(() =>
      mapInternationalEtfSnapshotRow(createRow(record), 'asset-voo')
    ).toThrow()
  })

  it('rejects missing and divergent XML paths', () => {
    const missing = createRecord()
    Reflect.deleteProperty(missing.provenance.xmlPaths, 'netAssets')
    const divergent = createRecord()
    divergent.provenance.xmlPaths = {
      ...SEC_NPORT_XML_PATHS,
      totalAssets: '/wrong',
    }
    expect(() =>
      mapInternationalEtfSnapshotRow(createRow(missing), 'asset-voo')
    ).toThrow('XML paths')
    expect(() =>
      mapInternationalEtfSnapshotRow(createRow(divergent), 'asset-voo')
    ).toThrow('XML path')
  })

  it.each([
    [
      'raw value',
      (record: SecInternationalEtfFundamentalRecord) => {
        record.provenance.facts.totalAssets.rawValue = '2.00'
      },
    ],
    [
      'normalized amount',
      (record: SecInternationalEtfFundamentalRecord) => {
        record.provenance.facts.totalAssets.normalizedAmountInMinorUnits = 200
      },
    ],
    [
      'fact currency',
      (record: SecInternationalEtfFundamentalRecord) =>
        Reflect.set(record.provenance.facts.totalAssets, 'currency', 'BRL'),
    ],
  ] as const)('rejects incompatible %s provenance', (_field, mutate) => {
    const record = createRecord()
    mutate(record)
    expect(() =>
      mapInternationalEtfSnapshotRow(createRow(record), 'asset-voo')
    ).toThrow()
  })
})
