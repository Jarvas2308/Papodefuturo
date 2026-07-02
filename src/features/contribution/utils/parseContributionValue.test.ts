import { describe, expect, it } from 'vitest'
import { parseBrazilianCurrencyToCents } from '../mocks/contributionMock'
import { parseContributionValue } from './parseContributionValue'

describe('parseContributionValue', () => {
  it.each([
    ['1000', 100_000],
    ['1000,5', 100_050],
    ['1000,50', 100_050],
    ['1000.50', 100_050],
    ['1234,56', 123_456],
    ['0,01', 1],
  ])('parses %s into integer cents', (value, expected) => {
    expect(parseContributionValue(value)).toBe(expected)
  })

  it.each(['', '0', '-1', 'NaN', 'Infinity', '1e3', '1,234', 'texto'])(
    'rejects invalid input %s',
    (value) => {
      expect(() => parseContributionValue(value)).toThrow(RangeError)
    }
  )

  it('is deterministic for repeated input', () => {
    expect(parseContributionValue('1234,56')).toBe(
      parseContributionValue('1234,56')
    )
  })
})

describe('parseBrazilianCurrencyToCents', () => {
  it('adapts a visual Brazilian currency value at the mock boundary', () => {
    expect(parseBrazilianCurrencyToCents('R$ 12.617,71')).toBe(1_261_771)
  })

  it.each(['12.617,71', 'R$ 1,2', 'R$ inválido'])('rejects %s', (value) => {
    expect(() => parseBrazilianCurrencyToCents(value)).toThrow(RangeError)
  })
})
