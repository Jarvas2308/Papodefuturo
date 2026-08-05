import type { Asset, AssetPrice } from './models'
import { getLatestAssetPricesByAsset } from './latestAssetPrices'

// Distinto de MARKET_DATA_FRESHNESS_MS (60 min, usada pelo cron para decidir
// se vale a pena buscar de novo no provider). Esse limiar é para o humano
// decidir se ainda confia no número, não para o job decidir se busca de
// novo — 60 min soaria falso alarme em qualquer fim de semana. 4 dias cobre
// um feriado prolongado sem soar alarme por causa do calendário de bolsa.
export const UI_STALE_PRICE_THRESHOLD_MS = 4 * 24 * 60 * 60 * 1000

export type StaleAssetPrice = {
  assetId: string
  ticker: string
  pricedAt: string
  daysStale: number
}

export function getStaleAssetPrices(
  assets: readonly Asset[],
  prices: readonly AssetPrice[],
  now: Date,
  thresholdMs: number = UI_STALE_PRICE_THRESHOLD_MS
): StaleAssetPrice[] {
  const latestByAsset = getLatestAssetPricesByAsset(prices)
  const assetsById = new Map(assets.map((asset) => [asset.id, asset]))
  const stale: StaleAssetPrice[] = []

  for (const [assetId, price] of latestByAsset) {
    if (price.source !== 'market-provider') {
      continue
    }

    const asset = assetsById.get(assetId)
    if (!asset) {
      continue
    }

    const pricedAtMs = Date.parse(price.pricedAt)
    if (Number.isNaN(pricedAtMs)) {
      continue
    }

    const ageMs = now.getTime() - pricedAtMs
    if (ageMs < thresholdMs) {
      continue
    }

    stale.push({
      assetId,
      ticker: asset.ticker,
      pricedAt: price.pricedAt,
      daysStale: Math.floor(ageMs / (24 * 60 * 60 * 1000)),
    })
  }

  return stale.sort((a, b) => b.daysStale - a.daysStale)
}
