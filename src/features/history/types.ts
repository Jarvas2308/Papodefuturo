import type { PortfolioCategory } from '../portfolio/types'

export type HistoryMovementType =
  'purchase' | 'sale' | 'dividend' | 'income' | 'contribution'

export type HistoryMovementStatus = 'completed' | 'pending' | 'cancelled'
export type HistoryCurrency = 'BRL' | 'USD'
export type HistoryCategory = PortfolioCategory | 'cash'

export type HistoryMovement = {
  id: string
  date: string
  type: HistoryMovementType
  assetId: string
  ticker: string
  assetName: string
  category: HistoryCategory
  quantity: number
  unitPriceInCents: number
  totalValueInCents: number
  currency: HistoryCurrency
  status: HistoryMovementStatus
}

export type HistoryFilters = {
  query: string
  type: 'all' | HistoryMovementType
  category: 'all' | HistoryCategory
  month: 'all' | string
  status: 'all' | HistoryMovementStatus
}

export type HistorySummary = {
  movementCount: number
  purchaseCount: number
  proceedsInCents: number
  brlVolumeInCents: number
  usdVolumeInCents: number
}
