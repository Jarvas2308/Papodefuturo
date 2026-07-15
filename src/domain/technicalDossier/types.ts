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

export type TechnicalDossierV1 = {
  schemaVersion: typeof TECHNICAL_DOSSIER_V1_SCHEMA_VERSION
  generatedAt: string
  portfolio: TechnicalDossierPortfolio
  strategy: TechnicalDossierStrategy
  marketFacts: TechnicalDossierMarketFacts
  technicalPlan: TechnicalDossierTechnicalPlan
  deviations: TechnicalDossierDeviations
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
}
