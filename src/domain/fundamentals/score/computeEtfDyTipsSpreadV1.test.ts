import { describe, expect, it } from 'vitest'
import { computeEtfDyTipsSpreadV1 } from './computeEtfDyTipsSpreadV1'

// Números reais do N-CSR de VNQ (accession 0001104659-26-036013,
// exercício encerrado em 31/01/2026): Total Distributions 3,472 e Net
// Asset Value, End of Period 90,81. Taxa TIPS real observada em
// market_reference_rates (série `fred-dfii10`, 05/08/2026): 2,41%.
const VNQ_TOTAL_DISTRIBUTIONS = { unscaledValue: 3472, scale: 3 }
const VNQ_NAV_END_OF_PERIOD = { unscaledValue: 9081, scale: 2 }

describe('computeEtfDyTipsSpreadV1', () => {
  it('computes the spread in percentage points from real VNQ N-CSR values', () => {
    const spread = computeEtfDyTipsSpreadV1({
      totalDistributionsPerShare: VNQ_TOTAL_DISTRIBUTIONS,
      netAssetValueEndOfPeriod: VNQ_NAV_END_OF_PERIOD,
      tipsRateScaled: 2_410_000,
      tipsRateScale: 1_000_000,
    })

    // 3,472 / 90,81 = 3,823367% -> 3,823367 - 2,41 = 1,413367 p.p.
    expect(spread).toBeCloseTo(1.413367, 6)
  })

  it('returns a negative spread when the TIPS rate is above the ETF yield', () => {
    const spread = computeEtfDyTipsSpreadV1({
      totalDistributionsPerShare: VNQ_TOTAL_DISTRIBUTIONS,
      netAssetValueEndOfPeriod: VNQ_NAV_END_OF_PERIOD,
      tipsRateScaled: 5_000_000,
      tipsRateScale: 1_000_000,
    })

    expect(spread).toBeLessThan(0)
    expect(spread).toBeCloseTo(-1.176633, 6)
  })

  it('is exact regardless of the decimal scales used by the source', () => {
    const withPaddedScales = computeEtfDyTipsSpreadV1({
      totalDistributionsPerShare: { unscaledValue: 34_720_000, scale: 7 },
      netAssetValueEndOfPeriod: { unscaledValue: 908_100_000, scale: 7 },
      tipsRateScaled: 2_410_000,
      tipsRateScale: 1_000_000,
    })

    expect(withPaddedScales).toBeCloseTo(1.413367, 6)
  })

  it('accepts a zero distribution as a real observation, not as missing data', () => {
    const spread = computeEtfDyTipsSpreadV1({
      totalDistributionsPerShare: { unscaledValue: 0, scale: 0 },
      netAssetValueEndOfPeriod: VNQ_NAV_END_OF_PERIOD,
      tipsRateScaled: 2_410_000,
      tipsRateScale: 1_000_000,
    })

    expect(spread).toBeCloseTo(-2.41, 6)
  })

  it('rejects a non-positive net asset value', () => {
    expect(() =>
      computeEtfDyTipsSpreadV1({
        totalDistributionsPerShare: VNQ_TOTAL_DISTRIBUTIONS,
        netAssetValueEndOfPeriod: { unscaledValue: 0, scale: 0 },
        tipsRateScaled: 2_410_000,
        tipsRateScale: 1_000_000,
      })
    ).toThrow(RangeError)
  })

  it('rejects a negative distribution value', () => {
    expect(() =>
      computeEtfDyTipsSpreadV1({
        totalDistributionsPerShare: { unscaledValue: -3472, scale: 3 },
        netAssetValueEndOfPeriod: VNQ_NAV_END_OF_PERIOD,
        tipsRateScaled: 2_410_000,
        tipsRateScale: 1_000_000,
      })
    ).toThrow(RangeError)
  })

  it('rejects a non-positive TIPS scale', () => {
    expect(() =>
      computeEtfDyTipsSpreadV1({
        totalDistributionsPerShare: VNQ_TOTAL_DISTRIBUTIONS,
        netAssetValueEndOfPeriod: VNQ_NAV_END_OF_PERIOD,
        tipsRateScaled: 2_410_000,
        tipsRateScale: 0,
      })
    ).toThrow(RangeError)
  })
})
