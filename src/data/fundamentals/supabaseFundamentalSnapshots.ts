import type {
  BrazilianStockFundamentalSnapshotInput,
  SignedMonetaryFact,
} from '../../domain/fundamentals'
import type { Asset } from '../../domain/models'
import { normalizeAssetTicker } from '../assetUniverse'
import type {
  FundamentalSnapshotRepository,
  FundamentalSnapshotStorage,
} from './contracts'
import type {
  CvmBrazilianStockFundamentalRecord,
  CvmFactProvenance,
  CvmStatement,
} from './cvm/types'
import type {
  FundamentalSnapshotInsert,
  FundamentalSnapshotJson,
  FundamentalSnapshotRow,
  FundamentalSnapshotSupabaseClient,
} from './fundamentalSnapshotSchema'

const UPSERT_CONFLICT_COLUMNS = [
  'ticker',
  'category',
  'market',
  'kind',
  'period',
  'source',
  'reference_date',
  'source_document_id',
].join(',')

type QueryError = { message: string }

type BrazilianStockAssetIdentity = {
  ticker: string
  category: string
  market: string
}

function createQueryError(operation: string, error: QueryError): Error {
  return new Error(
    `Failed to ${operation} fundamental snapshots: ${error.message}`
  )
}

function factProvenanceToJson(
  value: CvmFactProvenance
): FundamentalSnapshotJson {
  return {
    statement: value.statement,
    accountCode: value.accountCode,
    accountDescription: value.accountDescription,
    referenceDate: value.referenceDate,
    version: value.version,
    exerciseOrder: value.exerciseOrder,
  }
}

function toJson(
  value: CvmBrazilianStockFundamentalRecord['provenance']
): FundamentalSnapshotJson {
  return {
    totalRevenue: null,
    netIncome: factProvenanceToJson(value.netIncome),
    totalAssets: factProvenanceToJson(value.totalAssets),
    totalEquity: factProvenanceToJson(value.totalEquity),
    operatingCashFlow: factProvenanceToJson(value.operatingCashFlow),
  }
}

function assertBrlSafeFact(
  fact: SignedMonetaryFact | null,
  fieldName: string
): void {
  if (fact === null) {
    return
  }
  if (fact.currency !== 'BRL') {
    throw new Error(`${fieldName} must use BRL currency`)
  }
  if (!Number.isSafeInteger(fact.amountInMinorUnits)) {
    throw new RangeError(`${fieldName} must use signed safe minor units`)
  }
}

function assertRecordProvenance(
  record: CvmBrazilianStockFundamentalRecord
): void {
  for (const fact of [
    record.provenance.netIncome,
    record.provenance.totalAssets,
    record.provenance.totalEquity,
    record.provenance.operatingCashFlow,
  ]) {
    if (
      fact.referenceDate !== record.referenceDate ||
      fact.version !== record.filingVersion ||
      fact.exerciseOrder !== record.exerciseOrder
    ) {
      throw new Error('Fundamental provenance does not match filing identity')
    }
  }
}

function buildBrazilianStockAssetIdentity(
  asset: BrazilianStockAssetIdentity
): string {
  return JSON.stringify([
    normalizeAssetTicker(asset.ticker),
    asset.category,
    asset.market,
  ])
}

function toInsertRow(
  record: CvmBrazilianStockFundamentalRecord
): FundamentalSnapshotInsert {
  if (record.facts.totalRevenue !== null) {
    throw new Error('CVM totalRevenue must remain null in provider V1')
  }

  assertBrlSafeFact(record.facts.netIncome, 'Net income')
  assertBrlSafeFact(record.facts.totalAssets, 'Total assets')
  assertBrlSafeFact(record.facts.totalEquity, 'Total equity')
  assertBrlSafeFact(record.facts.operatingCashFlow, 'Operating cash flow')
  assertRecordProvenance(record)

  return {
    ticker: normalizeAssetTicker(record.ticker),
    category: record.category,
    market: record.market,
    kind: record.kind,
    period: record.period,
    source: record.source,
    reference_date: record.referenceDate,
    source_document_id: record.sourceDocumentId,
    source_archive: record.sourceArchive,
    filing_version: record.filingVersion,
    exercise_order: record.exerciseOrder,
    currency: 'BRL',
    total_revenue_minor: null,
    net_income_minor: record.facts.netIncome?.amountInMinorUnits ?? null,
    total_assets_minor: record.facts.totalAssets?.amountInMinorUnits ?? null,
    total_equity_minor: record.facts.totalEquity?.amountInMinorUnits ?? null,
    operating_cash_flow_minor:
      record.facts.operatingCashFlow?.amountInMinorUnits ?? null,
    provenance: toJson(record.provenance),
  }
}

function readNullableBrlFact(
  value: number | null,
  fieldName: string
): SignedMonetaryFact | null {
  if (value === null) {
    return null
  }
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`${fieldName} must use signed safe minor units`)
  }
  return { amountInMinorUnits: value, currency: 'BRL' }
}

type FundamentalProvenance = {
  totalRevenue: null
  netIncome: CvmFactProvenance
  totalAssets: CvmFactProvenance
  totalEquity: CvmFactProvenance
  operatingCashFlow: CvmFactProvenance
}

function isJsonRecord(
  value: FundamentalSnapshotJson | undefined
): value is { [key: string]: FundamentalSnapshotJson | undefined } {
  return Boolean(value) && !Array.isArray(value) && typeof value === 'object'
}

function isCvmStatement(value: string): value is CvmStatement {
  return ['BPA', 'BPP', 'DRE', 'DFC_MD', 'DFC_MI'].includes(value)
}

function readFactProvenance(
  value: FundamentalSnapshotJson | undefined,
  fieldName: string
): CvmFactProvenance {
  if (!isJsonRecord(value)) {
    throw new Error(`Invalid ${fieldName} provenance`)
  }

  if (
    typeof value.statement !== 'string' ||
    !isCvmStatement(value.statement) ||
    typeof value.accountCode !== 'string' ||
    !value.accountCode.trim() ||
    typeof value.accountDescription !== 'string' ||
    !value.accountDescription.trim() ||
    typeof value.referenceDate !== 'string' ||
    typeof value.version !== 'number' ||
    !Number.isSafeInteger(value.version) ||
    value.version <= 0 ||
    typeof value.exerciseOrder !== 'string' ||
    !value.exerciseOrder.trim()
  ) {
    throw new Error(`Invalid ${fieldName} provenance`)
  }

  return {
    statement: value.statement,
    accountCode: value.accountCode,
    accountDescription: value.accountDescription,
    referenceDate: value.referenceDate,
    version: value.version,
    exerciseOrder: value.exerciseOrder,
  }
}

function readProvenance(value: FundamentalSnapshotJson): FundamentalProvenance {
  if (!value || Array.isArray(value) || typeof value !== 'object') {
    throw new Error('Invalid fundamental snapshot provenance')
  }
  if (value.totalRevenue !== null) {
    throw new Error('CVM totalRevenue provenance must be null')
  }

  return {
    totalRevenue: null,
    netIncome: readFactProvenance(value.netIncome, 'netIncome'),
    totalAssets: readFactProvenance(value.totalAssets, 'totalAssets'),
    totalEquity: readFactProvenance(value.totalEquity, 'totalEquity'),
    operatingCashFlow: readFactProvenance(
      value.operatingCashFlow,
      'operatingCashFlow'
    ),
  }
}

export function mapFundamentalSnapshotRow(
  row: FundamentalSnapshotRow,
  assetId: string
): BrazilianStockFundamentalSnapshotInput {
  if (row.kind !== 'brazilian-stock' || row.category !== 'brazilian-stock') {
    throw new Error(`Unsupported fundamental snapshot kind: ${row.kind}`)
  }
  if (row.market !== 'BR' || row.currency !== 'BRL') {
    throw new Error(`Invalid Brazilian stock market or currency: ${row.ticker}`)
  }
  if (!(
    (row.source === 'cvm-dfp' && row.period === 'annual') ||
    (row.source === 'cvm-itr' && row.period === 'quarterly')
  )) {
    throw new Error(`Invalid CVM source and period: ${row.ticker}`)
  }
  if (!Number.isSafeInteger(row.filing_version) || row.filing_version <= 0) {
    throw new Error(`Invalid CVM filing version: ${row.filing_version}`)
  }
  if (row.total_revenue_minor !== null) {
    throw new Error('CVM totalRevenue must remain null in provider V1')
  }

  const provenance = readProvenance(row.provenance)
  for (const fact of [
    provenance.netIncome,
    provenance.totalAssets,
    provenance.totalEquity,
    provenance.operatingCashFlow,
  ]) {
    if (
      fact.referenceDate !== row.reference_date ||
      fact.version !== row.filing_version ||
      fact.exerciseOrder !== row.exercise_order
    ) {
      throw new Error('Fundamental provenance does not match filing identity')
    }
  }

  return {
    assetId,
    kind: 'brazilian-stock',
    referenceDate: row.reference_date,
    period: row.period,
    source: row.source,
    sourceDocumentId: row.source_document_id,
    facts: {
      totalRevenue: readNullableBrlFact(
        row.total_revenue_minor,
        'Total revenue'
      ),
      netIncome: readNullableBrlFact(row.net_income_minor, 'Net income'),
      totalAssets: readNullableBrlFact(row.total_assets_minor, 'Total assets'),
      totalEquity: readNullableBrlFact(row.total_equity_minor, 'Total equity'),
      operatingCashFlow: readNullableBrlFact(
        row.operating_cash_flow_minor,
        'Operating cash flow'
      ),
    },
  }
}

export function createSupabaseFundamentalSnapshotStorage(
  privilegedClient: FundamentalSnapshotSupabaseClient
): FundamentalSnapshotStorage {
  return {
    async upsertMany(records) {
      if (records.length === 0) {
        return
      }

      const { error } = await privilegedClient
        .from('fundamental_snapshots')
        .upsert(records.map(toInsertRow), {
          onConflict: UPSERT_CONFLICT_COLUMNS,
        })

      if (error) {
        throw createQueryError('upsert', error)
      }
    },
  }
}

export function createSupabaseFundamentalSnapshotRepository(
  client: FundamentalSnapshotSupabaseClient
): FundamentalSnapshotRepository {
  return {
    async listBrazilianStockSnapshots(assets: readonly Asset[]) {
      const brazilianAssets = assets.filter(
        (asset) =>
          asset.category === 'brazilian-stock' &&
          asset.market === 'BR' &&
          asset.status === 'active'
      )
      const assetsByIdentity = new Map(
        brazilianAssets.map((asset) => [
          buildBrazilianStockAssetIdentity(asset),
          asset,
        ])
      )

      if (assetsByIdentity.size !== brazilianAssets.length) {
        throw new Error('Duplicate Brazilian stock identity in asset list')
      }
      if (brazilianAssets.length === 0) {
        return []
      }

      const { data, error } = await client
        .from('fundamental_snapshots')
        .select('*')
        .eq('kind', 'brazilian-stock')
        .eq('category', 'brazilian-stock')
        .eq('market', 'BR')
        .in(
          'ticker',
          brazilianAssets.map((asset) => normalizeAssetTicker(asset.ticker))
        )
        .order('reference_date', { ascending: false })

      if (error) {
        throw createQueryError('load', error)
      }

      return (data ?? []).map((row) => {
        const asset = assetsByIdentity.get(
          buildBrazilianStockAssetIdentity({
            ticker: row.ticker,
            category: row.category,
            market: row.market,
          })
        )
        if (!asset) {
          throw new Error(
            `Snapshot references an unknown global asset identity: ${row.ticker}/${row.category}/${row.market}`
          )
        }
        return mapFundamentalSnapshotRow(row, asset.id)
      })
    },
  }
}
