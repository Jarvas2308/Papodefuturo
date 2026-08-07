import { describe, expect, it } from 'vitest'
import { computeFiiDyNtnbSpreadV1 } from './computeFiiDyNtnbSpreadV1'

describe('computeFiiDyNtnbSpreadV1', () => {
  it('computes a negative spread (DY 6% vs real NTN-B rate 7.42%)', () => {
    const spread = computeFiiDyNtnbSpreadV1({
      trailingTwelveMonthDividendYield: { unscaledValue: 6, scale: 2 }, // 0.06 = 6%
      ntnbRateScaled: 7420000,
      ntnbRateScale: 1000000, // 7.42%
    })

    expect(spread).toBeCloseTo(-1.42, 10)
  })

  it('computes a positive spread', () => {
    const spread = computeFiiDyNtnbSpreadV1({
      trailingTwelveMonthDividendYield: { unscaledValue: 9, scale: 2 }, // 9%
      ntnbRateScaled: 7420000,
      ntnbRateScale: 1000000, // 7.42%
    })

    expect(spread).toBeCloseTo(1.58, 10)
  })

  it('rejects a non-positive NTN-B scale', () => {
    expect(() =>
      computeFiiDyNtnbSpreadV1({
        trailingTwelveMonthDividendYield: { unscaledValue: 6, scale: 2 },
        ntnbRateScaled: 742,
        ntnbRateScale: 0,
      })
    ).toThrow(/safe-integer scaled\/scale/)
  })
})
