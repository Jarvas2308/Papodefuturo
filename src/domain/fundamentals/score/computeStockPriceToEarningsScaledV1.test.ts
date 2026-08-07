import { describe, expect, it } from 'vitest'
import { computeStockPriceToEarningsScaledV1 } from './computeStockPriceToEarningsScaledV1'

describe('computeStockPriceToEarningsScaledV1', () => {
  it('computes a simple P/L of 10x exactly', () => {
    // Preço R$20,00, LPA = R$2.000,00 lucro / 1.000 ações = R$2,00/ação
    // -> P/L = 20 / 2 = 10x.
    const result = computeStockPriceToEarningsScaledV1({
      closePriceInMinorUnits: 2_000, // R$20,00
      issuedShares: { unscaledValue: 1000, scale: 0 },
      netIncome: { amountInMinorUnits: 200_000, currency: 'BRL' }, // R$2.000,00
    })

    expect(result).toBe(10_000_000) // 10x * 1e6
  })

  it('rounds half away from zero', () => {
    // Preço R$1,00 * 1 ação = R$1,00, lucro R$3,00 -> LPA = R$3,00,
    // P/L = 1/3, cujo resto exato (100/300) arredonda pra cima.
    const result = computeStockPriceToEarningsScaledV1({
      closePriceInMinorUnits: 100,
      issuedShares: { unscaledValue: 1, scale: 0 },
      netIncome: { amountInMinorUnits: 300, currency: 'BRL' },
    })

    expect(result).toBe(333_333)
  })

  it('rejects non-BRL net income', () => {
    expect(() =>
      computeStockPriceToEarningsScaledV1({
        closePriceInMinorUnits: 2_000,
        issuedShares: { unscaledValue: 1000, scale: 0 },
        netIncome: { amountInMinorUnits: 200_000, currency: 'USD' },
      })
    ).toThrow(/BRL/)
  })

  it('rejects non-positive net income', () => {
    expect(() =>
      computeStockPriceToEarningsScaledV1({
        closePriceInMinorUnits: 2_000,
        issuedShares: { unscaledValue: 1000, scale: 0 },
        netIncome: { amountInMinorUnits: 0, currency: 'BRL' },
      })
    ).toThrow(/positive/)
  })

  it('rejects non-positive close price', () => {
    expect(() =>
      computeStockPriceToEarningsScaledV1({
        closePriceInMinorUnits: 0,
        issuedShares: { unscaledValue: 1000, scale: 0 },
        netIncome: { amountInMinorUnits: 200_000, currency: 'BRL' },
      })
    ).toThrow(/positive/)
  })

  it('rejects non-positive issued shares', () => {
    expect(() =>
      computeStockPriceToEarningsScaledV1({
        closePriceInMinorUnits: 2_000,
        issuedShares: { unscaledValue: 0, scale: 0 },
        netIncome: { amountInMinorUnits: 200_000, currency: 'BRL' },
      })
    ).toThrow(/positive/)
  })
})
