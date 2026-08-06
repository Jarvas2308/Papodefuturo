import type { ExactDecimalQuantity } from './types'

export const MAX_EXACT_DECIMAL_SCALE = 32_767

export function normalizeExactDecimalQuantity(
  value: ExactDecimalQuantity,
  description = 'Exact decimal quantity'
): ExactDecimalQuantity {
  if (!value || !Number.isSafeInteger(value.unscaledValue)) {
    throw new RangeError(`${description} must use a safe integer coefficient`)
  }
  if (value.unscaledValue < 0) {
    throw new RangeError(`${description} coefficient must be non-negative`)
  }
  if (
    !Number.isSafeInteger(value.scale) ||
    value.scale < 0 ||
    value.scale > MAX_EXACT_DECIMAL_SCALE
  ) {
    throw new RangeError(
      `${description} scale must be a non-negative small integer`
    )
  }

  if (value.unscaledValue === 0) {
    return { unscaledValue: 0, scale: 0 }
  }

  let unscaledValue = value.unscaledValue
  let scale = value.scale
  while (scale > 0 && unscaledValue % 10 === 0) {
    unscaledValue /= 10
    scale -= 1
  }

  return { unscaledValue, scale }
}

const DECIMAL_STRING_PATTERN = /^(\d+)(?:\.(\d+))?$/

/**
 * Parses a non-negative decimal string (dot separator, e.g. "0.48320810620")
 * into an `ExactDecimalQuantity`, preserving every digit of source
 * precision. Fails closed (throws) on anything that isn't a plain
 * non-negative decimal - never guesses.
 */
export function parseExactDecimalString(
  value: string,
  description = 'Exact decimal quantity'
): ExactDecimalQuantity {
  const match = DECIMAL_STRING_PATTERN.exec(value.trim())
  if (!match) {
    throw new RangeError(
      `${description} is not a valid decimal string: ${value}`
    )
  }

  const [, integerPart, fractionPart = ''] = match
  const unscaledValue = Number(`${integerPart}${fractionPart}`)
  const scale = fractionPart.length

  if (!Number.isSafeInteger(unscaledValue)) {
    throw new RangeError(
      `${description} is outside the safe integer range: ${value}`
    )
  }

  return normalizeExactDecimalQuantity({ unscaledValue, scale }, description)
}

export function formatExactDecimalQuantity(
  value: ExactDecimalQuantity
): string {
  const normalized = normalizeExactDecimalQuantity(value)
  const digits = String(normalized.unscaledValue)
  if (normalized.scale === 0) {
    return digits
  }

  const padded = digits.padStart(normalized.scale + 1, '0')
  const decimalIndex = padded.length - normalized.scale
  return `${padded.slice(0, decimalIndex)}.${padded.slice(decimalIndex)}`
}
