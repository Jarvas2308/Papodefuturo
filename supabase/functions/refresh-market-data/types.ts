export type MarketDataWarningProvider =
  'hg-brasil' | 'twelve-data' | 'configuration'

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

export type RefreshAsset = {
  id: string
  ticker: string
  status: string
}

export type StoredMarketPrice = {
  assetId: string
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
  id: string
  user_id: string
  asset_id: string
  price_minor: number
  currency: 'BRL' | 'USD'
  priced_at: string
  source: 'market-provider'
}

export type ExchangeRateInsert = {
  id: string
  user_id: string
  base_currency: 'USD'
  quote_currency: 'BRL'
  rate_scaled: number
  rate_scale: 1000000
  priced_at: string
  source: 'market-provider'
}
