import type { AssetCategory } from './asset'
import type { BasisPoints, EntityId } from './shared'

export type AllocationTargetScope = 'category' | 'asset'

export type AllocationTarget = {
  id: EntityId
  scope: AllocationTargetScope
  category: AssetCategory
  assetId?: EntityId
  targetInBasisPoints: BasisPoints
}
