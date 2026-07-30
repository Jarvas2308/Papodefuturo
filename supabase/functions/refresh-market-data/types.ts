export type MarketDataWarningProvider =
  'b3-cotahist' | 'twelve-data' | 'configuration' | 'storage'

export type MarketDataWarning = {
  provider: MarketDataWarningProvider
  ticker?: string
  message: string
}

export type MarketDataRefreshResult = {
  refreshedAt: string
  updatedPrices: number
  skippedFreshPrices: number
  updatedExchangeRates: number
  skippedFreshExchangeRates: number
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
