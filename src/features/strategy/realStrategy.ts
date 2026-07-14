import { CLOSED_ASSET_UNIVERSE } from '../../data/assetUniverse'
import type {
  AllocationTarget,
  Asset,
  AssetCategory,
  AssetPrice,
  ExchangeRate,
  Purchase,
} from '../../domain/models'
import { convertMoney, getLatestUsdBrlRate } from '../../domain/models'
import type { ContributionPosition } from '../contribution/types'
import type { StrategyCategory, StrategyCategoryId } from './types'

const CATEGORY_DEFINITIONS: Array<{
  id: StrategyCategoryId
  category: AssetCategory
  name: string
  defaultTargetInBasisPoints: number
}> = [
  {
    id: 'brazilian-stocks',
    category: 'brazilian-stock',
    name: 'Ações brasileiras',
    defaultTargetInBasisPoints: 3529,
  },
  {
    id: 'real-estate-funds',
    category: 'real-estate-fund',
    name: 'Fundos imobiliários',
    defaultTargetInBasisPoints: 3529,
  },
  {
    id: 'international',
    category: 'international-etf',
    name: 'Internacional',
    defaultTargetInBasisPoints: 2942,
  },
]

function getAssetCurrency(asset: Asset) {
  const definition = CLOSED_ASSET_UNIVERSE.find(
    (item) => item.ticker.toUpperCase() === asset.ticker.toUpperCase()
  )

  if (!definition) {
    throw new Error(
      `Unsupported asset outside closed universe: ${asset.ticker}`
    )
  }

  return definition.currency
}

function distributeBasisPoints(count: number): number[] {
  if (count <= 0) {
    return []
  }

  const base = Math.floor(10_000 / count)
  const remainder = 10_000 - base * count

  return Array.from({ length: count }, (_, index) =>
    index < remainder ? base + 1 : base
  )
}

export function buildStrategyFromRealData(
  assets: readonly Asset[],
  targets: readonly AllocationTarget[]
): StrategyCategory[] {
  return CATEGORY_DEFINITIONS.map((definition) => {
    const categoryAssets = assets.filter(
      (asset) =>
        asset.status === 'active' && asset.category === definition.category
    )
    const defaultAssetTargets = distributeBasisPoints(categoryAssets.length)
    const categoryTarget = targets.find(
      (target) =>
        target.scope === 'category' && target.category === definition.category
    )

    return {
      id: definition.id,
      name: definition.name,
      targetInBasisPoints:
        categoryTarget?.targetInBasisPoints ??
        definition.defaultTargetInBasisPoints,
      assets: categoryAssets.map((asset, index) => {
        const assetTarget = targets.find(
          (target) => target.scope === 'asset' && target.assetId === asset.id
        )

        return {
          assetId: asset.id,
          ticker: asset.ticker,
          assetName: asset.name,
          targetWithinCategoryInBasisPoints:
            assetTarget?.targetInBasisPoints ?? defaultAssetTargets[index] ?? 0,
        }
      }),
    }
  })
}

function getLatestPriceByAsset(prices: readonly AssetPrice[]) {
  const latestByAsset = new Map<string, AssetPrice>()

  for (const price of prices) {
    const current = latestByAsset.get(price.assetId)
    if (!current || price.pricedAt > current.pricedAt) {
      latestByAsset.set(price.assetId, price)
    }
  }

  return latestByAsset
}

export type RealStrategyPositions = {
  positions: ContributionPosition[]
  needsExchangeRate: boolean
  latestUsdBrlRate: ExchangeRate | null
}

export function buildRealStrategyPositions(
  assets: readonly Asset[],
  purchases: readonly Purchase[],
  prices: readonly AssetPrice[],
  rates: readonly ExchangeRate[]
): RealStrategyPositions {
  const latestPriceByAsset = getLatestPriceByAsset(prices)
  const latestUsdBrlRate = getLatestUsdBrlRate(rates)
  const hasConfirmedUsdPosition = assets.some((asset) => {
    if (getAssetCurrency(asset) !== 'USD') {
      return false
    }

    return purchases.some(
      (purchase) =>
        purchase.assetId === asset.id && purchase.status === 'confirmed'
    )
  })

  if (hasConfirmedUsdPosition && !latestUsdBrlRate) {
    return {
      positions: [],
      needsExchangeRate: true,
      latestUsdBrlRate: null,
    }
  }

  const categoryByDomain = new Map(
    CATEGORY_DEFINITIONS.map((definition) => [
      definition.category,
      definition.id,
    ])
  )

  const positions = assets.flatMap((asset): ContributionPosition[] => {
    const category = categoryByDomain.get(asset.category)
    if (!category) {
      return []
    }

    const confirmedPurchases = purchases.filter(
      (purchase) =>
        purchase.assetId === asset.id && purchase.status === 'confirmed'
    )

    if (confirmedPurchases.length === 0) {
      return []
    }

    const currency = getAssetCurrency(asset)
    const quantity = confirmedPurchases.reduce(
      (total, purchase) => total + purchase.quantity,
      0
    )
    const investedMinor = confirmedPurchases.reduce(
      (total, purchase) => total + purchase.totalAmount.amountInMinorUnits,
      0
    )

    if (quantity <= 0) {
      return []
    }

    const averagePriceMinor = Math.round(investedMinor / quantity)
    const latestPrice = latestPriceByAsset.get(asset.id)
    const currentPriceMinor =
      latestPrice?.price.amountInMinorUnits ?? averagePriceMinor
    const currentAmount = {
      amountInMinorUnits: Math.round(quantity * currentPriceMinor),
      currency,
    } as const
    const currentValueInCents =
      currency === 'BRL'
        ? currentAmount.amountInMinorUnits
        : convertMoney(currentAmount, 'BRL', latestUsdBrlRate!)
            .amountInMinorUnits

    return [
      {
        assetId: asset.id,
        category,
        currentValueInCents,
      },
    ]
  })

  return {
    positions,
    needsExchangeRate: false,
    latestUsdBrlRate,
  }
}

export function strategyToAllocationTargets(
  strategy: readonly StrategyCategory[],
  assets: readonly Asset[],
  createId: () => string = () => crypto.randomUUID()
): AllocationTarget[] {
  const domainCategoryByUi = new Map(
    CATEGORY_DEFINITIONS.map((definition) => [
      definition.id,
      definition.category,
    ])
  )
  const assetById = new Map(assets.map((asset) => [asset.id, asset]))

  return strategy.flatMap((category) => {
    const domainCategory = domainCategoryByUi.get(category.id)
    if (!domainCategory) {
      throw new Error(`Unsupported strategy category: ${category.id}`)
    }

    const categoryTarget: AllocationTarget = {
      id: createId(),
      scope: 'category',
      category: domainCategory,
      targetInBasisPoints: category.targetInBasisPoints,
    }

    const assetTargets = category.assets.map(
      (assetTarget): AllocationTarget => {
        const asset = assetById.get(assetTarget.assetId)
        if (!asset || asset.category !== domainCategory) {
          throw new Error(
            `Strategy asset/category mismatch: ${assetTarget.assetId}`
          )
        }

        return {
          id: createId(),
          scope: 'asset',
          category: domainCategory,
          assetId: asset.id,
          targetInBasisPoints: assetTarget.targetWithinCategoryInBasisPoints,
        }
      }
    )

    return [categoryTarget, ...assetTargets]
  })
}
