import { describe, expect, it, vi } from 'vitest'
import type { Asset } from '../../domain/models'
import {
  getCvmRealEstateFund,
  parseNullableCvmFiiExactDecimalQuantity,
  parseNullableCvmFiiMoney,
  parseNullableCvmFiiNonNegativeInteger,
} from './cvm/fii'
import type {
  CvmRealEstateFundFundamentalRecord,
  CvmRealEstateFundTicker,
} from './cvm/fii/types'
import { mapFundamentalSnapshotRow } from './supabaseFundamentalSnapshots'
import {
  createSupabaseRealEstateFundSnapshotRepository,
  createSupabaseRealEstateFundSnapshotStorage,
  mapRealEstateFundSnapshotRow,
  type RealEstateFundSnapshotRow,
  type RealEstateFundSnapshotSupabaseClient,
} from './supabaseRealEstateFundSnapshots'

const SHARES: Record<CvmRealEstateFundTicker, string> = {
  KNRI11: '28204047',
  VISC11: '28828640.0000073',
  XPLG11: '51390097.8938388',
  HGRU11: '23238024',
}

function rawField(column: string, rawValue: string) {
  return {
    fileName: 'inf_mensal_fii_2026.csv',
    column,
    rawValue,
  }
}

function createRecord(
  ticker: CvmRealEstateFundTicker = 'KNRI11',
  input: {
    netAssetValue?: string
    issuedShares?: string
    shareholderCount?: string
  } = {}
): CvmRealEstateFundFundamentalRecord {
  const fund = getCvmRealEstateFund(ticker)
  const archiveId = 'inf_mensal_fii_2026.zip'
  const referenceDate = '2026-05-01'
  const filingVersion = 2
  const netAssetValueRaw = input.netAssetValue ?? '1000000000.25'
  const issuedSharesRaw = input.issuedShares ?? SHARES[ticker]
  const shareholderCountRaw = input.shareholderCount ?? '100000'
  const netAssetValue = parseNullableCvmFiiMoney(
    netAssetValueRaw,
    'net asset value'
  )
  const issuedShares = parseNullableCvmFiiExactDecimalQuantity(
    issuedSharesRaw,
    'issued shares'
  )
  const shareholderCount = parseNullableCvmFiiNonNegativeInteger(
    shareholderCountRaw,
    'shareholder count'
  )

  return {
    ticker,
    fundIdentity: {
      officialName: fund.officialName,
      cnpj: fund.cnpj,
      isin: fund.isin,
    },
    category: 'real-estate-fund',
    market: 'BR',
    kind: 'real-estate-fund',
    referenceDate,
    period: 'monthly',
    source: 'cvm-fii-inf-mensal',
    sourceDocumentId: [
      'cvm-fii-inf-mensal',
      archiveId,
      fund.cnpj.replace(/\D/g, ''),
      referenceDate,
      `v${filingVersion}`,
    ].join(':'),
    sourceArchive: archiveId,
    filingVersion,
    exerciseOrder: null,
    facts: { netAssetValue, issuedShares, shareholderCount },
    provenance: {
      dataset: 'FII: Documentos: Informe Mensal Estruturado',
      archiveId,
      identity: {
        cnpj: rawField('CNPJ_Fundo_Classe', fund.cnpj),
        officialName: rawField('Nome_Fundo_Classe', fund.officialName),
        isin: rawField('Codigo_ISIN', fund.isin),
        complementCnpj: rawField('CNPJ_Fundo_Classe', fund.cnpj),
      },
      referenceDate: rawField('Data_Referencia', referenceDate),
      version: rawField('Versao', String(filingVersion)),
      netAssetValue: rawField('Patrimonio_Liquido', netAssetValueRaw),
      issuedShares: {
        ...rawField('Cotas_Emitidas', issuedSharesRaw),
        normalizedValue: issuedSharesRaw || null,
        unscaledValue: issuedShares?.unscaledValue ?? null,
        scale: issuedShares?.scale ?? null,
        referenceDate,
        filingVersion,
        archiveId,
      },
      shareholderCount: rawField('Total_Numero_Cotistas', shareholderCountRaw),
    },
  }
}

function createRow(
  ticker: CvmRealEstateFundTicker = 'KNRI11',
  input: {
    netAssetValue?: string
    issuedShares?: string
    shareholderCount?: string
  } = {}
): RealEstateFundSnapshotRow {
  const record = createRecord(ticker, input)
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
    filing_version: record.filingVersion,
    exercise_order: null,
    currency: 'BRL',
    net_asset_value_minor:
      record.facts.netAssetValue?.amountInMinorUnits ?? null,
    issued_shares_unscaled: record.facts.issuedShares?.unscaledValue ?? null,
    issued_shares_scale: record.facts.issuedShares?.scale ?? null,
    shareholder_count: record.facts.shareholderCount,
    total_revenue_minor: null,
    net_income_minor: null,
    total_assets_minor: null,
    total_equity_minor: null,
    operating_cash_flow_minor: null,
    provenance: {
      dataset: record.provenance.dataset,
      archiveId: record.provenance.archiveId,
      identity: {
        cnpj: record.provenance.identity.cnpj,
        officialName: record.provenance.identity.officialName,
        isin: record.provenance.identity.isin,
        complementCnpj: record.provenance.identity.complementCnpj,
      },
      referenceDate: record.provenance.referenceDate,
      version: record.provenance.version,
      netAssetValue: record.provenance.netAssetValue,
      issuedShares: record.provenance.issuedShares,
      shareholderCount: record.provenance.shareholderCount,
    },
    created_at: '2026-07-16T12:00:00.000Z',
    updated_at: '2026-07-16T12:00:00.000Z',
  }
}

function createAsset(
  ticker: CvmRealEstateFundTicker,
  id = `asset-${ticker.toLowerCase()}`
): Asset {
  return {
    id,
    ticker,
    name: ticker,
    category: 'real-estate-fund',
    market: 'BR',
    status: 'active',
  }
}

function asClient(value: object): RealEstateFundSnapshotSupabaseClient {
  return value as unknown as RealEstateFundSnapshotSupabaseClient
}

function createQueryClient(rows: RealEstateFundSnapshotRow[]) {
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

describe('Supabase FII fundamental snapshot storage', () => {
  it('maps a complete record and uses the complete logical conflict identity', async () => {
    const upsert = vi.fn(async () => ({ error: null }))
    const storage = createSupabaseRealEstateFundSnapshotStorage(
      asClient({ from: vi.fn(() => ({ upsert })) })
    )

    await storage.upsertMany([createRecord('KNRI11')])

    expect(upsert).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          ticker: 'KNRI11',
          kind: 'real-estate-fund',
          net_asset_value_minor: 100_000_000_025,
          issued_shares_unscaled: 28_204_047,
          issued_shares_scale: 0,
          shareholder_count: 100_000,
        }),
      ],
      {
        onConflict:
          'ticker,category,market,kind,period,source,reference_date,source_document_id',
      }
    )
  })

  it.each([
    ['VISC11', 288_286_400_000_073],
    ['XPLG11', 513_900_978_938_388],
  ] as const)(
    'persists exact fractional shares for %s',
    async (ticker, value) => {
      const upsert = vi.fn(async () => ({ error: null }))
      const storage = createSupabaseRealEstateFundSnapshotStorage(
        asClient({ from: vi.fn(() => ({ upsert })) })
      )

      await storage.upsertMany([createRecord(ticker)])

      expect(upsert).toHaveBeenCalledWith(
        [
          expect.objectContaining({
            issued_shares_unscaled: value,
            issued_shares_scale: 7,
          }),
        ],
        expect.any(Object)
      )
    }
  )

  it('keeps absent FII facts and every stock column null', async () => {
    const upsert = vi.fn(async () => ({ error: null }))
    const storage = createSupabaseRealEstateFundSnapshotStorage(
      asClient({ from: vi.fn(() => ({ upsert })) })
    )

    await storage.upsertMany([
      createRecord('KNRI11', {
        netAssetValue: '',
        issuedShares: '',
        shareholderCount: '',
      }),
    ])

    expect(upsert).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          net_asset_value_minor: null,
          issued_shares_unscaled: null,
          issued_shares_scale: null,
          shareholder_count: null,
          total_revenue_minor: null,
          net_income_minor: null,
          total_assets_minor: null,
          total_equity_minor: null,
          operating_cash_flow_minor: null,
        }),
      ],
      expect.any(Object)
    )
  })

  it('does not call Supabase for an empty record list', async () => {
    const from = vi.fn()
    const storage = createSupabaseRealEstateFundSnapshotStorage(
      asClient({ from })
    )

    await storage.upsertMany([])

    expect(from).not.toHaveBeenCalled()
  })

  it('preserves contextual Supabase upsert errors', async () => {
    const storage = createSupabaseRealEstateFundSnapshotStorage(
      asClient({
        from: vi.fn(() => ({
          upsert: vi.fn(async () => ({ error: { message: 'denied' } })),
        })),
      })
    )

    await expect(storage.upsertMany([createRecord()])).rejects.toThrow(
      'Failed to upsert real estate fund fundamental snapshots: denied'
    )
  })

  it.each([0, Number.MAX_SAFE_INTEGER + 1])(
    'rejects invalid filing version %s before upsert',
    async (version) => {
      const upsert = vi.fn()
      const record = createRecord()
      record.filingVersion = version
      const storage = createSupabaseRealEstateFundSnapshotStorage(
        asClient({ from: vi.fn(() => ({ upsert })) })
      )

      await expect(storage.upsertMany([record])).rejects.toThrow(
        'FII filing version must be a positive safe integer'
      )
      expect(upsert).not.toHaveBeenCalled()
    }
  )

  it('rejects invalid write facts and non-null exercise order', async () => {
    const upsert = vi.fn()
    const unsafeMoney = createRecord()
    unsafeMoney.facts.netAssetValue!.amountInMinorUnits =
      Number.MAX_SAFE_INTEGER + 1
    const wrongCurrency = createRecord()
    wrongCurrency.facts.netAssetValue!.currency = 'USD'
    const negativeShareholders = createRecord()
    negativeShareholders.facts.shareholderCount = -1
    const exerciseOrder = createRecord()
    Reflect.set(exerciseOrder, 'exerciseOrder', 'ULTIMO')
    const stockFacts = createRecord()
    Reflect.set(stockFacts.facts, 'netIncome', null)
    const storage = createSupabaseRealEstateFundSnapshotStorage(
      asClient({ from: vi.fn(() => ({ upsert })) })
    )

    await expect(storage.upsertMany([unsafeMoney])).rejects.toThrow(
      'signed safe minor units'
    )
    await expect(storage.upsertMany([wrongCurrency])).rejects.toThrow(
      'must use BRL currency'
    )
    await expect(storage.upsertMany([negativeShareholders])).rejects.toThrow(
      'non-negative safe integer'
    )
    await expect(storage.upsertMany([exerciseOrder])).rejects.toThrow(
      'Invalid FII snapshot contract'
    )
    await expect(storage.upsertMany([stockFacts])).rejects.toThrow(
      'Brazilian stock facts must be absent'
    )
    expect(upsert).not.toHaveBeenCalled()
  })

  it('rejects non-normalized shares and divergent official provenance', async () => {
    const upsert = vi.fn()
    const shares = createRecord()
    shares.facts.issuedShares = { unscaledValue: 100, scale: 1 }
    const provenance = createRecord()
    provenance.provenance.referenceDate.rawValue = '2026-04-01'
    const identity = createRecord()
    identity.provenance.identity.isin.rawValue = 'BRINVALID000'
    const storage = createSupabaseRealEstateFundSnapshotStorage(
      asClient({ from: vi.fn(() => ({ upsert })) })
    )

    await expect(storage.upsertMany([shares])).rejects.toThrow(
      'must use normalized coefficient and scale'
    )
    await expect(storage.upsertMany([provenance])).rejects.toThrow(
      'does not match filing identity'
    )
    await expect(storage.upsertMany([identity])).rejects.toThrow(
      'invalid official identity'
    )
    expect(upsert).not.toHaveBeenCalled()
  })
})

describe('FII snapshot row mapping', () => {
  it('round-trips complete facts without converting or rounding values', () => {
    const snapshot = mapRealEstateFundSnapshotRow(
      createRow('VISC11'),
      'asset-visc11'
    )

    expect(snapshot).toMatchObject({
      assetId: 'asset-visc11',
      kind: 'real-estate-fund',
      facts: {
        netAssetValue: {
          amountInMinorUnits: 100_000_000_025,
          currency: 'BRL',
        },
        issuedShares: {
          unscaledValue: 288_286_400_000_073,
          scale: 7,
        },
        shareholderCount: 100_000,
      },
    })
  })

  it('keeps all absent persisted facts null', () => {
    const snapshot = mapRealEstateFundSnapshotRow(
      createRow('KNRI11', {
        netAssetValue: '',
        issuedShares: '',
        shareholderCount: '',
      }),
      'asset-knri11'
    )

    expect(snapshot.facts).toEqual({
      netAssetValue: null,
      issuedShares: null,
      shareholderCount: null,
    })
  })

  it.each([
    ['kind', { kind: 'brazilian-stock' }],
    ['category', { category: 'brazilian-stock' }],
    ['market', { market: 'US' }],
    ['source', { source: 'cvm-dfp' }],
    ['period', { period: 'annual' }],
    ['currency', { currency: 'USD' }],
  ])('rejects an invalid persisted %s', (_field, patch) => {
    expect(() =>
      mapRealEstateFundSnapshotRow({ ...createRow(), ...patch }, 'asset-knri11')
    ).toThrow('Invalid persisted FII snapshot contract')
  })

  it('rejects non-null exercise order and invalid filing versions', () => {
    expect(() =>
      mapRealEstateFundSnapshotRow(
        { ...createRow(), exercise_order: 'ULTIMO' },
        'asset-knri11'
      )
    ).toThrow('FII exercise order must be null')
    expect(() =>
      mapRealEstateFundSnapshotRow(
        { ...createRow(), filing_version: 0 },
        'asset-knri11'
      )
    ).toThrow('positive safe integer')
  })

  it.each([
    ['total_revenue_minor', { total_revenue_minor: 1 }],
    ['net_income_minor', { net_income_minor: 1 }],
    ['total_assets_minor', { total_assets_minor: 1 }],
    ['total_equity_minor', { total_equity_minor: 1 }],
    ['operating_cash_flow_minor', { operating_cash_flow_minor: 1 }],
  ])('rejects a populated stock column %s', (_column, patch) => {
    expect(() =>
      mapRealEstateFundSnapshotRow({ ...createRow(), ...patch }, 'asset-knri11')
    ).toThrow('Brazilian stock columns must remain null')
  })

  it('rejects incomplete and invalid issued share pairs', () => {
    expect(() =>
      mapRealEstateFundSnapshotRow(
        { ...createRow(), issued_shares_scale: null },
        'asset-knri11'
      )
    ).toThrow('must be stored together')
    expect(() =>
      mapRealEstateFundSnapshotRow(
        { ...createRow(), issued_shares_unscaled: -1 },
        'asset-knri11'
      )
    ).toThrow('coefficient must be non-negative')
    expect(() =>
      mapRealEstateFundSnapshotRow(
        { ...createRow(), issued_shares_scale: -1 },
        'asset-knri11'
      )
    ).toThrow('scale must be a non-negative small integer')
    expect(() =>
      mapRealEstateFundSnapshotRow(
        { ...createRow(), issued_shares_scale: 32_768 },
        'asset-knri11'
      )
    ).toThrow('scale must be a non-negative small integer')
  })

  it('rejects unsafe bigint values and negative shareholder count', () => {
    expect(() =>
      mapRealEstateFundSnapshotRow(
        { ...createRow(), net_asset_value_minor: Number.MAX_SAFE_INTEGER + 1 },
        'asset-knri11'
      )
    ).toThrow('signed safe minor units')
    expect(() =>
      mapRealEstateFundSnapshotRow(
        { ...createRow(), issued_shares_unscaled: Number.MAX_SAFE_INTEGER + 1 },
        'asset-knri11'
      )
    ).toThrow('safe integer coefficient')
    expect(() =>
      mapRealEstateFundSnapshotRow(
        { ...createRow(), shareholder_count: -1 },
        'asset-knri11'
      )
    ).toThrow('non-negative safe integer')
  })

  it('rejects missing, malformed and divergent provenance', () => {
    expect(() =>
      mapRealEstateFundSnapshotRow(
        { ...createRow(), provenance: null },
        'asset-knri11'
      )
    ).toThrow('Invalid real estate fund snapshot provenance')
    expect(() =>
      mapRealEstateFundSnapshotRow(
        { ...createRow(), provenance: { dataset: 'wrong' } },
        'asset-knri11'
      )
    ).toThrow('Invalid real estate fund snapshot provenance')

    const row = createRow()
    const provenance = row.provenance
    if (
      !provenance ||
      Array.isArray(provenance) ||
      typeof provenance !== 'object'
    ) {
      throw new Error('Expected object provenance fixture')
    }
    provenance.archiveId = 'different.zip'
    expect(() => mapRealEstateFundSnapshotRow(row, 'asset-knri11')).toThrow(
      'does not match filing identity'
    )

    const wrongColumn = createRow()
    const wrongColumnProvenance = wrongColumn.provenance
    if (
      !wrongColumnProvenance ||
      Array.isArray(wrongColumnProvenance) ||
      typeof wrongColumnProvenance !== 'object' ||
      !wrongColumnProvenance.netAssetValue ||
      Array.isArray(wrongColumnProvenance.netAssetValue) ||
      typeof wrongColumnProvenance.netAssetValue !== 'object'
    ) {
      throw new Error('Expected netAssetValue provenance fixture')
    }
    wrongColumnProvenance.netAssetValue.column = 'Outra_Coluna'
    expect(() =>
      mapRealEstateFundSnapshotRow(wrongColumn, 'asset-knri11')
    ).toThrow('does not match official fields')
  })
})

describe('Supabase FII fundamental snapshot repository', () => {
  it('loads the four funds and filters by kind, category, market and tickers', async () => {
    const tickers = ['KNRI11', 'VISC11', 'XPLG11', 'HGRU11'] as const
    const { query, client } = createQueryClient(
      tickers.map((ticker) => createRow(ticker))
    )
    const repository = createSupabaseRealEstateFundSnapshotRepository(client)

    const snapshots = await repository.listRealEstateFundSnapshots(
      tickers.map((ticker) => createAsset(ticker))
    )

    expect(snapshots.map((snapshot) => snapshot.assetId)).toEqual([
      'asset-knri11',
      'asset-visc11',
      'asset-xplg11',
      'asset-hgru11',
    ])
    expect(query.eq).toHaveBeenNthCalledWith(1, 'kind', 'real-estate-fund')
    expect(query.eq).toHaveBeenNthCalledWith(2, 'category', 'real-estate-fund')
    expect(query.eq).toHaveBeenNthCalledWith(3, 'market', 'BR')
    expect(query.in).toHaveBeenCalledWith('ticker', tickers)
    expect(query.order).toHaveBeenCalledWith('reference_date', {
      ascending: false,
    })
  })

  it('queries only active BR real estate funds', async () => {
    const { query, client } = createQueryClient([createRow('KNRI11')])
    const repository = createSupabaseRealEstateFundSnapshotRepository(client)

    await repository.listRealEstateFundSnapshots([
      createAsset('KNRI11'),
      { ...createAsset('VISC11'), status: 'inactive' },
      { ...createAsset('XPLG11'), market: 'US' },
      { ...createAsset('HGRU11'), category: 'brazilian-stock' },
    ])

    expect(query.in).toHaveBeenCalledWith('ticker', ['KNRI11'])
  })

  it('returns early without a query when no asset is eligible', async () => {
    const from = vi.fn()
    const repository = createSupabaseRealEstateFundSnapshotRepository(
      asClient({ from })
    )

    await expect(
      repository.listRealEstateFundSnapshots([
        { ...createAsset('KNRI11'), status: 'inactive' },
      ])
    ).resolves.toEqual([])
    expect(from).not.toHaveBeenCalled()
  })

  it('rejects duplicate composite identities', async () => {
    const from = vi.fn()
    const repository = createSupabaseRealEstateFundSnapshotRepository(
      asClient({ from })
    )

    await expect(
      repository.listRealEstateFundSnapshots([
        createAsset('KNRI11', 'first'),
        { ...createAsset('KNRI11', 'second'), ticker: ' knri11 ' },
      ])
    ).rejects.toThrow('Duplicate real estate fund identity')
    expect(from).not.toHaveBeenCalled()
  })

  it.each([
    ['ticker', { ticker: 'MXRF11' }],
    ['category', { category: 'brazilian-stock' }],
    ['market', { market: 'US' }],
  ])('rejects an unknown persisted %s identity', async (_field, patch) => {
    const { client } = createQueryClient([{ ...createRow(), ...patch }])
    const repository = createSupabaseRealEstateFundSnapshotRepository(client)

    await expect(
      repository.listRealEstateFundSnapshots([createAsset('KNRI11')])
    ).rejects.toThrow('unknown real estate fund identity')
  })

  it('preserves the stock adapter after the type synchronization', () => {
    const stockRow = {
      id: 1,
      ticker: 'BBAS3',
      category: 'brazilian-stock',
      market: 'BR',
      kind: 'brazilian-stock',
      reference_date: '2026-03-31',
      period: 'quarterly',
      source: 'cvm-itr',
      source_document_id: 'itr:archive:001023:2026-03-31:v1',
      source_archive: 'itr_2026.zip',
      filing_version: 1,
      exercise_order: 'ULTIMO',
      currency: 'BRL',
      total_revenue_minor: null,
      net_income_minor: 100,
      total_assets_minor: 200,
      total_equity_minor: 50,
      operating_cash_flow_minor: -10,
      net_asset_value_minor: null,
      issued_shares_unscaled: null,
      issued_shares_scale: null,
      shareholder_count: null,
      provenance: {
        totalRevenue: null,
        netIncome: {
          statement: 'DRE',
          accountCode: '3.11',
          accountDescription: 'Lucro consolidado',
          referenceDate: '2026-03-31',
          version: 1,
          exerciseOrder: 'ULTIMO',
        },
        totalAssets: {
          statement: 'BPA',
          accountCode: '1',
          accountDescription: 'Ativo Total',
          referenceDate: '2026-03-31',
          version: 1,
          exerciseOrder: 'ULTIMO',
        },
        totalEquity: {
          statement: 'BPP',
          accountCode: '2.03',
          accountDescription: 'Patrimonio Liquido',
          referenceDate: '2026-03-31',
          version: 1,
          exerciseOrder: 'ULTIMO',
        },
        operatingCashFlow: {
          statement: 'DFC_MI',
          accountCode: '6.01',
          accountDescription: 'Caixa operacional',
          referenceDate: '2026-03-31',
          version: 1,
          exerciseOrder: 'ULTIMO',
        },
      },
      created_at: '2026-07-16T12:00:00.000Z',
      updated_at: '2026-07-16T12:00:00.000Z',
    } satisfies RealEstateFundSnapshotRow

    expect(mapFundamentalSnapshotRow(stockRow, 'asset-bbas3')).toMatchObject({
      assetId: 'asset-bbas3',
      kind: 'brazilian-stock',
      facts: { netIncome: { amountInMinorUnits: 100, currency: 'BRL' } },
    })
  })
})
