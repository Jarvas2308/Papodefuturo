import { describe, expect, it } from 'vitest'
import type { StrategyCategory } from '../../strategy/types'
import { buildGlobalAssetTargets } from './buildGlobalAssetTargets'

function strategy(): StrategyCategory[] {
  return [
    {
      id: 'brazilian-stocks',
      name: 'Ações brasileiras',
      targetInBasisPoints: 6_000,
      assets: [
        {
          assetId: 'a',
          ticker: 'A',
          assetName: 'A',
          targetWithinCategoryInBasisPoints: 5_000,
        },
        {
          assetId: 'b',
          ticker: 'B',
          assetName: 'B',
          targetWithinCategoryInBasisPoints: 5_000,
        },
      ],
    },
    {
      id: 'international',
      name: 'Internacional',
      targetInBasisPoints: 4_000,
      assets: [
        {
          assetId: 'c',
          ticker: 'C',
          assetName: 'C',
          targetWithinCategoryInBasisPoints: 3_333,
        },
        {
          assetId: 'd',
          ticker: 'D',
          assetName: 'D',
          targetWithinCategoryInBasisPoints: 3_333,
        },
        {
          assetId: 'e',
          ticker: 'E',
          assetName: 'E',
          targetWithinCategoryInBasisPoints: 3_334,
        },
      ],
    },
  ]
}

describe('buildGlobalAssetTargets', () => {
  it('derives global targets from category and internal targets', () => {
    expect(buildGlobalAssetTargets(strategy())).toEqual([
      { assetId: 'a', targetInBasisPoints: 3_000 },
      { assetId: 'b', targetInBasisPoints: 3_000 },
      { assetId: 'c', targetInBasisPoints: 1_333 },
      { assetId: 'd', targetInBasisPoints: 1_333 },
      { assetId: 'e', targetInBasisPoints: 1_334 },
    ])
  })

  it('normalizes the result to exactly 10000 basis points', () => {
    const total = buildGlobalAssetTargets(strategy()).reduce(
      (sum, target) => sum + target.targetInBasisPoints,
      0
    )
    expect(total).toBe(10_000)
  })

  it('uses largest remainders before smaller remainders', () => {
    const result = buildGlobalAssetTargets(strategy())
    expect(result.find((target) => target.assetId === 'e')).toEqual({
      assetId: 'e',
      targetInBasisPoints: 1_334,
    })
  })

  it('uses original strategy order to break equal remainder ties', () => {
    const oneCategory = strategy().slice(0, 1)
    oneCategory[0]!.targetInBasisPoints = 10_000
    expect(
      buildGlobalAssetTargets(oneCategory).map((target) => target.assetId)
    ).toEqual(['a', 'b'])
  })

  it('preserves asset order and is deterministic', () => {
    expect(buildGlobalAssetTargets(strategy())).toEqual(
      buildGlobalAssetTargets(strategy())
    )
    expect(
      buildGlobalAssetTargets(strategy()).map((target) => target.assetId)
    ).toEqual(['a', 'b', 'c', 'd', 'e'])
  })

  it('rejects an empty strategy', () => {
    expect(() => buildGlobalAssetTargets([])).toThrow(RangeError)
  })

  it('rejects categories below 10000 basis points', () => {
    const invalid = strategy()
    invalid[0]!.targetInBasisPoints -= 1
    expect(() => buildGlobalAssetTargets(invalid)).toThrow(/category targets/)
  })

  it('rejects categories above 10000 basis points', () => {
    const invalid = strategy()
    invalid[0]!.targetInBasisPoints += 1
    expect(() => buildGlobalAssetTargets(invalid)).toThrow(/category targets/)
  })

  it('rejects a category without assets', () => {
    const invalid = strategy()
    invalid[0]!.assets = []
    expect(() => buildGlobalAssetTargets(invalid)).toThrow(/no assets/)
  })

  it('rejects internal targets below 10000 basis points', () => {
    const invalid = strategy()
    invalid[0]!.assets[0]!.targetWithinCategoryInBasisPoints -= 1
    expect(() => buildGlobalAssetTargets(invalid)).toThrow(/asset targets/)
  })

  it('rejects internal targets above 10000 basis points', () => {
    const invalid = strategy()
    invalid[0]!.assets[0]!.targetWithinCategoryInBasisPoints += 1
    expect(() => buildGlobalAssetTargets(invalid)).toThrow(/asset targets/)
  })

  it('rejects duplicate category ids', () => {
    const invalid = strategy()
    invalid[1]!.id = invalid[0]!.id
    expect(() => buildGlobalAssetTargets(invalid)).toThrow(
      /duplicate strategy category/
    )
  })

  it('rejects a category incompatible with the monitored strategy', () => {
    const invalid = strategy()
    invalid[0]!.id = 'unsupported' as StrategyCategory['id']
    expect(() => buildGlobalAssetTargets(invalid)).toThrow(/strategy category/)
  })

  it('rejects duplicate asset ids across categories', () => {
    const invalid = strategy()
    invalid[1]!.assets[0]!.assetId = 'a'
    expect(() => buildGlobalAssetTargets(invalid)).toThrow(
      /duplicate strategy asset/
    )
  })

  it('rejects empty asset ids', () => {
    const invalid = strategy()
    invalid[0]!.assets[0]!.assetId = ''
    expect(() => buildGlobalAssetTargets(invalid)).toThrow(/strategy asset/)
  })

  it.each([-1, 10_001, 1.5, Number.NaN])(
    'rejects invalid category basis points %s',
    (value) => {
      const invalid = strategy()
      invalid[0]!.targetInBasisPoints = value
      expect(() => buildGlobalAssetTargets(invalid)).toThrow(RangeError)
    }
  )

  it.each([-1, 10_001, 1.5, Number.NaN])(
    'rejects invalid internal basis points %s',
    (value) => {
      const invalid = strategy()
      invalid[0]!.assets[0]!.targetWithinCategoryInBasisPoints = value
      expect(() => buildGlobalAssetTargets(invalid)).toThrow(RangeError)
    }
  )
})
