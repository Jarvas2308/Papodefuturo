import { decimalToExchangeRateScaled, decimalToMinorUnits } from './decimal.ts'
import { normalizeProviderTimestamp } from './timestamps.ts'
import type { ExchangeRateQuote, MarketQuote } from './types.ts'

type FetchLike = typeof fetch

type TwelveDataQuotePayload = {
  symbol?: unknown
  currency?: unknown
  close?: unknown
  datetime?: unknown
  timestamp?: unknown
}

export function parseTwelveDataQuote(
  payload: unknown,
  ticker: string
): MarketQuote {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Resposta de cotação inválida da Twelve Data.')
  }

  const quote = payload as TwelveDataQuotePayload

  if (
    typeof quote.symbol !== 'string' ||
    quote.symbol.toUpperCase() !== ticker.toUpperCase()
  ) {
    throw new Error('Símbolo inesperado na cotação da Twelve Data.')
  }

  if (quote.currency !== undefined && quote.currency !== 'USD') {
    throw new Error('Moeda inesperada na cotação da Twelve Data.')
  }

  const providerTimestamp = quote.datetime ?? quote.timestamp
  const pricedAt =
    typeof providerTimestamp === 'number' &&
    Number.isSafeInteger(providerTimestamp) &&
    providerTimestamp > 0
      ? new Date(providerTimestamp * 1000).toISOString()
      : normalizeProviderTimestamp(providerTimestamp)

  return {
    ticker: ticker.toUpperCase(),
    currency: 'USD',
    priceInMinorUnits: decimalToMinorUnits(quote.close),
    pricedAt,
  }
}

export function parseTwelveDataUsdBrlQuote(
  payload: unknown,
  fallbackPricedAt: string
): ExchangeRateQuote {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Resposta de câmbio inválida da Twelve Data.')
  }

  const quote = payload as TwelveDataQuotePayload

  if (
    typeof quote.symbol !== 'string' ||
    quote.symbol.toUpperCase() !== 'USD/BRL'
  ) {
    throw new Error('Par inesperado na cotação de câmbio da Twelve Data.')
  }

  if (quote.currency !== undefined && quote.currency !== 'BRL') {
    throw new Error('Moeda inesperada na cotação de câmbio da Twelve Data.')
  }

  const providerTimestamp = quote.datetime ?? quote.timestamp
  const pricedAt =
    providerTimestamp === undefined
      ? normalizeProviderTimestamp(fallbackPricedAt)
      : typeof providerTimestamp === 'number' &&
          Number.isSafeInteger(providerTimestamp) &&
          providerTimestamp > 0
        ? new Date(providerTimestamp * 1000).toISOString()
        : normalizeProviderTimestamp(providerTimestamp)

  return {
    ticker: 'USDBRL',
    baseCurrency: 'USD',
    quoteCurrency: 'BRL',
    rateScaled: decimalToExchangeRateScaled(quote.close),
    pricedAt,
  }
}

export function createTwelveDataProvider(
  apiKey: string,
  fetchImplementation: FetchLike = fetch,
  now: () => Date = () => new Date()
) {
  async function fetchQuote(symbol: string): Promise<unknown> {
    const url = new URL('https://api.twelvedata.com/quote')
    url.searchParams.set('symbol', symbol)
    url.searchParams.set('timezone', 'UTC')
    url.searchParams.set('apikey', apiKey)
    const response = await fetchImplementation(url)

    if (!response.ok) {
      throw new Error('Twelve Data indisponível para esta cotação.')
    }

    return response.json()
  }

  return {
    async getAssetQuote(ticker: string) {
      return parseTwelveDataQuote(
        await fetchQuote(ticker.toUpperCase()),
        ticker
      )
    },
    async getUsdBrlQuote() {
      const payload = await fetchQuote('USD/BRL')
      const fallbackPricedAt = now().toISOString()
      return parseTwelveDataUsdBrlQuote(payload, fallbackPricedAt)
    },
  }
}
