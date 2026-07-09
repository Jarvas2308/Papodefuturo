import type { EntityId, MoneyAmount } from './shared'

export type AssetPriceSource = 'manual' | 'market-provider'

export type AssetPrice = {
  id: EntityId
  assetId: EntityId
  price: MoneyAmount
  pricedAt: string
  source: AssetPriceSource
}
