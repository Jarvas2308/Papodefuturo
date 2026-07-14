import { describe, expect, it, vi } from 'vitest'
import { refreshMarketData, type MarketDataStorage } from './core.ts'
import type {
  ExchangeRateInsert,
  MarketPriceInsert,
  RefreshAsset,
  StoredExchangeRate,
  StoredMarketPrice,
} from './types.ts'

const now = new Date('2026-07-14T16:00:00.000Z')

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
    hgBrasil: {
      getAssetQuote: vi.fn().mockImplementation(async (ticker: string) => ({
        ticker,
        currency: 'BRL' as const,
        priceInMinorUnits: 3_817,
        pricedAt: '2026-07-14T15:30:00.000Z',
      })),
      getUsdBrlQuote: vi.fn().mockResolvedValue({
        ticker: 'USDBRL' as const,
        baseCurrency: 'USD' as const,
        quoteCurrency: 'BRL' as const,
        rateScaled: 5_432_100,
        pricedAt: '2026-07-14T15:30:00.000Z',
      }),
    },
    twelveData: {
      getAssetQuote: vi.fn().mockImplementation(async (ticker: string) => ({
        ticker,
        currency: 'USD' as const,
        priceInMinorUnits: 52_045,
        pricedAt: '2026-07-14T15:30:00.000Z',
      })),
    },
  }
}

async function runRefresh(options?: {
  storage?: ReturnType<typeof createStorage>
  providers?: ReturnType<typeof createProviders>
  hgConfigured?: boolean
  twelveConfigured?: boolean
}) {
  const storage = options?.storage ?? createStorage()
  const providers = options?.providers ?? createProviders()
  let id = 0
  const result = await refreshMarketData({
    userId: 'authenticated-user',
    storage: storage.storage,
    hgBrasil: options?.hgConfigured === false ? null : providers.hgBrasil,
    twelveData:
      options?.twelveConfigured === false ? null : providers.twelveData,
    now,
    createId: () => `generated-${++id}`,
  })

  return { result, storage, providers }
}

describe('market data refresh core', () => {
  it('uses HG Brasil for a Brazilian asset', async () => {
    const { providers } = await runRefresh()
    expect(providers.hgBrasil.getAssetQuote).toHaveBeenCalledWith('BBAS3')
  })

  it('uses Twelve Data for a US asset', async () => {
    const { providers } = await runRefresh()
    expect(providers.twelveData.getAssetQuote).toHaveBeenCalledWith('VOO')
  })

  it('updates only active assets', async () => {
    const storage = createStorage({
      assets: [{ id: 'inactive', ticker: 'ITSA4', status: 'inactive' }],
    })
    const { result, providers } = await runRefresh({ storage })

    expect(result.updatedPrices).toBe(0)
    expect(providers.hgBrasil.getAssetQuote).not.toHaveBeenCalled()
  })

  it('ignores assets outside the closed universe', async () => {
    const storage = createStorage({
      assets: [{ id: 'outside', ticker: 'OTHER', status: 'active' }],
    })
    const { result, providers } = await runRefresh({ storage })

    expect(result.updatedPrices).toBe(0)
    expect(providers.hgBrasil.getAssetQuote).not.toHaveBeenCalled()
    expect(providers.twelveData.getAssetQuote).not.toHaveBeenCalled()
  })

  it('returns a configuration warning when HG Brasil is absent', async () => {
    const { result, providers } = await runRefresh({ hgConfigured: false })

    expect(result.warnings).toContainEqual(
      expect.objectContaining({ provider: 'configuration' })
    )
    expect(providers.hgBrasil.getAssetQuote).not.toHaveBeenCalled()
    expect(result.updatedPrices).toBe(1)
  })

  it('returns a configuration warning when Twelve Data is absent', async () => {
    const { result, providers } = await runRefresh({ twelveConfigured: false })

    expect(result.warnings).toContainEqual(
      expect.objectContaining({ provider: 'configuration' })
    )
    expect(providers.twelveData.getAssetQuote).not.toHaveBeenCalled()
    expect(result.updatedPrices).toBe(1)
  })

  it('succeeds with zero updates when both provider secrets are absent', async () => {
    const { result } = await runRefresh({
      hgConfigured: false,
      twelveConfigured: false,
    })

    expect(result).toMatchObject({
      updatedPrices: 0,
      updatedExchangeRates: 0,
    })
    expect(result.warnings).toHaveLength(2)
  })

  it('keeps valid results when one asset fails', async () => {
    const providers = createProviders()
    providers.hgBrasil.getAssetQuote.mockRejectedValueOnce(
      new Error('raw provider payload')
    )
    const { result, storage } = await runRefresh({ providers })

    expect(result.updatedPrices).toBe(1)
    expect(storage.insertedPrices[0]?.[0]?.asset_id).toBe('asset-voo')
    expect(result.warnings).toContainEqual(
      expect.objectContaining({ provider: 'hg-brasil', ticker: 'BBAS3' })
    )
  })

  it('does not let an HG Brasil failure prevent Twelve Data', async () => {
    const providers = createProviders()
    providers.hgBrasil.getAssetQuote.mockRejectedValueOnce(new Error('failed'))
    await runRefresh({ providers })
    expect(providers.twelveData.getAssetQuote).toHaveBeenCalledOnce()
  })

  it('does not let a Twelve Data failure prevent HG Brasil', async () => {
    const providers = createProviders()
    providers.twelveData.getAssetQuote.mockRejectedValueOnce(
      new Error('failed')
    )
    await runRefresh({ providers })
    expect(providers.hgBrasil.getAssetQuote).toHaveBeenCalledOnce()
    expect(providers.hgBrasil.getUsdBrlQuote).toHaveBeenCalledOnce()
  })

  it('inserts all valid asset quotes in one batch', async () => {
    const { storage } = await runRefresh()
    expect(storage.storage.insertMarketPrices).toHaveBeenCalledOnce()
    expect(storage.insertedPrices[0]).toHaveLength(2)
  })

  it('uses the authenticated user id in every inserted fact', async () => {
    const { storage } = await runRefresh()
    expect(
      storage.insertedPrices[0]?.every(
        (row) => row.user_id === 'authenticated-user'
      )
    ).toBe(true)
    expect(storage.insertedRates[0]?.user_id).toBe('authenticated-user')
  })

  it('composes automatic USD/BRL as an append-only market-provider fact', async () => {
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

  it('skips fresh automatic facts without calling providers', async () => {
    const storage = createStorage({
      assets: [{ id: 'asset-bbas3', ticker: 'BBAS3', status: 'active' }],
      prices: [
        {
          assetId: 'asset-bbas3',
          pricedAt: '2026-07-14T15:30:00.000Z',
          source: 'market-provider',
        },
      ],
      rates: [
        {
          baseCurrency: 'USD',
          quoteCurrency: 'BRL',
          pricedAt: '2026-07-14T15:30:00.000Z',
          source: 'market-provider',
        },
      ],
    })
    const { result, providers } = await runRefresh({ storage })

    expect(result.skippedFreshPrices).toBe(1)
    expect(result.skippedFreshExchangeRates).toBe(1)
    expect(providers.hgBrasil.getAssetQuote).not.toHaveBeenCalled()
    expect(providers.hgBrasil.getUsdBrlQuote).not.toHaveBeenCalled()
  })

  it('does not expose raw provider payloads in the structured result', async () => {
    const providers = createProviders()
    providers.hgBrasil.getAssetQuote.mockRejectedValueOnce(
      new Error('secret raw provider payload')
    )
    const { result } = await runRefresh({ providers })
    expect(JSON.stringify(result)).not.toContain('secret raw provider payload')
  })
})
