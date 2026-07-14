import { describe, expect, it } from 'vitest'
import { contributionMock } from '../mocks/contributionMock'
import type {
  ContributionAssetTarget,
  ContributionInput,
  ContributionPosition,
} from '../types'
import {
  MAX_PLAN_ASSETS,
  targetAllocationStrategy,
} from './targetAllocationStrategy'

function position(
  assetId: string,
  currentValueInCents: number,
  unitPriceInCents: number | null = 10
): ContributionPosition {
  return {
    assetId,
    category: 'brazilian-stocks',
    currentValueInCents,
    unitPriceInCents,
  }
}

function targets(
  definitions: Array<[string, number]>
): ContributionAssetTarget[] {
  return definitions.map(([assetId, targetInBasisPoints]) => ({
    assetId,
    targetInBasisPoints,
  }))
}

function input(
  carteiraAtual: ContributionPosition[] = [
    position('a', 100),
    position('b', 0),
  ],
  metasGlobaisPorAtivo: ContributionAssetTarget[] = targets([
    ['a', 5_000],
    ['b', 5_000],
  ]),
  valorAporteEmCentavos = 100
): ContributionInput {
  return {
    valorAporteEmCentavos,
    carteiraAtual,
    metasAlocacao: [],
    metasGlobaisPorAtivo,
    strategy: 'target-allocation',
  }
}

function targetResult(value: ContributionInput) {
  const result = targetAllocationStrategy.execute(value)
  if (result.strategy !== 'target-allocation') {
    throw new Error('Expected target allocation result')
  }
  return result
}

describe('targetAllocationStrategy', () => {
  it('buys one unit at a time until the budget is exhausted', () => {
    const result = targetResult(input())

    expect(result.distribuicao).toEqual([
      { assetId: 'b', valorEmCentavos: 100 },
    ])
    expect(result.technicalImpact.items[0]).toMatchObject({
      assetId: 'b',
      suggestedQuantity: 10,
      unitPriceInCents: 10,
      allocatedInCents: 100,
    })
    expect(result.technicalImpact.stopReason).toBe('budget-exhausted')
  })

  it('reduces total deviation and never reports a negative reduction', () => {
    const result = targetResult(input())

    expect(result.technicalImpact.totalDeviationBeforeInBasisPoints).toBe(
      10_000
    )
    expect(result.technicalImpact.totalDeviationAfterInBasisPoints).toBe(0)
    expect(result.technicalImpact.totalDeviationReductionInBasisPoints).toBe(
      10_000
    )
  })

  it('uses the input order to break an exact candidate tie', () => {
    const result = targetResult(
      input(
        [position('a', 0), position('b', 0), position('over', 100)],
        targets([
          ['a', 5_000],
          ['b', 5_000],
          ['over', 0],
        ]),
        10
      )
    )

    expect(result.distribuicao).toEqual([{ assetId: 'a', valorEmCentavos: 10 }])
  })

  it('uses exact rational deviation when rounded basis points tie', () => {
    const result = targetResult(
      input(
        [position('first', 35, 1), position('second', 0, 1)],
        targets([
          ['first', 9_861],
          ['second', 139],
        ]),
        1
      )
    )

    expect(result.distribuicao).toEqual([
      { assetId: 'second', valorEmCentavos: 1 },
    ])
  })

  it('handles an empty initial portfolio value with a 10000 bps deviation', () => {
    const result = targetResult(
      input(
        [position('a', 0), position('b', 0)],
        targets([
          ['a', 10_000],
          ['b', 0],
        ]),
        20
      )
    )

    expect(result.technicalImpact.totalDeviationBeforeInBasisPoints).toBe(
      10_000
    )
    expect(result.technicalImpact.totalDeviationAfterInBasisPoints).toBe(0)
  })

  it('stops when no unit is affordable', () => {
    const result = targetResult(
      input([position('a', 100, 200), position('b', 0, 200)])
    )

    expect(result.distribuicao).toEqual([])
    expect(result.totalDistribuidoEmCentavos).toBe(0)
    expect(result.saldoNaoAlocadoEmCentavos).toBe(100)
    expect(result.technicalImpact.stopReason).toBe('no-affordable-unit')
  })

  it('stops when every affordable unit would keep or worsen deviation', () => {
    const result = targetResult(input([position('a', 50), position('b', 50)]))

    expect(result.distribuicao).toEqual([])
    expect(result.technicalImpact.stopReason).toBe('no-improving-purchase')
  })

  it('returns the zero-contribution stop without an empty placeholder item', () => {
    const result = targetResult(input(undefined, undefined, 0))

    expect(result.distribuicao).toEqual([])
    expect(result.technicalImpact.items).toEqual([])
    expect(result.technicalImpact.stopReason).toBe('zero-contribution')
  })

  it('limits a plan to three distinct assets', () => {
    const result = targetResult(
      input(
        [
          position('a', 100, 1),
          position('b', 0, 1),
          position('c', 0, 1),
          position('d', 0, 1),
          position('e', 0, 1),
        ],
        targets([
          ['a', 2_000],
          ['b', 2_000],
          ['c', 2_000],
          ['d', 2_000],
          ['e', 2_000],
        ]),
        200
      )
    )

    expect(result.distribuicao.length).toBeLessThanOrEqual(MAX_PLAN_ASSETS)
    expect(new Set(result.distribuicao.map((item) => item.assetId)).size).toBe(
      result.distribuicao.length
    )
  })

  it('can select exactly two assets', () => {
    const result = targetResult(
      input(
        [position('over', 100), position('b', 0), position('c', 0)],
        targets([
          ['over', 0],
          ['b', 5_000],
          ['c', 5_000],
        ]),
        200
      )
    )

    expect(result.distribuicao.map((item) => item.assetId)).toEqual(['b', 'c'])
  })

  it('can select exactly three assets and then only add to those assets', () => {
    const result = targetResult(
      input(
        [
          position('over', 100, 1),
          position('b', 0, 1),
          position('c', 0, 1),
          position('d', 0, 1),
          position('e', 0, 1),
        ],
        targets([
          ['over', 0],
          ['b', 2_500],
          ['c', 2_500],
          ['d', 2_500],
          ['e', 2_500],
        ]),
        100
      )
    )

    expect(result.distribuicao).toHaveLength(3)
    expect(
      result.technicalImpact.items.some((item) => item.suggestedQuantity > 1)
    ).toBe(true)
  })

  it('ignores an unaffordable candidate and selects an improving affordable unit', () => {
    const result = targetResult(
      input(
        [
          position('over', 100, 10),
          position('expensive', 0, 200),
          position('affordable', 0, 10),
        ],
        targets([
          ['over', 0],
          ['expensive', 7_000],
          ['affordable', 3_000],
        ]),
        100
      )
    )

    expect(
      result.distribuicao.some((item) => item.assetId === 'expensive')
    ).toBe(false)
    expect(result.distribuicao[0]?.assetId).toBe('affordable')
  })

  it('keeps output assets in first-selection order', () => {
    const result = targetResult(
      input(
        [
          position('over', 100, 10),
          position('first', 0, 20),
          position('second', 0, 10),
        ],
        targets([
          ['over', 2_000],
          ['first', 4_000],
          ['second', 4_000],
        ]),
        60
      )
    )

    expect(result.distribuicao.map((item) => item.assetId)).toEqual(
      result.technicalImpact.items.map((item) => item.assetId)
    )
  })

  it('preserves the distributed plus unallocated invariant', () => {
    const result = targetResult(
      input([position('a', 100, 30), position('b', 0, 30)], undefined, 95)
    )
    const distributed = result.distribuicao.reduce(
      (sum, item) => sum + item.valorEmCentavos,
      0
    )

    expect(distributed).toBe(result.totalDistribuidoEmCentavos)
    expect(distributed + result.saldoNaoAlocadoEmCentavos).toBe(95)
  })

  it('calculates signed differences before and after with half-up basis points', () => {
    const result = targetResult(input())
    const item = result.technicalImpact.items[0]

    expect(item?.differenceBeforeInBasisPoints).toBe(-5_000)
    expect(item?.differenceAfterInBasisPoints).toBe(0)
  })

  it('is deterministic for repeated executions', () => {
    const repeatedInput = input()
    expect(targetResult(repeatedInput)).toEqual(targetResult(repeatedInput))
  })

  it('uses BigInt intermediates for large safe-integer current values', () => {
    const large = Math.floor(Number.MAX_SAFE_INTEGER / 3)
    const result = targetResult(
      input([position('a', large), position('b', 0)], undefined, 10)
    )

    expect(
      result.technicalImpact.totalDeviationAfterInBasisPoints
    ).toBeLessThanOrEqual(
      result.technicalImpact.totalDeviationBeforeInBasisPoints
    )
  })

  it('accepts all 12 deterministic demo positions and global targets', () => {
    const result = targetResult({
      valorAporteEmCentavos: 100_000,
      carteiraAtual: contributionMock.carteiraAtual,
      metasAlocacao: contributionMock.metasAlocacao,
      metasGlobaisPorAtivo: contributionMock.metasGlobaisPorAtivo,
      strategy: 'target-allocation',
    })

    expect(result.distribuicao.length).toBeGreaterThan(0)
    expect(result.distribuicao.length).toBeLessThanOrEqual(3)
  })

  it('rejects missing unit prices instead of using average cost', () => {
    expect(() =>
      targetAllocationStrategy.execute(
        input([position('a', 100, null), position('b', 0)])
      )
    ).toThrow('Não há cotações suficientes')
  })

  it('rejects non-positive and unsafe unit prices', () => {
    for (const invalid of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
      expect(() =>
        targetAllocationStrategy.execute(
          input([position('a', 100, invalid), position('b', 0)])
        )
      ).toThrow(RangeError)
    }
  })

  it('rejects duplicate portfolio ids', () => {
    expect(() =>
      targetAllocationStrategy.execute(
        input([position('a', 100), position('a', 0)])
      )
    ).toThrow(/duplicate portfolio asset/i)
  })

  it('rejects an empty portfolio asset id', () => {
    expect(() =>
      targetAllocationStrategy.execute(
        input(
          [position('', 100), position('b', 0)],
          targets([
            ['', 5_000],
            ['b', 5_000],
          ])
        )
      )
    ).toThrow(/portfolio asset id/i)
  })

  it('rejects invalid current values and contribution values', () => {
    expect(() =>
      targetAllocationStrategy.execute(
        input([position('a', -1), position('b', 0)])
      )
    ).toThrow(RangeError)
    expect(() =>
      targetAllocationStrategy.execute(input(undefined, undefined, -1))
    ).toThrow(RangeError)
    expect(() =>
      targetAllocationStrategy.execute(
        input([position('a', 1.5), position('b', 0)])
      )
    ).toThrow(RangeError)
    expect(() =>
      targetAllocationStrategy.execute(
        input(undefined, undefined, Number.MAX_SAFE_INTEGER + 1)
      )
    ).toThrow(RangeError)
  })

  it('rejects duplicate, missing and extra asset targets', () => {
    expect(() =>
      targetAllocationStrategy.execute(
        input(
          undefined,
          targets([
            ['a', 5_000],
            ['a', 5_000],
          ])
        )
      )
    ).toThrow(/duplicate contribution asset target/i)
    expect(() =>
      targetAllocationStrategy.execute(
        input(undefined, targets([['a', 10_000]]))
      )
    ).toThrow(/missing asset target/i)
    expect(() =>
      targetAllocationStrategy.execute(
        input(
          undefined,
          targets([
            ['a', 5_000],
            ['outside', 5_000],
          ])
        )
      )
    ).toThrow(/no portfolio position/i)
  })

  it('rejects global targets that do not total exactly 10000', () => {
    expect(() =>
      targetAllocationStrategy.execute(
        input(
          undefined,
          targets([
            ['a', 5_000],
            ['b', 4_999],
          ])
        )
      )
    ).toThrow(/total 10000/i)
  })

  it.each([-1, 10_001, 1.5, Number.NaN])(
    'rejects invalid global target %s',
    (targetInBasisPoints) => {
      expect(() =>
        targetAllocationStrategy.execute(
          input(
            undefined,
            targets([
              ['a', targetInBasisPoints],
              ['b', 5_000],
            ])
          )
        )
      ).toThrow(RangeError)
    }
  )
})
