import {
  isValidMoneyInMinorUnits,
  type CurrencyCode,
  type EntityId,
  type MoneyAmount,
} from './shared'

export const EXCHANGE_RATE_SCALE = 1_000_000

const MAX_SAFE_INTEGER_AS_BIGINT = BigInt(Number.MAX_SAFE_INTEGER)

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

export function getLatestUsdBrlRate(
  rates: readonly ExchangeRate[]
): ExchangeRate | null {
  return rates.reduce<ExchangeRate | null>((latest, rate) => {
    const isUsdBrlPair =
      (rate.baseCurrency === 'USD' && rate.quoteCurrency === 'BRL') ||
      (rate.baseCurrency === 'BRL' && rate.quoteCurrency === 'USD')
    const pricedAt = Date.parse(rate.pricedAt)

    if (!isUsdBrlPair || !isValidExchangeRate(rate) || Number.isNaN(pricedAt)) {
      return latest
    }

    if (!latest) {
      return rate
    }

    const latestPricedAt = Date.parse(latest.pricedAt)

    if (
      pricedAt > latestPricedAt ||
      (pricedAt === latestPricedAt && rate.id > latest.id)
    ) {
      return rate
    }

    return latest
  }, null)
}

function divideAndRoundHalfUp(numerator: bigint, denominator: bigint): bigint {
  if (numerator < 0n || denominator <= 0n) {
    throw new RangeError(
      'Financial division requires a non-negative numerator and positive denominator'
    )
  }

  const quotient = numerator / denominator
  const remainder = numerator % denominator

  return remainder * 2n >= denominator ? quotient + 1n : quotient
}

export function convertMoney(
  money: MoneyAmount,
  targetCurrency: CurrencyCode,
  rate: ExchangeRate
): MoneyAmount {
  if (!isValidMoneyInMinorUnits(money.amountInMinorUnits)) {
    throw new RangeError(
      'Money amount must be a non-negative safe integer in minor units'
    )
  }

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

  const amount = BigInt(money.amountInMinorUnits)
  const numerator = isDirectPair
    ? amount * BigInt(rate.rateScaled)
    : amount * BigInt(rate.rateScale)
  const denominator = BigInt(isDirectPair ? rate.rateScale : rate.rateScaled)
  const convertedAmount = divideAndRoundHalfUp(numerator, denominator)

  if (convertedAmount > MAX_SAFE_INTEGER_AS_BIGINT) {
    throw new RangeError(
      'Converted money amount exceeds the safe integer range'
    )
  }

  return {
    amountInMinorUnits: Number(convertedAmount),
    currency: targetCurrency,
  }
}
