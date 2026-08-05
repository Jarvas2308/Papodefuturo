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

export type ExactDecimalQuantity = {
  unscaledValue: number
  scale: number
}

export type BrazilianStockFundamentalFacts = {
  totalRevenue: SignedMonetaryFact | null
  netIncome: SignedMonetaryFact | null
  totalAssets: SignedMonetaryFact | null
  totalEquity: SignedMonetaryFact | null
  operatingCashFlow: SignedMonetaryFact | null
  // Cotas emitidas da classe negociada pelo ticker (DEC-081), fonte
  // `dfp_cia_aberta_composicao_capital`/`itr_cia_aberta_composicao_capital`.
  // ON puro (BBAS3/WEGE3/PSSA3), PN puro (ITSA4) ou total ON+PN para units
  // (TAEE11) - ver `CvmBrazilianStockCompany.shareClass`. Insumo de LPA e
  // P/L, ainda nao calculados (Fase 5).
  issuedShares: ExactDecimalQuantity | null
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
  issuedShares: ExactDecimalQuantity | null
  shareholderCount: number | null
  // So populado por 'cvm-fii-inf-trimestral' - o Informe Mensal nao tem
  // esse dado. Media ponderada por receita entre os imoveis do fundo no
  // trimestre mais recente (docs/reference/FII_SEGMENTOS_E_METRICAS.md,
  // secao 7.1). Escala 0-10000 (pontos-base), mesmo padrao de BasisPoints
  // usado no resto do dominio.
  vacancyInBasisPoints: number | null
}

export type RealEstateFundFundamentalSnapshotInput = {
  assetId: string
  kind: 'real-estate-fund'
  referenceDate: string
  period: 'monthly' | 'quarterly'
  source: 'cvm-fii-inf-mensal' | 'cvm-fii-inf-trimestral'
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
