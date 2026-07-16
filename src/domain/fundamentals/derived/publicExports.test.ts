import { describe, expect, expectTypeOf, it } from 'vitest'
import {
  FUNDAMENTAL_DERIVED_FACTS_V1_SCHEMA_VERSION,
  FUNDAMENTAL_RATIO_SCALE,
  buildFundamentalDerivedFactsV1,
  divideToScaledSafeInteger,
  type BrazilianStockDerivedSnapshotV1,
  type FundamentalDerivationUnavailableReason,
  type FundamentalDerivedFactsAsset,
  type FundamentalDerivedFactsDataCoverage,
  type FundamentalDerivedFactsLimitation,
  type FundamentalDerivedFactsV1,
  type FundamentalDerivedMetric,
  type InternationalEtfDerivedSnapshotV1,
  type RealEstateFundDerivedSnapshotV1,
  type ScaledFundamentalRatio,
  type ScaledMonetaryPerQuantity,
} from '../index'

describe('exports públicos de Fundamental Derived Facts V1', () => {
  it('expõe apenas a API de domínio necessária pelo barrel de fundamentals', () => {
    expect(FUNDAMENTAL_DERIVED_FACTS_V1_SCHEMA_VERSION).toBe(
      'fundamental-derived-facts.v1'
    )
    expect(FUNDAMENTAL_RATIO_SCALE).toBe(1_000_000)
    expect(buildFundamentalDerivedFactsV1).toBeTypeOf('function')
    expect(divideToScaledSafeInteger).toBeTypeOf('function')
    expectTypeOf<ScaledFundamentalRatio>().not.toBeNever()
    expectTypeOf<ScaledMonetaryPerQuantity>().not.toBeNever()
    expectTypeOf<FundamentalDerivationUnavailableReason>().not.toBeNever()
    expectTypeOf<
      FundamentalDerivedMetric<
        ScaledFundamentalRatio,
        Record<string, never>,
        'stock-equity-to-assets.v1'
      >
    >().not.toBeNever()
    expectTypeOf<BrazilianStockDerivedSnapshotV1>().not.toBeNever()
    expectTypeOf<RealEstateFundDerivedSnapshotV1>().not.toBeNever()
    expectTypeOf<InternationalEtfDerivedSnapshotV1>().not.toBeNever()
    expectTypeOf<FundamentalDerivedFactsAsset>().not.toBeNever()
    expectTypeOf<FundamentalDerivedFactsDataCoverage>().not.toBeNever()
    expectTypeOf<FundamentalDerivedFactsLimitation>().not.toBeNever()
    expectTypeOf<FundamentalDerivedFactsV1>().not.toBeNever()
  })
})
