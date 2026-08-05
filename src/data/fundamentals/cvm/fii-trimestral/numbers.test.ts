import { describe, expect, it } from 'vitest'
import { parseNullableCvmFiiExactDecimalQuantity } from '../fii/numbers'
import {
  computeTenantConcentration,
  computeWaleInMonths,
  computeWeightedAverageVacancyInBasisPoints,
  toBasisPoints,
} from './numbers'

function decimal(value: string) {
  const parsed = parseNullableCvmFiiExactDecimalQuantity(value, 'test value')
  if (parsed === null) {
    throw new Error(`Unexpected null decimal for ${value}`)
  }
  return parsed
}

describe('computeWeightedAverageVacancyInBasisPoints', () => {
  it('returns null with a zero-length weight sum for no properties', () => {
    expect(computeWeightedAverageVacancyInBasisPoints([])).toEqual({
      basisPoints: null,
      weightSum: { unscaledValue: 0, scale: 0 },
    })
  })

  it('returns null when every weight is zero', () => {
    const result = computeWeightedAverageVacancyInBasisPoints([
      { vacancy: decimal('0.5'), weight: decimal('0') },
      { vacancy: decimal('1'), weight: decimal('0') },
    ])
    expect(result.basisPoints).toBeNull()
  })

  it('computes an exact weighted average when weights sum to one', () => {
    const result = computeWeightedAverageVacancyInBasisPoints([
      { vacancy: decimal('0.1'), weight: decimal('0.5') },
      { vacancy: decimal('0.2'), weight: decimal('0.5') },
    ])
    expect(result.basisPoints).toBe(1500)
    expect(result.weightSum).toEqual({ unscaledValue: 1, scale: 0 })
  })

  it('normalizes by the real weight sum instead of assuming it equals one', () => {
    // Espelha o dado real da HGRU11: soma de Percentual_Receitas_FII fica
    // abaixo de 1 (receita nao alocada a imovel especifico).
    const result = computeWeightedAverageVacancyInBasisPoints([
      { vacancy: decimal('1'), weight: decimal('0.1') },
      { vacancy: decimal('0'), weight: decimal('0.2') },
    ])
    expect(result.basisPoints).toBe(3333)
    expect(result.weightSum).toEqual({ unscaledValue: 3, scale: 1 })
  })

  it('rounds half up at the basis-point boundary', () => {
    const result = computeWeightedAverageVacancyInBasisPoints([
      { vacancy: decimal('0.00005'), weight: decimal('1') },
    ])
    expect(result.basisPoints).toBe(1)
  })

  it('handles full vacancy (100%)', () => {
    const result = computeWeightedAverageVacancyInBasisPoints([
      { vacancy: decimal('1'), weight: decimal('1') },
    ])
    expect(result.basisPoints).toBe(10_000)
  })

  it('handles high-precision fractions observed in real CVM data without overflow', () => {
    const result = computeWeightedAverageVacancyInBasisPoints([
      { vacancy: decimal('0.00183809242195829'), weight: decimal('0.014') },
      { vacancy: decimal('0.103933'), weight: decimal('0.02') },
      { vacancy: decimal('1'), weight: decimal('0.005') },
    ])
    expect(result.basisPoints).not.toBeNull()
    expect(result.basisPoints).toBeGreaterThanOrEqual(0)
    expect(result.basisPoints).toBeLessThanOrEqual(10_000)
    expect(Number.isSafeInteger(result.weightSum.unscaledValue)).toBe(true)
  })
})

describe('toBasisPoints', () => {
  it('returns null for a null input', () => {
    expect(toBasisPoints(null)).toBeNull()
  })

  it('converts the real HGRU11 IPCA share exactly', () => {
    expect(toBasisPoints(decimal('0.867201'))).toBe(8672)
  })

  it('rounds half up', () => {
    expect(toBasisPoints(decimal('0.00005'))).toBe(1)
  })

  it('converts a full fraction to 10000', () => {
    expect(toBasisPoints(decimal('1'))).toBe(10_000)
  })

  it('converts zero to zero', () => {
    expect(toBasisPoints(decimal('0'))).toBe(0)
  })
})

describe('computeTenantConcentration', () => {
  it('returns null with no sectors for an empty input', () => {
    expect(computeTenantConcentration([])).toEqual({
      basisPoints: null,
      dominantSector: null,
      sectors: [],
    })
  })

  it('picks the dominant sector for a single-sector fund', () => {
    const result = computeTenantConcentration([
      { sector: 'Serviço', share: decimal('0.884577') },
      { sector: 'Comércio', share: decimal('0.100799') },
    ])
    expect(result.basisPoints).toBe(8846)
    expect(result.dominantSector).toBe('Serviço')
    expect(result.sectors).toHaveLength(2)
  })

  it('sums revenue share across properties sharing the same sector', () => {
    const result = computeTenantConcentration([
      { sector: 'Varejo', share: decimal('0.3') },
      { sector: 'Varejo', share: decimal('0.25') },
      { sector: 'Educação', share: decimal('0.4') },
    ])
    expect(result.basisPoints).toBe(5500)
    expect(result.dominantSector).toBe('Varejo')
    const varejo = result.sectors.find((sector) => sector.sector === 'Varejo')
    expect(varejo?.rowCount).toBe(2)
    expect(varejo?.sum).toEqual({ unscaledValue: 55, scale: 2 })
  })

  it('treats a single dominant sector at 100% correctly', () => {
    const result = computeTenantConcentration([
      { sector: 'Logística', share: decimal('1') },
    ])
    expect(result.basisPoints).toBe(10_000)
    expect(result.dominantSector).toBe('Logística')
  })
})

describe('computeWaleInMonths', () => {
  it('returns null with a zero-length weight sum for no faixas', () => {
    expect(computeWaleInMonths([])).toEqual({
      monthsScaledBy100: null,
      weightSum: { unscaledValue: 0, scale: 0 },
    })
  })

  it('returns null when every weight is zero', () => {
    const result = computeWaleInMonths([
      { midpointMonthsX100: 150, weight: decimal('0') },
      { midpointMonthsX100: 450, weight: decimal('0') },
    ])
    expect(result.monthsScaledBy100).toBeNull()
  })

  it('computes an exact weighted average across two faixas', () => {
    // 50% em 1,5 mes, 50% em 4,5 meses -> media exata de 3 meses.
    const result = computeWaleInMonths([
      { midpointMonthsX100: 150, weight: decimal('0.5') },
      { midpointMonthsX100: 450, weight: decimal('0.5') },
    ])
    expect(result.monthsScaledBy100).toBe(300)
  })

  it('normalizes by the real weight sum instead of assuming it equals one', () => {
    const result = computeWaleInMonths([
      { midpointMonthsX100: 150, weight: decimal('0.1') },
      { midpointMonthsX100: 450, weight: decimal('0.2') },
    ])
    // (150*0.1 + 450*0.2) / 0.3 = (15+90)/0.3 = 350
    expect(result.monthsScaledBy100).toBe(350)
  })

  it('handles scientific-notation weights from real CVM maturity faixas without overflow', () => {
    const result = computeWaleInMonths([
      { midpointMonthsX100: 2850, weight: decimal('6.8E-05') },
      { midpointMonthsX100: 3150, weight: decimal('7.5E-05') },
      { midpointMonthsX100: 3600, weight: decimal('0.8196') },
    ])
    expect(result.monthsScaledBy100).not.toBeNull()
    expect(Number.isSafeInteger(result.monthsScaledBy100)).toBe(true)
    expect(Number.isSafeInteger(result.weightSum.unscaledValue)).toBe(true)
  })
})
