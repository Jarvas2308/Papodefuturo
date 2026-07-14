import { CLOSED_ASSET_UNIVERSE } from '../../../src/data/assetUniverse.ts'
import {
  getLatestAutomaticFact,
  isAutomaticFactFresh,
  isStrictlyNewerTimestamp,
} from './freshness.ts'
import type {
  ExchangeRateInsert,
  ExchangeRateQuote,
  MarketDataRefreshResult,
  MarketDataWarning,
  MarketPriceInsert,
  MarketQuote,
  RefreshAsset,
  StoredExchangeRate,
  StoredMarketPrice,
} from './types.ts'

type HgBrasilProvider = {
  getAssetQuote(ticker: string): Promise<MarketQuote>
  getUsdBrlQuote(): Promise<ExchangeRateQuote>
}

type TwelveDataProvider = {
  getAssetQuote(ticker: string): Promise<MarketQuote>
}

export type MarketDataStorage = {
  listActiveAssets(): Promise<RefreshAsset[]>
  listMarketPrices(): Promise<StoredMarketPrice[]>
  listMarketExchangeRates(): Promise<StoredExchangeRate[]>
  insertMarketPrices(rows: readonly MarketPriceInsert[]): Promise<void>
  insertMarketExchangeRate(row: ExchangeRateInsert): Promise<void>
}

export type RefreshMarketDataInput = {
  userId: string
  storage: MarketDataStorage
  hgBrasil: HgBrasilProvider | null
  twelveData: TwelveDataProvider | null
  now?: Date
  createId?: () => string
}

const universeByTicker = new Map(
  CLOSED_ASSET_UNIVERSE.map((asset) => [asset.ticker.toUpperCase(), asset])
)

function providerFailureWarning(
  provider: 'hg-brasil' | 'twelve-data',
  ticker: string
): MarketDataWarning {
  return {
    provider,
    ticker,
    message: `Não foi possível atualizar a cotação automática de ${ticker}.`,
  }
}

function getLatestPriceByAsset(prices: readonly StoredMarketPrice[]) {
  const grouped = new Map<string, StoredMarketPrice[]>()

  for (const price of prices) {
    const current = grouped.get(price.assetId) ?? []
    current.push(price)
    grouped.set(price.assetId, current)
  }

  return new Map(
    Array.from(grouped, ([assetId, facts]) => [
      assetId,
      getLatestAutomaticFact(facts),
    ])
  )
}

export async function refreshMarketData({
  userId,
  storage,
  hgBrasil,
  twelveData,
  now = new Date(),
  createId = () => crypto.randomUUID(),
}: RefreshMarketDataInput): Promise<MarketDataRefreshResult> {
  const warnings: MarketDataWarning[] = []
  const [activeAssets, persistedPrices, persistedRates] = await Promise.all([
    storage.listActiveAssets(),
    storage.listMarketPrices(),
    storage.listMarketExchangeRates(),
  ])
  const latestPriceByAsset = getLatestPriceByAsset(persistedPrices)
  const latestAutomaticRate = getLatestAutomaticFact(persistedRates)
  const eligibleAssets = activeAssets.flatMap((asset) => {
    const definition = universeByTicker.get(asset.ticker.trim().toUpperCase())

    if (asset.status !== 'active' || !definition) {
      return []
    }

    return [{ asset, definition }]
  })
  const hasUsAssets = eligibleAssets.some(
    ({ definition }) => definition.market === 'US'
  )

  if (!hgBrasil) {
    warnings.push({
      provider: 'configuration',
      message: 'HG Brasil não está configurada para atualização automática.',
    })
  }

  if (!twelveData && hasUsAssets) {
    warnings.push({
      provider: 'configuration',
      message: 'Twelve Data não está configurada para atualização automática.',
    })
  }

  let skippedFreshPrices = 0
  const priceRows: MarketPriceInsert[] = []

  for (const { asset, definition } of eligibleAssets) {
    const latest = latestPriceByAsset.get(asset.id) ?? null

    if (isAutomaticFactFresh(latest, now)) {
      skippedFreshPrices += 1
      continue
    }

    const provider = definition.market === 'BR' ? hgBrasil : twelveData

    if (
      !provider ||
      (definition.market !== 'BR' && definition.market !== 'US')
    ) {
      continue
    }

    try {
      const quote = await provider.getAssetQuote(definition.ticker)

      if (!isStrictlyNewerTimestamp(quote.pricedAt, latest)) {
        warnings.push({
          provider: definition.market === 'BR' ? 'hg-brasil' : 'twelve-data',
          ticker: definition.ticker,
          message: `A cotação automática de ${definition.ticker} não é mais recente que a armazenada.`,
        })
        continue
      }

      priceRows.push({
        id: createId(),
        user_id: userId,
        asset_id: asset.id,
        price_minor: quote.priceInMinorUnits,
        currency: definition.currency,
        priced_at: quote.pricedAt,
        source: 'market-provider',
      })
    } catch {
      warnings.push(
        providerFailureWarning(
          definition.market === 'BR' ? 'hg-brasil' : 'twelve-data',
          definition.ticker
        )
      )
    }
  }

  if (priceRows.length > 0) {
    await storage.insertMarketPrices(priceRows)
  }

  let updatedExchangeRates = 0
  let skippedFreshExchangeRates = 0

  if (isAutomaticFactFresh(latestAutomaticRate, now)) {
    skippedFreshExchangeRates = 1
  } else if (hgBrasil) {
    try {
      const quote = await hgBrasil.getUsdBrlQuote()

      if (isStrictlyNewerTimestamp(quote.pricedAt, latestAutomaticRate)) {
        await storage.insertMarketExchangeRate({
          id: createId(),
          user_id: userId,
          base_currency: 'USD',
          quote_currency: 'BRL',
          rate_scaled: quote.rateScaled,
          rate_scale: 1_000_000,
          priced_at: quote.pricedAt,
          source: 'market-provider',
        })
        updatedExchangeRates = 1
      } else {
        warnings.push({
          provider: 'hg-brasil',
          ticker: 'USDBRL',
          message:
            'A cotação automática de USD/BRL não é mais recente que a armazenada.',
        })
      }
    } catch {
      warnings.push(providerFailureWarning('hg-brasil', 'USDBRL'))
    }
  }

  return {
    refreshedAt: now.toISOString(),
    updatedPrices: priceRows.length,
    skippedFreshPrices,
    updatedExchangeRates,
    skippedFreshExchangeRates,
    warnings,
  }
}
