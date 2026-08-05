import { describe, expect, it } from 'vitest'
import { computeFiiPvpScaledV1 } from './computeFiiPvpScaledV1'

describe('computeFiiPvpScaledV1', () => {
  it('computes P/VP = 1.0 when price equals NAV per share exactly', () => {
    const pvpScaled = computeFiiPvpScaledV1({
      marketPriceInMinorUnits: 10_000,
      netAssetValuePerIssuedShare: {
        scaledAmountInMinorUnitsPerUnit: 10_000_000_000,
        scale: 1_000_000,
        currency: 'BRL',
        rounding: 'half-away-from-zero',
      },
    })

    expect(pvpScaled).toBe(1_000_000)
  })

  it('computes P/VP = 0.9 when price is 90% of NAV per share', () => {
    const pvpScaled = computeFiiPvpScaledV1({
      marketPriceInMinorUnits: 900,
      netAssetValuePerIssuedShare: {
        scaledAmountInMinorUnitsPerUnit: 1_000_000_000,
        scale: 1_000_000,
        currency: 'BRL',
        rounding: 'half-away-from-zero',
      },
    })

    expect(pvpScaled).toBe(900_000)
  })

  it('rounds half up on an inexact division', () => {
    const pvpScaled = computeFiiPvpScaledV1({
      marketPriceInMinorUnits: 1,
      netAssetValuePerIssuedShare: {
        scaledAmountInMinorUnitsPerUnit: 3,
        scale: 1_000_000,
        currency: 'BRL',
        rounding: 'half-away-from-zero',
      },
    })

    // price * scale * ratioScale / navScaledAmount = 1e12 / 3 = 333333333333.33...
    expect(pvpScaled).toBe(333_333_333_333)
  })

  it('throws on a non-positive market price', () => {
    expect(() =>
      computeFiiPvpScaledV1({
        marketPriceInMinorUnits: 0,
        netAssetValuePerIssuedShare: {
          scaledAmountInMinorUnitsPerUnit: 1_000_000,
          scale: 1_000_000,
          currency: 'BRL',
          rounding: 'half-away-from-zero',
        },
      })
    ).toThrow(RangeError)
  })

  it('throws on a non-positive NAV per share', () => {
    expect(() =>
      computeFiiPvpScaledV1({
        marketPriceInMinorUnits: 1_000,
        netAssetValuePerIssuedShare: {
          scaledAmountInMinorUnitsPerUnit: 0,
          scale: 1_000_000,
          currency: 'BRL',
          rounding: 'half-away-from-zero',
        },
      })
    ).toThrow(RangeError)
  })
})
