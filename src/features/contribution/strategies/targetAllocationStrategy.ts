import type {
  ContributionInput,
  ContributionResult,
  ContributionStrategy,
} from '../types'
import { allocateByWeights } from '../utils/allocateByWeights'

const TARGET_SUM_TOLERANCE = 0.0001

function executeTargetAllocationStrategy(
  input: ContributionInput
): ContributionResult {
  if (
    !Number.isSafeInteger(input.valorAporteEmCentavos) ||
    input.valorAporteEmCentavos < 0
  ) {
    throw new RangeError(
      'Contribution value must be a non-negative safe integer'
    )
  }
  if (input.carteiraAtual.length === 0) {
    throw new RangeError('Portfolio must contain at least one position')
  }

  const targetsByCategory = new Map<string, number>()
  let targetPercentageTotal = 0

  for (const target of input.metasAlocacao) {
    if (
      !Number.isFinite(target.targetPercentage) ||
      target.targetPercentage < 0 ||
      target.targetPercentage > 100
    ) {
      throw new RangeError(`Invalid allocation target: ${target.category}`)
    }
    if (targetsByCategory.has(target.category)) {
      throw new Error(`Duplicate allocation target: ${target.category}`)
    }
    targetsByCategory.set(target.category, target.targetPercentage)
    targetPercentageTotal += target.targetPercentage
  }

  if (Math.abs(targetPercentageTotal - 100) > TARGET_SUM_TOLERANCE) {
    throw new RangeError('Allocation targets must total 100%')
  }

  const seenAssetIds = new Set<string>()
  const currentValueByCategory = new Map<string, number>()
  const positionsByCategory = new Map<string, typeof input.carteiraAtual>()
  let totalCurrentValue = 0

  for (const position of input.carteiraAtual) {
    if (!position.assetId || seenAssetIds.has(position.assetId)) {
      throw new Error(
        `Invalid or duplicate portfolio asset id: ${position.assetId}`
      )
    }
    if (
      !Number.isSafeInteger(position.currentValueInCents) ||
      position.currentValueInCents < 0
    ) {
      throw new RangeError(
        `Invalid current value for asset: ${position.assetId}`
      )
    }

    seenAssetIds.add(position.assetId)
    totalCurrentValue += position.currentValueInCents
    currentValueByCategory.set(
      position.category,
      (currentValueByCategory.get(position.category) ?? 0) +
        position.currentValueInCents
    )
    positionsByCategory.set(position.category, [
      ...(positionsByCategory.get(position.category) ?? []),
      position,
    ])
  }

  if (!Number.isSafeInteger(totalCurrentValue) || totalCurrentValue < 0) {
    throw new RangeError(
      'Portfolio current value must be a non-negative safe integer'
    )
  }

  for (const category of positionsByCategory.keys()) {
    if (!targetsByCategory.has(category)) {
      throw new Error(`Missing allocation target for category: ${category}`)
    }
  }

  for (const category of targetsByCategory.keys()) {
    if (!positionsByCategory.has(category)) {
      throw new Error(
        `Allocation target has no portfolio positions: ${category}`
      )
    }
  }

  const totalFinal = totalCurrentValue + input.valorAporteEmCentavos
  if (!Number.isSafeInteger(totalFinal)) {
    throw new RangeError(
      'Projected portfolio total exceeds the safe integer range'
    )
  }

  if (input.valorAporteEmCentavos === 0) {
    const allocations = allocateByWeights(
      0,
      input.carteiraAtual.map((position, originalOrder) => ({
        id: position.assetId,
        weight: 1,
        originalOrder,
      }))
    )

    return {
      distribuicao: allocations.map((allocation) => ({
        assetId: allocation.id,
        valorEmCentavos: allocation.valueInCents,
      })),
      totalDistribuidoEmCentavos: 0,
    }
  }

  const deficitByCategory = new Map<string, number>()
  for (const [category, targetPercentage] of targetsByCategory) {
    const categoryValue = currentValueByCategory.get(category) ?? 0
    const desiredFinalValue = (totalFinal * targetPercentage) / 100
    deficitByCategory.set(
      category,
      Math.max(desiredFinalValue - categoryValue, 0)
    )
  }

  const weightedAssets = input.carteiraAtual.map((position, originalOrder) => {
    const categoryDeficit = deficitByCategory.get(position.category) ?? 0
    const categoryValue = currentValueByCategory.get(position.category) ?? 0
    const categoryPositions = positionsByCategory.get(position.category) ?? []
    const positionShare =
      categoryValue > 0
        ? position.currentValueInCents / categoryValue
        : 1 / categoryPositions.length

    return {
      id: position.assetId,
      weight: categoryDeficit * positionShare,
      originalOrder,
    }
  })

  if (!weightedAssets.some((asset) => asset.weight > 0)) {
    throw new RangeError('No eligible category deficit found')
  }

  const allocations = allocateByWeights(
    input.valorAporteEmCentavos,
    weightedAssets
  )

  return {
    distribuicao: allocations.map((allocation) => ({
      assetId: allocation.id,
      valorEmCentavos: allocation.valueInCents,
    })),
    totalDistribuidoEmCentavos: input.valorAporteEmCentavos,
  }
}

export const targetAllocationStrategy: ContributionStrategy = {
  execute: executeTargetAllocationStrategy,
}
