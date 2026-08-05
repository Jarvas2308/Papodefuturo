import { describe, expect, it } from 'vitest'
import { computeStockRoeScaledV1 } from './computeStockRoeScaledV1'

describe('computeStockRoeScaledV1', () => {
  it('computes ROE of 20% exactly', () => {
    const roeScaled = computeStockRoeScaledV1({
      netIncome: { amountInMinorUnits: 2_000, currency: 'BRL' },
      totalEquity: { amountInMinorUnits: 10_000, currency: 'BRL' },
    })

    expect(roeScaled).toBe(200_000)
  })

  it('preserves the sign for a negative net income (loss)', () => {
    const roeScaled = computeStockRoeScaledV1({
      netIncome: { amountInMinorUnits: -1_000, currency: 'BRL' },
      totalEquity: { amountInMinorUnits: 10_000, currency: 'BRL' },
    })

    expect(roeScaled).toBe(-100_000)
  })

  it('rounds half up on an inexact division', () => {
    const roeScaled = computeStockRoeScaledV1({
      netIncome: { amountInMinorUnits: 1, currency: 'BRL' },
      totalEquity: { amountInMinorUnits: 3, currency: 'BRL' },
    })

    // 1/3 * 1_000_000 = 333333.33... -> rounds to 333333
    expect(roeScaled).toBe(333_333)
  })

  it('rounds half up on a negative inexact division', () => {
    const roeScaled = computeStockRoeScaledV1({
      netIncome: { amountInMinorUnits: -1, currency: 'BRL' },
      totalEquity: { amountInMinorUnits: 3, currency: 'BRL' },
    })

    expect(roeScaled).toBe(-333_333)
  })

  it('throws when currencies diverge', () => {
    expect(() =>
      computeStockRoeScaledV1({
        netIncome: { amountInMinorUnits: 1_000, currency: 'USD' },
        totalEquity: { amountInMinorUnits: 10_000, currency: 'BRL' },
      })
    ).toThrow(RangeError)
  })

  it('throws on a non-positive total equity', () => {
    expect(() =>
      computeStockRoeScaledV1({
        netIncome: { amountInMinorUnits: 1_000, currency: 'BRL' },
        totalEquity: { amountInMinorUnits: 0, currency: 'BRL' },
      })
    ).toThrow(RangeError)
  })

  it('throws on a negative total equity', () => {
    expect(() =>
      computeStockRoeScaledV1({
        netIncome: { amountInMinorUnits: 1_000, currency: 'BRL' },
        totalEquity: { amountInMinorUnits: -5_000, currency: 'BRL' },
      })
    ).toThrow(RangeError)
  })
})
