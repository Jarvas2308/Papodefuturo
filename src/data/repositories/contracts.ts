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

export type UserProfile = {
  displayName: string
}

export type ProfileRepository = {
  get(userId: EntityId): Promise<UserProfile>
  update(userId: EntityId, profile: UserProfile): Promise<UserProfile>
}

export type UserPreferences = {
  currency: CurrencyCode
  percentageDecimals: 0 | 1 | 2
  compactView: boolean
  defaultContributionStrategy: 'proportional' | 'target-allocation'
  contributionReminderEnabled: boolean
  contributionReminderDay: number
  // Peso do score no laco guloso (DEC-068):
  // desvioAjustado = desvioCandidato - (score * scoreWeightInBasisPoints).
  scoreWeightInBasisPoints: number
}

export type UserPreferencesRepository = {
  get(userId: EntityId): Promise<UserPreferences>
  update(
    userId: EntityId,
    preferences: UserPreferences
  ): Promise<UserPreferences>
}

// Faixa de pontuacao de um sinal (docs/reference/REGRAS_DE_PONTUACAO_RASCUNHO.md).
// `signalKey` prefixa a categoria (ex.: 'fii_pvp', 'stock_roe') - nunca
// aplicar regra de uma categoria a ativo de outra.
export type SignalRule = {
  id: EntityId
  signalKey: string
  minValue: number | null
  maxValue: number | null
  points: number
  enabled: boolean
}

export type CreateSignalRuleInput = Omit<SignalRule, 'id'>
export type UpdateSignalRuleInput = SignalRule

export type SignalRuleRepository = {
  list(): Promise<SignalRule[]>
  create(input: CreateSignalRuleInput): Promise<SignalRule>
  update(input: UpdateSignalRuleInput): Promise<SignalRule>
  remove(ruleId: EntityId): Promise<void>
}

// `stale-quote` é o caso normal: o provider respondeu, mas a cotação não é
// mais recente que a já armazenada, então nada foi escrito de propósito. Só
// os demais tipos representam degradação real e devem virar aviso na tela.
export type MarketDataWarningKind =
  'provider-failed' | 'stale-quote' | 'configuration' | 'storage-failed'

export type MarketDataWarning = {
  provider:
    | 'b3-cotahist'
    | 'twelve-data'
    | 'tesouro-transparente'
    | 'configuration'
    | 'storage'
  kind: MarketDataWarningKind
  ticker?: string
  message: string
}

export type MarketDataRefreshResult = {
  refreshedAt: string
  updatedPrices: number
  skippedFreshPrices: number
  updatedExchangeRates: number
  skippedFreshExchangeRates: number
  updatedReferenceRates: number
  skippedFreshReferenceRates: number
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
  profile: ProfileRepository
  userPreferences: UserPreferencesRepository
  signalRules: SignalRuleRepository
}
