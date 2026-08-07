import { describe, expect, it } from 'vitest'
import { computeProventoTrailingTwelveMonthValueV1 } from './computeProventoTrailingTwelveMonthValueV1'

describe('computeProventoTrailingTwelveMonthValueV1', () => {
  it('sums declarations within the trailing 12 months, ending inclusive', () => {
    const result = computeProventoTrailingTwelveMonthValueV1({
      declarations: [
        {
          protocol: 'p1',
          version: 1,
          grossValuePerShare: { unscaledValue: 5, scale: 2 }, // 0.05
          paymentDate: '2025-03-01',
        },
        {
          protocol: 'p2',
          version: 1,
          grossValuePerShare: { unscaledValue: 3, scale: 1 }, // 0.3
          paymentDate: '2025-12-31',
        },
        {
          protocol: 'p3',
          version: 1,
          grossValuePerShare: { unscaledValue: 999, scale: 0 },
          paymentDate: '2024-01-01', // outside the window
        },
      ],
      windowEndDate: '2025-12-31',
    })

    // 0.05 + 0.30 = 0.35
    expect(result).toEqual({ unscaledValue: 35, scale: 2 })
  })

  it('keeps only the highest version per protocol (DEC-101 dedup)', () => {
    const result = computeProventoTrailingTwelveMonthValueV1({
      declarations: [
        {
          protocol: 'p1',
          version: 1,
          grossValuePerShare: { unscaledValue: 100, scale: 2 },
          paymentDate: '2025-06-01',
        },
        {
          protocol: 'p1',
          version: 2,
          grossValuePerShare: { unscaledValue: 150, scale: 2 },
          paymentDate: '2025-06-01',
        },
      ],
      windowEndDate: '2025-12-31',
    })

    expect(result).toEqual({ unscaledValue: 15, scale: 1 })
  })

  it('returns null (not zero) when nothing falls in the window', () => {
    const result = computeProventoTrailingTwelveMonthValueV1({
      declarations: [
        {
          protocol: 'p1',
          version: 1,
          grossValuePerShare: { unscaledValue: 100, scale: 2 },
          paymentDate: '2020-01-01',
        },
      ],
      windowEndDate: '2025-12-31',
    })

    expect(result).toBeNull()
  })

  it('returns null for an empty declaration list', () => {
    expect(
      computeProventoTrailingTwelveMonthValueV1({
        declarations: [],
        windowEndDate: '2025-12-31',
      })
    ).toBeNull()
  })

  it('excludes a payment exactly 366 days before the window end', () => {
    const result = computeProventoTrailingTwelveMonthValueV1({
      declarations: [
        {
          protocol: 'p1',
          version: 1,
          grossValuePerShare: { unscaledValue: 100, scale: 2 },
          paymentDate: '2024-12-31',
        },
      ],
      windowEndDate: '2025-12-31',
    })

    expect(result).toBeNull()
  })
})
