import type {
  AllocationTarget,
  Asset,
  AssetPrice,
  ContributionPlan,
  ContributionPlanItem,
  ContributionPlanStatus,
  CurrencyCode,
  EntityId,
  ExchangeRate,
  Purchase,
} from '../../domain/models'
import type { AiExplanationV1 } from '../../domain/aiExplanation'
import type { TechnicalDossierV1 } from '../../domain/technicalDossier'

export type AssetRepository = {
  list(): Promise<Asset[]>
  ensureClosedUniverse(userId: EntityId): Promise<Asset[]>
}

export type CreatePurchaseInput = {
  userId: EntityId
  assetId: EntityId
  quantity: number
  unitPriceInMinorUnits: number
  currency: CurrencyCode
  purchasedAt: string
  notes?: string
}

export type CreatePurchaseBatchItem = Omit<CreatePurchaseInput, 'userId'>

export type CreatePurchaseBatchInput = {
  userId: EntityId
  purchases: readonly CreatePurchaseBatchItem[]
}

export type UpdatePurchaseInput = Omit<CreatePurchaseInput, 'userId'> & {
  purchaseId: EntityId
}

export type PurchaseRepository = {
  list(): Promise<Purchase[]>
  create(input: CreatePurchaseInput): Promise<Purchase>
  createMany(input: CreatePurchaseBatchInput): Promise<Purchase[]>
  update(input: UpdatePurchaseInput): Promise<Purchase>
  cancel(purchaseId: EntityId): Promise<Purchase>
}

export type AssetPriceRepository = {
  list(assets: readonly Asset[]): Promise<AssetPrice[]>
}

export type ExchangeRateRepository = {
  list(): Promise<ExchangeRate[]>
}

export type CreateContributionPlanItemInput = {
  assetId: EntityId
  plannedAmountInMinorUnits: number
  currency: CurrencyCode
}

export type CreateContributionPlanInput = {
  userId: EntityId
  inputAmountInMinorUnits: number
  currency: CurrencyCode
  status: ContributionPlanStatus
  items: readonly CreateContributionPlanItemInput[]
}

export type ContributionPlanRepository = {
  list(
    purchasesById: ReadonlyMap<EntityId, Purchase>
  ): Promise<ContributionPlan[]>
  create(
    input: CreateContributionPlanInput,
    purchasesById: ReadonlyMap<EntityId, Purchase>
  ): Promise<ContributionPlan>
  updateStatus(
    planId: EntityId,
    status: ContributionPlanStatus,
    purchasesById: ReadonlyMap<EntityId, Purchase>
  ): Promise<ContributionPlan>
  linkItemPurchase(
    itemId: EntityId,
    purchase: Purchase
  ): Promise<ContributionPlanItem>
}

export type AllocationTargetRepository = {
  list(): Promise<AllocationTarget[]>
  replaceAll(targets: readonly AllocationTarget[]): Promise<AllocationTarget[]>
}

export type MarketDataWarning = {
  provider: 'b3-cotahist' | 'twelve-data' | 'configuration'
  ticker?: string
  message: string
}

export type MarketDataRefreshResult = {
  refreshedAt: string
  updatedPrices: number
  skippedFreshPrices: number
  updatedExchangeRates: number
  skippedFreshExchangeRates: number
  warnings: MarketDataWarning[]
}

export type MarketDataRepository = {
  refresh(): Promise<MarketDataRefreshResult>
}

export type AiExplanationRepository = {
  explain(dossier: TechnicalDossierV1): Promise<AiExplanationV1>
}

export type AppRepositories = {
  assets: AssetRepository
  purchases: PurchaseRepository
  assetPrices: AssetPriceRepository
  exchangeRates: ExchangeRateRepository
  allocationTargets: AllocationTargetRepository
  marketData: MarketDataRepository
  contributionPlans: ContributionPlanRepository
  aiExplanation: AiExplanationRepository
}
