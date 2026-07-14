import type {
  ContributionAssetTarget,
  ContributionInput,
  ContributionPosition,
  ContributionResult,
  ContributionStopReason,
  ContributionStrategy,
} from '../types'

const TOTAL_BASIS_POINTS = 10_000n
const MAX_SAFE_INTEGER = BigInt(Number.MAX_SAFE_INTEGER)

export const MAX_PLAN_ASSETS = 3

type Deviation = {
  numerator: bigint
  total: bigint
}

function assertSafeNonNegativeInteger(value: number, description: string) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${description} must be a non-negative safe integer`)
  }
}

function toSafeNumber(value: bigint, description: string): number {
  if (value < 0n || value > MAX_SAFE_INTEGER) {
    throw new RangeError(`${description} exceeds the safe integer range`)
  }
  return Number(value)
}

function divideAndRoundHalfUp(numerator: bigint, denominator: bigint): bigint {
  if (numerator < 0n || denominator <= 0n) {
    throw new RangeError('Invalid financial division')
  }

  const quotient = numerator / denominator
  const remainder = numerator % denominator
  return remainder * 2n >= denominator ? quotient + 1n : quotient
}

function calculateDeviation(
  values: readonly bigint[],
  targets: readonly bigint[]
): Deviation {
  const total = values.reduce((sum, value) => sum + value, 0n)
  if (total === 0n) {
    return { numerator: TOTAL_BASIS_POINTS, total: 1n }
  }

  const numerator = values.reduce((sum, value, index) => {
    const target = targets[index] ?? 0n
    const difference = value * TOTAL_BASIS_POINTS - target * total
    return sum + (difference < 0n ? -difference : difference)
  }, 0n)

  return { numerator, total }
}

function compareDeviation(left: Deviation, right: Deviation): number {
  const comparison = left.numerator * right.total - right.numerator * left.total
  return comparison < 0n ? -1 : comparison > 0n ? 1 : 0
}

function deviationInBasisPoints(deviation: Deviation): number {
  return toSafeNumber(
    divideAndRoundHalfUp(deviation.numerator, deviation.total),
    'Deviation'
  )
}

function participationDifferenceInBasisPoints(
  value: bigint,
  total: bigint,
  target: bigint
): number {
  const participation =
    total === 0n ? 0n : divideAndRoundHalfUp(value * TOTAL_BASIS_POINTS, total)
  const difference = participation - target

  if (difference < -MAX_SAFE_INTEGER || difference > MAX_SAFE_INTEGER) {
    throw new RangeError('Participation difference exceeds safe integer range')
  }
  return Number(difference)
}

function validateAndAlignTargets(
  positions: readonly ContributionPosition[],
  targets: readonly ContributionAssetTarget[]
): bigint[] {
  if (positions.length === 0) {
    throw new RangeError('Portfolio must contain at least one position')
  }

  const positionsById = new Set<string>()
  for (const position of positions) {
    if (!position.assetId || positionsById.has(position.assetId)) {
      throw new Error(
        `Invalid or duplicate portfolio asset id: ${position.assetId}`
      )
    }
    assertSafeNonNegativeInteger(
      position.currentValueInCents,
      `Current value for ${position.assetId}`
    )
    if (
      position.unitPriceInCents === null ||
      !Number.isSafeInteger(position.unitPriceInCents) ||
      position.unitPriceInCents <= 0
    ) {
      throw new RangeError(
        'Não há cotações suficientes para calcular o plano técnico multiativos.'
      )
    }
    positionsById.add(position.assetId)
  }

  const targetsByAsset = new Map<string, number>()
  let targetTotal = 0
  for (const target of targets) {
    if (!target.assetId || targetsByAsset.has(target.assetId)) {
      throw new Error(
        `Invalid or duplicate contribution asset target: ${target.assetId}`
      )
    }
    if (
      !Number.isSafeInteger(target.targetInBasisPoints) ||
      target.targetInBasisPoints < 0 ||
      target.targetInBasisPoints > Number(TOTAL_BASIS_POINTS)
    ) {
      throw new RangeError(`Invalid asset target: ${target.assetId}`)
    }
    if (!positionsById.has(target.assetId)) {
      throw new Error(
        `Asset target has no portfolio position: ${target.assetId}`
      )
    }

    targetsByAsset.set(target.assetId, target.targetInBasisPoints)
    targetTotal += target.targetInBasisPoints
  }

  if (targetTotal !== Number(TOTAL_BASIS_POINTS)) {
    throw new RangeError('Global asset targets must total 10000 basis points')
  }

  return positions.map((position) => {
    const target = targetsByAsset.get(position.assetId)
    if (target === undefined) {
      throw new Error(`Missing asset target: ${position.assetId}`)
    }
    return BigInt(target)
  })
}

function executeTargetAllocationStrategy(
  input: ContributionInput
): ContributionResult {
  assertSafeNonNegativeInteger(
    input.valorAporteEmCentavos,
    'Contribution value'
  )

  const targets = validateAndAlignTargets(
    input.carteiraAtual,
    input.metasGlobaisPorAtivo
  )
  const initialValues = input.carteiraAtual.map((position) =>
    BigInt(position.currentValueInCents)
  )
  const values = [...initialValues]
  const unitPrices = input.carteiraAtual.map((position) =>
    BigInt(position.unitPriceInCents!)
  )
  const quantities = input.carteiraAtual.map(() => 0n)
  const selected = new Set<number>()
  const selectionOrder: number[] = []
  const deviationBefore = calculateDeviation(initialValues, targets)
  let currentDeviation = deviationBefore
  let remaining = BigInt(input.valorAporteEmCentavos)
  let stopReason: ContributionStopReason = 'zero-contribution'

  while (remaining > 0n) {
    let bestIndex: number | null = null
    let bestDeviation: Deviation | null = null

    for (let index = 0; index < values.length; index += 1) {
      if (selected.size >= MAX_PLAN_ASSETS && !selected.has(index)) {
        continue
      }
      if ((unitPrices[index] ?? 0n) > remaining) {
        continue
      }

      const candidateValues = [...values]
      candidateValues[index] =
        (candidateValues[index] ?? 0n) + (unitPrices[index] ?? 0n)
      const candidateDeviation = calculateDeviation(candidateValues, targets)

      if (
        bestDeviation === null ||
        compareDeviation(candidateDeviation, bestDeviation) < 0
      ) {
        bestIndex = index
        bestDeviation = candidateDeviation
      }
    }

    if (bestIndex === null || bestDeviation === null) {
      stopReason = 'no-affordable-unit'
      break
    }
    if (compareDeviation(bestDeviation, currentDeviation) >= 0) {
      stopReason = 'no-improving-purchase'
      break
    }

    if (!selected.has(bestIndex)) {
      selected.add(bestIndex)
      selectionOrder.push(bestIndex)
    }
    values[bestIndex] =
      (values[bestIndex] ?? 0n) + (unitPrices[bestIndex] ?? 0n)
    quantities[bestIndex] = (quantities[bestIndex] ?? 0n) + 1n
    remaining -= unitPrices[bestIndex] ?? 0n
    currentDeviation = bestDeviation

    if (remaining === 0n) {
      stopReason = 'budget-exhausted'
    }
  }

  const totalAfter = values.reduce((sum, value) => sum + value, 0n)
  const totalBefore = initialValues.reduce((sum, value) => sum + value, 0n)
  const totalDistributed = BigInt(input.valorAporteEmCentavos) - remaining
  const beforeInBasisPoints = deviationInBasisPoints(deviationBefore)
  const afterInBasisPoints = deviationInBasisPoints(currentDeviation)

  return {
    strategy: 'target-allocation',
    distribuicao: selectionOrder.map((index) => ({
      assetId: input.carteiraAtual[index]!.assetId,
      valorEmCentavos: toSafeNumber(
        (quantities[index] ?? 0n) * (unitPrices[index] ?? 0n),
        'Allocated amount'
      ),
    })),
    totalDistribuidoEmCentavos: toSafeNumber(
      totalDistributed,
      'Distributed amount'
    ),
    saldoNaoAlocadoEmCentavos: toSafeNumber(remaining, 'Unallocated amount'),
    technicalImpact: {
      totalDeviationBeforeInBasisPoints: beforeInBasisPoints,
      totalDeviationAfterInBasisPoints: afterInBasisPoints,
      totalDeviationReductionInBasisPoints: Math.max(
        beforeInBasisPoints - afterInBasisPoints,
        0
      ),
      stopReason,
      items: selectionOrder.map((index) => ({
        assetId: input.carteiraAtual[index]!.assetId,
        suggestedQuantity: toSafeNumber(
          quantities[index] ?? 0n,
          'Suggested quantity'
        ),
        unitPriceInCents: input.carteiraAtual[index]!.unitPriceInCents!,
        allocatedInCents: toSafeNumber(
          (quantities[index] ?? 0n) * (unitPrices[index] ?? 0n),
          'Allocated amount'
        ),
        differenceBeforeInBasisPoints: participationDifferenceInBasisPoints(
          initialValues[index] ?? 0n,
          totalBefore,
          targets[index] ?? 0n
        ),
        differenceAfterInBasisPoints: participationDifferenceInBasisPoints(
          values[index] ?? 0n,
          totalAfter,
          targets[index] ?? 0n
        ),
      })),
    },
  }
}

export const targetAllocationStrategy: ContributionStrategy = {
  execute: executeTargetAllocationStrategy,
}
