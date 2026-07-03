import type { ContributionPosition } from '../../contribution/types'
import type {
  StrategyAllocationStatus,
  StrategyCategory,
  StrategyCategoryAllocation,
  StrategyCategoryId,
  StrategyDraft,
  StrategyValidation,
  StrategyValidationIssue,
} from '../types'

export const TOTAL_BASIS_POINTS = 10_000
export const VISUAL_TOLERANCE_IN_BASIS_POINTS = 50
export const GLOBAL_TARGET_PRODUCT_SCALE = 1_000_000

const percentageFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const detailedPercentageFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
})

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export function cloneStrategy(strategy: StrategyCategory[]) {
  return strategy.map((category) => ({
    ...category,
    assets: category.assets.map((asset) => ({ ...asset })),
  }))
}

export function basisPointsToPercentageInput(valueInBasisPoints: number) {
  return (valueInBasisPoints / 100).toFixed(2)
}

export function percentageInputToBasisPoints(value: string): number | null {
  const normalized = value.trim().replace(',', '.')
  const match = /^(\d{1,3})(?:\.(\d{0,2}))?$/.exec(normalized)

  if (!match) {
    return null
  }

  const integerPart = Number(match[1])
  const decimalPart = Number((match[2] ?? '').padEnd(2, '0'))
  const result = integerPart * 100 + decimalPart

  return Number.isSafeInteger(result) ? result : null
}

export function createStrategyDraft(
  strategy: StrategyCategory[]
): StrategyDraft {
  return {
    categories: strategy.map((category) => ({
      id: category.id,
      targetPercentage: basisPointsToPercentageInput(
        category.targetInBasisPoints
      ),
      assets: category.assets.map((asset) => ({
        assetId: asset.assetId,
        targetPercentage: basisPointsToPercentageInput(
          asset.targetWithinCategoryInBasisPoints
        ),
      })),
    })),
  }
}

export function strategyFromDraft(
  source: StrategyCategory[],
  draft: StrategyDraft
) {
  return source.map((category) => {
    const draftCategory = draft.categories.find(
      (candidate) => candidate.id === category.id
    )

    return {
      ...category,
      targetInBasisPoints:
        percentageInputToBasisPoints(draftCategory?.targetPercentage ?? '') ??
        -1,
      assets: category.assets.map((asset) => ({
        ...asset,
        targetWithinCategoryInBasisPoints:
          percentageInputToBasisPoints(
            draftCategory?.assets.find(
              (candidate) => candidate.assetId === asset.assetId
            )?.targetPercentage ?? ''
          ) ?? -1,
      })),
    }
  })
}

function isValidBasisPoints(value: number) {
  return (
    Number.isSafeInteger(value) && value >= 0 && value <= TOTAL_BASIS_POINTS
  )
}

function describeDifference(
  totalInBasisPoints: number,
  subject: string
): string {
  const difference = TOTAL_BASIS_POINTS - totalInBasisPoints
  const totalLabel = formatBasisPoints(totalInBasisPoints)

  if (difference > 0) {
    return `${subject} totalizam ${totalLabel}. Faltam ${formatBasisPoints(difference)}.`
  }

  return `${subject} totalizam ${totalLabel}. Reduza ${formatBasisPoints(Math.abs(difference))}.`
}

export function validateStrategy(
  strategy: StrategyCategory[]
): StrategyValidation {
  const issues: StrategyValidationIssue[] = []
  const invalidCategoryIds = new Set<StrategyCategoryId>()
  const categoryTotalInBasisPoints = strategy.reduce(
    (total, category) => total + category.targetInBasisPoints,
    0
  )

  for (const category of strategy) {
    if (!isValidBasisPoints(category.targetInBasisPoints)) {
      issues.push({
        id: `category-range-${category.id}`,
        message: `A meta de ${category.name} deve estar entre 0,00% e 100,00%.`,
      })
      invalidCategoryIds.add(category.id)
    }

    const internalTotal = category.assets.reduce(
      (total, asset) => total + asset.targetWithinCategoryInBasisPoints,
      0
    )
    const hasInvalidAsset = category.assets.some(
      (asset) => !isValidBasisPoints(asset.targetWithinCategoryInBasisPoints)
    )

    if (hasInvalidAsset) {
      issues.push({
        id: `asset-range-${category.id}`,
        message: `Todas as metas dos ativos de ${category.name} devem estar entre 0,00% e 100,00%.`,
      })
      invalidCategoryIds.add(category.id)
    } else if (internalTotal !== TOTAL_BASIS_POINTS) {
      issues.push({
        id: `asset-total-${category.id}`,
        message: describeDifference(
          internalTotal,
          `As metas dos ativos de ${category.name}`
        ),
      })
      invalidCategoryIds.add(category.id)
    }
  }

  const categoryTargetsAreInRange = strategy.every((category) =>
    isValidBasisPoints(category.targetInBasisPoints)
  )

  if (
    categoryTargetsAreInRange &&
    categoryTotalInBasisPoints !== TOTAL_BASIS_POINTS
  ) {
    issues.unshift({
      id: 'category-total',
      message: describeDifference(
        categoryTotalInBasisPoints,
        'As metas das categorias'
      ),
    })
  }

  return {
    isValid: issues.length === 0,
    categoryTotalInBasisPoints,
    issues,
    invalidCategoryIds: [...invalidCategoryIds],
  }
}

export function calculateGlobalTargetProduct(
  categoryTargetInBasisPoints: number,
  assetTargetInBasisPoints: number
) {
  return categoryTargetInBasisPoints * assetTargetInBasisPoints
}

export function classifyDeviation(
  deviationInBasisPoints: number
): StrategyAllocationStatus {
  if (deviationInBasisPoints < -VISUAL_TOLERANCE_IN_BASIS_POINTS) {
    return 'below'
  }

  if (deviationInBasisPoints > VISUAL_TOLERANCE_IN_BASIS_POINTS) {
    return 'above'
  }

  return 'near'
}

export function calculateStrategyAllocation(
  strategy: StrategyCategory[],
  positions: ContributionPosition[]
): StrategyCategoryAllocation[] {
  const positionByAssetId = new Map(
    positions.map((position) => [position.assetId, position])
  )
  const totalValueInCents = positions.reduce(
    (total, position) => total + position.currentValueInCents,
    0
  )

  if (totalValueInCents <= 0) {
    throw new RangeError('Strategy portfolio total must be positive')
  }

  return strategy.map((category) => {
    const categoryValueInCents = category.assets.reduce(
      (total, asset) =>
        total +
        (positionByAssetId.get(asset.assetId)?.currentValueInCents ?? 0),
      0
    )
    const currentInBasisPoints = Math.round(
      (categoryValueInCents * TOTAL_BASIS_POINTS) / totalValueInCents
    )
    const categoryDeviation =
      currentInBasisPoints - category.targetInBasisPoints

    return {
      ...category,
      currentValueInCents: categoryValueInCents,
      currentInBasisPoints,
      deviationInBasisPoints: categoryDeviation,
      status: classifyDeviation(categoryDeviation),
      internalTargetTotalInBasisPoints: category.assets.reduce(
        (total, asset) => total + asset.targetWithinCategoryInBasisPoints,
        0
      ),
      assets: category.assets.map((asset) => {
        const currentValueInCents =
          positionByAssetId.get(asset.assetId)?.currentValueInCents ?? 0
        const currentGlobalInBasisPoints = Math.round(
          (currentValueInCents * TOTAL_BASIS_POINTS) / totalValueInCents
        )
        const globalTargetProduct = calculateGlobalTargetProduct(
          category.targetInBasisPoints,
          asset.targetWithinCategoryInBasisPoints
        )
        const globalTargetInBasisPoints = Math.round(
          globalTargetProduct / TOTAL_BASIS_POINTS
        )
        const deviationInBasisPoints =
          currentGlobalInBasisPoints - globalTargetInBasisPoints

        return {
          ...asset,
          currentValueInCents,
          currentGlobalInBasisPoints,
          globalTargetProduct,
          deviationInBasisPoints,
          status: classifyDeviation(deviationInBasisPoints),
        }
      }),
    }
  })
}

export function countAssets(strategy: StrategyCategory[]) {
  return strategy.reduce((total, category) => total + category.assets.length, 0)
}

export function formatBasisPoints(valueInBasisPoints: number) {
  return `${percentageFormatter.format(valueInBasisPoints / 100)}%`
}

export function formatGlobalTargetProduct(product: number) {
  return `${detailedPercentageFormatter.format(product / GLOBAL_TARGET_PRODUCT_SCALE)}%`
}

export function formatDeviation(valueInBasisPoints: number) {
  const prefix = valueInBasisPoints > 0 ? '+' : ''
  return `${prefix}${percentageFormatter.format(valueInBasisPoints / 100)} p.p.`
}

export function formatCurrencyFromCents(valueInCents: number) {
  return currencyFormatter.format(valueInCents / 100)
}
