import { describe, expect, it, vi } from 'vitest'
import {
  refreshMarketData,
  sanitizeMarketPriceRows,
  type MarketDataStorage,
} from './core.ts'
import type {
  ExchangeRateInsert,
  MarketPriceInsert,
  ReferenceRateInsert,
  StoredExchangeRate,
  StoredMarketPrice,
  StoredReferenceRate,
} from './types.ts'

const now = new Date('2026-07-14T22:00:00.000Z')

// Fresco por padrao para o dia de `now` (2026-07-14) - testes existentes nao
// sabem de taxa de referencia e nao devem ganhar warning/insert novo so por
// causa dela, a menos que o proprio teste passe `referenceRates` explicito.
const DEFAULT_REFERENCE_RATES: StoredReferenceRate[] = [
  { series: 'ntnb-longa', pricedAt: '2026-07-14' },
]

function createStorage(input?: {
  prices?: StoredMarketPrice[]
  rates?: StoredExchangeRate[]
  referenceRates?: StoredReferenceRate[]
}) {
  const insertedPrices: MarketPriceInsert[][] = []
  const insertedRates: ExchangeRateInsert[] = []
  const insertedReferenceRates: ReferenceRateInsert[] = []
  const storage: MarketDataStorage = {
    listMarketPrices: vi.fn().mockResolvedValue(input?.prices ?? []),
    listMarketExchangeRates: vi.fn().mockResolvedValue(input?.rates ?? []),
    listMarketReferenceRates: vi
      .fn()
      .mockResolvedValue(input?.referenceRates ?? DEFAULT_REFERENCE_RATES),
    insertMarketPrices: vi.fn().mockImplementation(async (rows) => {
      insertedPrices.push([...rows])
    }),
    insertMarketExchangeRate: vi.fn().mockImplementation(async (row) => {
      insertedRates.push(row)
    }),
    insertMarketReferenceRate: vi.fn().mockImplementation(async (row) => {
      insertedReferenceRates.push(row)
    }),
  }

  return { storage, insertedPrices, insertedRates, insertedReferenceRates }
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
    tesouroTransparente: {
      getNtnbLongaRate: vi.fn().mockResolvedValue({
        series: 'ntnb-longa' as const,
        maturityDate: '2060-08-15',
        rateScaled: 7_650_000,
        rateScale: 1_000_000 as const,
        pricedAt: '2026-07-15',
        source: 'tesouro-transparente' as const,
      }),
    },
  }
}

async function runRefresh(options?: {
  storage?: ReturnType<typeof createStorage>
  providers?: ReturnType<typeof createProviders>
  twelveConfigured?: boolean
  tesouroConfigured?: boolean
  now?: Date
}) {
  const storage = options?.storage ?? createStorage()
  const providers = options?.providers ?? createProviders()
  const result = await refreshMarketData({
    storage: storage.storage,
    b3Cotahist: providers.b3Cotahist,
    twelveData:
      options?.twelveConfigured === false ? null : providers.twelveData,
    tesouroTransparente:
      options?.tesouroConfigured === false
        ? null
        : providers.tesouroTransparente,
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

describe('resilient persistence (DEC-062)', () => {
  it('drops non-positive prices instead of failing the whole batch', () => {
    const result = sanitizeMarketPriceRows([
      {
        ticker: 'BBAS3',
        market: 'BR',
        currency: 'BRL',
        price_minor: 2_078,
        priced_at: '2026-07-29T21:00:00.000Z',
        source: 'market-provider',
      },
      {
        ticker: 'ITSA4',
        market: 'BR',
        currency: 'BRL',
        price_minor: 0,
        priced_at: '2026-07-29T21:00:00.000Z',
        source: 'market-provider',
      },
    ])

    expect(result.discarded).toBe(1)
    expect(result.rows.map((row) => row.ticker)).toEqual(['BBAS3'])
  })

  it('deduplicates rows sharing ticker, source and priced_at', () => {
    const row: MarketPriceInsert = {
      ticker: 'BBAS3',
      market: 'BR',
      currency: 'BRL',
      price_minor: 2_078,
      priced_at: '2026-07-29T21:00:00.000Z',
      source: 'market-provider',
    }

    // ON CONFLICT DO UPDATE recusa o comando inteiro com 21000 quando a mesma
    // chave aparece duas vezes no lote.
    const result = sanitizeMarketPriceRows([row, { ...row }])

    expect(result.rows).toHaveLength(1)
    expect(result.discarded).toBe(1)
  })

  it('keeps distinct priced_at values for the same ticker', () => {
    const base: MarketPriceInsert = {
      ticker: 'BBAS3',
      market: 'BR',
      currency: 'BRL',
      price_minor: 2_078,
      priced_at: '2026-07-29T21:00:00.000Z',
      source: 'market-provider',
    }

    const result = sanitizeMarketPriceRows([
      base,
      { ...base, priced_at: '2026-07-30T21:00:00.000Z' },
    ])

    expect(result.rows).toHaveLength(2)
    expect(result.discarded).toBe(0)
  })

  it('degrades a price write failure into a warning instead of throwing', async () => {
    const storage = createStorage()
    storage.storage.insertMarketPrices = vi
      .fn()
      .mockRejectedValue(new Error('ON CONFLICT DO UPDATE...'))

    const { result } = await runRefresh({ storage })

    expect(result.warnings).toContainEqual({
      provider: 'storage',
      kind: 'storage-failed',
      message: 'Não foi possível gravar as cotações de mercado nesta execução.',
    })
    expect(result.updatedPrices).toBe(0)
  })

  it('reports only the prices actually persisted', async () => {
    const { result, storage } = await runRefresh()

    expect(result.updatedPrices).toBe(storage.insertedPrices[0].length)
  })
})

describe('reference rate (NTN-B)', () => {
  it('skips fetching when today already has a stored rate', async () => {
    const { result, providers } = await runRefresh()

    expect(
      providers.tesouroTransparente.getNtnbLongaRate
    ).not.toHaveBeenCalled()
    expect(result.skippedFreshReferenceRates).toBe(1)
    expect(result.updatedReferenceRates).toBe(0)
  })

  it('fetches and persists a new rate when the stored one is from a previous day', async () => {
    const storage = createStorage({
      referenceRates: [{ series: 'ntnb-longa', pricedAt: '2026-07-10' }],
    })
    const { result } = await runRefresh({ storage })

    expect(result.updatedReferenceRates).toBe(1)
    expect(result.skippedFreshReferenceRates).toBe(0)
    expect(storage.insertedReferenceRates[0]).toMatchObject({
      series: 'ntnb-longa',
      maturity_date: '2060-08-15',
      rate_scaled: 7_650_000,
      rate_scale: 1_000_000,
      priced_at: '2026-07-15',
      source: 'tesouro-transparente',
    })
  })

  it('fetches when there is no stored rate at all', async () => {
    const storage = createStorage({ referenceRates: [] })
    const { result } = await runRefresh({ storage })

    expect(result.updatedReferenceRates).toBe(1)
  })

  it('warns instead of persisting when the fetched rate is not newer', async () => {
    const storage = createStorage({
      referenceRates: [{ series: 'ntnb-longa', pricedAt: '2026-07-20' }],
    })
    const { result } = await runRefresh({ storage })

    expect(result.updatedReferenceRates).toBe(0)
    expect(result.skippedFreshReferenceRates).toBe(0)
    expect(result.warnings).toContainEqual(
      expect.objectContaining({
        provider: 'tesouro-transparente',
        kind: 'stale-quote',
      })
    )
  })

  it('warns without throwing when the provider fails', async () => {
    const storage = createStorage({
      referenceRates: [{ series: 'ntnb-longa', pricedAt: '2026-07-10' }],
    })
    const providers = createProviders()
    providers.tesouroTransparente.getNtnbLongaRate = vi
      .fn()
      .mockRejectedValue(new Error('CSV indisponível'))

    const { result } = await runRefresh({ storage, providers })

    expect(result.updatedReferenceRates).toBe(0)
    expect(result.warnings).toContainEqual(
      expect.objectContaining({
        provider: 'tesouro-transparente',
        kind: 'provider-failed',
      })
    )
  })

  it('warns with a configuration notice when Tesouro Transparente is not configured', async () => {
    const storage = createStorage({
      referenceRates: [{ series: 'ntnb-longa', pricedAt: '2026-07-10' }],
    })
    const { result } = await runRefresh({ storage, tesouroConfigured: false })

    expect(result.warnings).toContainEqual(
      expect.objectContaining({
        provider: 'configuration',
        kind: 'configuration',
      })
    )
  })
})
