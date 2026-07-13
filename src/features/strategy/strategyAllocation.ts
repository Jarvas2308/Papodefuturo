import type { ContributionPosition } from '../contribution/types'
import type { StrategyCategory, StrategyCategoryAllocation } from './types'
import {
  TOTAL_BASIS_POINTS,
  calculateGlobalTargetProduct,
  calculateStrategyAllocation,
  classifyDeviation,
} from './utils/strategy'

export function calculateStrategyAllocationForRuntime(
  strategy: StrategyCategory[],
  positions: ContributionPosition[]
): StrategyCategoryAllocation[] {
  const totalValueInCents = positions.reduce(
    (total, position) => total + position.currentValueInCents,
    0
  )

  if (totalValueInCents > 0) {
    return calculateStrategyAllocation(strategy, positions)
  }

  return strategy.map((category) => ({
    ...category,
    currentValueInCents: 0,
    currentInBasisPoints: 0,
    deviationInBasisPoints: -category.targetInBasisPoints,
    status: classifyDeviation(-category.targetInBasisPoints),
    internalTargetTotalInBasisPoints: category.assets.reduce(
      (total, asset) => total + asset.targetWithinCategoryInBasisPoints,
      0
    ),
    assets: category.assets.map((asset) => {
      const globalTargetProduct = calculateGlobalTargetProduct(
        category.targetInBasisPoints,
        asset.targetWithinCategoryInBasisPoints
      )
      const globalTargetInBasisPoints = Math.round(
        globalTargetProduct / TOTAL_BASIS_POINTS
      )

      return {
        ...asset,
        currentValueInCents: 0,
        currentGlobalInBasisPoints: 0,
        globalTargetProduct,
        deviationInBasisPoints: -globalTargetInBasisPoints,
        status: classifyDeviation(-globalTargetInBasisPoints),
      }
    }),
  }))
}
