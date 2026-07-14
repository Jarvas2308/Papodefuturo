import { describe, expect, it } from 'vitest'
import { decimalToExchangeRateScaled, decimalToMinorUnits } from './decimal.ts'

describe('external decimal conversion', () => {
  it('converts BRL decimal values to cents', () => {
    expect(decimalToMinorUnits('38.17')).toBe(3_817)
  })

  it('converts USD decimal values to cents', () => {
    expect(decimalToMinorUnits('520.45')).toBe(52_045)
  })

  it('rounds an exact half up', () => {
    expect(decimalToMinorUnits('1.005')).toBe(101)
  })

  it('keeps a value below half', () => {
    expect(decimalToMinorUnits('1.0049')).toBe(100)
  })

  it('rounds a value above half up', () => {
    expect(decimalToMinorUnits('1.0051')).toBe(101)
  })

  it('rejects zero', () => {
    expect(() => decimalToMinorUnits('0')).toThrow(RangeError)
  })

  it('rejects negative values', () => {
    expect(() => decimalToMinorUnits('-1')).toThrow(RangeError)
  })

  it('rejects invalid text', () => {
    expect(() => decimalToMinorUnits('not-a-price')).toThrow(RangeError)
  })

  it('rejects values outside the safe integer range', () => {
    expect(() => decimalToMinorUnits('90071992547409.92')).toThrow(RangeError)
  })

  it('converts exchange rates with six decimal places', () => {
    expect(decimalToExchangeRateScaled('5.432100')).toBe(5_432_100)
  })

  it('rounds additional exchange-rate decimals half up', () => {
    expect(decimalToExchangeRateScaled('5.4321005')).toBe(5_432_101)
  })
})
