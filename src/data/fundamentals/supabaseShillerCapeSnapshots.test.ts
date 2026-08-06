import { describe, expect, it, vi } from 'vitest'
import {
  createSupabaseShillerCapeHistoryRepository,
  createSupabaseShillerCapeSnapshotStorage,
  UPSERT_MARKET_VALUATION_RATIOS_RPC_V1,
  type MarketValuationRatiosRpcClientV1,
  type ShillerCapeHistorySupabaseClient,
} from './supabaseShillerCapeSnapshots'
import type { ShillerCapeRecord } from './shiller/types'

function buildRecord(
  overrides: Partial<ShillerCapeRecord> = {}
): ShillerCapeRecord {
  return {
    series: 'shiller-cape-sp500',
    source: 'shiller-yale',
    referenceDate: '2020-01-01',
    valueScaled: 30_123_456,
    valueScale: 1_000_000,
    provenance: {
      dataset: 'Shiller Online Data - U.S. Stock Markets 1871-Present',
      sheetName: 'Data',
      dateColumn: { sheetName: 'Data', column: 'Date', rawValue: 2020.01 },
      capeColumn: { sheetName: 'Data', column: 'CAPE', rawValue: 30.123456 },
    },
    ...overrides,
  }
}

describe('createSupabaseShillerCapeSnapshotStorage', () => {
  it('calls the RPC with the mapped snake_case row', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null })
    const client: MarketValuationRatiosRpcClientV1 = { rpc }
    const storage = createSupabaseShillerCapeSnapshotStorage(client)

    await storage.upsertMany([buildRecord()])

    expect(rpc).toHaveBeenCalledWith(UPSERT_MARKET_VALUATION_RATIOS_RPC_V1, {
      records: [
        {
          series: 'shiller-cape-sp500',
          reference_date: '2020-01-01',
          value_scaled: 30_123_456,
          value_scale: 1_000_000,
          source: 'shiller-yale',
        },
      ],
    })
  })

  it('does not call the RPC for an empty record list', async () => {
    const rpc = vi.fn()
    const client: MarketValuationRatiosRpcClientV1 = { rpc }
    const storage = createSupabaseShillerCapeSnapshotStorage(client)

    await storage.upsertMany([])

    expect(rpc).not.toHaveBeenCalled()
  })

  it('wraps an RPC error with a descriptive message', async () => {
    const rpc = vi
      .fn()
      .mockResolvedValue({ data: null, error: { message: 'boom' } })
    const client: MarketValuationRatiosRpcClientV1 = { rpc }
    const storage = createSupabaseShillerCapeSnapshotStorage(client)

    await expect(storage.upsertMany([buildRecord()])).rejects.toThrow(
      'Failed to upsert Shiller CAPE valuation ratios: boom'
    )
  })

  it('rejects a non-safe-integer valueScaled before calling the RPC', async () => {
    const rpc = vi.fn()
    const client: MarketValuationRatiosRpcClientV1 = { rpc }
    const storage = createSupabaseShillerCapeSnapshotStorage(client)

    await expect(
      storage.upsertMany([
        buildRecord({ valueScaled: Number.MAX_SAFE_INTEGER + 10 }),
      ])
    ).rejects.toThrow(RangeError)
    expect(rpc).not.toHaveBeenCalled()
  })

  it('rejects a non-positive valueScaled before calling the RPC', async () => {
    const rpc = vi.fn()
    const client: MarketValuationRatiosRpcClientV1 = { rpc }
    const storage = createSupabaseShillerCapeSnapshotStorage(client)

    await expect(
      storage.upsertMany([buildRecord({ valueScaled: 0 })])
    ).rejects.toThrow(RangeError)
    expect(rpc).not.toHaveBeenCalled()
  })

  it('rejects an unexpected valueScale before calling the RPC', async () => {
    const rpc = vi.fn()
    const client: MarketValuationRatiosRpcClientV1 = { rpc }
    const storage = createSupabaseShillerCapeSnapshotStorage(client)

    await expect(
      storage.upsertMany([buildRecord({ valueScale: 1000 })])
    ).rejects.toThrow(RangeError)
    expect(rpc).not.toHaveBeenCalled()
  })

  it('splits more than 20 records into sequential batches of at most 20', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null })
    const client: MarketValuationRatiosRpcClientV1 = { rpc }
    const storage = createSupabaseShillerCapeSnapshotStorage(client)
    const records = Array.from({ length: 25 }, (_, index) =>
      buildRecord({
        referenceDate: `2020-${String((index % 12) + 1).padStart(2, '0')}-01`,
      })
    )

    await storage.upsertMany(records)

    expect(rpc).toHaveBeenCalledTimes(2)
    expect(rpc.mock.calls[0]?.[1].records).toHaveLength(20)
    expect(rpc.mock.calls[1]?.[1].records).toHaveLength(5)
  })
})

describe('createSupabaseShillerCapeHistoryRepository', () => {
  function fakeClient(
    rows: { reference_date: string; value_scaled: number }[]
  ) {
    const query = {
      select: vi.fn(),
      eq: vi.fn(),
      order: vi.fn(async () => ({ data: rows, error: null })),
    }
    query.select.mockReturnValue(query)
    query.eq.mockReturnValue(query)
    return {
      query,
      client: {
        from: vi.fn(() => query),
      } as unknown as ShillerCapeHistorySupabaseClient,
    }
  }

  it('queries the shiller-cape-sp500 series ordered by reference date', async () => {
    const { query, client } = fakeClient([
      { reference_date: '2020-01-01', value_scaled: 10_000_000 },
      { reference_date: '2020-02-01', value_scaled: 11_000_000 },
    ])
    const repository = createSupabaseShillerCapeHistoryRepository(client)

    const history = await repository.listShillerCapeHistory()

    expect(query.eq).toHaveBeenCalledWith('series', 'shiller-cape-sp500')
    expect(query.order).toHaveBeenCalledWith('reference_date', {
      ascending: true,
    })
    expect(history).toEqual([
      { referenceDate: '2020-01-01', valueScaled: 10_000_000 },
      { referenceDate: '2020-02-01', valueScaled: 11_000_000 },
    ])
  })

  it('returns an empty array when there is no data yet', async () => {
    const { client } = fakeClient([])
    const repository = createSupabaseShillerCapeHistoryRepository(client)

    await expect(repository.listShillerCapeHistory()).resolves.toEqual([])
  })

  it('wraps a query error with a descriptive message', async () => {
    const query = {
      select: vi.fn(),
      eq: vi.fn(),
      order: vi
        .fn()
        .mockResolvedValue({ data: null, error: { message: 'boom' } }),
    }
    query.select.mockReturnValue(query)
    query.eq.mockReturnValue(query)
    const client = {
      from: vi.fn(() => query),
    } as unknown as ShillerCapeHistorySupabaseClient
    const repository = createSupabaseShillerCapeHistoryRepository(client)

    await expect(repository.listShillerCapeHistory()).rejects.toThrow(
      'Failed to load Shiller CAPE history: boom'
    )
  })
})
