import type {
  Asset,
  AssetCategory,
  AssetPrice,
  AssetPriceSource,
  BasisPoints,
  ExchangeRate,
  MoneyAmount,
} from '../models'
import type {
  PortfolioSnapshot,
  PortfolioSnapshotPosition,
} from '../portfolioSnapshot'
import type { StrategyCategory } from '../../features/strategy/types'
import type {
  ContributionAssetTarget,
  ContributionStopReason,
  TargetAllocationContributionResult,
} from '../../features/contribution/types'
import type { AssetScoreV1 } from '../fundamentals/score'

export const TECHNICAL_DOSSIER_V1_SCHEMA_VERSION =
  'technical-dossier.v1' as const

export type TechnicalDossierLimitationCode =
  | 'simulation-only'
  | 'not-persisted'
  | 'greedy-whole-units-max-three'
  | 'technical-ranking-not-exposed-v1'
  | 'market-refresh-best-effort'

export type TechnicalDossierLimitation = {
  code: TechnicalDossierLimitationCode
  description: string
}

export type TechnicalDossierPortfolioPosition = Omit<
  PortfolioSnapshotPosition,
  'asset'
> & {
  assetId: string
  ticker: string
  name: string
  category: AssetCategory
}

export type TechnicalDossierPortfolio = {
  baseCurrency: 'BRL'
  totalInvestedMinorInBrl: number
  totalCurrentMinorInBrl: number
  totalResultMinorInBrl: number
  totalResultPercentage: number
  positions: TechnicalDossierPortfolioPosition[]
}

export type TechnicalDossierStrategyAsset = {
  assetId: string
  ticker: string
  name: string
  targetWithinCategoryInBasisPoints: BasisPoints
  globalTargetInBasisPoints: BasisPoints
}

export type TechnicalDossierStrategyCategory = {
  id: string
  name: string
  targetInBasisPoints: BasisPoints
  assets: TechnicalDossierStrategyAsset[]
}

export type TechnicalDossierStrategy = {
  categories: TechnicalDossierStrategyCategory[]
  totalGlobalTargetInBasisPoints: BasisPoints
}

export type TechnicalDossierLatestAssetPrice = {
  assetId: string
  ticker: string
  price: MoneyAmount
  pricedAt: string
  source: AssetPriceSource
}

export type TechnicalDossierMarketFacts = {
  latestAssetPrices: TechnicalDossierLatestAssetPrice[]
  latestUsdBrlRate: ExchangeRate | null
}

export type TechnicalDossierTechnicalPlanItem = {
  assetId: string
  ticker: string
  name: string
  category: AssetCategory
  suggestedQuantity: number
  unitPriceMinorInBrl: number
  allocatedMinorInBrl: number
  differenceBeforeInBasisPoints: BasisPoints
  differenceAfterInBasisPoints: BasisPoints
}

export type TechnicalDossierTechnicalPlan = {
  strategy: 'target-allocation'
  contributionAmountMinorInBrl: number
  totalAllocatedMinorInBrl: number
  unallocatedMinorInBrl: number
  stopReason: ContributionStopReason
  items: TechnicalDossierTechnicalPlanItem[]
}

export type TechnicalDossierDeviations = {
  totalBeforeInBasisPoints: BasisPoints
  totalAfterInBasisPoints: BasisPoints
  totalReductionInBasisPoints: BasisPoints
}

export type TechnicalDossierDataCoverage = {
  eligibleAssetCount: number
  latestPriceFactCount: number
  missingLatestPriceAssetIds: string[]
  manualLatestPriceCount: number
  marketProviderLatestPriceCount: number
  hasLatestUsdBrlRate: boolean
}

// Quebra por sinal do motor de score (Sprint 16, Fase 5/7, DEC-085/DEC-087)
// - mesma forma de AssetScoreSignal (domain/fundamentals/score/types.ts),
// achatada em campos opcionais porque o dossie e' JSON simples consumido
// pela explicacao de IA, sem union discriminado.
export type TechnicalDossierAssetSignal = {
  signalKey: string
  status: 'applied' | 'unavailable'
  observedValue: number | null
  points: number | null
  unavailableReason: string | null
}

export type TechnicalDossierAssetSignals = {
  assetId: string
  ticker: string
  totalPoints: number
  signals: TechnicalDossierAssetSignal[]
}

export type TechnicalDossierV1 = {
  schemaVersion: typeof TECHNICAL_DOSSIER_V1_SCHEMA_VERSION
  generatedAt: string
  portfolio: TechnicalDossierPortfolio
  strategy: TechnicalDossierStrategy
  marketFacts: TechnicalDossierMarketFacts
  technicalPlan: TechnicalDossierTechnicalPlan
  deviations: TechnicalDossierDeviations
  // So cobre os ativos com sinal calculado (hoje: FII tijolo, Fase 5 fatia
  // 1) - ativos fora do escopo simplesmente nao aparecem aqui, mesmo
  // criterio de "ausencia, nao zero forcado" do resto do dominio de
  // fundamentos.
  signals: TechnicalDossierAssetSignals[]
  dataCoverage: TechnicalDossierDataCoverage
  limitations: TechnicalDossierLimitation[]
}

export type BuildTechnicalDossierV1Input = {
  generatedAt: string
  contributionAmountInCents: number
  assets: readonly Asset[]
  portfolioSnapshot: PortfolioSnapshot
  strategy: readonly StrategyCategory[]
  globalAssetTargets: readonly ContributionAssetTarget[]
  assetPrices: readonly AssetPrice[]
  exchangeRates: readonly ExchangeRate[]
  technicalPlan: TargetAllocationContributionResult
  // Opcional: ausente, o dossie sai com signals: [] (mesmo comportamento de
  // antes da Fase 7) - best-effort, nao trava a explicacao de IA.
  assetFundamentalScores?: readonly AssetScoreV1[]
}
