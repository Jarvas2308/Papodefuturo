import type {
  ExactDecimalQuantity,
  FundamentalAssetKind,
  SignedMonetaryFact,
} from '../types'

export const FUNDAMENTAL_DERIVED_FACTS_V1_SCHEMA_VERSION =
  'fundamental-derived-facts.v1' as const

export const FUNDAMENTAL_RATIO_SCALE = 1_000_000 as const

export type FundamentalDerivationUnavailableReason =
  | 'missing-input'
  | 'non-positive-denominator'
  | 'currency-mismatch'
  | 'unsafe-arithmetic'

export type FundamentalDerivedFormulaId =
  | 'stock-equity-to-assets.v1'
  | 'fii-net-asset-value-per-issued-share.v1'
  | 'etf-liabilities-to-assets.v1'
  | 'etf-net-assets-to-assets.v1'
  | 'etf-balance-reconciliation-delta.v1'

export type ScaledFundamentalRatio = {
  scaledValue: number
  scale: typeof FUNDAMENTAL_RATIO_SCALE
  rounding: 'half-away-from-zero'
}

export type ScaledMonetaryPerQuantity = {
  scaledAmountInMinorUnitsPerUnit: number
  scale: typeof FUNDAMENTAL_RATIO_SCALE
  currency: 'BRL'
  rounding: 'half-away-from-zero'
}

export type FundamentalDerivedMetric<
  TValue,
  TInputs,
  TFormulaId extends FundamentalDerivedFormulaId = FundamentalDerivedFormulaId,
> =
  | {
      status: 'available'
      formulaId: TFormulaId
      inputs: TInputs
      value: TValue
    }
  | {
      status: 'unavailable'
      formulaId: TFormulaId
      inputs: TInputs
      reason: FundamentalDerivationUnavailableReason
    }

export type StockEquityToAssetsInputs = {
  totalEquity: SignedMonetaryFact | null
  totalAssets: SignedMonetaryFact | null
}

export type FiiNetAssetValuePerIssuedShareInputs = {
  netAssetValue: SignedMonetaryFact | null
  issuedShares: ExactDecimalQuantity | null
}

export type EtfLiabilitiesToAssetsInputs = {
  totalLiabilities: SignedMonetaryFact | null
  totalAssets: SignedMonetaryFact | null
}

export type EtfNetAssetsToAssetsInputs = {
  netAssets: SignedMonetaryFact | null
  totalAssets: SignedMonetaryFact | null
}

export type EtfBalanceReconciliationDeltaInputs = {
  totalAssets: SignedMonetaryFact | null
  totalLiabilities: SignedMonetaryFact | null
  netAssets: SignedMonetaryFact | null
}

export type FundamentalDerivedSnapshotReference = {
  assetId: string
  referenceDate: string
  sourceDocumentId: string
}

export type BrazilianStockDerivedSnapshotV1 =
  FundamentalDerivedSnapshotReference & {
    kind: 'brazilian-stock'
    period: 'annual' | 'quarterly'
    source: 'cvm-dfp' | 'cvm-itr'
    metrics: {
      equityToAssets: FundamentalDerivedMetric<
        ScaledFundamentalRatio,
        StockEquityToAssetsInputs,
        'stock-equity-to-assets.v1'
      >
    }
  }

export type RealEstateFundDerivedSnapshotV1 =
  FundamentalDerivedSnapshotReference & {
    kind: 'real-estate-fund'
    period: 'monthly'
    source: 'cvm-fii-inf-mensal'
    metrics: {
      netAssetValuePerIssuedShare: FundamentalDerivedMetric<
        ScaledMonetaryPerQuantity,
        FiiNetAssetValuePerIssuedShareInputs,
        'fii-net-asset-value-per-issued-share.v1'
      >
    }
  }

export type InternationalEtfDerivedSnapshotV1 =
  FundamentalDerivedSnapshotReference & {
    kind: 'international-etf'
    period: 'monthly'
    source: 'sec-nport'
    metrics: {
      liabilitiesToAssets: FundamentalDerivedMetric<
        ScaledFundamentalRatio,
        EtfLiabilitiesToAssetsInputs,
        'etf-liabilities-to-assets.v1'
      >
      netAssetsToAssets: FundamentalDerivedMetric<
        ScaledFundamentalRatio,
        EtfNetAssetsToAssetsInputs,
        'etf-net-assets-to-assets.v1'
      >
      balanceReconciliationDelta: FundamentalDerivedMetric<
        SignedMonetaryFact,
        EtfBalanceReconciliationDeltaInputs,
        'etf-balance-reconciliation-delta.v1'
      >
    }
  }

export type FundamentalDerivedSnapshot =
  | BrazilianStockDerivedSnapshotV1
  | RealEstateFundDerivedSnapshotV1
  | InternationalEtfDerivedSnapshotV1

export type FundamentalDerivedFactsAsset = {
  assetId: string
  ticker: string
  name: string
  category: FundamentalAssetKind
  snapshots: FundamentalDerivedSnapshot[]
}

export type FundamentalDerivedFactsDataCoverage = {
  eligibleAssetCount: number
  assetWithDerivedSnapshotsCount: number
  totalDerivedSnapshotCount: number
  availableMetricCount: number
  unavailableMetricCount: number
  availableStockMetricCount: number
  availableRealEstateFundMetricCount: number
  availableInternationalEtfMetricCount: number
}

export type FundamentalDerivedFactsLimitationCode =
  | 'no-market-price-derivatives'
  | 'no-growth-derivatives'
  | 'no-profitability-flow-ratios'
  | 'no-score'
  | 'no-ranking'
  | 'no-recommendation'
  | 'no-technical-plan-modification'
  | 'not-persisted'
  | 'not-integrated-runtime'

export type FundamentalDerivedFactsLimitation = {
  code: FundamentalDerivedFactsLimitationCode
  description: string
}

export type FundamentalDerivedFactsV1 = {
  schemaVersion: typeof FUNDAMENTAL_DERIVED_FACTS_V1_SCHEMA_VERSION
  generatedAt: string
  assets: FundamentalDerivedFactsAsset[]
  dataCoverage: FundamentalDerivedFactsDataCoverage
  limitations: FundamentalDerivedFactsLimitation[]
}
