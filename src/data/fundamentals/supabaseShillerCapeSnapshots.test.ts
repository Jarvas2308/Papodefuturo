import { describe, expect, it, vi } from 'vitest'
import {
  createSupabaseShillerCapeSnapshotStorage,
  UPSERT_MARKET_VALUATION_RATIOS_RPC_V1,
  type MarketValuationRatiosRpcClientV1,
} from './supabaseShillerCapeSnapshots'
import type { ShillerCapeRecord } from './shiller/types'

function buildRecord(overrides: Partial<ShillerCapeRecord> = {}): ShillerCapeRecord {
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
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } })
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
      storage.upsertMany([buildRecord({ valueScaled: Number.MAX_SAFE_INTEGER + 10 })])
    ).rejects.toThrow(RangeError)
    expect(rpc).not.toHaveBeenCalled()
  })

  it('rejects a non-positive valueScaled before calling the RPC', async () => {
    const rpc = vi.fn()
    const client: MarketValuationRatiosRpcClientV1 = { rpc }
    const storage = createSupabaseShillerCapeSnapshotStorage(client)

    await expect(storage.upsertMany([buildRecord({ valueScaled: 0 })])).rejects.toThrow(RangeError)
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
})
