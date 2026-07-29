import { SERVER_CLOSED_ASSET_UNIVERSE } from '../_shared/closedAssetUniverse.ts'
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
  StoredExchangeRate,
  StoredMarketPrice,
} from './types.ts'

type B3CotahistProvider = {
  getAssetQuotes(tickers: readonly string[]): Promise<MarketQuote[]>
}

type TwelveDataProvider = {
  getAssetQuote(ticker: string): Promise<MarketQuote>
  getUsdBrlQuote(): Promise<ExchangeRateQuote>
}

export type MarketDataStorage = {
  listMarketPrices(): Promise<StoredMarketPrice[]>
  listMarketExchangeRates(): Promise<StoredExchangeRate[]>
  insertMarketPrices(rows: readonly MarketPriceInsert[]): Promise<void>
  insertMarketExchangeRate(row: ExchangeRateInsert): Promise<void>
}

export type RefreshMarketDataInput = {
  storage: MarketDataStorage
  b3Cotahist: B3CotahistProvider
  twelveData: TwelveDataProvider | null
  now?: Date
}

function providerFailureWarning(
  provider: 'b3-cotahist' | 'twelve-data',
  ticker: string
): MarketDataWarning {
  return {
    provider,
    ticker,
    message: `Não foi possível atualizar a cotação automática de ${ticker}.`,
  }
}

function staleQuoteWarning(
  provider: 'b3-cotahist' | 'twelve-data',
  ticker: string
): MarketDataWarning {
  return {
    provider,
    ticker,
    message: `A cotação automática de ${ticker} não é mais recente que a armazenada.`,
  }
}

function getLatestPriceByTicker(prices: readonly StoredMarketPrice[]) {
  const grouped = new Map<string, StoredMarketPrice[]>()

  for (const price of prices) {
    const current = grouped.get(price.ticker) ?? []
    current.push(price)
    grouped.set(price.ticker, current)
  }

  return new Map(
    Array.from(grouped, ([ticker, facts]) => [
      ticker,
      getLatestAutomaticFact(facts),
    ])
  )
}

export async function refreshMarketData({
  storage,
  b3Cotahist,
  twelveData,
  now = new Date(),
}: RefreshMarketDataInput): Promise<MarketDataRefreshResult> {
  const warnings: MarketDataWarning[] = []
  const [persistedPrices, persistedRates] = await Promise.all([
    storage.listMarketPrices(),
    storage.listMarketExchangeRates(),
  ])
  const latestPriceByTicker = getLatestPriceByTicker(persistedPrices)
  const latestAutomaticRate = getLatestAutomaticFact(persistedRates)

  if (!twelveData) {
    warnings.push({
      provider: 'configuration',
      message: 'Twelve Data não está configurada para atualização automática.',
    })
  }

  let skippedFreshPrices = 0
  const staleAssets = SERVER_CLOSED_ASSET_UNIVERSE.filter((definition) => {
    const latest = latestPriceByTicker.get(definition.ticker) ?? null

    if (isAutomaticFactFresh(latest, now)) {
      skippedFreshPrices += 1
      return false
    }

    return true
  })
  const brazilianAssets = staleAssets.filter(
    (definition) => definition.market === 'BR'
  )
  const usAssets = staleAssets.filter(
    (definition) => definition.market === 'US'
  )
  const priceRows: MarketPriceInsert[] = []

  if (brazilianAssets.length > 0) {
    try {
      const quotes = await b3Cotahist.getAssetQuotes(
        brazilianAssets.map((definition) => definition.ticker)
      )
      const quoteByTicker = new Map(
        quotes.map((quote) => [quote.ticker.toUpperCase(), quote])
      )

      for (const definition of brazilianAssets) {
        const quote = quoteByTicker.get(definition.ticker)
        const latest = latestPriceByTicker.get(definition.ticker) ?? null

        if (!quote) {
          warnings.push(
            providerFailureWarning('b3-cotahist', definition.ticker)
          )
          continue
        }

        if (!isStrictlyNewerTimestamp(quote.pricedAt, latest)) {
          warnings.push(staleQuoteWarning('b3-cotahist', definition.ticker))
          continue
        }

        priceRows.push({
          ticker: definition.ticker,
          market: definition.market,
          price_minor: quote.priceInMinorUnits,
          currency: definition.currency,
          priced_at: quote.pricedAt,
          source: 'market-provider',
        })
      }
    } catch {
      for (const definition of brazilianAssets) {
        warnings.push(providerFailureWarning('b3-cotahist', definition.ticker))
      }
    }
  }

  if (twelveData) {
    for (const definition of usAssets) {
      const latest = latestPriceByTicker.get(definition.ticker) ?? null

      try {
        const quote = await twelveData.getAssetQuote(definition.ticker)

        if (!isStrictlyNewerTimestamp(quote.pricedAt, latest)) {
          warnings.push(staleQuoteWarning('twelve-data', definition.ticker))
          continue
        }

        priceRows.push({
          ticker: definition.ticker,
          market: definition.market,
          price_minor: quote.priceInMinorUnits,
          currency: definition.currency,
          priced_at: quote.pricedAt,
          source: 'market-provider',
        })
      } catch {
        warnings.push(providerFailureWarning('twelve-data', definition.ticker))
      }
    }
  }

  if (priceRows.length > 0) {
    await storage.insertMarketPrices(priceRows)
  }

  let updatedExchangeRates = 0
  let skippedFreshExchangeRates = 0

  if (isAutomaticFactFresh(latestAutomaticRate, now)) {
    skippedFreshExchangeRates = 1
  } else if (twelveData) {
    try {
      const quote = await twelveData.getUsdBrlQuote()

      if (isStrictlyNewerTimestamp(quote.pricedAt, latestAutomaticRate)) {
        await storage.insertMarketExchangeRate({
          base_currency: 'USD',
          quote_currency: 'BRL',
          rate_scaled: quote.rateScaled,
          rate_scale: 1_000_000,
          priced_at: quote.pricedAt,
          source: 'market-provider',
        })
        updatedExchangeRates = 1
      } else {
        warnings.push(staleQuoteWarning('twelve-data', 'USDBRL'))
      }
    } catch {
      warnings.push(providerFailureWarning('twelve-data', 'USDBRL'))
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
