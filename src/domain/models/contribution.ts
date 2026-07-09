import type { Purchase } from './purchase'
import type { EntityId, MoneyAmount } from './shared'

export type ContributionPlanStatus =
  'draft' | 'presented' | 'accepted' | 'rejected'

export type ContributionPlanItem = {
  id: EntityId
  assetId: EntityId
  plannedAmount: MoneyAmount
  plannedPurchase?: Purchase
}

export type ContributionPlan = {
  id: EntityId
  inputAmount: MoneyAmount
  items: ContributionPlanItem[]
  status: ContributionPlanStatus
  createdAt: string
}
