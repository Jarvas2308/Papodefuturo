import type { SignedMonetaryFact } from '../../../domain/fundamentals'
import { normalizeCvmDescription } from './normalizeDescription'

const DECIMAL_PATTERN = /^([+-]?)(\d+)(?:[.,](\d+))?$/

function getMinorUnitMultiplier(currencyScale: string): bigint {
  const normalizedScale = normalizeCvmDescription(currencyScale)

  if (normalizedScale === 'UNIDADE') {
    return 100n
  }
  if (normalizedScale === 'MIL') {
    return 100_000n
  }

  throw new Error(`Unsupported CVM currency scale: ${currencyScale}`)
}

export function parseCvmMonetaryFact(
  value: string,
  currency: string,
  currencyScale: string
): SignedMonetaryFact {
  if (normalizeCvmDescription(currency) !== 'REAL') {
    throw new Error(`Unsupported CVM currency: ${currency}`)
  }

  const match = DECIMAL_PATTERN.exec(value.trim())
  if (!match) {
    throw new Error(`Invalid CVM monetary value: ${value}`)
  }

  const [, sign, integerPart, fractionPart = ''] = match
  const denominator = 10n ** BigInt(fractionPart.length)
  const decimalInteger = BigInt(`${integerPart}${fractionPart}`)
  const scaledNumerator = decimalInteger * getMinorUnitMultiplier(currencyScale)
  let roundedAbsolute = scaledNumerator / denominator
  const remainder = scaledNumerator % denominator

  if (remainder * 2n >= denominator) {
    roundedAbsolute += 1n
  }

  const signedValue = sign === '-' ? -roundedAbsolute : roundedAbsolute
  const amountInMinorUnits = Number(signedValue)

  if (!Number.isSafeInteger(amountInMinorUnits)) {
    throw new RangeError('CVM monetary value is outside the safe integer range')
  }

  return { amountInMinorUnits, currency: 'BRL' }
}
