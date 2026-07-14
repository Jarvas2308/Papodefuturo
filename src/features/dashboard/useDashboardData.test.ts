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
  saveDashboardExchangeRateAndReload,
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
      saveManualUsdBrl: vi.fn().mockImplementation(async (_userId, value) => {
        const saved = { ...rate, rateScaled: value }
        rates.push(saved)
        return saved
      }),
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
    })
    expect(repositories.assets.ensureClosedUniverse).toHaveBeenCalledWith(
      'authenticated-user'
    )
  })

  it('saves a manual rate with the session user id and reloads real data', async () => {
    const rates: ExchangeRate[] = []
    const repositories = createRepositories(rates)
    const reload = () =>
      loadRealDashboardState({
        repositories,
        userId: 'authenticated-user',
        userMetadata: { name: 'Clara' },
        now: new Date('2026-07-14T00:00:00.000Z'),
      })
    const state = await saveDashboardExchangeRateAndReload(
      repositories,
      'authenticated-user',
      5_500_000,
      reload
    )

    expect(repositories.exchangeRates.saveManualUsdBrl).toHaveBeenCalledWith(
      'authenticated-user',
      5_500_000
    )
    expect(state.needsExchangeRate).toBe(false)
    expect(state.data?.welcome.title).toBe('Olá, Clara')
    expect(state.data?.summary[1].value).toBe('R$\u00a055,00')
  })
})
