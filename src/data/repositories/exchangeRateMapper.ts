import type {
  CurrencyCode,
  ExchangeRate,
  ExchangeRateSource,
} from '../../domain/models'
import { EXCHANGE_RATE_SCALE, isValidExchangeRate } from '../../domain/models'
import type { ExchangeRateDatabase } from './exchangeRateSchema'

type ExchangeRateRow =
  ExchangeRateDatabase['public']['Tables']['exchange_rates']['Row']

const CURRENCIES: readonly CurrencyCode[] = ['BRL', 'USD']
const SOURCES: readonly ExchangeRateSource[] = ['manual', 'market-provider']

function readAllowedValue<T extends string>(
  value: string,
  allowedValues: readonly T[],
  fieldName: string
): T {
  if (!allowedValues.includes(value as T)) {
    throw new Error(`Unsupported ${fieldName}: ${value}`)
  }

  return value as T
}

export function mapExchangeRateRow(row: ExchangeRateRow): ExchangeRate {
  const rate: ExchangeRate = {
    id: row.id,
    baseCurrency: readAllowedValue(
      row.base_currency,
      CURRENCIES,
      'exchange base currency'
    ),
    quoteCurrency: readAllowedValue(
      row.quote_currency,
      CURRENCIES,
      'exchange quote currency'
    ),
    rateScaled: row.rate_scaled,
    rateScale: row.rate_scale as typeof EXCHANGE_RATE_SCALE,
    pricedAt: row.priced_at,
    source: readAllowedValue(row.source, SOURCES, 'exchange rate source'),
  }

  if (!isValidExchangeRate(rate)) {
    throw new Error(`Invalid exchange rate row: ${row.id}`)
  }

  return rate
}
