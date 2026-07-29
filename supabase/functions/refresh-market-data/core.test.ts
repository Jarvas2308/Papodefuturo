import { describe, expect, it, vi } from 'vitest'
import { refreshMarketData, type MarketDataStorage } from './core.ts'
import type {
  ExchangeRateInsert,
  MarketPriceInsert,
  StoredExchangeRate,
  StoredMarketPrice,
} from './types.ts'

const now = new Date('2026-07-14T22:00:00.000Z')

function createStorage(input?: {
  prices?: StoredMarketPrice[]
  rates?: StoredExchangeRate[]
}) {
  const insertedPrices: MarketPriceInsert[][] = []
  const insertedRates: ExchangeRateInsert[] = []
  const storage: MarketDataStorage = {
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
  now?: Date
}) {
  const storage = options?.storage ?? createStorage()
  const providers = options?.providers ?? createProviders()
  const result = await refreshMarketData({
    storage: storage.storage,
    b3Cotahist: providers.b3Cotahist,
    twelveData:
      options?.twelveConfigured === false ? null : providers.twelveData,
    now: options?.now ?? now,
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
      'TAEE11',
      'WEGE3',
      'PSSA3',
      'KNRI11',
      'VISC11',
      'XPLG11',
      'HGRU11',
    ])
  })

  it('uses Twelve Data for US assets', async () => {
    const { providers } = await runRefresh()
    expect(providers.twelveData.getAssetQuote).toHaveBeenCalledWith('VOO')
    expect(providers.twelveData.getAssetQuote).toHaveBeenCalledWith('VNQ')
    expect(providers.twelveData.getAssetQuote).toHaveBeenCalledWith('VEA')
  })

  it('keeps B3 working when the Twelve Data secret is absent', async () => {
    const { result, providers } = await runRefresh({ twelveConfigured: false })
    expect(result.updatedPrices).toBe(9)
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
    expect(providers.twelveData.getAssetQuote).toHaveBeenCalledTimes(3)
    expect(result.updatedPrices).toBe(3)
  })

  it('keeps B3 working when a Twelve Data asset fails', async () => {
    const providers = createProviders()
    providers.twelveData.getAssetQuote.mockRejectedValueOnce(
      new Error('raw provider payload')
    )
    const { result } = await runRefresh({ providers })
    expect(providers.b3Cotahist.getAssetQuotes).toHaveBeenCalledOnce()
    expect(result.updatedPrices).toBe(11)
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
    expect(result.updatedPrices).toBe(4)
  })

  it('inserts valid B3 and US quotes in one batch', async () => {
    const { storage } = await runRefresh()
    expect(storage.storage.insertMarketPrices).toHaveBeenCalledOnce()
    expect(storage.insertedPrices[0]).toHaveLength(12)
  })

  it('stamps ticker, market and market-provider source in every price row', async () => {
    const { storage } = await runRefresh()
    expect(
      storage.insertedPrices[0]?.every(
        (row) =>
          typeof row.ticker === 'string' &&
          (row.market === 'BR' || row.market === 'US') &&
          row.source === 'market-provider'
      )
    ).toBe(true)
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
      prices: [
        {
          ticker: 'BBAS3',
          pricedAt: '2026-07-14T21:30:00.000Z',
          source: 'market-provider',
        },
      ],
    })
    const { result, providers } = await runRefresh({ storage })
    expect(result.skippedFreshPrices).toBe(1)
    expect(providers.b3Cotahist.getAssetQuotes).toHaveBeenCalledWith([
      'ITSA4',
      'TAEE11',
      'WEGE3',
      'PSSA3',
      'KNRI11',
      'VISC11',
      'XPLG11',
      'HGRU11',
    ])
  })

  it('does not duplicate the same B3 trading session', async () => {
    const storage = createStorage({
      prices: [
        {
          ticker: 'BBAS3',
          pricedAt: '2026-07-14T21:00:00.000Z',
          source: 'market-provider',
        },
      ],
    })
    const later = new Date('2026-07-15T12:00:00.000Z')
    const { result } = await runRefresh({ storage, now: later })
    expect(result.skippedFreshPrices).toBe(0)
    const bbas3Row = result.updatedPrices
    expect(bbas3Row).toBe(11)
  })

  it('does not persist an older B3 trading session', async () => {
    const storage = createStorage({
      prices: [
        {
          ticker: 'BBAS3',
          pricedAt: '2026-07-15T21:00:00.000Z',
          source: 'market-provider',
        },
      ],
    })
    const { result } = await runRefresh({
      storage,
      now: new Date('2026-07-16T22:00:00.000Z'),
    })
    expect(result.updatedPrices).toBe(11)
  })

  it('persists a new B3 trading session', async () => {
    const storage = createStorage({
      prices: [
        {
          ticker: 'BBAS3',
          pricedAt: '2026-07-13T21:00:00.000Z',
          source: 'market-provider',
        },
      ],
    })
    const { result } = await runRefresh({ storage })
    expect(result.updatedPrices).toBe(12)
  })

  it('skips a fresh automatic exchange rate', async () => {
    const storage = createStorage({
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
