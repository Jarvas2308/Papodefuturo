import type { EntityId, MoneyAmount } from './shared'

export type PurchaseStatus = 'planned' | 'confirmed' | 'cancelled'

export type Purchase = {
  id: EntityId
  assetId: EntityId
  quantity: number
  unitPrice: MoneyAmount
  totalAmount: MoneyAmount
  tradeDate: string
  status: PurchaseStatus
  notes?: string
}
