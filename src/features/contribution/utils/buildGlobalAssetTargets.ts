import type { StrategyCategory } from '../../strategy/types'
import type { ContributionAssetTarget } from '../types'

const TOTAL_BASIS_POINTS = 10_000
const SUPPORTED_CATEGORY_IDS = new Set([
  'brazilian-stocks',
  'real-estate-funds',
  'international',
])

function validateBasisPoints(value: number, description: string) {
  if (!Number.isSafeInteger(value) || value < 0 || value > TOTAL_BASIS_POINTS) {
    throw new RangeError(`Invalid basis points for ${description}`)
  }
}

export function buildGlobalAssetTargets(
  strategy: readonly StrategyCategory[]
): ContributionAssetTarget[] {
  if (strategy.length === 0) {
    throw new RangeError('Strategy must contain at least one category')
  }

  const categoryIds = new Set<string>()
  const assetIds = new Set<string>()
  let categoryTotal = 0
  const products: Array<{
    assetId: string
    base: number
    remainder: number
    originalOrder: number
  }> = []

  for (const category of strategy) {
    if (
      !category.id ||
      !SUPPORTED_CATEGORY_IDS.has(category.id) ||
      categoryIds.has(category.id)
    ) {
      throw new Error(`Invalid or duplicate strategy category: ${category.id}`)
    }
    if (category.assets.length === 0) {
      throw new RangeError(`Strategy category has no assets: ${category.id}`)
    }

    validateBasisPoints(category.targetInBasisPoints, category.id)
    categoryTotal += category.targetInBasisPoints
    categoryIds.add(category.id)

    let internalTotal = 0
    for (const asset of category.assets) {
      if (!asset.assetId || assetIds.has(asset.assetId)) {
        throw new Error(`Invalid or duplicate strategy asset: ${asset.assetId}`)
      }

      validateBasisPoints(
        asset.targetWithinCategoryInBasisPoints,
        asset.assetId
      )
      internalTotal += asset.targetWithinCategoryInBasisPoints
      assetIds.add(asset.assetId)

      const product =
        BigInt(category.targetInBasisPoints) *
        BigInt(asset.targetWithinCategoryInBasisPoints)
      products.push({
        assetId: asset.assetId,
        base: Number(product / BigInt(TOTAL_BASIS_POINTS)),
        remainder: Number(product % BigInt(TOTAL_BASIS_POINTS)),
        originalOrder: products.length,
      })
    }

    if (internalTotal !== TOTAL_BASIS_POINTS) {
      throw new RangeError(
        `Strategy asset targets must total ${TOTAL_BASIS_POINTS}: ${category.id}`
      )
    }
  }

  if (categoryTotal !== TOTAL_BASIS_POINTS) {
    throw new RangeError(
      `Strategy category targets must total ${TOTAL_BASIS_POINTS}`
    )
  }

  const missingBasisPoints =
    TOTAL_BASIS_POINTS -
    products.reduce((total, product) => total + product.base, 0)
  const recipients = [...products].sort(
    (left, right) =>
      right.remainder - left.remainder ||
      left.originalOrder - right.originalOrder
  )

  for (let index = 0; index < missingBasisPoints; index += 1) {
    const recipient = recipients[index]
    if (!recipient) {
      throw new RangeError('Unable to normalize global asset targets')
    }
    recipient.base += 1
  }

  return products
    .sort((left, right) => left.originalOrder - right.originalOrder)
    .map((product) => ({
      assetId: product.assetId,
      targetInBasisPoints: product.base,
    }))
}
