import { SERVER_CLOSED_ASSET_UNIVERSE } from '../_shared/closedAssetUniverse.ts'
import {
  getLatestAutomaticFact,
  isAutomaticFactFresh,
  isReferenceRateFreshForToday,
  isStrictlyNewerTimestamp,
} from './freshness.ts'
import type {
  ExchangeRateInsert,
  ExchangeRateQuote,
  MarketDataRefreshResult,
  MarketDataWarning,
  MarketPriceInsert,
  MarketQuote,
  ReferenceRateInsert,
  StoredExchangeRate,
  StoredMarketPrice,
  StoredReferenceRate,
} from './types.ts'
import type { NtnbLongaRate } from './tesouroTransparenteProvider.ts'

type B3CotahistProvider = {
  getAssetQuotes(tickers: readonly string[]): Promise<MarketQuote[]>
}

type TwelveDataProvider = {
  getAssetQuote(ticker: string): Promise<MarketQuote>
  getUsdBrlQuote(): Promise<ExchangeRateQuote>
}

type TesouroTransparenteProvider = {
  getNtnbLongaRate(): Promise<NtnbLongaRate>
}

export type MarketDataStorage = {
  listMarketPrices(): Promise<StoredMarketPrice[]>
  listMarketExchangeRates(): Promise<StoredExchangeRate[]>
  listMarketReferenceRates(): Promise<StoredReferenceRate[]>
  insertMarketPrices(rows: readonly MarketPriceInsert[]): Promise<void>
  insertMarketExchangeRate(row: ExchangeRateInsert): Promise<void>
  insertMarketReferenceRate(row: ReferenceRateInsert): Promise<void>
}

export type RefreshMarketDataInput = {
  storage: MarketDataStorage
  b3Cotahist: B3CotahistProvider
  twelveData: TwelveDataProvider | null
  tesouroTransparente: TesouroTransparenteProvider | null
  now?: Date
}

function providerFailureWarning(
  provider: 'b3-cotahist' | 'twelve-data' | 'tesouro-transparente',
  ticker: string
): MarketDataWarning {
  return {
    provider,
    kind: 'provider-failed',
    ticker,
    message: `Não foi possível atualizar a cotação automática de ${ticker}.`,
  }
}

function storageFailureWarning(scope: string): MarketDataWarning {
  return {
    provider: 'storage',
    kind: 'storage-failed',
    message: `Não foi possível gravar ${scope} nesta execução.`,
  }
}

// A RPC de upsert e' transacional e recusa o lote inteiro diante de uma unica
// linha invalida. Duas defesas antes de enviar, porque uma execucao parcial e'
// muito melhor que nenhuma:
//   1. descartar preco nao positivo, que viola
//      market_asset_prices_price_minor_positive;
//   2. deduplicar por (ticker, source, priced_at), porque ON CONFLICT DO
//      UPDATE falha com 21000 se a mesma chave aparecer duas vezes no mesmo
//      comando.
export function sanitizeMarketPriceRows(rows: readonly MarketPriceInsert[]): {
  rows: MarketPriceInsert[]
  discarded: number
} {
  const byIdentity = new Map<string, MarketPriceInsert>()
  let discarded = 0

  for (const row of rows) {
    if (!Number.isSafeInteger(row.price_minor) || row.price_minor <= 0) {
      discarded += 1
      continue
    }

    const identity = `${row.ticker}|${row.source}|${row.priced_at}`

    if (byIdentity.has(identity)) {
      discarded += 1
      continue
    }

    byIdentity.set(identity, row)
  }

  return { rows: Array.from(byIdentity.values()), discarded }
}

function staleQuoteWarning(
  provider: 'b3-cotahist' | 'twelve-data' | 'tesouro-transparente',
  ticker: string
): MarketDataWarning {
  return {
    provider,
    kind: 'stale-quote',
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
  tesouroTransparente,
  now = new Date(),
}: RefreshMarketDataInput): Promise<MarketDataRefreshResult> {
  const warnings: MarketDataWarning[] = []
  const [persistedPrices, persistedRates, persistedReferenceRates] =
    await Promise.all([
      storage.listMarketPrices(),
      storage.listMarketExchangeRates(),
      storage.listMarketReferenceRates(),
    ])
  const latestPriceByTicker = getLatestPriceByTicker(persistedPrices)
  const latestAutomaticRate = getLatestAutomaticFact(persistedRates)

  if (!twelveData) {
    warnings.push({
      provider: 'configuration',
      kind: 'configuration',
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

  const sanitizedPrices = sanitizeMarketPriceRows(priceRows)
  let persistedPriceCount = 0

  if (sanitizedPrices.discarded > 0) {
    warnings.push(
      storageFailureWarning(
        `${sanitizedPrices.discarded} cotação(ões) com dado inconsistente`
      )
    )
  }

  if (sanitizedPrices.rows.length > 0) {
    // Uma falha de escrita vira warning, nunca 500: o cron dispara via pg_net
    // e um 500 aqui e' invisivel em cron.job_run_details. Degradar mantem o
    // restante do resultado utilizavel e observavel.
    try {
      await storage.insertMarketPrices(sanitizedPrices.rows)
      persistedPriceCount = sanitizedPrices.rows.length
    } catch {
      warnings.push(storageFailureWarning('as cotações de mercado'))
    }
  }

  let updatedExchangeRates = 0
  let skippedFreshExchangeRates = 0

  if (isAutomaticFactFresh(latestAutomaticRate, now)) {
    skippedFreshExchangeRates = 1
  } else if (twelveData) {
    try {
      const quote = await twelveData.getUsdBrlQuote()

      if (isStrictlyNewerTimestamp(quote.pricedAt, latestAutomaticRate)) {
        if (!Number.isSafeInteger(quote.rateScaled) || quote.rateScaled <= 0) {
          warnings.push(
            storageFailureWarning('a cotação USD/BRL inconsistente')
          )
        } else {
          await storage.insertMarketExchangeRate({
            base_currency: 'USD',
            quote_currency: 'BRL',
            rate_scaled: quote.rateScaled,
            rate_scale: 1_000_000,
            priced_at: quote.pricedAt,
            source: 'market-provider',
          })
          updatedExchangeRates = 1
        }
      } else {
        warnings.push(staleQuoteWarning('twelve-data', 'USDBRL'))
      }
    } catch {
      warnings.push(providerFailureWarning('twelve-data', 'USDBRL'))
    }
  }

  let updatedReferenceRates = 0
  let skippedFreshReferenceRates = 0
  const latestNtnbLonga =
    persistedReferenceRates.find((rate) => rate.series === 'ntnb-longa') ??
    null

  if (
    isReferenceRateFreshForToday(latestNtnbLonga?.pricedAt ?? null, now)
  ) {
    skippedFreshReferenceRates = 1
  } else if (tesouroTransparente) {
    try {
      const rate = await tesouroTransparente.getNtnbLongaRate()

      if (!latestNtnbLonga || rate.pricedAt > latestNtnbLonga.pricedAt) {
        await storage.insertMarketReferenceRate({
          series: 'ntnb-longa',
          maturity_date: rate.maturityDate,
          rate_scaled: rate.rateScaled,
          rate_scale: 1_000_000,
          priced_at: rate.pricedAt,
          source: 'tesouro-transparente',
        })
        updatedReferenceRates = 1
      } else {
        warnings.push(staleQuoteWarning('tesouro-transparente', 'NTNB'))
      }
    } catch {
      warnings.push(providerFailureWarning('tesouro-transparente', 'NTNB'))
    }
  } else {
    warnings.push({
      provider: 'configuration',
      kind: 'configuration',
      message: 'Tesouro Transparente não está configurado para atualização automática.',
    })
  }

  return {
    refreshedAt: now.toISOString(),
    updatedPrices: persistedPriceCount,
    skippedFreshPrices,
    updatedExchangeRates,
    skippedFreshExchangeRates,
    updatedReferenceRates,
    skippedFreshReferenceRates,
    warnings,
  }
}
