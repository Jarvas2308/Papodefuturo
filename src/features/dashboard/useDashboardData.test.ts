import { describe, expect, it, vi } from 'vitest'
import type { AppRepositories } from '../../data/repositories'
import {
  EXCHANGE_RATE_SCALE,
  type Asset,
  type ExchangeRate,
  type Purchase,
} from '../../domain/models'
import { dashboardMock } from '../../mocks/dashboard'
import {
  createInitialDashboardLoadState,
  loadRealDashboardState,
} from './useDashboardData'

const voo: Asset = {
  id: 'asset-voo',
  ticker: 'VOO',
  name: 'Vanguard S&P 500 ETF',
  category: 'international-etf',
  market: 'US',
  status: 'active',
}

const purchase: Purchase = {
  id: 'purchase-voo',
  assetId: voo.id,
  quantity: 1,
  unitPrice: { amountInMinorUnits: 1_000, currency: 'USD' },
  totalAmount: { amountInMinorUnits: 1_000, currency: 'USD' },
  tradeDate: '2026-07-01',
  status: 'confirmed',
}

const rate: ExchangeRate = {
  id: 'rate',
  baseCurrency: 'USD',
  quoteCurrency: 'BRL',
  rateScaled: 5_000_000,
  rateScale: EXCHANGE_RATE_SCALE,
  pricedAt: '2026-07-10T00:00:00.000Z',
  source: 'manual',
}

function createRepositories(rates: ExchangeRate[]) {
  return {
    assets: {
      list: vi.fn().mockResolvedValue([voo]),
      ensureClosedUniverse: vi.fn().mockResolvedValue([voo]),
    },
    purchases: {
      list: vi.fn().mockResolvedValue([purchase]),
      create: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
      cancel: vi.fn(),
    },
    assetPrices: { list: vi.fn().mockResolvedValue([]) },
    allocationTargets: {
      list: vi.fn().mockResolvedValue([]),
      replaceAll: vi.fn(),
    },
    exchangeRates: {
      list: vi.fn().mockImplementation(async () => rates),
    },
    marketData: {
      refresh: vi.fn().mockResolvedValue({
        refreshedAt: '2026-07-14T00:00:00.000Z',
        updatedPrices: 0,
        skippedFreshPrices: 0,
        updatedExchangeRates: 0,
        skippedFreshExchangeRates: 0,
        warnings: [],
      }),
    },
    contributionPlans: {
      list: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
      updateStatus: vi.fn(),
      linkItemPurchase: vi.fn(),
    },
  } as AppRepositories
}

describe('Dashboard data loading', () => {
  it('keeps demo mode on the exact existing mock without data access', () => {
    expect(createInitialDashboardLoadState(true)).toEqual({
      data: dashboardMock,
      status: 'ready',
      error: null,
      needsExchangeRate: false,
      latestUsdBrlRate: null,
      marketDataWarning: null,
    })
  })

  it('returns an explicit exchange-rate setup state for real USD positions', async () => {
    const repositories = createRepositories([])
    const state = await loadRealDashboardState({
      repositories,
      userId: 'authenticated-user',
      userMetadata: null,
      now: new Date('2026-07-14T00:00:00.000Z'),
    })

    expect(state).toEqual({
      data: null,
      status: 'ready',
      error: null,
      needsExchangeRate: true,
      latestUsdBrlRate: null,
      marketDataWarning: null,
    })
    expect(repositories.assets.ensureClosedUniverse).toHaveBeenCalledWith(
      'authenticated-user'
    )
  })

  it('loads persisted dashboard data when automatic refresh is unavailable', async () => {
    const repositories = createRepositories([rate])
    repositories.marketData.refresh = vi
      .fn()
      .mockRejectedValue(new Error('function unavailable'))

    const state = await loadRealDashboardState({
      repositories,
      userId: 'authenticated-user',
      userMetadata: null,
      now: new Date('2026-07-14T00:00:00.000Z'),
    })

    expect(state.status).toBe('ready')
    expect(state.data).not.toBeNull()
    expect(state.marketDataWarning).toContain('últimos dados disponíveis')
  })
})
