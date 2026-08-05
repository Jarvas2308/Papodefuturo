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
import type { FundamentalSnapshotsRpcClientV1 } from './supabaseSnapshotsRpc'

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
    issuedShares: null,
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
      issuedShares: null,
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
    vacancy_basis_points: null,
    ipca_revenue_share_basis_points: null,
    igpm_revenue_share_basis_points: null,
    inpc_revenue_share_basis_points: null,
    incc_revenue_share_basis_points: null,
    tenant_concentration_basis_points: null,
    quarterly_net_financial_result_minor: null,
    wale_months_x100: null,
    provenance: createProvenance(),
    created_at: '2026-07-15T12:00:00.000Z',
    updated_at: '2026-07-15T12:00:00.000Z',
  }
}

describe('Supabase fundamental snapshot persistence', () => {
  it('sends an idempotent bulk upsert RPC with the complete row shape', async () => {
    const rpc = vi.fn(async () => ({
      data: { attempted: 1, upserted: 1 },
      error: null,
    }))
    const client = { rpc } as unknown as FundamentalSnapshotsRpcClientV1
    const storage = createSupabaseFundamentalSnapshotStorage(client)

    await storage.upsertMany([createRecord()])
    await storage.upsertMany([createRecord()])

    expect(rpc).toHaveBeenCalledTimes(2)
    expect(rpc).toHaveBeenLastCalledWith('upsert_fundamental_snapshots_v1', {
      records: [
        {
          ticker: 'BBAS3',
          category: 'brazilian-stock',
          market: 'BR',
          kind: 'brazilian-stock',
          period: 'quarterly',
          source: 'cvm-itr',
          reference_date: '2026-03-31',
          source_document_id: 'itr:archive:001023:2026-03-31:v1',
          source_archive: 'itr_cia_aberta_2026.zip',
          filing_version: 1,
          exercise_order: 'ÚLTIMO',
          currency: 'BRL',
          total_revenue_minor: null,
          net_income_minor: 100,
          total_assets_minor: 200,
          total_equity_minor: 50,
          total_liabilities_minor: null,
          net_assets_minor: null,
          operating_cash_flow_minor: -10,
          net_asset_value_minor: null,
          issued_shares_unscaled: null,
          issued_shares_scale: null,
          shareholder_count: null,
          provenance: createProvenance(),
        },
      ],
    })
  })

  it('sends exactly the 24 canonical fundamental_snapshots columns understood by the upsert RPC', async () => {
    let sentArgs: { records: [Record<string, unknown>] } | undefined
    const rpc = vi.fn(async (_functionName: string, args: unknown) => {
      sentArgs = args as { records: [Record<string, unknown>] }
      return { data: { attempted: 1, upserted: 1 }, error: null }
    })
    const client = { rpc } as unknown as FundamentalSnapshotsRpcClientV1
    const storage = createSupabaseFundamentalSnapshotStorage(client)

    await storage.upsertMany([createRecord()])

    const sentKeys = Object.keys(sentArgs!.records[0]).sort()
    expect(sentKeys).toEqual(
      [
        'ticker',
        'category',
        'market',
        'kind',
        'period',
        'source',
        'reference_date',
        'source_document_id',
        'source_archive',
        'filing_version',
        'exercise_order',
        'currency',
        'total_revenue_minor',
        'net_income_minor',
        'total_assets_minor',
        'total_equity_minor',
        'total_liabilities_minor',
        'net_assets_minor',
        'operating_cash_flow_minor',
        'net_asset_value_minor',
        'issued_shares_unscaled',
        'issued_shares_scale',
        'shareholder_count',
        'provenance',
      ].sort()
    )
  })

  it('refuses to persist normalized CVM revenue in provider V1', async () => {
    const rpc = vi.fn()
    const client = { rpc } as unknown as FundamentalSnapshotsRpcClientV1
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
    const rpc = vi.fn()
    const client = { rpc } as unknown as FundamentalSnapshotsRpcClientV1
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
    expect(rpc).not.toHaveBeenCalled()
  })

  it('validates exercise order provenance before upsert', async () => {
    const rpc = vi.fn()
    const client = { rpc } as unknown as FundamentalSnapshotsRpcClientV1
    const storage = createSupabaseFundamentalSnapshotStorage(client)
    const record = createRecord()
    record.provenance.totalEquity.exerciseOrder = 'PENÚLTIMO'

    await expect(storage.upsertMany([record])).rejects.toThrow(
      'Fundamental provenance does not match filing identity'
    )
    expect(rpc).not.toHaveBeenCalled()
  })

  it('reconstructs a domain snapshot while preserving totalRevenue null', () => {
    const snapshot = mapFundamentalSnapshotRow(createRow(), 'asset-bbas3')

    expect(snapshot.facts.totalRevenue).toBeNull()
    expect(snapshot.facts.operatingCashFlow?.amountInMinorUnits).toBe(-10)
    expect(snapshot.facts.issuedShares).toBeNull()
  })

  it('round-trips issued shares (composicao_capital) through write and read', async () => {
    const record: CvmBrazilianStockFundamentalRecord = {
      ...createRecord(),
      facts: {
        ...createRecord().facts,
        issuedShares: { unscaledValue: 5_730_834_040, scale: 0 },
      },
      provenance: {
        ...createProvenance(),
        issuedShares: {
          fileName: 'dfp_cia_aberta_composicao_capital_2025.csv',
          column: 'QT_ACAO_ORDIN_CAP_INTEGR',
          rawValue: '5730834040',
          referenceDate: '2025-12-31',
          version: 1,
        },
      },
    }
    let sentArgs: { records: [Record<string, unknown>] } | undefined
    const rpc = vi.fn(async (_functionName: string, args: unknown) => {
      sentArgs = args as { records: [Record<string, unknown>] }
      return { data: { attempted: 1, upserted: 1 }, error: null }
    })
    const client = { rpc } as unknown as FundamentalSnapshotsRpcClientV1
    const storage = createSupabaseFundamentalSnapshotStorage(client)

    await storage.upsertMany([record])

    expect(sentArgs!.records[0]).toEqual(
      expect.objectContaining({
        issued_shares_unscaled: 5_730_834_040,
        issued_shares_scale: 0,
      })
    )

    const row = {
      ...createRow(),
      issued_shares_unscaled: 5_730_834_040,
      issued_shares_scale: 0,
      provenance: sentArgs!.records[0]!.provenance as FundamentalSnapshotRow['provenance'],
    }
    const snapshot = mapFundamentalSnapshotRow(row, 'asset-bbas3')

    expect(snapshot.facts.issuedShares).toEqual({
      unscaledValue: 5_730_834_040,
      scale: 0,
    })
  })

  it('rejects a write where the issued-shares fact and provenance disagree on null', async () => {
    const record: CvmBrazilianStockFundamentalRecord = {
      ...createRecord(),
      facts: {
        ...createRecord().facts,
        issuedShares: { unscaledValue: 100, scale: 0 },
      },
    }
    const rpc = vi.fn()
    const client = { rpc } as unknown as FundamentalSnapshotsRpcClientV1
    const storage = createSupabaseFundamentalSnapshotStorage(client)

    await expect(storage.upsertMany([record])).rejects.toThrow(
      'Issued shares fact and provenance must agree on null'
    )
  })

  it('rejects a persisted row where issued shares and provenance disagree on null', () => {
    expect(() =>
      mapFundamentalSnapshotRow(
        {
          ...createRow(),
          issued_shares_unscaled: 100,
          issued_shares_scale: 0,
        },
        'asset-bbas3'
      )
    ).toThrow('Issued shares fact and provenance must agree on null')
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
