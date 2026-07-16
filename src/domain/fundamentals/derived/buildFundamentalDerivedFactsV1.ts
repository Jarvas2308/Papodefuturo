import { normalizeExactDecimalQuantity } from '../exactDecimalQuantity'
import {
  FUNDAMENTAL_FACTS_V1_SCHEMA_VERSION,
  type ExactDecimalQuantity,
  type FundamentalFactsAsset,
  type FundamentalFactsV1,
  type FundamentalSnapshotInput,
  type SignedMonetaryFact,
} from '../types'
import { divideToScaledSafeInteger } from './scaledArithmetic'
import {
  FUNDAMENTAL_DERIVED_FACTS_V1_SCHEMA_VERSION,
  FUNDAMENTAL_RATIO_SCALE,
  type BrazilianStockDerivedSnapshotV1,
  type EtfBalanceReconciliationDeltaInputs,
  type EtfLiabilitiesToAssetsInputs,
  type EtfNetAssetsToAssetsInputs,
  type FiiNetAssetValuePerIssuedShareInputs,
  type FundamentalDerivedFactsAsset,
  type FundamentalDerivedFactsDataCoverage,
  type FundamentalDerivedFactsLimitation,
  type FundamentalDerivedFactsV1,
  type FundamentalDerivedFormulaId,
  type FundamentalDerivedMetric,
  type FundamentalDerivationUnavailableReason,
  type FundamentalDerivedSnapshot,
  type InternationalEtfDerivedSnapshotV1,
  type RealEstateFundDerivedSnapshotV1,
  type ScaledFundamentalRatio,
  type ScaledMonetaryPerQuantity,
  type StockEquityToAssetsInputs,
} from './types'

const ISO_DATE_TIME_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,9})?(Z|[+-]\d{2}:\d{2})$/
const CIVIL_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

const STOCK_EQUITY_TO_ASSETS_FORMULA_ID = 'stock-equity-to-assets.v1'
const FII_NET_ASSET_VALUE_PER_ISSUED_SHARE_FORMULA_ID =
  'fii-net-asset-value-per-issued-share.v1'
const ETF_LIABILITIES_TO_ASSETS_FORMULA_ID = 'etf-liabilities-to-assets.v1'
const ETF_NET_ASSETS_TO_ASSETS_FORMULA_ID = 'etf-net-assets-to-assets.v1'
const ETF_BALANCE_RECONCILIATION_DELTA_FORMULA_ID =
  'etf-balance-reconciliation-delta.v1'

const LIMITATIONS: readonly FundamentalDerivedFactsLimitation[] = [
  {
    code: 'no-market-price-derivatives',
    description:
      'O contrato não combina fundamentos com preços de mercado nem calcula múltiplos de valuation.',
  },
  {
    code: 'no-growth-derivatives',
    description:
      'O contrato não calcula crescimento porque cada derivado permanece ligado a um único snapshot factual.',
  },
  {
    code: 'no-profitability-flow-ratios',
    description:
      'Margens e razões entre fluxos não fazem parte dos derivados fundamentalistas V1.',
  },
  {
    code: 'no-score',
    description: 'Nenhum score fundamentalista é produzido neste ciclo.',
  },
  {
    code: 'no-ranking',
    description: 'Nenhum ranking de ativos é produzido neste ciclo.',
  },
  {
    code: 'no-recommendation',
    description:
      'Os derivados não constituem recomendação de investimento ou ordem de execução.',
  },
  {
    code: 'no-technical-plan-modification',
    description:
      'Os derivados não alteram o plano técnico nem as regras do Motor Estratégico V2.',
  },
  {
    code: 'not-persisted',
    description:
      'O resultado é derivado em memória e não possui persistência própria neste ciclo.',
  },
  {
    code: 'not-integrated-runtime',
    description:
      'A camada derivada ainda não está integrada ao runtime ou à interface do produto.',
  },
]

function getDaysInMonth(year: number, month: number): number {
  const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
  return (
    [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][
      month - 1
    ] ?? 0
  )
}

function assertValidGeneratedAt(generatedAt: string) {
  const match = ISO_DATE_TIME_PATTERN.exec(generatedAt)
  const year = Number(match?.[1])
  const month = Number(match?.[2])
  const day = Number(match?.[3])
  const hour = Number(match?.[4])
  const minute = Number(match?.[5])
  const second = Number(match?.[6])
  const timezone = match?.[7]
  const offsetHours = Number(timezone?.slice(1, 3))
  const offsetMinutes = Number(timezone?.slice(4, 6))
  const hasValidTimezone =
    timezone === 'Z' || (offsetHours <= 23 && offsetMinutes <= 59)

  if (
    typeof generatedAt !== 'string' ||
    !match ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > getDaysInMonth(year, month) ||
    hour > 23 ||
    minute > 59 ||
    second > 59 ||
    !hasValidTimezone ||
    Number.isNaN(Date.parse(generatedAt))
  ) {
    throw new RangeError('generatedAt must be a valid ISO date-time')
  }
}

function assertValidReferenceDate(referenceDate: string) {
  const match = CIVIL_DATE_PATTERN.exec(referenceDate)
  const year = Number(match?.[1])
  const month = Number(match?.[2])
  const day = Number(match?.[3])

  if (
    typeof referenceDate !== 'string' ||
    !match ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > getDaysInMonth(year, month)
  ) {
    throw new RangeError(
      `referenceDate must be a valid YYYY-MM-DD date: ${referenceDate}`
    )
  }
}

function assertNonEmptyString(value: string, description: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${description} must be a non-empty string`)
  }
}

function copyMonetaryFact(
  fact: SignedMonetaryFact | null,
  description: string
): SignedMonetaryFact | null {
  if (fact === null) {
    return null
  }
  if (!fact || !Number.isSafeInteger(fact.amountInMinorUnits)) {
    throw new RangeError(`${description} must use signed safe minor units`)
  }
  if (fact.currency !== 'BRL' && fact.currency !== 'USD') {
    throw new RangeError(`${description} must use a supported currency`)
  }
  return { ...fact }
}

function copyExactDecimalQuantity(
  value: ExactDecimalQuantity | null
): ExactDecimalQuantity | null {
  if (value === null) {
    return null
  }

  const normalized = normalizeExactDecimalQuantity(value, 'Issued shares')
  if (
    normalized.unscaledValue !== value.unscaledValue ||
    normalized.scale !== value.scale
  ) {
    throw new RangeError('Issued shares must use normalized decimal form')
  }
  return { ...value }
}

function copyNullableNonNegativeInteger(
  value: number | null,
  description: string
): number | null {
  if (value === null) {
    return null
  }
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(
      `${description} must be a non-negative safe integer or null`
    )
  }
  return value
}

function copyRatioValue(scaledValue: number): ScaledFundamentalRatio {
  return {
    scaledValue,
    scale: FUNDAMENTAL_RATIO_SCALE,
    rounding: 'half-away-from-zero',
  }
}

function unavailable<
  TValue,
  TInputs,
  TFormulaId extends FundamentalDerivedFormulaId,
>(
  formulaId: TFormulaId,
  inputs: TInputs,
  reason: FundamentalDerivationUnavailableReason
): FundamentalDerivedMetric<TValue, TInputs, TFormulaId> {
  return { status: 'unavailable', formulaId, inputs, reason }
}

function deriveRatio<TInputs, TFormulaId extends FundamentalDerivedFormulaId>(
  formulaId: TFormulaId,
  inputs: TInputs,
  numerator: SignedMonetaryFact | null,
  denominator: SignedMonetaryFact | null,
  expectedCurrency: SignedMonetaryFact['currency']
): FundamentalDerivedMetric<ScaledFundamentalRatio, TInputs, TFormulaId> {
  if (numerator === null || denominator === null) {
    return unavailable(formulaId, inputs, 'missing-input')
  }
  if (
    numerator.currency !== expectedCurrency ||
    denominator.currency !== expectedCurrency
  ) {
    return unavailable(formulaId, inputs, 'currency-mismatch')
  }
  if (denominator.amountInMinorUnits <= 0) {
    return unavailable(formulaId, inputs, 'non-positive-denominator')
  }

  try {
    return {
      status: 'available',
      formulaId,
      inputs,
      value: copyRatioValue(
        divideToScaledSafeInteger(
          numerator.amountInMinorUnits,
          denominator.amountInMinorUnits,
          FUNDAMENTAL_RATIO_SCALE
        )
      ),
    }
  } catch (error) {
    if (error instanceof RangeError) {
      return unavailable(formulaId, inputs, 'unsafe-arithmetic')
    }
    throw error
  }
}

function compareProductWithPowerOfTen(
  left: bigint,
  exponent: number,
  right: bigint
): number {
  const leftDigits = left.toString().length + exponent
  const rightDigits = right.toString().length
  if (leftDigits !== rightDigits) {
    return leftDigits < rightDigits ? -1 : 1
  }

  const expandedLeft = left * 10n ** BigInt(exponent)
  if (expandedLeft === right) {
    return 0
  }
  return expandedLeft < right ? -1 : 1
}

function divideBigIntHalfAwayFromZero(
  numerator: bigint,
  denominator: bigint
): number {
  const isNegative = numerator < 0n
  const magnitude = isNegative ? -numerator : numerator
  const quotient = magnitude / denominator
  const remainder = magnitude % denominator
  const roundedMagnitude =
    remainder * 2n >= denominator ? quotient + 1n : quotient
  const rounded = isNegative ? -roundedMagnitude : roundedMagnitude

  if (
    rounded > BigInt(Number.MAX_SAFE_INTEGER) ||
    rounded < BigInt(Number.MIN_SAFE_INTEGER)
  ) {
    throw new RangeError('Scaled result exceeds the safe integer range')
  }
  return Number(rounded)
}

function deriveNetAssetValuePerIssuedShare(
  inputs: FiiNetAssetValuePerIssuedShareInputs
): FundamentalDerivedMetric<
  ScaledMonetaryPerQuantity,
  FiiNetAssetValuePerIssuedShareInputs,
  typeof FII_NET_ASSET_VALUE_PER_ISSUED_SHARE_FORMULA_ID
> {
  const formulaId = FII_NET_ASSET_VALUE_PER_ISSUED_SHARE_FORMULA_ID
  const { netAssetValue, issuedShares } = inputs
  if (netAssetValue === null || issuedShares === null) {
    return unavailable(formulaId, inputs, 'missing-input')
  }
  if (netAssetValue.currency !== 'BRL') {
    return unavailable(formulaId, inputs, 'currency-mismatch')
  }
  if (issuedShares.unscaledValue <= 0) {
    return unavailable(formulaId, inputs, 'non-positive-denominator')
  }
  if (netAssetValue.amountInMinorUnits === 0) {
    return {
      status: 'available',
      formulaId,
      inputs,
      value: {
        scaledAmountInMinorUnitsPerUnit: 0,
        scale: FUNDAMENTAL_RATIO_SCALE,
        currency: 'BRL',
        rounding: 'half-away-from-zero',
      },
    }
  }

  const netAssetValueAmount = BigInt(netAssetValue.amountInMinorUnits)
  const absoluteNetAssetValueAmount =
    netAssetValueAmount < 0n ? -netAssetValueAmount : netAssetValueAmount
  const absoluteScaledMoney =
    absoluteNetAssetValueAmount * BigInt(FUNDAMENTAL_RATIO_SCALE)
  const denominator = BigInt(issuedShares.unscaledValue)
  const unsafeThreshold = denominator * (BigInt(Number.MAX_SAFE_INTEGER) + 1n)

  if (
    compareProductWithPowerOfTen(
      absoluteScaledMoney,
      issuedShares.scale,
      unsafeThreshold
    ) >= 0
  ) {
    return unavailable(formulaId, inputs, 'unsafe-arithmetic')
  }

  try {
    const signedScaledMoney =
      BigInt(netAssetValue.amountInMinorUnits) * BigInt(FUNDAMENTAL_RATIO_SCALE)
    const numerator = signedScaledMoney * 10n ** BigInt(issuedShares.scale)
    return {
      status: 'available',
      formulaId,
      inputs,
      value: {
        scaledAmountInMinorUnitsPerUnit: divideBigIntHalfAwayFromZero(
          numerator,
          denominator
        ),
        scale: FUNDAMENTAL_RATIO_SCALE,
        currency: 'BRL',
        rounding: 'half-away-from-zero',
      },
    }
  } catch (error) {
    if (error instanceof RangeError) {
      return unavailable(formulaId, inputs, 'unsafe-arithmetic')
    }
    throw error
  }
}

function deriveBalanceReconciliationDelta(
  inputs: EtfBalanceReconciliationDeltaInputs
): FundamentalDerivedMetric<
  SignedMonetaryFact,
  EtfBalanceReconciliationDeltaInputs,
  typeof ETF_BALANCE_RECONCILIATION_DELTA_FORMULA_ID
> {
  const formulaId = ETF_BALANCE_RECONCILIATION_DELTA_FORMULA_ID
  const { totalAssets, totalLiabilities, netAssets } = inputs
  if (totalAssets === null || totalLiabilities === null || netAssets === null) {
    return unavailable(formulaId, inputs, 'missing-input')
  }
  if (
    totalAssets.currency !== 'USD' ||
    totalLiabilities.currency !== 'USD' ||
    netAssets.currency !== 'USD'
  ) {
    return unavailable(formulaId, inputs, 'currency-mismatch')
  }

  const delta =
    BigInt(totalAssets.amountInMinorUnits) -
    BigInt(totalLiabilities.amountInMinorUnits) -
    BigInt(netAssets.amountInMinorUnits)
  if (
    delta > BigInt(Number.MAX_SAFE_INTEGER) ||
    delta < BigInt(Number.MIN_SAFE_INTEGER)
  ) {
    return unavailable(formulaId, inputs, 'unsafe-arithmetic')
  }

  return {
    status: 'available',
    formulaId,
    inputs,
    value: { amountInMinorUnits: Number(delta), currency: 'USD' },
  }
}

function snapshotKey(snapshot: FundamentalSnapshotInput): string {
  return JSON.stringify([
    snapshot.assetId,
    snapshot.kind,
    snapshot.period,
    snapshot.source,
    snapshot.referenceDate,
    snapshot.sourceDocumentId,
  ])
}

function compareSnapshots(
  left: FundamentalDerivedSnapshot,
  right: FundamentalDerivedSnapshot
): number {
  if (left.referenceDate !== right.referenceDate) {
    return left.referenceDate > right.referenceDate ? -1 : 1
  }
  if (left.sourceDocumentId === right.sourceDocumentId) {
    return 0
  }
  return left.sourceDocumentId < right.sourceDocumentId ? -1 : 1
}

function assertSnapshotCommon(
  asset: FundamentalFactsAsset,
  snapshot: FundamentalSnapshotInput,
  snapshotKeys: Set<string>
) {
  assertNonEmptyString(snapshot.assetId, 'Snapshot assetId')
  if (snapshot.assetId !== asset.assetId) {
    throw new Error(`Snapshot assetId does not match asset: ${asset.assetId}`)
  }
  if (snapshot.kind !== asset.category) {
    throw new Error(`Snapshot kind does not match asset: ${asset.assetId}`)
  }
  assertValidReferenceDate(snapshot.referenceDate)
  assertNonEmptyString(snapshot.sourceDocumentId, 'sourceDocumentId')

  const key = snapshotKey(snapshot)
  if (snapshotKeys.has(key)) {
    throw new Error(`Duplicate fundamental snapshot: ${asset.assetId}`)
  }
  snapshotKeys.add(key)
}

function buildStockDerivedSnapshot(
  snapshot: Extract<FundamentalSnapshotInput, { kind: 'brazilian-stock' }>
): BrazilianStockDerivedSnapshotV1 {
  const facts = snapshot.facts
  if (!facts) {
    throw new Error('Brazilian stock facts are required')
  }
  copyMonetaryFact(facts.totalRevenue, 'Total revenue')
  copyMonetaryFact(facts.netIncome, 'Net income')
  const totalAssets = copyMonetaryFact(facts.totalAssets, 'Total assets')
  const totalEquity = copyMonetaryFact(facts.totalEquity, 'Total equity')
  copyMonetaryFact(facts.operatingCashFlow, 'Operating cash flow')
  const inputs: StockEquityToAssetsInputs = {
    totalEquity,
    totalAssets,
  }

  return {
    assetId: snapshot.assetId,
    kind: snapshot.kind,
    referenceDate: snapshot.referenceDate,
    period: snapshot.period,
    source: snapshot.source,
    sourceDocumentId: snapshot.sourceDocumentId,
    metrics: {
      equityToAssets: deriveRatio(
        STOCK_EQUITY_TO_ASSETS_FORMULA_ID,
        inputs,
        totalEquity,
        totalAssets,
        'BRL'
      ),
    },
  }
}

function buildFiiDerivedSnapshot(
  snapshot: Extract<FundamentalSnapshotInput, { kind: 'real-estate-fund' }>
): RealEstateFundDerivedSnapshotV1 {
  const facts = snapshot.facts
  if (!facts) {
    throw new Error('Real estate fund facts are required')
  }
  const netAssetValue = copyMonetaryFact(facts.netAssetValue, 'Net asset value')
  const issuedShares = copyExactDecimalQuantity(facts.issuedShares)
  copyNullableNonNegativeInteger(facts.shareholderCount, 'Shareholder count')
  const inputs: FiiNetAssetValuePerIssuedShareInputs = {
    netAssetValue,
    issuedShares,
  }

  return {
    assetId: snapshot.assetId,
    kind: snapshot.kind,
    referenceDate: snapshot.referenceDate,
    period: snapshot.period,
    source: snapshot.source,
    sourceDocumentId: snapshot.sourceDocumentId,
    metrics: {
      netAssetValuePerIssuedShare: deriveNetAssetValuePerIssuedShare(inputs),
    },
  }
}

function buildEtfDerivedSnapshot(
  snapshot: Extract<FundamentalSnapshotInput, { kind: 'international-etf' }>
): InternationalEtfDerivedSnapshotV1 {
  const facts = snapshot.facts
  if (!facts) {
    throw new Error('International ETF facts are required')
  }
  const totalAssets = copyMonetaryFact(facts.totalAssets, 'Total assets')
  const totalLiabilities = copyMonetaryFact(
    facts.totalLiabilities,
    'Total liabilities'
  )
  const netAssets = copyMonetaryFact(facts.netAssets, 'Net assets')
  const liabilitiesInputs: EtfLiabilitiesToAssetsInputs = {
    totalLiabilities: totalLiabilities ? { ...totalLiabilities } : null,
    totalAssets: totalAssets ? { ...totalAssets } : null,
  }
  const netAssetsInputs: EtfNetAssetsToAssetsInputs = {
    netAssets: netAssets ? { ...netAssets } : null,
    totalAssets: totalAssets ? { ...totalAssets } : null,
  }
  const reconciliationInputs: EtfBalanceReconciliationDeltaInputs = {
    totalAssets: totalAssets ? { ...totalAssets } : null,
    totalLiabilities: totalLiabilities ? { ...totalLiabilities } : null,
    netAssets: netAssets ? { ...netAssets } : null,
  }

  return {
    assetId: snapshot.assetId,
    kind: snapshot.kind,
    referenceDate: snapshot.referenceDate,
    period: snapshot.period,
    source: snapshot.source,
    sourceDocumentId: snapshot.sourceDocumentId,
    metrics: {
      liabilitiesToAssets: deriveRatio(
        ETF_LIABILITIES_TO_ASSETS_FORMULA_ID,
        liabilitiesInputs,
        liabilitiesInputs.totalLiabilities,
        liabilitiesInputs.totalAssets,
        'USD'
      ),
      netAssetsToAssets: deriveRatio(
        ETF_NET_ASSETS_TO_ASSETS_FORMULA_ID,
        netAssetsInputs,
        netAssetsInputs.netAssets,
        netAssetsInputs.totalAssets,
        'USD'
      ),
      balanceReconciliationDelta:
        deriveBalanceReconciliationDelta(reconciliationInputs),
    },
  }
}

function buildDerivedSnapshot(
  snapshot: FundamentalSnapshotInput
): FundamentalDerivedSnapshot {
  if (snapshot.kind === 'brazilian-stock') {
    if (!(
      (snapshot.source === 'cvm-dfp' && snapshot.period === 'annual') ||
      (snapshot.source === 'cvm-itr' && snapshot.period === 'quarterly')
    )) {
      throw new Error('Brazilian stock source and period are inconsistent')
    }
    return buildStockDerivedSnapshot(snapshot)
  }
  if (snapshot.kind === 'real-estate-fund') {
    if (
      snapshot.source !== 'cvm-fii-inf-mensal' ||
      snapshot.period !== 'monthly'
    ) {
      throw new Error('Real estate fund source and period are inconsistent')
    }
    return buildFiiDerivedSnapshot(snapshot)
  }
  if (snapshot.kind === 'international-etf') {
    if (snapshot.source !== 'sec-nport' || snapshot.period !== 'monthly') {
      throw new Error('International ETF source and period are inconsistent')
    }
    return buildEtfDerivedSnapshot(snapshot)
  }
  throw new Error('Unsupported fundamental snapshot kind')
}

function countMetricAvailability(snapshot: FundamentalDerivedSnapshot): {
  available: number
  unavailable: number
} {
  const metrics = Object.values(snapshot.metrics)
  const available = metrics.filter(
    (metric) => metric.status === 'available'
  ).length
  return { available, unavailable: metrics.length - available }
}

function buildDataCoverage(
  assets: readonly FundamentalDerivedFactsAsset[]
): FundamentalDerivedFactsDataCoverage {
  const snapshots = assets.flatMap((asset) => asset.snapshots)
  let availableMetricCount = 0
  let unavailableMetricCount = 0
  let availableStockMetricCount = 0
  let availableRealEstateFundMetricCount = 0
  let availableInternationalEtfMetricCount = 0

  for (const snapshot of snapshots) {
    const counts = countMetricAvailability(snapshot)
    availableMetricCount += counts.available
    unavailableMetricCount += counts.unavailable
    if (snapshot.kind === 'brazilian-stock') {
      availableStockMetricCount += counts.available
    } else if (snapshot.kind === 'real-estate-fund') {
      availableRealEstateFundMetricCount += counts.available
    } else {
      availableInternationalEtfMetricCount += counts.available
    }
  }

  return {
    eligibleAssetCount: assets.length,
    assetWithDerivedSnapshotsCount: assets.filter(
      (asset) => asset.snapshots.length > 0
    ).length,
    totalDerivedSnapshotCount: snapshots.length,
    availableMetricCount,
    unavailableMetricCount,
    availableStockMetricCount,
    availableRealEstateFundMetricCount,
    availableInternationalEtfMetricCount,
  }
}

export function buildFundamentalDerivedFactsV1(
  input: FundamentalFactsV1
): FundamentalDerivedFactsV1 {
  if (input.schemaVersion !== FUNDAMENTAL_FACTS_V1_SCHEMA_VERSION) {
    throw new Error('Unsupported fundamental facts schema version')
  }
  assertValidGeneratedAt(input.generatedAt)
  if (!Array.isArray(input.assets)) {
    throw new Error('Fundamental facts assets must be an array')
  }

  const assetIds = new Set<string>()
  const snapshotKeys = new Set<string>()

  const assets: FundamentalDerivedFactsAsset[] = input.assets.map((asset) => {
    assertNonEmptyString(asset.assetId, 'Asset id')
    assertNonEmptyString(asset.ticker, 'Asset ticker')
    assertNonEmptyString(asset.name, 'Asset name')
    if (assetIds.has(asset.assetId)) {
      throw new Error(`Duplicate asset id: ${asset.assetId}`)
    }
    assetIds.add(asset.assetId)
    if (
      asset.category !== 'brazilian-stock' &&
      asset.category !== 'real-estate-fund' &&
      asset.category !== 'international-etf'
    ) {
      throw new Error(
        `Unsupported fundamental asset category: ${asset.category}`
      )
    }
    if (!Array.isArray(asset.snapshots)) {
      throw new Error(`Asset snapshots must be an array: ${asset.assetId}`)
    }

    const snapshots = asset.snapshots.map((snapshot) => {
      assertSnapshotCommon(asset, snapshot, snapshotKeys)
      return buildDerivedSnapshot(snapshot)
    })

    return {
      assetId: asset.assetId,
      ticker: asset.ticker,
      name: asset.name,
      category: asset.category,
      snapshots: [...snapshots].sort(compareSnapshots),
    }
  })

  return {
    schemaVersion: FUNDAMENTAL_DERIVED_FACTS_V1_SCHEMA_VERSION,
    generatedAt: input.generatedAt,
    assets,
    dataCoverage: buildDataCoverage(assets),
    limitations: LIMITATIONS.map((limitation) => ({ ...limitation })),
  }
}
