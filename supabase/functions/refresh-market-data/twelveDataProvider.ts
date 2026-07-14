import { decimalToMinorUnits } from './decimal.ts'
import { normalizeProviderTimestamp } from './timestamps.ts'
import type { MarketQuote } from './types.ts'

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

export function createTwelveDataProvider(
  apiKey: string,
  fetchImplementation: FetchLike = fetch
) {
  return {
    async getAssetQuote(ticker: string) {
      const url = new URL('https://api.twelvedata.com/quote')
      url.searchParams.set('symbol', ticker.toUpperCase())
      url.searchParams.set('timezone', 'UTC')
      url.searchParams.set('apikey', apiKey)
      const response = await fetchImplementation(url)

      if (!response.ok) {
        throw new Error('Twelve Data indisponível para esta cotação.')
      }

      return parseTwelveDataQuote(await response.json(), ticker)
    },
  }
}
