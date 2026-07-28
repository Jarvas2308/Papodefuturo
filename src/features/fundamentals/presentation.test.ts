import { describe, expect, it } from 'vitest'
import {
  formatFundamentalSource,
  formatFundamentalsDate,
  formatFundamentalsMoney,
  formatFundamentalsMoneyPerUnit,
  formatFundamentalsRatioPercent,
} from './presentation'

describe('formatFundamentalsMoney', () => {
  it('formats a BRL fact from minor units', () => {
    expect(
      formatFundamentalsMoney({ amountInMinorUnits: 12_345, currency: 'BRL' })
    ).toBe('R$\xa0123,45')
  })

  it('formats a negative USD fact', () => {
    expect(
      formatFundamentalsMoney({ amountInMinorUnits: -500, currency: 'USD' })
    ).toContain('5,00')
  })

  it('returns a not-informed label for null facts', () => {
    expect(formatFundamentalsMoney(null)).toBe('Não informado')
  })
})

describe('formatFundamentalsDate', () => {
  it('formats a civil date in pt-BR without timezone drift', () => {
    expect(formatFundamentalsDate('2025-12-31')).toBe('31/12/2025')
  })
})

describe('formatFundamentalsRatioPercent', () => {
  it('formats a scaled ratio as a percentage', () => {
    expect(formatFundamentalsRatioPercent(250_000)).toBe('25%')
  })
})

describe('formatFundamentalsMoneyPerUnit', () => {
  it('formats a scaled BRL amount per unit', () => {
    const result = formatFundamentalsMoneyPerUnit(150_000_000)
    expect(result).toContain('R$')
  })
})

describe('formatFundamentalSource', () => {
  it('maps known source codes to labels', () => {
    expect(formatFundamentalSource('cvm-dfp')).toBe('CVM — DFP')
    expect(formatFundamentalSource('sec-nport')).toBe('SEC — N-PORT')
  })

  it('falls back to the raw code for unknown sources', () => {
    expect(formatFundamentalSource('unknown-source')).toBe('unknown-source')
  })
})
