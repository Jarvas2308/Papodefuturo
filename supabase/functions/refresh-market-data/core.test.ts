import { describe, expect, it, vi } from 'vitest'
import { refreshMarketData, type MarketDataStorage } from './core.ts'
import type {
  ExchangeRateInsert,
  MarketPriceInsert,
  RefreshAsset,
  StoredExchangeRate,
  StoredMarketPrice,
} from './types.ts'

const now = new Date('2026-07-14T22:00:00.000Z')

function createStorage(input?: {
  assets?: RefreshAsset[]
  prices?: StoredMarketPrice[]
  rates?: StoredExchangeRate[]
}) {
  const insertedPrices: MarketPriceInsert[][] = []
  const insertedRates: ExchangeRateInsert[] = []
  const storage: MarketDataStorage = {
    listActiveAssets: vi.fn().mockResolvedValue(
      input?.assets ?? [
        { id: 'asset-bbas3', ticker: 'BBAS3', status: 'active' },
        { id: 'asset-itsa4', ticker: 'ITSA4', status: 'active' },
        { id: 'asset-voo', ticker: 'VOO', status: 'active' },
      ]
    ),
    listMarketPrices: vi.fn().mockResolvedValue(input?.prices ?? []),
    listMarketExchangeRates: vi.fn().mockResolvedValue(input?.rates ?? []),
    insertMarketPrices: vi.fn().mockImplementation(async (rows) => {
      insertedPrices.push([...rows])
    }),
    insertMarketExchangeRate: vi.fn().mockImplementation(async (row) => {
      insertedRates.push(row)
    }),
  }

  return { storage, insertedPrices, insertedRates }
}

function createProviders() {
  return {
    b3Cotahist: {
      getAssetQuotes: vi
        .fn()
        .mockImplementation(async (tickers: readonly string[]) =>
          tickers.map((ticker) => ({
            ticker,
            currency: 'BRL' as const,
            priceInMinorUnits: ticker === 'BBAS3' ? 3_817 : 1_245,
            pricedAt: '2026-07-14T21:00:00.000Z',
          }))
        ),
    },
    twelveData: {
      getAssetQuote: vi.fn().mockImplementation(async (ticker: string) => ({
        ticker,
        currency: 'USD' as const,
        priceInMinorUnits: 52_045,
        pricedAt: '2026-07-14T21:30:00.000Z',
      })),
      getUsdBrlQuote: vi.fn().mockResolvedValue({
        ticker: 'USDBRL' as const,
        baseCurrency: 'USD' as const,
        quoteCurrency: 'BRL' as const,
        rateScaled: 5_432_100,
        pricedAt: '2026-07-14T21:30:00.000Z',
      }),
    },
  }
}

async function runRefresh(options?: {
  storage?: ReturnType<typeof createStorage>
  providers?: ReturnType<typeof createProviders>
  twelveConfigured?: boolean
}) {
  const storage = options?.storage ?? createStorage()
  const providers = options?.providers ?? createProviders()
  let id = 0
  const result = await refreshMarketData({
    userId: 'authenticated-user',
    storage: storage.storage,
    b3Cotahist: providers.b3Cotahist,
    twelveData:
      options?.twelveConfigured === false ? null : providers.twelveData,
    now,
    createId: () => `generated-${++id}`,
  })

  return { result, storage, providers }
}

describe('market data refresh core', () => {
  it('groups Brazilian assets in one B3 batch', async () => {
    const { providers } = await runRefresh()
    expect(providers.b3Cotahist.getAssetQuotes).toHaveBeenCalledOnce()
    expect(providers.b3Cotahist.getAssetQuotes).toHaveBeenCalledWith([
      'BBAS3',
      'ITSA4',
    ])
  })

  it('uses Twelve Data for US assets', async () => {
    const { providers } = await runRefresh()
    expect(providers.twelveData.getAssetQuote).toHaveBeenCalledWith('VOO')
  })

  it('updates only active assets', async () => {
    const storage = createStorage({
      assets: [{ id: 'inactive', ticker: 'ITSA4', status: 'inactive' }],
    })
    const { result, providers } = await runRefresh({ storage })
    expect(result.updatedPrices).toBe(0)
    expect(providers.b3Cotahist.getAssetQuotes).not.toHaveBeenCalled()
  })

  it('ignores assets outside the server closed universe', async () => {
    const storage = createStorage({
      assets: [{ id: 'outside', ticker: 'OTHER', status: 'active' }],
    })
    const { result, providers } = await runRefresh({ storage })
    expect(result.updatedPrices).toBe(0)
    expect(providers.b3Cotahist.getAssetQuotes).not.toHaveBeenCalled()
    expect(providers.twelveData.getAssetQuote).not.toHaveBeenCalled()
  })

  it('keeps B3 working when the Twelve Data secret is absent', async () => {
    const { result, providers } = await runRefresh({ twelveConfigured: false })
    expect(result.updatedPrices).toBe(2)
    expect(result.updatedExchangeRates).toBe(0)
    expect(result.warnings).toContainEqual(
      expect.objectContaining({ provider: 'configuration' })
    )
    expect(providers.b3Cotahist.getAssetQuotes).toHaveBeenCalledOnce()
  })

  it('keeps Twelve Data working when B3 fails', async () => {
    const providers = createProviders()
    providers.b3Cotahist.getAssetQuotes.mockRejectedValueOnce(
      new Error('raw archive payload')
    )
    const { result } = await runRefresh({ providers })
    expect(providers.twelveData.getAssetQuote).toHaveBeenCalledOnce()
    expect(result.updatedPrices).toBe(1)
  })

  it('keeps B3 working when a Twelve Data asset fails', async () => {
    const providers = createProviders()
    providers.twelveData.getAssetQuote.mockRejectedValueOnce(
      new Error('raw provider payload')
    )
    const { result } = await runRefresh({ providers })
    expect(providers.b3Cotahist.getAssetQuotes).toHaveBeenCalledOnce()
    expect(result.updatedPrices).toBe(2)
  })

  it('creates a specific warning when B3 omits one requested ticker', async () => {
    const providers = createProviders()
    providers.b3Cotahist.getAssetQuotes.mockResolvedValueOnce([
      {
        ticker: 'BBAS3',
        currency: 'BRL',
        priceInMinorUnits: 3_817,
        pricedAt: '2026-07-14T21:00:00.000Z',
      },
    ])
    const { result } = await runRefresh({ providers })
    expect(result.warnings).toContainEqual(
      expect.objectContaining({ provider: 'b3-cotahist', ticker: 'ITSA4' })
    )
    expect(result.updatedPrices).toBe(2)
  })

  it('inserts valid B3 and US quotes in one batch', async () => {
    const { storage } = await runRefresh()
    expect(storage.storage.insertMarketPrices).toHaveBeenCalledOnce()
    expect(storage.insertedPrices[0]).toHaveLength(3)
  })

  it('uses the authenticated user id and market-provider source in every fact', async () => {
    const { storage } = await runRefresh()
    expect(
      storage.insertedPrices[0]?.every(
        (row) =>
          row.user_id === 'authenticated-user' &&
          row.source === 'market-provider'
      )
    ).toBe(true)
    expect(storage.insertedRates[0]).toMatchObject({
      user_id: 'authenticated-user',
      source: 'market-provider',
    })
  })

  it('persists Twelve Data USD/BRL as an append-only scaled fact', async () => {
    const { result, storage } = await runRefresh()
    expect(result.updatedExchangeRates).toBe(1)
    expect(storage.insertedRates[0]).toMatchObject({
      base_currency: 'USD',
      quote_currency: 'BRL',
      rate_scaled: 5_432_100,
      rate_scale: 1_000_000,
      source: 'market-provider',
    })
  })

  it('skips a fresh automatic asset price', async () => {
    const storage = createStorage({
      assets: [{ id: 'asset-bbas3', ticker: 'BBAS3', status: 'active' }],
      prices: [
        {
          assetId: 'asset-bbas3',
          pricedAt: '2026-07-14T21:30:00.000Z',
          source: 'market-provider',
        },
      ],
    })
    const { result, providers } = await runRefresh({ storage })
    expect(result.skippedFreshPrices).toBe(1)
    expect(providers.b3Cotahist.getAssetQuotes).not.toHaveBeenCalled()
  })

  it('does not let a manual price block automatic refresh', async () => {
    const storage = createStorage({
      assets: [{ id: 'asset-bbas3', ticker: 'BBAS3', status: 'active' }],
      prices: [
        {
          assetId: 'asset-bbas3',
          pricedAt: '2026-07-14T21:59:00.000Z',
          source: 'manual',
        },
      ],
    })
    const { providers } = await runRefresh({ storage })
    expect(providers.b3Cotahist.getAssetQuotes).toHaveBeenCalledOnce()
  })

  it('does not duplicate the same B3 trading session', async () => {
    const storage = createStorage({
      assets: [{ id: 'asset-bbas3', ticker: 'BBAS3', status: 'active' }],
      prices: [
        {
          assetId: 'asset-bbas3',
          pricedAt: '2026-07-14T21:00:00.000Z',
          source: 'market-provider',
        },
      ],
    })
    const later = new Date('2026-07-15T12:00:00.000Z')
    const providers = createProviders()
    const result = await refreshMarketData({
      userId: 'authenticated-user',
      storage: storage.storage,
      b3Cotahist: providers.b3Cotahist,
      twelveData: providers.twelveData,
      now: later,
    })
    expect(result.updatedPrices).toBe(0)
    expect(storage.storage.insertMarketPrices).not.toHaveBeenCalled()
  })

  it('does not persist an older B3 trading session', async () => {
    const storage = createStorage({
      assets: [{ id: 'asset-bbas3', ticker: 'BBAS3', status: 'active' }],
      prices: [
        {
          assetId: 'asset-bbas3',
          pricedAt: '2026-07-15T21:00:00.000Z',
          source: 'market-provider',
        },
      ],
    })
    const result = await refreshMarketData({
      userId: 'authenticated-user',
      storage: storage.storage,
      b3Cotahist: createProviders().b3Cotahist,
      twelveData: null,
      now: new Date('2026-07-16T22:00:00.000Z'),
    })
    expect(result.updatedPrices).toBe(0)
  })

  it('persists a new B3 trading session', async () => {
    const storage = createStorage({
      assets: [{ id: 'asset-bbas3', ticker: 'BBAS3', status: 'active' }],
      prices: [
        {
          assetId: 'asset-bbas3',
          pricedAt: '2026-07-13T21:00:00.000Z',
          source: 'market-provider',
        },
      ],
    })
    const { result } = await runRefresh({ storage })
    expect(result.updatedPrices).toBe(1)
  })

  it('skips a fresh automatic exchange rate', async () => {
    const storage = createStorage({
      assets: [],
      rates: [
        {
          baseCurrency: 'USD',
          quoteCurrency: 'BRL',
          pricedAt: '2026-07-14T21:30:00.000Z',
          source: 'market-provider',
        },
      ],
    })
    const { result, providers } = await runRefresh({ storage })
    expect(result.skippedFreshExchangeRates).toBe(1)
    expect(providers.twelveData.getUsdBrlQuote).not.toHaveBeenCalled()
  })

  it('does not let a manual exchange rate block automatic refresh', async () => {
    const storage = createStorage({
      assets: [],
      rates: [
        {
          baseCurrency: 'USD',
          quoteCurrency: 'BRL',
          pricedAt: '2026-07-14T21:59:00.000Z',
          source: 'manual',
        },
      ],
    })
    const { providers } = await runRefresh({ storage })
    expect(providers.twelveData.getUsdBrlQuote).toHaveBeenCalledOnce()
  })

  it('does not expose raw provider or archive payloads', async () => {
    const providers = createProviders()
    providers.b3Cotahist.getAssetQuotes.mockRejectedValueOnce(
      new Error('secret raw COTAHIST archive')
    )
    providers.twelveData.getAssetQuote.mockRejectedValueOnce(
      new Error('secret raw Twelve payload')
    )
    const { result } = await runRefresh({ providers })
    expect(JSON.stringify(result)).not.toContain('secret raw')
  })
})
