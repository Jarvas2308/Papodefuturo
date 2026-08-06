export type MarketDataWarningProvider =
  | 'b3-cotahist'
  | 'twelve-data'
  | 'tesouro-transparente'
  | 'fred'
  | 'vanguard-site'
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
  updatedEtfValuations: number
  skippedFreshEtfValuations: number
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
// Transparente e o FRED publicam uma linha por dia util, nao por segundo.
export type StoredReferenceRate = {
  series: string
  pricedAt: string
}

// `maturity_date` e' null pra `fred-dfii10`: DFII10 e' rendimento sintetico
// de maturidade constante, sem titulo real por tras com data de vencimento
// (diferente da NTN-B). Ver migration `20260806120000`.
export type ReferenceRateInsert =
  | {
      series: 'ntnb-longa'
      maturity_date: string
      rate_scaled: number
      rate_scale: 1000000
      priced_at: string
      source: 'tesouro-transparente'
    }
  | {
      series: 'fred-dfii10'
      maturity_date: null
      rate_scaled: number
      rate_scale: 1000000
      priced_at: string
      source: 'fred'
    }

// `pricedAt` aqui tambem e' data civil (AAAA-MM-DD, `effectiveDate` da
// Vanguard) - o site publica no maximo uma linha por dia util por ticker,
// mesmo padrao de frescor diario de `StoredReferenceRate`.
export type StoredEtfValuation = {
  ticker: string
  pricedAt: string
}

export type EtfValuationInsert = {
  ticker: 'VOO' | 'VNQ' | 'VEA'
  reference_date: string
  premium_discount_basis_points: number
  source: 'vanguard-site'
}
