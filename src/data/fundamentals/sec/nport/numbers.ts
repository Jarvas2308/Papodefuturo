import type { SignedMonetaryFact } from '../../../../domain/fundamentals'

const DECIMAL_PATTERN = /^([+-]?)(\d+)(?:\.(\d+))?$/

export function parseNullableSecUsdMoney(
  rawValue: string | null,
  fieldName: string
): SignedMonetaryFact | null {
  if (rawValue === null || rawValue.trim() === '') {
    return null
  }

  const normalized = rawValue.trim()
  const match = DECIMAL_PATTERN.exec(normalized)
  if (!match) {
    throw new Error(`Invalid SEC N-PORT ${fieldName}: ${rawValue}`)
  }

  const [, sign, integerPart, fraction = ''] = match
  const cents = fraction.padEnd(2, '0').slice(0, 2)
  const excessPrecision = fraction.slice(2)
  if (excessPrecision.replaceAll('0', '') !== '') {
    throw new Error(
      `SEC N-PORT ${fieldName} is not exactly representable in cents: ${rawValue}`
    )
  }

  const absoluteMinorUnits = BigInt(integerPart) * 100n + BigInt(cents)
  const signedMinorUnits =
    sign === '-' ? -absoluteMinorUnits : absoluteMinorUnits
  if (
    signedMinorUnits > BigInt(Number.MAX_SAFE_INTEGER) ||
    signedMinorUnits < BigInt(Number.MIN_SAFE_INTEGER)
  ) {
    throw new RangeError(
      `SEC N-PORT ${fieldName} exceeds safe integer minor units: ${rawValue}`
    )
  }

  return {
    amountInMinorUnits: Number(signedMinorUnits),
    currency: 'USD',
  }
}
