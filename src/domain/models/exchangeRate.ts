import type { CurrencyCode, EntityId, MoneyAmount } from './shared'

export const EXCHANGE_RATE_SCALE = 1_000_000

export type ExchangeRateSource = 'manual' | 'market-provider'

export type ExchangeRate = {
  id: EntityId
  baseCurrency: CurrencyCode
  quoteCurrency: CurrencyCode
  rateScaled: number
  rateScale: typeof EXCHANGE_RATE_SCALE
  pricedAt: string
  source: ExchangeRateSource
}

export function isValidExchangeRate(rate: ExchangeRate): boolean {
  return (
    rate.baseCurrency !== rate.quoteCurrency &&
    Number.isSafeInteger(rate.rateScaled) &&
    rate.rateScaled > 0 &&
    rate.rateScale === EXCHANGE_RATE_SCALE
  )
}

export function convertMoney(
  money: MoneyAmount,
  targetCurrency: CurrencyCode,
  rate: ExchangeRate
): MoneyAmount {
  if (money.currency === targetCurrency) {
    return money
  }

  const isDirectPair =
    rate.baseCurrency === money.currency &&
    rate.quoteCurrency === targetCurrency
  const isInversePair =
    rate.quoteCurrency === money.currency &&
    rate.baseCurrency === targetCurrency

  if (!isValidExchangeRate(rate) || (!isDirectPair && !isInversePair)) {
    throw new RangeError(
      'Exchange rate does not support the requested conversion'
    )
  }

  const convertedAmount = isDirectPair
    ? Math.round((money.amountInMinorUnits * rate.rateScaled) / rate.rateScale)
    : Math.round((money.amountInMinorUnits * rate.rateScale) / rate.rateScaled)

  return {
    amountInMinorUnits: convertedAmount,
    currency: targetCurrency,
  }
}
