import { describe, expect, it, vi } from 'vitest'
import {
  createSupabaseMarketReferenceRateRepository,
  type MarketReferenceRateSupabaseClient,
} from './supabaseMarketReferenceRates'

function fakeClient(
  row: {
    series: string
    priced_at: string
    rate_scaled: number
    rate_scale: number
  } | null,
  error: { message: string } | null = null
) {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue({ data: row, error }),
  }
  query.select.mockReturnValue(query)
  query.eq.mockReturnValue(query)
  query.order.mockReturnValue(query)
  query.limit.mockReturnValue(query)
  const client = {
    from: vi.fn(() => query),
  } as unknown as MarketReferenceRateSupabaseClient

  return { client, query }
}

describe('createSupabaseMarketReferenceRateRepository', () => {
  it('maps the latest row to the domain shape, filtered by series', async () => {
    const { client, query } = fakeClient({
      series: 'ntnb-longa',
      priced_at: '2026-08-05',
      rate_scaled: 7420000,
      rate_scale: 1000000,
    })
    const repository = createSupabaseMarketReferenceRateRepository(client)

    const rate = await repository.getLatestMarketReferenceRate('ntnb-longa')

    expect(client.from).toHaveBeenCalledWith('market_reference_rates')
    expect(query.eq).toHaveBeenCalledWith('series', 'ntnb-longa')
    expect(rate).toEqual({
      series: 'ntnb-longa',
      pricedAt: '2026-08-05',
      rateScaled: 7420000,
      rateScale: 1000000,
    })
  })

  it('returns null when there is no data yet', async () => {
    const { client } = fakeClient(null)
    const repository = createSupabaseMarketReferenceRateRepository(client)

    await expect(
      repository.getLatestMarketReferenceRate('ntnb-longa')
    ).resolves.toBeNull()
  })

  it('wraps a query error with a descriptive message', async () => {
    const { client } = fakeClient(null, { message: 'boom' })
    const repository = createSupabaseMarketReferenceRateRepository(client)

    await expect(
      repository.getLatestMarketReferenceRate('ntnb-longa')
    ).rejects.toThrow('Failed to load market reference rate: boom')
  })
})
