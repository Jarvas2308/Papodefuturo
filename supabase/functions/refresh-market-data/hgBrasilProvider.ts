import { decimalToExchangeRateScaled, decimalToMinorUnits } from './decimal.ts'
import { normalizeProviderTimestamp } from './timestamps.ts'
import type { ExchangeRateQuote, MarketQuote } from './types.ts'

type FetchLike = typeof fetch

type HgQuotePayload = {
  ticker?: unknown
  symbol?: unknown
  currency?: unknown
  quote?: {
    value?: unknown
    updated_at?: unknown
  }
}

function readHgQuote(payload: unknown): HgQuotePayload {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Resposta de cotação inválida da HG Brasil.')
  }

  const results = (payload as { results?: unknown }).results

  if (Array.isArray(results) && results[0]) {
    return results[0] as HgQuotePayload
  }

  if (results && typeof results === 'object') {
    const values = Object.values(results)

    if (values[0] && typeof values[0] === 'object') {
      return values[0] as HgQuotePayload
    }
  }

  throw new Error('Resposta de cotação inválida da HG Brasil.')
}

function readSymbol(quote: HgQuotePayload): string {
  const symbol = quote.ticker ?? quote.symbol

  if (typeof symbol !== 'string') {
    throw new Error('Símbolo ausente na cotação da HG Brasil.')
  }

  return symbol.toUpperCase()
}

export function parseHgBrasilAssetQuote(
  payload: unknown,
  ticker: string
): MarketQuote {
  const expectedSymbol = `B3:${ticker.toUpperCase()}`
  const quote = readHgQuote(payload)

  if (readSymbol(quote) !== expectedSymbol) {
    throw new Error('Símbolo inesperado na cotação da HG Brasil.')
  }

  if (quote.currency !== 'BRL') {
    throw new Error('Moeda inesperada na cotação da HG Brasil.')
  }

  return {
    ticker: ticker.toUpperCase(),
    currency: 'BRL',
    priceInMinorUnits: decimalToMinorUnits(quote.quote?.value),
    pricedAt: normalizeProviderTimestamp(quote.quote?.updated_at),
  }
}

export function parseHgBrasilUsdBrlQuote(payload: unknown): ExchangeRateQuote {
  const quote = readHgQuote(payload)

  if (readSymbol(quote) !== 'FOREX:USDBRL') {
    throw new Error('Símbolo inesperado na cotação de câmbio da HG Brasil.')
  }

  if (quote.currency !== undefined && quote.currency !== 'BRL') {
    throw new Error('Moeda inesperada na cotação de câmbio da HG Brasil.')
  }

  return {
    ticker: 'USDBRL',
    baseCurrency: 'USD',
    quoteCurrency: 'BRL',
    rateScaled: decimalToExchangeRateScaled(quote.quote?.value),
    pricedAt: normalizeProviderTimestamp(quote.quote?.updated_at),
  }
}

async function fetchHgBrasilPayload(
  symbol: string,
  apiKey: string,
  fetchImplementation: FetchLike
): Promise<unknown> {
  const url = new URL('https://api.hgbrasil.com/v2/finance/quotes')
  url.searchParams.set('symbol', symbol)
  url.searchParams.set('key', apiKey)
  const response = await fetchImplementation(url)

  if (!response.ok) {
    throw new Error('HG Brasil indisponível para esta cotação.')
  }

  return response.json()
}

export function createHgBrasilProvider(
  apiKey: string,
  fetchImplementation: FetchLike = fetch
) {
  return {
    async getAssetQuote(ticker: string) {
      const payload = await fetchHgBrasilPayload(
        `B3:${ticker.toUpperCase()}`,
        apiKey,
        fetchImplementation
      )
      return parseHgBrasilAssetQuote(payload, ticker)
    },
    async getUsdBrlQuote() {
      const payload = await fetchHgBrasilPayload(
        'FOREX:USDBRL',
        apiKey,
        fetchImplementation
      )
      return parseHgBrasilUsdBrlQuote(payload)
    },
  }
}
