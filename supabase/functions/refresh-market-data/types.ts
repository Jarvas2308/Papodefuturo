export type MarketDataWarningProvider =
  | 'b3-cotahist'
  | 'twelve-data'
  | 'tesouro-transparente'
  | 'configuration'
  | 'storage'

// `stale-quote` é o caso normal: o provider respondeu, mas a cotação não é
// mais recente que a já armazenada, então nada foi escrito de propósito. Os
// demais são degradação real e merecem alertar o usuário; `stale-quote` não,
// ou o aviso apareceria em toda consulta com preços em dia.
export type MarketDataWarningKind =
  'provider-failed' | 'stale-quote' | 'configuration' | 'storage-failed'

export type MarketDataWarning = {
  provider: MarketDataWarningProvider
  kind: MarketDataWarningKind
  ticker?: string
  message: string
}

export type MarketDataRefreshResult = {
  refreshedAt: string
  updatedPrices: number
  skippedFreshPrices: number
  updatedExchangeRates: number
  skippedFreshExchangeRates: number
  updatedReferenceRates: number
  skippedFreshReferenceRates: number
  warnings: MarketDataWarning[]
}

export type MarketQuote = {
  ticker: string
  currency: 'BRL' | 'USD'
  priceInMinorUnits: number
  pricedAt: string
}

export type ExchangeRateQuote = {
  ticker: 'USDBRL'
  baseCurrency: 'USD'
  quoteCurrency: 'BRL'
  rateScaled: number
  pricedAt: string
}

export type StoredMarketPrice = {
  ticker: string
  pricedAt: string
  source: string
}

export type StoredExchangeRate = {
  baseCurrency: string
  quoteCurrency: string
  pricedAt: string
  source: string
}

export type MarketPriceInsert = {
  ticker: string
  market: 'BR' | 'US'
  currency: 'BRL' | 'USD'
  price_minor: number
  priced_at: string
  source: 'market-provider'
}

export type ExchangeRateInsert = {
  base_currency: 'USD'
  quote_currency: 'BRL'
  rate_scaled: number
  rate_scale: 1000000
  priced_at: string
  source: 'market-provider'
}

// `priced_at` aqui e' data (AAAA-MM-DD), nao timestamp - o Tesouro
// Transparente publica uma linha por dia util, nao por segundo.
export type StoredReferenceRate = {
  series: string
  pricedAt: string
}

export type ReferenceRateInsert = {
  series: 'ntnb-longa'
  maturity_date: string
  rate_scaled: number
  rate_scale: 1000000
  priced_at: string
  source: 'tesouro-transparente'
}
