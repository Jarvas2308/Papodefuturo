import { describe, expect, it, vi } from 'vitest'
import type { AppRepositories } from '../../data/repositories'
import type { Asset } from '../../domain/models'
import { portfolioMock } from '../../mocks/portfolio'
import {
  createInitialPortfolioLoadState,
  loadRealPortfolioState,
} from './usePortfolioData'

const asset: Asset = {
  id: 'asset-bbas3',
  ticker: 'BBAS3',
  name: 'Banco do Brasil',
  category: 'brazilian-stock',
  market: 'BR',
  status: 'active',
}

function createRepositories(): AppRepositories {
  return {
    assets: {
      list: vi.fn().mockResolvedValue([asset]),
      ensureClosedUniverse: vi.fn().mockResolvedValue([asset]),
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

describe('createInitialPortfolioLoadState', () => {
  it('keeps demo mode on its mock without requiring an exchange rate', () => {
    expect(createInitialPortfolioLoadState(true)).toEqual({
      data: portfolioMock,
      status: 'ready',
      error: null,
      needsExchangeRate: false,
      latestUsdBrlRate: null,
      marketDataWarning: null,
    })
  })

  it('loads persisted portfolio data when automatic refresh is unavailable', async () => {
    const state = await loadRealPortfolioState(
      createRepositories(),
      'authenticated-user'
    )

    expect(state.status).toBe('ready')
    expect(state.data).not.toBeNull()
    expect(state.marketDataWarning).toContain('últimos dados disponíveis')
  })
})
