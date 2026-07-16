export function divideToScaledSafeInteger(
  numerator: number,
  denominator: number,
  scale: number
): number {
  if (!Number.isSafeInteger(numerator)) {
    throw new TypeError('Numerator must be a safe integer')
  }

  if (!Number.isSafeInteger(denominator) || denominator <= 0) {
    throw new RangeError('Denominator must be a positive safe integer')
  }

  if (!Number.isSafeInteger(scale) || scale <= 0) {
    throw new RangeError('Scale must be a positive safe integer')
  }

  const bigintNumerator = BigInt(numerator)
  const isNegative = bigintNumerator < 0n
  const absoluteNumerator =
    (isNegative ? -bigintNumerator : bigintNumerator) * BigInt(scale)
  const bigintDenominator = BigInt(denominator)
  const quotient = absoluteNumerator / bigintDenominator
  const remainder = absoluteNumerator % bigintDenominator
  const roundedMagnitude =
    remainder * 2n >= bigintDenominator ? quotient + 1n : quotient
  const rounded = isNegative ? -roundedMagnitude : roundedMagnitude

  if (
    rounded > BigInt(Number.MAX_SAFE_INTEGER) ||
    rounded < BigInt(Number.MIN_SAFE_INTEGER)
  ) {
    throw new RangeError('Scaled result exceeds the safe integer range')
  }

  return Number(rounded)
}
