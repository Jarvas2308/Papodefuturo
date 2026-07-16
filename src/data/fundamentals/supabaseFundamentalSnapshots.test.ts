import { describe, expect, it, vi } from 'vitest'
import { buildFundamentalFactsV1 } from '../../domain/fundamentals'
import type { Asset } from '../../domain/models'
import type { CvmBrazilianStockFundamentalRecord } from './cvm/types'
import {
  createSupabaseFundamentalSnapshotRepository,
  createSupabaseFundamentalSnapshotStorage,
  mapFundamentalSnapshotRow,
  type FundamentalSnapshotRow,
  type FundamentalSnapshotSupabaseClient,
} from './supabaseFundamentalSnapshots'

function createProvenance() {
  return {
    totalRevenue: null,
    netIncome: {
      statement: 'DRE' as const,
      accountCode: '3.11',
      accountDescription: 'Lucro/Prejuízo Consolidado do Período',
      referenceDate: '2026-03-31',
      version: 1,
      exerciseOrder: 'ÚLTIMO',
    },
    totalAssets: {
      statement: 'BPA' as const,
      accountCode: '1',
      accountDescription: 'Ativo Total',
      referenceDate: '2026-03-31',
      version: 1,
      exerciseOrder: 'ÚLTIMO',
    },
    totalEquity: {
      statement: 'BPP' as const,
      accountCode: '2.07',
      accountDescription: 'Patrimônio Líquido Consolidado',
      referenceDate: '2026-03-31',
      version: 1,
      exerciseOrder: 'ÚLTIMO',
    },
    operatingCashFlow: {
      statement: 'DFC_MI' as const,
      accountCode: '6.01',
      accountDescription: 'Caixa Líquido das Atividades Operacionais',
      referenceDate: '2026-03-31',
      version: 1,
      exerciseOrder: 'ÚLTIMO',
    },
  }
}

function createRecord(): CvmBrazilianStockFundamentalRecord {
  return {
    ticker: 'BBAS3',
    companyIdentity: {
      officialName: 'BCO BRASIL S.A.',
      cvmCode: '001023',
      cnpj: '00.000.000/0001-91',
    },
    category: 'brazilian-stock',
    market: 'BR',
    kind: 'brazilian-stock',
    referenceDate: '2026-03-31',
    period: 'quarterly',
    source: 'cvm-itr',
    sourceDocumentId: 'itr:archive:001023:2026-03-31:v1',
    sourceArchive: 'itr_cia_aberta_2026.zip',
    filingVersion: 1,
    exerciseOrder: 'ÚLTIMO',
    facts: {
      totalRevenue: null,
      netIncome: { amountInMinorUnits: 100, currency: 'BRL' },
      totalAssets: { amountInMinorUnits: 200, currency: 'BRL' },
      totalEquity: { amountInMinorUnits: 50, currency: 'BRL' },
      operatingCashFlow: { amountInMinorUnits: -10, currency: 'BRL' },
    },
    provenance: createProvenance(),
  }
}

function createRow(): FundamentalSnapshotRow {
  return {
    id: 1,
    ticker: 'BBAS3',
    category: 'brazilian-stock',
    market: 'BR',
    kind: 'brazilian-stock',
    reference_date: '2026-03-31',
    period: 'quarterly',
    source: 'cvm-itr',
    source_document_id: 'itr:archive:001023:2026-03-31:v1',
    source_archive: 'itr_cia_aberta_2026.zip',
    filing_version: 1,
    issued_shares_scale: null,
    issued_shares_unscaled: null,
    exercise_order: 'ÚLTIMO',
    currency: 'BRL',
    net_asset_value_minor: null,
    net_assets_minor: null,
    total_revenue_minor: null,
    net_income_minor: 100,
    total_assets_minor: 200,
    total_equity_minor: 50,
    total_liabilities_minor: null,
    operating_cash_flow_minor: -10,
    shareholder_count: null,
    provenance: createProvenance(),
    created_at: '2026-07-15T12:00:00.000Z',
    updated_at: '2026-07-15T12:00:00.000Z',
  }
}

describe('Supabase fundamental snapshot persistence', () => {
  it('uses an idempotent bulk upsert with the complete logical identity', async () => {
    const upsert = vi.fn(async () => ({ error: null }))
    const client = {
      from: vi.fn(() => ({ upsert })),
    } as unknown as FundamentalSnapshotSupabaseClient
    const storage = createSupabaseFundamentalSnapshotStorage(client)

    await storage.upsertMany([createRecord()])
    await storage.upsertMany([createRecord()])

    expect(upsert).toHaveBeenCalledTimes(2)
    expect(upsert).toHaveBeenLastCalledWith(
      [expect.objectContaining({ ticker: 'BBAS3', total_revenue_minor: null })],
      {
        onConflict:
          'ticker,category,market,kind,period,source,reference_date,source_document_id',
      }
    )
  })

  it('refuses to persist normalized CVM revenue in provider V1', async () => {
    const client = {
      from: vi.fn(() => ({ upsert: vi.fn() })),
    } as unknown as FundamentalSnapshotSupabaseClient
    const storage = createSupabaseFundamentalSnapshotStorage(client)
    const record = createRecord()
    record.facts.totalRevenue = {
      amountInMinorUnits: 999,
      currency: 'BRL',
    }

    await expect(storage.upsertMany([record])).rejects.toThrow(
      'CVM totalRevenue must remain null'
    )
  })

  it('validates BRL currency and safe minor units before upsert', async () => {
    const upsert = vi.fn()
    const client = {
      from: vi.fn(() => ({ upsert })),
    } as unknown as FundamentalSnapshotSupabaseClient
    const storage = createSupabaseFundamentalSnapshotStorage(client)
    const wrongCurrency = createRecord()
    wrongCurrency.facts.netIncome!.currency = 'USD'
    const unsafeAmount = createRecord()
    unsafeAmount.facts.totalAssets!.amountInMinorUnits =
      Number.MAX_SAFE_INTEGER + 1

    await expect(storage.upsertMany([wrongCurrency])).rejects.toThrow(
      'Net income must use BRL currency'
    )
    await expect(storage.upsertMany([unsafeAmount])).rejects.toThrow(
      'Total assets must use signed safe minor units'
    )
    expect(upsert).not.toHaveBeenCalled()
  })

  it('validates exercise order provenance before upsert', async () => {
    const upsert = vi.fn()
    const client = {
      from: vi.fn(() => ({ upsert })),
    } as unknown as FundamentalSnapshotSupabaseClient
    const storage = createSupabaseFundamentalSnapshotStorage(client)
    const record = createRecord()
    record.provenance.totalEquity.exerciseOrder = 'PENÚLTIMO'

    await expect(storage.upsertMany([record])).rejects.toThrow(
      'Fundamental provenance does not match filing identity'
    )
    expect(upsert).not.toHaveBeenCalled()
  })

  it('reconstructs a domain snapshot while preserving totalRevenue null', () => {
    const snapshot = mapFundamentalSnapshotRow(createRow(), 'asset-bbas3')

    expect(snapshot.facts.totalRevenue).toBeNull()
    expect(snapshot.facts.operatingCashFlow?.amountInMinorUnits).toBe(-10)
  })

  it('rejects persisted CVM revenue that violates the V1 comparability decision', () => {
    expect(() =>
      mapFundamentalSnapshotRow(
        { ...createRow(), total_revenue_minor: 999 },
        'asset-bbas3'
      )
    ).toThrow('CVM totalRevenue must remain null')
  })

  it('rejects provenance that diverges from the persisted filing identity', () => {
    const provenance = createProvenance()
    provenance.netIncome.version = 2

    expect(() =>
      mapFundamentalSnapshotRow({ ...createRow(), provenance }, 'asset-bbas3')
    ).toThrow('Fundamental provenance does not match filing identity')
  })

  it('rejects persisted exercise order that diverges from provenance', () => {
    expect(() =>
      mapFundamentalSnapshotRow(
        { ...createRow(), exercise_order: 'PENÚLTIMO' },
        'asset-bbas3'
      )
    ).toThrow('Fundamental provenance does not match filing identity')
  })

  it('rejects a null CVM filing version', () => {
    expect(() =>
      mapFundamentalSnapshotRow(
        { ...createRow(), filing_version: null },
        'asset-bbas3'
      )
    ).toThrow('positive safe integer')
  })

  it.each([
    ['total_liabilities_minor', { total_liabilities_minor: 1 }],
    ['net_assets_minor', { net_assets_minor: 1 }],
  ])('rejects a populated SEC column %s for stocks', (_column, patch) => {
    expect(() =>
      mapFundamentalSnapshotRow({ ...createRow(), ...patch }, 'asset-bbas3')
    ).toThrow('SEC columns must remain null')
  })

  it('queries and joins by normalized ticker, category and market', async () => {
    const query = {
      select: vi.fn(),
      eq: vi.fn(),
      in: vi.fn(),
      order: vi.fn(async () => ({ data: [createRow()], error: null })),
    }
    query.select.mockReturnValue(query)
    query.eq.mockReturnValue(query)
    query.in.mockReturnValue(query)
    const client = {
      from: vi.fn(() => query),
    } as unknown as FundamentalSnapshotSupabaseClient
    const repository = createSupabaseFundamentalSnapshotRepository(client)
    const assets: Asset[] = [
      {
        id: 'user-specific-bbas3',
        ticker: 'bbas3',
        name: 'Banco do Brasil',
        category: 'brazilian-stock',
        market: 'BR',
        status: 'active',
      },
    ]

    const snapshots = await repository.listBrazilianStockSnapshots(assets)
    const facts = buildFundamentalFactsV1({
      generatedAt: '2026-07-15T12:00:00.000Z',
      assets,
      snapshots,
    })

    expect(snapshots[0]?.assetId).toBe('user-specific-bbas3')
    expect(query.eq).toHaveBeenNthCalledWith(1, 'kind', 'brazilian-stock')
    expect(query.eq).toHaveBeenNthCalledWith(2, 'category', 'brazilian-stock')
    expect(query.eq).toHaveBeenNthCalledWith(3, 'market', 'BR')
    expect(query.in).toHaveBeenCalledWith('ticker', ['BBAS3'])
    const persistedSnapshot = facts.assets[0]?.snapshots[0]
    expect(persistedSnapshot?.kind).toBe('brazilian-stock')
    if (persistedSnapshot?.kind !== 'brazilian-stock') {
      throw new Error('Expected a Brazilian stock fixture')
    }
    expect(persistedSnapshot.facts.totalRevenue).toBeNull()
  })

  it('does not query Brazilian-stock assets outside the BR market', async () => {
    const from = vi.fn()
    const client = { from } as unknown as FundamentalSnapshotSupabaseClient
    const repository = createSupabaseFundamentalSnapshotRepository(client)
    const assets: Asset[] = [
      {
        id: 'wrong-market',
        ticker: 'BBAS3',
        name: 'Banco do Brasil',
        category: 'brazilian-stock',
        market: 'US',
        status: 'active',
      },
    ]

    await expect(
      repository.listBrazilianStockSnapshots(assets)
    ).resolves.toEqual([])
    expect(from).not.toHaveBeenCalled()
  })

  it.each([
    ['category', { category: 'international-etf' }],
    ['market', { market: 'US' }],
  ])('rejects a snapshot with divergent %s identity', async (_field, patch) => {
    const query = {
      select: vi.fn(),
      eq: vi.fn(),
      in: vi.fn(),
      order: vi.fn(async () => ({
        data: [{ ...createRow(), ...patch }],
        error: null,
      })),
    }
    query.select.mockReturnValue(query)
    query.eq.mockReturnValue(query)
    query.in.mockReturnValue(query)
    const client = {
      from: vi.fn(() => query),
    } as unknown as FundamentalSnapshotSupabaseClient
    const repository = createSupabaseFundamentalSnapshotRepository(client)
    const assets: Asset[] = [
      {
        id: 'asset-bbas3',
        ticker: 'BBAS3',
        name: 'Banco do Brasil',
        category: 'brazilian-stock',
        market: 'BR',
        status: 'active',
      },
    ]

    await expect(
      repository.listBrazilianStockSnapshots(assets)
    ).rejects.toThrow('unknown global asset identity')
  })

  it('rejects duplicate ticker, category and market identities', async () => {
    const client = {
      from: vi.fn(),
    } as unknown as FundamentalSnapshotSupabaseClient
    const repository = createSupabaseFundamentalSnapshotRepository(client)
    const assets: Asset[] = [
      {
        id: 'first-bbas3',
        ticker: 'BBAS3',
        name: 'Banco do Brasil',
        category: 'brazilian-stock',
        market: 'BR',
        status: 'active',
      },
      {
        id: 'second-bbas3',
        ticker: ' bbas3 ',
        name: 'Banco do Brasil duplicado',
        category: 'brazilian-stock',
        market: 'BR',
        status: 'active',
      },
    ]

    await expect(
      repository.listBrazilianStockSnapshots(assets)
    ).rejects.toThrow('Duplicate Brazilian stock identity')
    expect(client.from).not.toHaveBeenCalled()
  })
})
