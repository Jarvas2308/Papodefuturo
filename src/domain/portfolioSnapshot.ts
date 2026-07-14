import {
  convertMoney,
  getLatestUsdBrlRate,
  type AllocationTarget,
  type Asset,
  type AssetCategory,
  type AssetPrice,
  type CurrencyCode,
  type ExchangeRate,
  type Purchase,
} from './models'
import { getLatestAssetPricesByAsset } from './latestAssetPrices'

export type AssetCurrencyResolver = (asset: Asset) => CurrencyCode

export type PortfolioSnapshotPosition = {
  asset: Asset
  currency: CurrencyCode
  quantity: number
  investedMinorNative: number
  averagePriceMinorNative: number
  currentPriceMinorNative: number
  currentMinorNative: number
  resultMinorNative: number
  resultPercentage: number
  investedMinorInBrl: number
  currentMinorInBrl: number
  resultMinorInBrl: number
  hasCurrentPrice: boolean
}

export type PortfolioSnapshotCategory = {
  category: AssetCategory
  currentMinorInBrl: number
  currentPercentage: number
  targetInBasisPoints: number
  targetPercentage: number
  differencePercentage: number
}

export type PortfolioSnapshot = {
  positions: PortfolioSnapshotPosition[]
  categories: PortfolioSnapshotCategory[]
  totalInvestedMinorInBrl: number
  totalCurrentMinorInBrl: number
  totalResultMinorInBrl: number
  totalResultPercentage: number
  hasUsdPosition: boolean
  latestUsdBrlRate: ExchangeRate | null
}

export type PortfolioSnapshotResult = {
  snapshot: PortfolioSnapshot | null
  needsExchangeRate: boolean
  latestUsdBrlRate: ExchangeRate | null
}

export type BuildPortfolioSnapshotInput = {
  assets: readonly Asset[]
  purchases: readonly Purchase[]
  prices: readonly AssetPrice[]
  targets: readonly AllocationTarget[]
  rates: readonly ExchangeRate[]
  resolveAssetCurrency: AssetCurrencyResolver
}

type NativePosition = Omit<
  PortfolioSnapshotPosition,
  'investedMinorInBrl' | 'currentMinorInBrl' | 'resultMinorInBrl'
>

function calculateNativePositions(
  assets: readonly Asset[],
  purchases: readonly Purchase[],
  prices: readonly AssetPrice[],
  resolveAssetCurrency: AssetCurrencyResolver
): NativePosition[] {
  const latestPriceByAsset = getLatestAssetPricesByAsset(prices)

  return assets.flatMap((asset) => {
    const confirmedPurchases = purchases.filter(
      (purchase) =>
        purchase.assetId === asset.id && purchase.status === 'confirmed'
    )

    if (confirmedPurchases.length === 0) {
      return []
    }

    const currency = resolveAssetCurrency(asset)

    if (
      confirmedPurchases.some(
        (purchase) =>
          purchase.totalAmount.currency !== currency ||
          purchase.unitPrice.currency !== currency
      )
    ) {
      throw new Error(`Purchase currency mismatch for ${asset.ticker}`)
    }

    const quantity = confirmedPurchases.reduce(
      (total, purchase) => total + purchase.quantity,
      0
    )
    const investedMinorNative = confirmedPurchases.reduce(
      (total, purchase) => total + purchase.totalAmount.amountInMinorUnits,
      0
    )

    if (quantity <= 0) {
      return []
    }

    const averagePriceMinorNative = Math.round(investedMinorNative / quantity)
    const latestPrice = latestPriceByAsset.get(asset.id)

    if (latestPrice && latestPrice.price.currency !== currency) {
      throw new Error(`Asset price currency mismatch for ${asset.ticker}`)
    }

    const currentPriceMinorNative =
      latestPrice?.price.amountInMinorUnits ?? averagePriceMinorNative
    const currentMinorNative = Math.round(quantity * currentPriceMinorNative)
    const resultMinorNative = currentMinorNative - investedMinorNative
    const resultPercentage =
      investedMinorNative === 0
        ? 0
        : (resultMinorNative / investedMinorNative) * 100

    return [
      {
        asset,
        currency,
        quantity,
        investedMinorNative,
        averagePriceMinorNative,
        currentPriceMinorNative,
        currentMinorNative,
        resultMinorNative,
        resultPercentage,
        hasCurrentPrice: latestPrice !== undefined,
      },
    ]
  })
}

function normalizeToBrl(
  amountInMinorUnits: number,
  currency: CurrencyCode,
  usdBrlRate: ExchangeRate | null
): number {
  if (currency === 'BRL') {
    return amountInMinorUnits
  }

  if (!usdBrlRate) {
    throw new Error('USD/BRL exchange rate is required for USD positions')
  }

  return convertMoney({ amountInMinorUnits, currency }, 'BRL', usdBrlRate)
    .amountInMinorUnits
}

function normalizePositions(
  positions: readonly NativePosition[],
  usdBrlRate: ExchangeRate | null
): PortfolioSnapshotPosition[] {
  return positions.map((position) => {
    const investedMinorInBrl = normalizeToBrl(
      position.investedMinorNative,
      position.currency,
      usdBrlRate
    )
    const currentMinorInBrl = normalizeToBrl(
      position.currentMinorNative,
      position.currency,
      usdBrlRate
    )

    return {
      ...position,
      investedMinorInBrl,
      currentMinorInBrl,
      resultMinorInBrl: currentMinorInBrl - investedMinorInBrl,
    }
  })
}

function buildCategorySnapshots(
  assets: readonly Asset[],
  targets: readonly AllocationTarget[],
  positions: readonly PortfolioSnapshotPosition[],
  totalCurrentMinorInBrl: number
): PortfolioSnapshotCategory[] {
  const categories = new Set<AssetCategory>([
    ...assets.map((asset) => asset.category),
    ...targets.map((target) => target.category),
  ])

  return [...categories].map((category) => {
    const currentMinorInBrl = positions
      .filter((position) => position.asset.category === category)
      .reduce((total, position) => total + position.currentMinorInBrl, 0)
    const currentPercentage =
      totalCurrentMinorInBrl === 0
        ? 0
        : (currentMinorInBrl / totalCurrentMinorInBrl) * 100
    const targetInBasisPoints =
      targets.find(
        (target) => target.scope === 'category' && target.category === category
      )?.targetInBasisPoints ?? 0
    const targetPercentage = targetInBasisPoints / 100

    return {
      category,
      currentMinorInBrl,
      currentPercentage,
      targetInBasisPoints,
      targetPercentage,
      differencePercentage: currentPercentage - targetPercentage,
    }
  })
}

export function buildPortfolioSnapshot({
  assets,
  purchases,
  prices,
  targets,
  rates,
  resolveAssetCurrency,
}: BuildPortfolioSnapshotInput): PortfolioSnapshotResult {
  const nativePositions = calculateNativePositions(
    assets,
    purchases,
    prices,
    resolveAssetCurrency
  )
  const hasUsdPosition = nativePositions.some(
    (position) => position.currency === 'USD'
  )
  const latestUsdBrlRate = getLatestUsdBrlRate(rates)

  if (hasUsdPosition && !latestUsdBrlRate) {
    return {
      snapshot: null,
      needsExchangeRate: true,
      latestUsdBrlRate: null,
    }
  }

  const positions = normalizePositions(nativePositions, latestUsdBrlRate)
  const totalInvestedMinorInBrl = positions.reduce(
    (total, position) => total + position.investedMinorInBrl,
    0
  )
  const totalCurrentMinorInBrl = positions.reduce(
    (total, position) => total + position.currentMinorInBrl,
    0
  )
  const totalResultMinorInBrl = totalCurrentMinorInBrl - totalInvestedMinorInBrl
  const totalResultPercentage =
    totalInvestedMinorInBrl === 0
      ? 0
      : (totalResultMinorInBrl / totalInvestedMinorInBrl) * 100

  return {
    snapshot: {
      positions,
      categories: buildCategorySnapshots(
        assets,
        targets,
        positions,
        totalCurrentMinorInBrl
      ),
      totalInvestedMinorInBrl,
      totalCurrentMinorInBrl,
      totalResultMinorInBrl,
      totalResultPercentage,
      hasUsdPosition,
      latestUsdBrlRate: hasUsdPosition ? latestUsdBrlRate : null,
    },
    needsExchangeRate: false,
    latestUsdBrlRate: hasUsdPosition ? latestUsdBrlRate : null,
  }
}
