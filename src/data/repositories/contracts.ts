import type {
  AllocationTarget,
  Asset,
  AssetPrice,
  CurrencyCode,
  EntityId,
  ExchangeRate,
  Purchase,
} from '../../domain/models'

export type AssetRepository = {
  list(): Promise<Asset[]>
  ensureClosedUniverse(userId: EntityId): Promise<Asset[]>
}

export type CreateConfirmedPurchaseInput = {
  userId: EntityId
  assetId: EntityId
  quantity: number
  unitPriceMinor: number
  currency: CurrencyCode
  tradeDate: string
}

export type PurchaseRepository = {
  list(): Promise<Purchase[]>
  createConfirmed(input: CreateConfirmedPurchaseInput): Promise<Purchase>
}

export type AssetPriceRepository = {
  list(): Promise<AssetPrice[]>
}

export type ExchangeRateRepository = {
  list(): Promise<ExchangeRate[]>
  saveManualUsdBrl(userId: EntityId, rateScaled: number): Promise<ExchangeRate>
}

export type AllocationTargetRepository = {
  list(): Promise<AllocationTarget[]>
  replaceAll(targets: readonly AllocationTarget[]): Promise<AllocationTarget[]>
}

export type AppRepositories = {
  assets: AssetRepository
  purchases: PurchaseRepository
  assetPrices: AssetPriceRepository
  exchangeRates: ExchangeRateRepository
  allocationTargets: AllocationTargetRepository
}
