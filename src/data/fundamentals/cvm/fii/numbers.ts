import {
  MAX_EXACT_DECIMAL_SCALE,
  normalizeExactDecimalQuantity,
  type ExactDecimalQuantity,
  type SignedMonetaryFact,
} from '../../../../domain/fundamentals'

const DECIMAL_PATTERN = /^([+-]?)(\d+)(?:[.,](\d+))?$/
const NON_NEGATIVE_DECIMAL_PATTERN = /^\+?(\d+)(?:[.,](\d+))?$/
const MAX_SAFE_INTEGER_BIGINT = BigInt(Number.MAX_SAFE_INTEGER)

export function parseNullableCvmFiiMoney(
  value: string,
  description: string
): SignedMonetaryFact | null {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  const match = DECIMAL_PATTERN.exec(trimmed)
  if (!match) {
    throw new Error(`Invalid CVM FII ${description}: ${value}`)
  }

  const [, sign, integerPart, fractionPart = ''] = match
  const denominator = 10n ** BigInt(fractionPart.length)
  const decimalInteger = BigInt(`${integerPart}${fractionPart}`)
  const numeratorInMinorUnits = decimalInteger * 100n

  if (numeratorInMinorUnits % denominator !== 0n) {
    throw new Error(
      `CVM FII ${description} cannot be represented exactly in BRL minor units: ${value}`
    )
  }

  const absoluteAmount = numeratorInMinorUnits / denominator
  const signedAmount = sign === '-' ? -absoluteAmount : absoluteAmount
  const amountInMinorUnits = Number(signedAmount)

  if (!Number.isSafeInteger(amountInMinorUnits)) {
    throw new RangeError(
      `CVM FII ${description} is outside the safe integer range`
    )
  }

  return { amountInMinorUnits, currency: 'BRL' }
}

export function parseNullableCvmFiiNonNegativeInteger(
  value: string,
  description: string
): number | null {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  const match = DECIMAL_PATTERN.exec(trimmed)
  if (!match || match[1] === '-') {
    throw new Error(`Invalid CVM FII ${description}: ${value}`)
  }

  const [, , integerPart, fractionPart = ''] = match
  if (fractionPart && /[1-9]/.test(fractionPart)) {
    throw new Error(`CVM FII ${description} must be an integer: ${value}`)
  }

  const integer = BigInt(integerPart)
  const parsed = Number(integer)
  if (!Number.isSafeInteger(parsed)) {
    throw new RangeError(
      `CVM FII ${description} is outside the safe integer range`
    )
  }

  return parsed
}

export function parseNullableCvmFiiExactDecimalQuantity(
  value: string,
  description: string
): ExactDecimalQuantity | null {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  const match = NON_NEGATIVE_DECIMAL_PATTERN.exec(trimmed)
  if (!match) {
    throw new Error(`Invalid CVM FII ${description}: ${value}`)
  }

  const [, integerPart, fractionPart = ''] = match
  const normalizedFraction = fractionPart.replace(/0+$/, '')
  if (normalizedFraction.length > MAX_EXACT_DECIMAL_SCALE) {
    throw new RangeError(`CVM FII ${description} has an invalid scale`)
  }

  const unscaled = BigInt(`${integerPart}${normalizedFraction}`)
  if (unscaled > MAX_SAFE_INTEGER_BIGINT) {
    throw new RangeError(
      `CVM FII ${description} coefficient is outside the safe integer range`
    )
  }

  return normalizeExactDecimalQuantity(
    {
      unscaledValue: Number(unscaled),
      scale: normalizedFraction.length,
    },
    `CVM FII ${description}`
  )
}
