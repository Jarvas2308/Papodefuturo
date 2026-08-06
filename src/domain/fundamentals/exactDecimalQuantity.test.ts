import { describe, expect, it } from 'vitest'
import { parseExactDecimalString } from './exactDecimalQuantity'

describe('parseExactDecimalString', () => {
  it('parses an integer string with scale 0', () => {
    expect(parseExactDecimalString('42')).toEqual({
      unscaledValue: 42,
      scale: 0,
    })
  })

  it('parses a decimal string and trims trailing zeros', () => {
    expect(parseExactDecimalString('0.02424250000')).toEqual({
      unscaledValue: 242425,
      scale: 7,
    })
  })

  it('parses a decimal string with no trailing zeros to trim', () => {
    expect(parseExactDecimalString('0.4832081062')).toEqual({
      unscaledValue: 4832081062,
      scale: 10,
    })
  })

  it('treats an all-zero value as scale 0', () => {
    expect(parseExactDecimalString('0.000')).toEqual({
      unscaledValue: 0,
      scale: 0,
    })
  })

  it('rejects a negative value', () => {
    expect(() => parseExactDecimalString('-1.5')).toThrow(RangeError)
  })

  it('rejects a comma-separated value', () => {
    expect(() => parseExactDecimalString('0,48')).toThrow(RangeError)
  })

  it('rejects an empty string', () => {
    expect(() => parseExactDecimalString('')).toThrow(RangeError)
  })
})
