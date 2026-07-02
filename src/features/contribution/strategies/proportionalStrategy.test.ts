import { describe, expect, it } from 'vitest'
import type { ContributionInput, ContributionPosition } from '../types'
import { proportionalStrategy } from './proportionalStrategy'

const position = (
  assetId: string,
  currentValueInCents: number
): ContributionPosition => ({
  assetId,
  category: 'brazilian-stocks',
  currentValueInCents,
})

const input = (
  valorAporteEmCentavos: number,
  carteiraAtual: ContributionPosition[]
): ContributionInput => ({
  valorAporteEmCentavos,
  carteiraAtual,
  metasAlocacao: [],
  strategy: 'proportional',
})

describe('proportionalStrategy', () => {
  it('allocates the entire contribution to one position', () => {
    expect(
      proportionalStrategy.execute(input(100_000, [position('a', 500)]))
    ).toEqual({
      distribuicao: [{ assetId: 'a', valorEmCentavos: 100_000 }],
      totalDistribuidoEmCentavos: 100_000,
    })
  })

  it('allocates multiple positions with exact cents and remainders', () => {
    const result = proportionalStrategy.execute(
      input(100, [position('a', 1), position('b', 1), position('c', 1)])
    )
    expect(result.distribuicao).toEqual([
      { assetId: 'a', valorEmCentavos: 34 },
      { assetId: 'b', valorEmCentavos: 33 },
      { assetId: 'c', valorEmCentavos: 33 },
    ])
    expect(result.totalDistribuidoEmCentavos).toBe(100)
  })

  it('supports a one-cent and a zero contribution', () => {
    const portfolio = [position('a', 1), position('b', 1)]
    expect(
      proportionalStrategy.execute(input(1, portfolio)).distribuicao
    ).toEqual([
      { assetId: 'a', valorEmCentavos: 1 },
      { assetId: 'b', valorEmCentavos: 0 },
    ])
    expect(
      proportionalStrategy.execute(input(0, portfolio))
        .totalDistribuidoEmCentavos
    ).toBe(0)
  })

  it('rejects duplicate IDs, empty portfolios and zero-value portfolios', () => {
    expect(() =>
      proportionalStrategy.execute(
        input(100, [position('a', 1), position('a', 2)])
      )
    ).toThrow(/duplicate/i)
    expect(() => proportionalStrategy.execute(input(100, []))).toThrow(
      RangeError
    )
    expect(() =>
      proportionalStrategy.execute(input(100, [position('a', 0)]))
    ).toThrow(RangeError)
  })

  it.each([-1, 1.5, Number.MAX_SAFE_INTEGER + 1])(
    'rejects invalid position value %s',
    (value) => {
      expect(() =>
        proportionalStrategy.execute(input(100, [position('a', value)]))
      ).toThrow(RangeError)
    }
  )

  it('is deterministic', () => {
    const repeatedInput = input(123_456, [position('a', 7), position('b', 11)])
    expect(proportionalStrategy.execute(repeatedInput)).toEqual(
      proportionalStrategy.execute(repeatedInput)
    )
  })
})
