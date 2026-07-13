import type {
  AllocationTarget,
  Asset,
  AssetPrice,
  Purchase,
} from '../../domain/models'

export type AssetRepository = {
  list(): Promise<Asset[]>
}

export type PurchaseRepository = {
  list(): Promise<Purchase[]>
}

export type AssetPriceRepository = {
  list(): Promise<AssetPrice[]>
}

export type AllocationTargetRepository = {
  list(): Promise<AllocationTarget[]>
}

export type AppRepositories = {
  assets: AssetRepository
  purchases: PurchaseRepository
  assetPrices: AssetPriceRepository
  allocationTargets: AllocationTargetRepository
}
