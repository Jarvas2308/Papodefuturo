import type { AssetCategory } from './asset'
import type { BasisPoints, EntityId, MoneyAmount } from './shared'

export type PortfolioPosition = {
  id: EntityId
  assetId: EntityId
  category: AssetCategory
  quantity: number
  averagePrice: MoneyAmount
  investedAmount: MoneyAmount
  currentAmount: MoneyAmount
  participationInBasisPoints: BasisPoints
}
