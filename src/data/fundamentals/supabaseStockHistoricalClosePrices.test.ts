import { describe, expect, it, vi } from 'vitest'
import {
  createSupabaseStockHistoricalClosePriceRepository,
  type StockHistoricalClosePriceSupabaseClient,
} from './supabaseStockHistoricalClosePrices'

function fakeClient(
  rows: Array<{
    ticker: string
    fiscal_year_end_date: string
    close_price_in_minor_units: number
  }> | null,
  error: { message: string } | null = null
) {
  const eq = vi.fn().mockResolvedValue({ data: rows, error })
  const query = {
    select: vi.fn(() => ({ eq })),
  }
  const client = {
    from: vi.fn(() => query),
  } as unknown as StockHistoricalClosePriceSupabaseClient

  return { client, query, eq }
}

describe('createSupabaseStockHistoricalClosePriceRepository', () => {
  it('maps snake_case rows to the camelCase domain shape, filtered by ticker', async () => {
    const { client, eq } = fakeClient([
      {
        ticker: 'BBAS3',
        fiscal_year_end_date: '2025-12-31',
        close_price_in_minor_units: 2_192,
      },
    ])
    const repository = createSupabaseStockHistoricalClosePriceRepository(client)

    const values =
      await repository.listStockHistoricalClosePricesByTicker('BBAS3')

    expect(client.from).toHaveBeenCalledWith('stock_historical_close_prices')
    expect(eq).toHaveBeenCalledWith('ticker', 'BBAS3')
    expect(values).toEqual([
      { referenceDate: '2025-12-31', closePriceInMinorUnits: 2_192 },
    ])
  })

  it('returns an empty array when nothing was backfilled yet', async () => {
    const { client } = fakeClient([])
    const repository = createSupabaseStockHistoricalClosePriceRepository(client)

    await expect(
      repository.listStockHistoricalClosePricesByTicker('WEGE3')
    ).resolves.toEqual([])
  })

  it('wraps a query error with a descriptive message', async () => {
    const { client } = fakeClient(null, { message: 'boom' })
    const repository = createSupabaseStockHistoricalClosePriceRepository(client)

    await expect(
      repository.listStockHistoricalClosePricesByTicker('PSSA3')
    ).rejects.toThrow('Failed to load stock historical close prices: boom')
  })
})
