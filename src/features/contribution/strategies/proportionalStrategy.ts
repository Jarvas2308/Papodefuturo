import type {
  ContributionInput,
  ContributionResult,
  ContributionStrategy,
} from '../types'
import { allocateByWeights } from '../utils/allocateByWeights'

function validatePositions(input: ContributionInput) {
  if (input.carteiraAtual.length === 0) {
    throw new RangeError('Portfolio must contain at least one position')
  }

  const seenAssetIds = new Set<string>()

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
  }
}

function executeProportionalStrategy(
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

  validatePositions(input)

  const totalCurrentValue = input.carteiraAtual.reduce(
    (total, position) => total + position.currentValueInCents,
    0
  )

  if (!Number.isSafeInteger(totalCurrentValue) || totalCurrentValue <= 0) {
    throw new RangeError(
      'Portfolio current value must be a positive safe integer'
    )
  }

  const allocations = allocateByWeights(
    input.valorAporteEmCentavos,
    input.carteiraAtual.map((position, originalOrder) => ({
      id: position.assetId,
      weight: position.currentValueInCents,
      originalOrder,
    }))
  )

  return {
    distribuicao: allocations.map((allocation) => ({
      assetId: allocation.id,
      valorEmCentavos: allocation.valueInCents,
    })),
    totalDistribuidoEmCentavos: input.valorAporteEmCentavos,
  }
}

export const proportionalStrategy: ContributionStrategy = {
  execute: executeProportionalStrategy,
}
