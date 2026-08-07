import { describe, expect, it } from 'vitest'
import { computeStockPayoutRatioScaledV1 } from './computeStockPayoutRatioScaledV1'

describe('computeStockPayoutRatioScaledV1', () => {
  it('computes a simple 50% payout exactly', () => {
    const result = computeStockPayoutRatioScaledV1({
      trailingTwelveMonthDividendPerShare: { unscaledValue: 100, scale: 2 }, // R$1.00/share
      issuedShares: { unscaledValue: 1000, scale: 0 }, // 1,000 shares -> R$1,000 total
      netIncome: { amountInMinorUnits: 200_000, currency: 'BRL' }, // R$2,000.00
    })

    expect(result).toBe(500_000) // 50% * 1e6
  })

  it('rounds half away from zero', () => {
    // R$2.00 * 1 share = R$2.00, net income R$3.00 -> ratio = 2/3, whose
    // exact scaled remainder (200/300) rounds up per half-away-from-zero.
    const result = computeStockPayoutRatioScaledV1({
      trailingTwelveMonthDividendPerShare: { unscaledValue: 2, scale: 0 },
      issuedShares: { unscaledValue: 1, scale: 0 },
      netIncome: { amountInMinorUnits: 300, currency: 'BRL' },
    })

    expect(result).toBe(666_667)
  })

  it('rejects non-BRL net income', () => {
    expect(() =>
      computeStockPayoutRatioScaledV1({
        trailingTwelveMonthDividendPerShare: { unscaledValue: 100, scale: 2 },
        issuedShares: { unscaledValue: 1000, scale: 0 },
        netIncome: { amountInMinorUnits: 200_000, currency: 'USD' },
      })
    ).toThrow(/BRL/)
  })

  it('rejects non-positive net income', () => {
    expect(() =>
      computeStockPayoutRatioScaledV1({
        trailingTwelveMonthDividendPerShare: { unscaledValue: 100, scale: 2 },
        issuedShares: { unscaledValue: 1000, scale: 0 },
        netIncome: { amountInMinorUnits: 0, currency: 'BRL' },
      })
    ).toThrow(/positive/)
  })
})
