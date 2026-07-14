import type { AssetPrice } from './models'

export function getLatestAssetPricesByAsset(
  prices: readonly AssetPrice[]
): Map<string, AssetPrice> {
  const latestByAsset = new Map<string, AssetPrice>()

  for (const price of prices) {
    const pricedAt = Date.parse(price.pricedAt)
    if (Number.isNaN(pricedAt)) {
      continue
    }

    const current = latestByAsset.get(price.assetId)
    if (!current) {
      latestByAsset.set(price.assetId, price)
      continue
    }

    const currentPricedAt = Date.parse(current.pricedAt)
    if (
      pricedAt > currentPricedAt ||
      (pricedAt === currentPricedAt && price.id > current.id)
    ) {
      latestByAsset.set(price.assetId, price)
    }
  }

  return latestByAsset
}
