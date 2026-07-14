import { describe, expect, it, vi } from 'vitest'
import type { MarketDataRepository } from './repositories/contracts'
import {
  MARKET_DATA_REFRESH_WARNING,
  refreshMarketDataBestEffort,
} from './marketDataRefresh'

const successfulResult = {
  refreshedAt: '2026-07-14T16:00:00.000Z',
  updatedPrices: 2,
  skippedFreshPrices: 10,
  updatedExchangeRates: 1,
  skippedFreshExchangeRates: 0,
  warnings: [],
}

describe('refreshMarketDataBestEffort', () => {
  it('returns a successful structured refresh result', async () => {
    const repository: MarketDataRepository = {
      refresh: vi.fn().mockResolvedValue(successfulResult),
    }

    await expect(refreshMarketDataBestEffort(repository)).resolves.toEqual({
      result: successfulResult,
      warning: null,
    })
  })

  it('turns an invoke failure into a non-destructive warning', async () => {
    const repository: MarketDataRepository = {
      refresh: vi.fn().mockRejectedValue(new Error('function unavailable')),
    }

    await expect(refreshMarketDataBestEffort(repository)).resolves.toEqual({
      result: null,
      warning: MARKET_DATA_REFRESH_WARNING,
    })
  })
})
