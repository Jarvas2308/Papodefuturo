import { describe, expect, it } from 'vitest'
import { computeStockNetDebtToEbitdaScaledV1 } from './computeStockNetDebtToEbitdaScaledV1'

const brl = (amountInMinorUnits: number) => ({
  amountInMinorUnits,
  currency: 'BRL' as const,
})

describe('computeStockNetDebtToEbitdaScaledV1', () => {
  it('computes an exact ratio scaled to 1e6 (1x)', () => {
    const result = computeStockNetDebtToEbitdaScaledV1({
      financialDebtCurrent: brl(1_000_000),
      financialDebtNonCurrent: brl(1_000_000),
      cashAndEquivalents: brl(0),
      ebit: brl(1_500_000),
      depreciationAndAmortization: brl(500_000),
    })

    expect(result).toBe(1_000_000)
  })

  it('subtracts cash and equivalents from financial debt (net cash -> negative ratio)', () => {
    const result = computeStockNetDebtToEbitdaScaledV1({
      financialDebtCurrent: brl(100_000),
      financialDebtNonCurrent: brl(100_000),
      cashAndEquivalents: brl(1_000_000),
      ebit: brl(400_000),
      depreciationAndAmortization: brl(100_000),
    })

    // netDebt = -800_000, EBITDA = 500_000 -> -1.6x
    expect(result).toBe(-1_600_000)
  })

  it('rounds half-away-from-zero on the discarded remainder', () => {
    const result = computeStockNetDebtToEbitdaScaledV1({
      financialDebtCurrent: brl(1),
      financialDebtNonCurrent: brl(0),
      cashAndEquivalents: brl(0),
      ebit: brl(3),
      depreciationAndAmortization: brl(0),
    })

    // 1/3 = 0.333333... * 1e6 -> 333333.33... rounds down
    expect(result).toBe(333_333)
  })

  it('throws when EBITDA is zero', () => {
    expect(() =>
      computeStockNetDebtToEbitdaScaledV1({
        financialDebtCurrent: brl(100),
        financialDebtNonCurrent: brl(0),
        cashAndEquivalents: brl(0),
        ebit: brl(0),
        depreciationAndAmortization: brl(0),
      })
    ).toThrow(/EBITDA must be positive/)
  })

  it('throws when EBITDA is negative', () => {
    expect(() =>
      computeStockNetDebtToEbitdaScaledV1({
        financialDebtCurrent: brl(100),
        financialDebtNonCurrent: brl(0),
        cashAndEquivalents: brl(0),
        ebit: brl(-500),
        depreciationAndAmortization: brl(100),
      })
    ).toThrow(/EBITDA must be positive/)
  })

  it('throws when currencies diverge', () => {
    expect(() =>
      computeStockNetDebtToEbitdaScaledV1({
        financialDebtCurrent: brl(100),
        financialDebtNonCurrent: brl(0),
        cashAndEquivalents: brl(0),
        ebit: { amountInMinorUnits: 500, currency: 'USD' },
        depreciationAndAmortization: brl(0),
      })
    ).toThrow(/same currency/)
  })

  it('throws when an input is not a safe integer', () => {
    expect(() =>
      computeStockNetDebtToEbitdaScaledV1({
        financialDebtCurrent: brl(Number.MAX_SAFE_INTEGER + 10),
        financialDebtNonCurrent: brl(0),
        cashAndEquivalents: brl(0),
        ebit: brl(500),
        depreciationAndAmortization: brl(0),
      })
    ).toThrow(/safe integers/)
  })
})
