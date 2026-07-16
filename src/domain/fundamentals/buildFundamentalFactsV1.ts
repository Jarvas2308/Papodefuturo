import type { Asset } from '../models'
import { normalizeExactDecimalQuantity } from './exactDecimalQuantity'
import {
  FUNDAMENTAL_FACTS_V1_SCHEMA_VERSION,
  type BrazilianStockFundamentalFacts,
  type BuildFundamentalFactsV1Input,
  type FundamentalAssetKind,
  type FundamentalFactsLimitation,
  type FundamentalFactsV1,
  type FundamentalSnapshotInput,
  type InternationalEtfFundamentalFacts,
  type RealEstateFundFundamentalFacts,
  type SignedMonetaryFact,
} from './types'

const ISO_DATE_TIME_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,9})?(Z|[+-]\d{2}:\d{2})$/
const CIVIL_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

const ELIGIBLE_CATEGORIES = new Set<FundamentalAssetKind>([
  'brazilian-stock',
  'real-estate-fund',
  'international-etf',
])

const LIMITATIONS: readonly FundamentalFactsLimitation[] = [
  {
    code: 'normalized-facts-only',
    description:
      'O contrato representa fatos normalizados e não interpretação.',
  },
  {
    code: 'not-persisted',
    description: 'Os fatos permanecem somente em memória neste ciclo.',
  },
  {
    code: 'providers-not-integrated-v1',
    description: 'CVM e SEC ainda não são consultadas pelo runtime neste PR.',
  },
  {
    code: 'no-derived-fundamental-ratios',
    description:
      'P/L, P/VP, margens, crescimento e outros derivados não são calculados.',
  },
  {
    code: 'no-fundamental-score',
    description:
      'Nenhum score, ranking ou classificação de qualidade é produzido.',
  },
  {
    code: 'no-technical-plan-modification',
    description: 'Fundamentos não modificam o plano técnico do Motor V2.',
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

function buildAssetMap(assets: readonly Asset[]): Map<string, Asset> {
  const assetById = new Map<string, Asset>()

  for (const asset of assets) {
    if (typeof asset.id !== 'string' || !asset.id.trim()) {
      throw new Error('Asset id must be a non-empty string')
    }
    if (assetById.has(asset.id)) {
      throw new Error(`Duplicate asset id: ${asset.id}`)
    }
    assetById.set(asset.id, asset)
  }

  return assetById
}

function copySignedMonetaryFact(
  fact: SignedMonetaryFact | null,
  expectedCurrency: SignedMonetaryFact['currency'],
  description: string
): SignedMonetaryFact | null {
  if (fact === null) {
    return null
  }
  if (!fact || !Number.isSafeInteger(fact.amountInMinorUnits)) {
    throw new RangeError(`${description} must use signed safe minor units`)
  }
  if (fact.currency !== expectedCurrency) {
    throw new RangeError(`${description} must use ${expectedCurrency}`)
  }

  return { ...fact }
}

function copyBrazilianStockFacts(
  facts: BrazilianStockFundamentalFacts
): BrazilianStockFundamentalFacts {
  if (!facts) {
    throw new Error('Brazilian stock facts are required')
  }

  return {
    totalRevenue: copySignedMonetaryFact(
      facts.totalRevenue,
      'BRL',
      'Total revenue'
    ),
    netIncome: copySignedMonetaryFact(facts.netIncome, 'BRL', 'Net income'),
    totalAssets: copySignedMonetaryFact(
      facts.totalAssets,
      'BRL',
      'Total assets'
    ),
    totalEquity: copySignedMonetaryFact(
      facts.totalEquity,
      'BRL',
      'Total equity'
    ),
    operatingCashFlow: copySignedMonetaryFact(
      facts.operatingCashFlow,
      'BRL',
      'Operating cash flow'
    ),
  }
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

function copyRealEstateFundFacts(
  facts: RealEstateFundFundamentalFacts
): RealEstateFundFundamentalFacts {
  if (!facts) {
    throw new Error('Real estate fund facts are required')
  }

  return {
    netAssetValue: copySignedMonetaryFact(
      facts.netAssetValue,
      'BRL',
      'Net asset value'
    ),
    issuedShares:
      facts.issuedShares === null
        ? null
        : normalizeExactDecimalQuantity(facts.issuedShares, 'Issued shares'),
    shareholderCount: copyNullableNonNegativeInteger(
      facts.shareholderCount,
      'Shareholder count'
    ),
  }
}

function copyInternationalEtfFacts(
  facts: InternationalEtfFundamentalFacts
): InternationalEtfFundamentalFacts {
  if (!facts) {
    throw new Error('International ETF facts are required')
  }

  return {
    totalAssets: copySignedMonetaryFact(
      facts.totalAssets,
      'USD',
      'Total assets'
    ),
    totalLiabilities: copySignedMonetaryFact(
      facts.totalLiabilities,
      'USD',
      'Total liabilities'
    ),
    netAssets: copySignedMonetaryFact(facts.netAssets, 'USD', 'Net assets'),
  }
}

function assertRuntimeSourceAndPeriod(snapshot: FundamentalSnapshotInput) {
  if (snapshot.kind === 'brazilian-stock') {
    const isValid =
      (snapshot.source === 'cvm-dfp' && snapshot.period === 'annual') ||
      (snapshot.source === 'cvm-itr' && snapshot.period === 'quarterly')
    if (!isValid) {
      throw new Error('Brazilian stock source and period are inconsistent')
    }
    return
  }

  if (
    snapshot.kind === 'real-estate-fund' &&
    (snapshot.source !== 'cvm-fii-inf-mensal' || snapshot.period !== 'monthly')
  ) {
    throw new Error('Real estate fund source and period are inconsistent')
  }

  if (
    snapshot.kind === 'international-etf' &&
    (snapshot.source !== 'sec-nport' || snapshot.period !== 'monthly')
  ) {
    throw new Error('International ETF source and period are inconsistent')
  }
}

function copySnapshot(
  snapshot: FundamentalSnapshotInput
): FundamentalSnapshotInput {
  const common = {
    assetId: snapshot.assetId,
    referenceDate: snapshot.referenceDate,
    sourceDocumentId: snapshot.sourceDocumentId,
  }

  switch (snapshot.kind) {
    case 'brazilian-stock':
      return {
        ...common,
        kind: snapshot.kind,
        period: snapshot.period,
        source: snapshot.source,
        facts: copyBrazilianStockFacts(snapshot.facts),
      }
    case 'real-estate-fund':
      return {
        ...common,
        kind: snapshot.kind,
        period: snapshot.period,
        source: snapshot.source,
        facts: copyRealEstateFundFacts(snapshot.facts),
      }
    case 'international-etf':
      return {
        ...common,
        kind: snapshot.kind,
        period: snapshot.period,
        source: snapshot.source,
        facts: copyInternationalEtfFacts(snapshot.facts),
      }
    default:
      throw new Error('Unsupported fundamental snapshot kind')
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
  left: FundamentalSnapshotInput,
  right: FundamentalSnapshotInput
): number {
  if (left.referenceDate !== right.referenceDate) {
    return left.referenceDate > right.referenceDate ? -1 : 1
  }
  if (left.sourceDocumentId === right.sourceDocumentId) {
    return 0
  }
  return left.sourceDocumentId < right.sourceDocumentId ? -1 : 1
}

export function buildFundamentalFactsV1({
  generatedAt,
  assets,
  snapshots,
}: BuildFundamentalFactsV1Input): FundamentalFactsV1 {
  assertValidGeneratedAt(generatedAt)
  const assetById = buildAssetMap(assets)
  const snapshotsByAsset = new Map<string, FundamentalSnapshotInput[]>()
  const snapshotKeys = new Set<string>()
  let brazilianStockSnapshotCount = 0
  let realEstateFundSnapshotCount = 0
  let internationalEtfSnapshotCount = 0

  for (const snapshot of snapshots) {
    if (typeof snapshot.assetId !== 'string' || !snapshot.assetId.trim()) {
      throw new Error('Snapshot assetId must be a non-empty string')
    }

    const asset = assetById.get(snapshot.assetId)
    if (!asset) {
      throw new Error(
        `Snapshot references an unknown asset: ${snapshot.assetId}`
      )
    }
    if (asset.status !== 'active') {
      throw new Error(`Snapshot asset must be active: ${snapshot.assetId}`)
    }
    if (!ELIGIBLE_CATEGORIES.has(asset.category as FundamentalAssetKind)) {
      throw new Error(
        `Snapshot asset category is not monitored: ${asset.category}`
      )
    }
    if (snapshot.kind !== asset.category) {
      throw new Error(
        `Snapshot kind does not match asset category: ${snapshot.assetId}`
      )
    }

    assertRuntimeSourceAndPeriod(snapshot)
    assertValidReferenceDate(snapshot.referenceDate)
    if (
      typeof snapshot.sourceDocumentId !== 'string' ||
      !snapshot.sourceDocumentId.trim()
    ) {
      throw new Error('sourceDocumentId must be a non-empty string')
    }

    const key = snapshotKey(snapshot)
    if (snapshotKeys.has(key)) {
      throw new Error(`Duplicate fundamental snapshot: ${snapshot.assetId}`)
    }
    snapshotKeys.add(key)

    const copiedSnapshot = copySnapshot(snapshot)
    const assetSnapshots = snapshotsByAsset.get(snapshot.assetId) ?? []
    assetSnapshots.push(copiedSnapshot)
    snapshotsByAsset.set(snapshot.assetId, assetSnapshots)

    if (snapshot.kind === 'brazilian-stock') {
      brazilianStockSnapshotCount += 1
    } else if (snapshot.kind === 'real-estate-fund') {
      realEstateFundSnapshotCount += 1
    } else {
      internationalEtfSnapshotCount += 1
    }
  }

  const eligibleAssets = assets.filter(
    (asset): asset is Asset & { category: FundamentalAssetKind } =>
      asset.status === 'active' &&
      ELIGIBLE_CATEGORIES.has(asset.category as FundamentalAssetKind)
  )
  const outputAssets = eligibleAssets.map((asset) => ({
    assetId: asset.id,
    ticker: asset.ticker,
    name: asset.name,
    category: asset.category,
    snapshots: [...(snapshotsByAsset.get(asset.id) ?? [])].sort(
      compareSnapshots
    ),
  }))
  const missingFundamentalAssetIds = outputAssets
    .filter((asset) => asset.snapshots.length === 0)
    .map((asset) => asset.assetId)

  return {
    schemaVersion: FUNDAMENTAL_FACTS_V1_SCHEMA_VERSION,
    generatedAt,
    assets: outputAssets,
    dataCoverage: {
      eligibleAssetCount: outputAssets.length,
      assetWithFactsCount:
        outputAssets.length - missingFundamentalAssetIds.length,
      missingFundamentalAssetIds,
      totalSnapshotCount: snapshots.length,
      brazilianStockSnapshotCount,
      realEstateFundSnapshotCount,
      internationalEtfSnapshotCount,
    },
    limitations: LIMITATIONS.map((limitation) => ({ ...limitation })),
  }
}
