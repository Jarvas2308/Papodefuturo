import { describe, expect, it } from 'vitest'
import {
  computeStockPlQuartilePositionV1,
  STOCK_PL_HISTORY_MIN_POINTS,
  type StockPlHistoryPointV1,
} from './computeStockPlQuartilePositionV1'

function point(referenceDate: string, plScaled: number): StockPlHistoryPointV1 {
  return { referenceDate, plScaled }
}

describe('computeStockPlQuartilePositionV1', () => {
  it('returns null when the sample is smaller than the minimum', () => {
    expect(STOCK_PL_HISTORY_MIN_POINTS).toBe(5)

    const history = [
      point('2024-12-31', 10_000_000),
      point('2025-12-31', 8_000_000),
    ]

    expect(computeStockPlQuartilePositionV1({ history })).toBeNull()
  })

  it('flags the current point below its own lower quartile', () => {
    // 5 anos, P/L em 6x, 7x, 8x, 9x, 10x (mais recente = 6x, o mais
    // barato da série) - quartil inferior (rank = ceil(0.25*5) = 2) é o
    // 2º menor valor = 7x.
    const history = [
      point('2021-12-31', 10_000_000),
      point('2022-12-31', 9_000_000),
      point('2023-12-31', 8_000_000),
      point('2024-12-31', 7_000_000),
      point('2025-12-31', 6_000_000),
    ]

    const result = computeStockPlQuartilePositionV1({ history })

    expect(result).not.toBeNull()
    expect(result?.currentScaled).toBe(6_000_000)
    expect(result?.currentReferenceDate).toBe('2025-12-31')
    expect(result?.lowerQuartileScaled).toBe(7_000_000)
    expect(result?.deviationScaled).toBe(-1_000_000)
    expect(result?.belowLowerQuartile).toBe(true)
    expect(result?.sampleSize).toBe(5)
  })

  it('does not flag the current point when it sits above the lower quartile', () => {
    const history = [
      point('2021-12-31', 6_000_000),
      point('2022-12-31', 7_000_000),
      point('2023-12-31', 8_000_000),
      point('2024-12-31', 9_000_000),
      point('2025-12-31', 10_000_000), // mais recente = mais caro da série
    ]

    const result = computeStockPlQuartilePositionV1({ history })

    expect(result?.lowerQuartileScaled).toBe(7_000_000)
    expect(result?.deviationScaled).toBe(3_000_000)
    expect(result?.belowLowerQuartile).toBe(false)
  })

  it('treats a value exactly at the lower quartile as not below it', () => {
    const history = [
      point('2021-12-31', 7_000_000), // mais recente, igual ao quartil
      point('2022-12-31', 8_000_000),
      point('2023-12-31', 9_000_000),
      point('2024-12-31', 10_000_000),
      point('2025-01-15', 7_000_000),
    ]
    // referenceDate mais recente entre os dois pontos: escolhe por
    // string comparável (YYYY-MM-DD) - '2025-01-15' > '2024-12-31'.
    const result = computeStockPlQuartilePositionV1({ history })

    expect(result?.currentReferenceDate).toBe('2025-01-15')
    expect(result?.currentScaled).toBe(7_000_000)
    expect(result?.lowerQuartileScaled).toBe(7_000_000)
    expect(result?.deviationScaled).toBe(0)
    expect(result?.belowLowerQuartile).toBe(false)
  })
})
