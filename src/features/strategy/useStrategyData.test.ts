import { describe, expect, it, vi } from 'vitest'
import type { AppRepositories } from '../../data/repositories'
import { loadRealStrategyInputs } from './useStrategyData'

function createRepositories(): AppRepositories {
  return {
    assets: {
      list: vi.fn().mockResolvedValue([]),
      ensureClosedUniverse: vi.fn().mockResolvedValue([]),
    },
    purchases: {
      list: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
      cancel: vi.fn(),
    },
    assetPrices: { list: vi.fn().mockResolvedValue([]) },
    exchangeRates: {
      list: vi.fn().mockResolvedValue([]),
      saveManualUsdBrl: vi.fn(),
    },
    allocationTargets: {
      list: vi.fn().mockResolvedValue([]),
      replaceAll: vi.fn(),
    },
    marketData: {
      refresh: vi.fn().mockRejectedValue(new Error('function unavailable')),
    },
  }
}

describe('real strategy data loading', () => {
  it('loads persisted data when automatic refresh is unavailable', async () => {
    const repositories = createRepositories()
    const inputs = await loadRealStrategyInputs(
      repositories,
      'authenticated-user'
    )

    expect(inputs).toEqual({
      assets: [],
      purchases: [],
      prices: [],
      targets: [],
      rates: [],
    })
    expect(repositories.marketData.refresh).toHaveBeenCalledOnce()
  })
})
