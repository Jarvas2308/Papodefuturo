import { describe, expect, it } from 'vitest'
import { strategyCurrentPositions, strategyMock } from '../mocks/strategyMock'
import {
  TOTAL_BASIS_POINTS,
  calculateGlobalTargetProduct,
  calculateStrategyAllocation,
  classifyDeviation,
  cloneStrategy,
  createStrategyDraft,
  percentageInputToBasisPoints,
  strategyFromDraft,
  validateStrategy,
} from './strategy'

describe('validateStrategy', () => {
  it('accepts categories totaling exactly 10,000 basis points', () => {
    const validation = validateStrategy(strategyMock)

    expect(validation.isValid).toBe(true)
    expect(validation.categoryTotalInBasisPoints).toBe(TOTAL_BASIS_POINTS)
  })

  it('rejects categories below 10,000 basis points', () => {
    const strategy = cloneStrategy(strategyMock)
    strategy[0].targetInBasisPoints -= 500

    const validation = validateStrategy(strategy)

    expect(validation.isValid).toBe(false)
    expect(validation.issues[0].message).toContain('Faltam 5,00%')
  })

  it('rejects categories above 10,000 basis points', () => {
    const strategy = cloneStrategy(strategyMock)
    strategy[0].targetInBasisPoints += 200

    const validation = validateStrategy(strategy)

    expect(validation.isValid).toBe(false)
    expect(validation.issues[0].message).toContain('Reduza 2,00%')
  })

  it('accepts assets totaling exactly 10,000 within every category', () => {
    for (const category of strategyMock) {
      expect(
        category.assets.reduce(
          (total, asset) => total + asset.targetWithinCategoryInBasisPoints,
          0
        )
      ).toBe(TOTAL_BASIS_POINTS)
    }
  })

  it('identifies a category with an invalid internal composition', () => {
    const strategy = cloneStrategy(strategyMock)
    strategy[1].assets[0].targetWithinCategoryInBasisPoints += 200

    const validation = validateStrategy(strategy)

    expect(validation.isValid).toBe(false)
    expect(validation.invalidCategoryIds).toContain('real-estate-funds')
    expect(validation.issues[0].message).toContain('Reduza 2,00%')
  })
})

describe('strategy calculations', () => {
  it('derives the global target from category and internal targets', () => {
    expect(calculateGlobalTargetProduct(3529, 2000)).toBe(7_058_000)
  })

  it('calculates the current category allocation from portfolio cents', () => {
    const allocations = calculateStrategyAllocation(
      strategyMock,
      strategyCurrentPositions
    )

    expect(allocations[0].currentValueInCents).toBe(4_783_142)
    expect(allocations[0].currentInBasisPoints).toBe(3780)
  })

  it('calculates category and asset deviations in basis points', () => {
    const allocations = calculateStrategyAllocation(
      strategyMock,
      strategyCurrentPositions
    )

    expect(allocations[0].deviationInBasisPoints).toBe(251)
    expect(allocations[0].assets[0].deviationInBasisPoints).toBe(337)
  })

  it('keeps all 12 portfolio assets in the derived allocation', () => {
    const allocations = calculateStrategyAllocation(
      strategyMock,
      strategyCurrentPositions
    )

    expect(
      allocations.reduce((total, category) => total + category.assets.length, 0)
    ).toBe(12)
  })
})

describe('allocation status', () => {
  it.each([
    [-51, 'below'],
    [-50, 'near'],
    [0, 'near'],
    [50, 'near'],
    [51, 'above'],
  ] as const)('classifies %i basis points as %s', (deviation, expected) => {
    expect(classifyDeviation(deviation)).toBe(expected)
  })
})

describe('strategy editing helpers', () => {
  it('converts percentage inputs to basis points without floating validation', () => {
    expect(percentageInputToBasisPoints('35,29')).toBe(3529)
    expect(percentageInputToBasisPoints('100.00')).toBe(10_000)
    expect(percentageInputToBasisPoints('35.291')).toBeNull()
  })

  it('restores a default draft with two decimal places', () => {
    const draft = createStrategyDraft(strategyMock)

    expect(
      draft.categories.map((category) => category.targetPercentage)
    ).toEqual(['35.29', '35.29', '29.42'])
  })

  it('does not mutate the original mock when editing a clone or draft', () => {
    const originalSnapshot = JSON.stringify(strategyMock)
    const clone = cloneStrategy(strategyMock)
    clone[0].targetInBasisPoints = 3000

    const draft = createStrategyDraft(clone)
    draft.categories[0].targetPercentage = '31.00'
    strategyFromDraft(clone, draft)

    expect(JSON.stringify(strategyMock)).toBe(originalSnapshot)
  })
})
