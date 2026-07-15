import type { Asset, AssetCategory } from '../models'

export const FUNDAMENTAL_FACTS_V1_SCHEMA_VERSION =
  'fundamental-facts.v1' as const

export type FundamentalAssetKind = Extract<
  AssetCategory,
  'brazilian-stock' | 'real-estate-fund' | 'international-etf'
>

export type SignedMonetaryFact = {
  amountInMinorUnits: number
  currency: 'BRL' | 'USD'
}

export type BrazilianStockFundamentalFacts = {
  totalRevenue: SignedMonetaryFact | null
  netIncome: SignedMonetaryFact | null
  totalAssets: SignedMonetaryFact | null
  totalEquity: SignedMonetaryFact | null
  operatingCashFlow: SignedMonetaryFact | null
}

export type BrazilianStockFundamentalSnapshotInput = {
  assetId: string
  kind: 'brazilian-stock'
  referenceDate: string
  period: 'annual' | 'quarterly'
  source: 'cvm-dfp' | 'cvm-itr'
  sourceDocumentId: string
  facts: BrazilianStockFundamentalFacts
}

export type RealEstateFundFundamentalFacts = {
  netAssetValue: SignedMonetaryFact | null
  issuedShares: number | null
  shareholderCount: number | null
}

export type RealEstateFundFundamentalSnapshotInput = {
  assetId: string
  kind: 'real-estate-fund'
  referenceDate: string
  period: 'monthly'
  source: 'cvm-fii-inf-mensal'
  sourceDocumentId: string
  facts: RealEstateFundFundamentalFacts
}

export type InternationalEtfFundamentalFacts = {
  totalAssets: SignedMonetaryFact | null
  totalLiabilities: SignedMonetaryFact | null
  netAssets: SignedMonetaryFact | null
}

export type InternationalEtfFundamentalSnapshotInput = {
  assetId: string
  kind: 'international-etf'
  referenceDate: string
  period: 'monthly'
  source: 'sec-nport'
  sourceDocumentId: string
  facts: InternationalEtfFundamentalFacts
}

export type FundamentalSnapshotInput =
  | BrazilianStockFundamentalSnapshotInput
  | RealEstateFundFundamentalSnapshotInput
  | InternationalEtfFundamentalSnapshotInput

export type FundamentalFactsAsset = {
  assetId: string
  ticker: string
  name: string
  category: FundamentalAssetKind
  snapshots: FundamentalSnapshotInput[]
}

export type FundamentalFactsDataCoverage = {
  eligibleAssetCount: number
  assetWithFactsCount: number
  missingFundamentalAssetIds: string[]
  totalSnapshotCount: number
  brazilianStockSnapshotCount: number
  realEstateFundSnapshotCount: number
  internationalEtfSnapshotCount: number
}

export type FundamentalFactsLimitationCode =
  | 'normalized-facts-only'
  | 'not-persisted'
  | 'providers-not-integrated-v1'
  | 'no-derived-fundamental-ratios'
  | 'no-fundamental-score'
  | 'no-technical-plan-modification'

export type FundamentalFactsLimitation = {
  code: FundamentalFactsLimitationCode
  description: string
}

export type FundamentalFactsV1 = {
  schemaVersion: typeof FUNDAMENTAL_FACTS_V1_SCHEMA_VERSION
  generatedAt: string
  assets: FundamentalFactsAsset[]
  dataCoverage: FundamentalFactsDataCoverage
  limitations: FundamentalFactsLimitation[]
}

export type BuildFundamentalFactsV1Input = {
  generatedAt: string
  assets: readonly Asset[]
  snapshots: readonly FundamentalSnapshotInput[]
}
