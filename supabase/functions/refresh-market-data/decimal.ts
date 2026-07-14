const DECIMAL_PATTERN = /^\+?\d+(?:\.\d+)?$/

function decimalToScaledInteger(value: unknown, scaleDigits: number): number {
  const decimal = typeof value === 'number' ? String(value) : value

  if (
    (typeof value === 'number' && !Number.isFinite(value)) ||
    typeof decimal !== 'string'
  ) {
    throw new RangeError('Decimal value must be finite')
  }

  const normalized = decimal.trim()

  if (!DECIMAL_PATTERN.test(normalized)) {
    throw new RangeError('Decimal value has an invalid format')
  }

  const [integerPart, fractionPart = ''] = normalized
    .replace(/^\+/, '')
    .split('.')
  const keptFraction = fractionPart
    .slice(0, scaleDigits)
    .padEnd(scaleDigits, '0')
  const firstDiscardedDigit = fractionPart[scaleDigits]
  let scaled = BigInt(integerPart) * 10n ** BigInt(scaleDigits)
  scaled += BigInt(keptFraction || '0')

  if (firstDiscardedDigit && firstDiscardedDigit >= '5') {
    scaled += 1n
  }

  if (scaled <= 0n || scaled > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new RangeError(
      'Decimal value is outside the supported positive range'
    )
  }

  return Number(scaled)
}

export function decimalToMinorUnits(value: unknown): number {
  return decimalToScaledInteger(value, 2)
}

export function decimalToExchangeRateScaled(value: unknown): number {
  return decimalToScaledInteger(value, 6)
}
