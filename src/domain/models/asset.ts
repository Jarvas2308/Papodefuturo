import type { EntityId } from './shared'

export type AssetCategory =
  | 'brazilian-stock'
  | 'real-estate-fund'
  | 'international-etf'
  | 'fixed-income'
  | 'cash'

export type AssetMarket = 'BR' | 'US' | 'INTERNAL'
export type AssetStatus = 'active' | 'inactive'

export type Asset = {
  id: EntityId
  ticker: string
  name: string
  category: AssetCategory
  market: AssetMarket
  status: AssetStatus
}
