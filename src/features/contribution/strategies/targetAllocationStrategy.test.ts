import { describe, expect, it } from 'vitest'
import { contributionMock } from '../mocks/contributionMock'
import type {
  AllocationTarget,
  ContributionInput,
  ContributionPosition,
} from '../types'
import { targetAllocationStrategy } from './targetAllocationStrategy'

const position = (
  assetId: string,
  category: ContributionPosition['category'],
  currentValueInCents: number
): ContributionPosition => ({ assetId, category, currentValueInCents })

const normalizedTargets: AllocationTarget[] = [
  { category: 'brazilian-stocks', targetPercentage: 50 },
  { category: 'real-estate-funds', targetPercentage: 30 },
  { category: 'international', targetPercentage: 20 },
]

const basePortfolio = [
  position('stocks', 'brazilian-stocks', 60),
  position('funds', 'real-estate-funds', 30),
  position('international', 'international', 10),
]

const input = (
  carteiraAtual: ContributionPosition[] = basePortfolio,
  metasAlocacao: AllocationTarget[] = normalizedTargets,
  valorAporteEmCentavos = 100
): ContributionInput => ({
  valorAporteEmCentavos,
  carteiraAtual,
  metasAlocacao,
  strategy: 'target-allocation',
})

describe('targetAllocationStrategy', () => {
  it('uses the projected total to produce the required 40 / 30 / 30 result', () => {
    const result = targetAllocationStrategy.execute(input())

    expect(result).toEqual({
      distribuicao: [
        { assetId: 'stocks', valorEmCentavos: 40 },
        { assetId: 'funds', valorEmCentavos: 30 },
        { assetId: 'international', valorEmCentavos: 30 },
      ],
      totalDistribuidoEmCentavos: 100,
    })
  })

  it('preserves one cent for a small contribution', () => {
    expect(
      targetAllocationStrategy.execute(input(undefined, undefined, 1))
    ).toEqual({
      distribuicao: [
        { assetId: 'stocks', valorEmCentavos: 0 },
        { assetId: 'funds', valorEmCentavos: 0 },
        { assetId: 'international', valorEmCentavos: 1 },
      ],
      totalDistribuidoEmCentavos: 1,
    })
  })

  it('uses projected monetary deficits for a large contribution', () => {
    expect(
      targetAllocationStrategy.execute(input(undefined, undefined, 1_000))
        .distribuicao
    ).toEqual([
      { assetId: 'stocks', valorEmCentavos: 490 },
      { assetId: 'funds', valorEmCentavos: 300 },
      { assetId: 'international', valorEmCentavos: 210 },
    ])
  })

  it('distributes inside a category according to each asset current value', () => {
    const result = targetAllocationStrategy.execute(
      input([
        position('stocks', 'brazilian-stocks', 60),
        position('funds', 'real-estate-funds', 30),
        position('intl-a', 'international', 8),
        position('intl-b', 'international', 2),
      ])
    )

    expect(result.distribuicao).toEqual([
      { assetId: 'stocks', valorEmCentavos: 40 },
      { assetId: 'funds', valorEmCentavos: 30 },
      { assetId: 'intl-a', valorEmCentavos: 24 },
      { assetId: 'intl-b', valorEmCentavos: 6 },
    ])
  })

  it('splits equally when eligible assets in a category are all zero', () => {
    const result = targetAllocationStrategy.execute(
      input([
        position('stocks', 'brazilian-stocks', 70),
        position('funds', 'real-estate-funds', 30),
        position('intl-a', 'international', 0),
        position('intl-b', 'international', 0),
      ])
    )

    expect(result.distribuicao).toEqual([
      { assetId: 'stocks', valorEmCentavos: 30 },
      { assetId: 'funds', valorEmCentavos: 30 },
      { assetId: 'intl-a', valorEmCentavos: 20 },
      { assetId: 'intl-b', valorEmCentavos: 20 },
    ])
  })

  it('gives zero to a category above its projected target', () => {
    const result = targetAllocationStrategy.execute(
      input(
        [
          position('stocks', 'brazilian-stocks', 70),
          position('funds', 'real-estate-funds', 20),
          position('international', 'international', 10),
        ],
        undefined,
        20
      )
    )

    expect(result.distribuicao[0]).toEqual({
      assetId: 'stocks',
      valorEmCentavos: 0,
    })
  })

  it('gives zero to categories exactly at their projected targets', () => {
    const result = targetAllocationStrategy.execute(
      input(
        [
          position('stocks', 'brazilian-stocks', 60),
          position('funds', 'real-estate-funds', 36),
          position('international', 'international', 4),
        ],
        undefined,
        20
      )
    )

    expect(result.distribuicao).toEqual([
      { assetId: 'stocks', valorEmCentavos: 0 },
      { assetId: 'funds', valorEmCentavos: 0 },
      { assetId: 'international', valorEmCentavos: 20 },
    ])
  })

  it('returns every asset at zero when contribution is zero', () => {
    expect(
      targetAllocationStrategy.execute(input(undefined, undefined, 0))
    ).toEqual({
      distribuicao: [
        { assetId: 'stocks', valorEmCentavos: 0 },
        { assetId: 'funds', valorEmCentavos: 0 },
        { assetId: 'international', valorEmCentavos: 0 },
      ],
      totalDistribuidoEmCentavos: 0,
    })
  })

  it('accepts the normalized project targets and all 12 mock positions', () => {
    const result = targetAllocationStrategy.execute({
      valorAporteEmCentavos: 100_000,
      carteiraAtual: contributionMock.carteiraAtual,
      metasAlocacao: contributionMock.metasAlocacao,
      strategy: 'target-allocation',
    })

    expect(result.distribuicao).toHaveLength(12)
    expect(result.totalDistribuidoEmCentavos).toBe(100_000)
  })

  it.each([-1, 100.0001, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects invalid target percentage %s',
    (targetPercentage) => {
      expect(() =>
        targetAllocationStrategy.execute(
          input(undefined, [
            { category: 'brazilian-stocks', targetPercentage },
            { category: 'real-estate-funds', targetPercentage: 30 },
            { category: 'international', targetPercentage: 70 },
          ])
        )
      ).toThrow(RangeError)
    }
  )

  it('rejects duplicate targets', () => {
    expect(() =>
      targetAllocationStrategy.execute(
        input(undefined, [
          { category: 'brazilian-stocks', targetPercentage: 50 },
          { category: 'brazilian-stocks', targetPercentage: 20 },
          { category: 'international', targetPercentage: 30 },
        ])
      )
    ).toThrow(/duplicate/i)
  })

  it('rejects a portfolio category without a target', () => {
    expect(() =>
      targetAllocationStrategy.execute(
        input(undefined, [
          { category: 'brazilian-stocks', targetPercentage: 70 },
          { category: 'real-estate-funds', targetPercentage: 30 },
        ])
      )
    ).toThrow(/missing allocation target/i)
  })

  it('rejects a target without a corresponding portfolio position', () => {
    expect(() =>
      targetAllocationStrategy.execute(
        input(
          [
            position('stocks', 'brazilian-stocks', 70),
            position('funds', 'real-estate-funds', 30),
          ],
          normalizedTargets
        )
      )
    ).toThrow(/no portfolio positions/i)
  })

  it('rejects allocation targets whose sum differs from 100%', () => {
    expect(() =>
      targetAllocationStrategy.execute(
        input(undefined, [
          { category: 'brazilian-stocks', targetPercentage: 50 },
          { category: 'real-estate-funds', targetPercentage: 30 },
          { category: 'international', targetPercentage: 19 },
        ])
      )
    ).toThrow(/total 100/i)
  })

  it('rejects empty portfolios, duplicate IDs and invalid values', () => {
    expect(() => targetAllocationStrategy.execute(input([]))).toThrow(
      RangeError
    )
    expect(() =>
      targetAllocationStrategy.execute(
        input([
          position('duplicate', 'brazilian-stocks', 60),
          position('funds', 'real-estate-funds', 30),
          position('duplicate', 'international', 10),
        ])
      )
    ).toThrow(/duplicate/i)
    expect(() =>
      targetAllocationStrategy.execute(
        input([
          position('stocks', 'brazilian-stocks', -1),
          position('funds', 'real-estate-funds', 30),
          position('international', 'international', 10),
        ])
      )
    ).toThrow(RangeError)
  })

  it('preserves the exact total and is deterministic', () => {
    const repeatedInput = input(undefined, undefined, 123_456)
    const result = targetAllocationStrategy.execute(repeatedInput)

    expect(
      result.distribuicao.reduce(
        (total, distribution) => total + distribution.valorEmCentavos,
        0
      )
    ).toBe(123_456)
    expect(result).toEqual(targetAllocationStrategy.execute(repeatedInput))
  })
})
