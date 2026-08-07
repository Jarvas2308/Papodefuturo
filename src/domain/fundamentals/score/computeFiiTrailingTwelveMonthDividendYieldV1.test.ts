import { describe, expect, it } from 'vitest'
import { computeFiiTrailingTwelveMonthDividendYieldV1 } from './computeFiiTrailingTwelveMonthDividendYieldV1'

function buildTwelveMonths(
  overrides: Record<string, { unscaledValue: number; scale: number }> = {}
) {
  const points = []
  for (let month = 1; month <= 12; month += 1) {
    const referenceDate = `2025-${String(month).padStart(2, '0')}-01`
    points.push({
      referenceDate,
      version: 1,
      dividendYield: overrides[referenceDate] ?? { unscaledValue: 5, scale: 3 }, // 0.005 = 0.5%
    })
  }
  return points
}

describe('computeFiiTrailingTwelveMonthDividendYieldV1', () => {
  it('sums 12 distinct months in the window (0.5% x 12 = 6%)', () => {
    const result = computeFiiTrailingTwelveMonthDividendYieldV1({
      monthlyPoints: buildTwelveMonths(),
      windowEndDate: '2025-12-31',
    })

    expect(result).toEqual({ unscaledValue: 6, scale: 2 })
  })

  it('returns null (not partial) with only 11 months', () => {
    const points = buildTwelveMonths().slice(0, 11)
    const result = computeFiiTrailingTwelveMonthDividendYieldV1({
      monthlyPoints: points,
      windowEndDate: '2025-12-31',
    })

    expect(result).toBeNull()
  })

  it('keeps only the highest version per month', () => {
    const points = buildTwelveMonths()
    points.push({
      referenceDate: '2025-06-01',
      version: 2,
      dividendYield: { unscaledValue: 100, scale: 3 }, // replaces the 0.005 for June
    })

    const result = computeFiiTrailingTwelveMonthDividendYieldV1({
      monthlyPoints: points,
      windowEndDate: '2025-12-31',
    })

    // 11 months x 0.005 + 1 month x 0.1 = 0.055 + 0.1 = 0.155
    expect(result).toEqual({ unscaledValue: 155, scale: 3 })
  })

  it('returns null for an empty list', () => {
    expect(
      computeFiiTrailingTwelveMonthDividendYieldV1({
        monthlyPoints: [],
        windowEndDate: '2025-12-31',
      })
    ).toBeNull()
  })
})
