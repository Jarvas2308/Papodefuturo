import type { SupabaseClient } from '@supabase/supabase-js'
import {
  formatExactDecimalQuantity,
  normalizeExactDecimalQuantity,
  type ExactDecimalQuantity,
  type RealEstateFundFundamentalSnapshotInput,
  type SignedMonetaryFact,
} from '../../domain/fundamentals'
import type { Asset } from '../../domain/models'
import type {
  Database,
  Json,
  Tables,
  TablesInsert,
  TablesUpdate,
} from '../../lib/database.types'
import { normalizeAssetTicker } from '../assetUniverse'
import type {
  RealEstateFundFundamentalSnapshotRepository,
  RealEstateFundFundamentalSnapshotStorage,
} from './contracts'
import { normalizeCvmCnpj } from './cvm/cnpj'
import {
  getCvmRealEstateFund,
  parseNullableCvmFiiExactDecimalQuantity,
  parseNullableCvmFiiMoney,
  parseNullableCvmFiiNonNegativeInteger,
} from './cvm/fii'
import type {
  CvmFiiExactDecimalProvenance,
  CvmFiiRawFieldProvenance,
  CvmRealEstateFundFundamentalRecord,
} from './cvm/fii/types'
import { normalizeCvmDescription } from './cvm/normalizeDescription'

export type RealEstateFundSnapshotJson = Json
export type RealEstateFundSnapshotRow = Tables<'fundamental_snapshots'>
export type RealEstateFundSnapshotInsert = TablesInsert<'fundamental_snapshots'>
export type RealEstateFundSnapshotUpdate = TablesUpdate<'fundamental_snapshots'>
export type RealEstateFundSnapshotSupabaseClient = SupabaseClient<Database>

const DATASET = 'FII: Documentos: Informe Mensal Estruturado' as const

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

const STOCK_FACT_COLUMNS = [
  'total_revenue_minor',
  'net_income_minor',
  'total_assets_minor',
  'total_equity_minor',
  'operating_cash_flow_minor',
] as const

const STOCK_FACT_KEYS = [
  'totalRevenue',
  'netIncome',
  'totalAssets',
  'totalEquity',
  'operatingCashFlow',
] as const

type QueryError = { message: string }

type RealEstateFundAssetIdentity = {
  ticker: string
  category: string
  market: string
}

type FiiProvenance = CvmRealEstateFundFundamentalRecord['provenance']

type ProvenanceContext = {
  ticker: string
  officialName: string
  cnpj: string
  isin: string
  referenceDate: string
  filingVersion: number
  sourceArchive: string
  sourceDocumentId: string
  netAssetValue: SignedMonetaryFact | null
  issuedShares: ExactDecimalQuantity | null
  shareholderCount: number | null
}

function createQueryError(operation: string, error: QueryError): Error {
  return new Error(
    `Failed to ${operation} real estate fund fundamental snapshots: ${error.message}`
  )
}

function buildAssetIdentity(asset: RealEstateFundAssetIdentity): string {
  return JSON.stringify([
    normalizeAssetTicker(asset.ticker),
    asset.category,
    asset.market,
  ])
}

function rawFieldToJson(value: CvmFiiRawFieldProvenance): Json {
  return {
    fileName: value.fileName,
    column: value.column,
    rawValue: value.rawValue,
  }
}

function exactDecimalProvenanceToJson(
  value: CvmFiiExactDecimalProvenance
): Json {
  return {
    fileName: value.fileName,
    column: value.column,
    rawValue: value.rawValue,
    normalizedValue: value.normalizedValue,
    unscaledValue: value.unscaledValue,
    scale: value.scale,
    referenceDate: value.referenceDate,
    filingVersion: value.filingVersion,
    archiveId: value.archiveId,
  }
}

function provenanceToJson(value: FiiProvenance): Json {
  return {
    dataset: value.dataset,
    archiveId: value.archiveId,
    identity: {
      cnpj: rawFieldToJson(value.identity.cnpj),
      officialName: rawFieldToJson(value.identity.officialName),
      isin: rawFieldToJson(value.identity.isin),
      complementCnpj: rawFieldToJson(value.identity.complementCnpj),
    },
    referenceDate: rawFieldToJson(value.referenceDate),
    version: rawFieldToJson(value.version),
    netAssetValue: rawFieldToJson(value.netAssetValue),
    issuedShares: exactDecimalProvenanceToJson(value.issuedShares),
    shareholderCount: rawFieldToJson(value.shareholderCount),
  }
}

function isJsonRecord(
  value: Json | undefined
): value is { [key: string]: Json | undefined } {
  return Boolean(value) && !Array.isArray(value) && typeof value === 'object'
}

function readRawField(
  value: Json | undefined,
  fieldName: string
): CvmFiiRawFieldProvenance {
  if (
    !isJsonRecord(value) ||
    typeof value.fileName !== 'string' ||
    !value.fileName.trim() ||
    typeof value.column !== 'string' ||
    !value.column.trim() ||
    typeof value.rawValue !== 'string'
  ) {
    throw new Error(`Invalid ${fieldName} provenance`)
  }

  return {
    fileName: value.fileName,
    column: value.column,
    rawValue: value.rawValue,
  }
}

function readNullableJsonString(
  value: Json | undefined,
  fieldName: string
): string | null {
  if (value === null) {
    return null
  }
  if (typeof value !== 'string') {
    throw new Error(`Invalid ${fieldName} provenance`)
  }
  return value
}

function readNullableJsonSafeInteger(
  value: Json | undefined,
  fieldName: string
): number | null {
  if (value === null) {
    return null
  }
  if (typeof value !== 'number' || !Number.isSafeInteger(value)) {
    throw new Error(`Invalid ${fieldName} provenance`)
  }
  return value
}

function readExactDecimalProvenance(
  value: Json | undefined
): CvmFiiExactDecimalProvenance {
  if (!isJsonRecord(value)) {
    throw new Error('Invalid issuedShares provenance')
  }

  const raw = readRawField(value, 'issuedShares')
  const normalizedValue = readNullableJsonString(
    value.normalizedValue,
    'issuedShares normalizedValue'
  )
  const unscaledValue = readNullableJsonSafeInteger(
    value.unscaledValue,
    'issuedShares unscaledValue'
  )
  const scale = readNullableJsonSafeInteger(value.scale, 'issuedShares scale')
  if (
    typeof value.referenceDate !== 'string' ||
    typeof value.filingVersion !== 'number' ||
    !Number.isSafeInteger(value.filingVersion) ||
    value.filingVersion <= 0 ||
    typeof value.archiveId !== 'string' ||
    !value.archiveId.trim()
  ) {
    throw new Error('Invalid issuedShares provenance')
  }

  return {
    ...raw,
    normalizedValue,
    unscaledValue,
    scale,
    referenceDate: value.referenceDate,
    filingVersion: value.filingVersion,
    archiveId: value.archiveId,
  }
}

function readProvenance(value: Json): FiiProvenance {
  if (
    !isJsonRecord(value) ||
    value.dataset !== DATASET ||
    typeof value.archiveId !== 'string' ||
    !value.archiveId.trim() ||
    !isJsonRecord(value.identity)
  ) {
    throw new Error('Invalid real estate fund snapshot provenance')
  }

  return {
    dataset: DATASET,
    archiveId: value.archiveId,
    identity: {
      cnpj: readRawField(value.identity.cnpj, 'identity CNPJ'),
      officialName: readRawField(
        value.identity.officialName,
        'identity officialName'
      ),
      isin: readRawField(value.identity.isin, 'identity ISIN'),
      complementCnpj: readRawField(
        value.identity.complementCnpj,
        'identity complement CNPJ'
      ),
    },
    referenceDate: readRawField(value.referenceDate, 'referenceDate'),
    version: readRawField(value.version, 'version'),
    netAssetValue: readRawField(value.netAssetValue, 'netAssetValue'),
    issuedShares: readExactDecimalProvenance(value.issuedShares),
    shareholderCount: readRawField(value.shareholderCount, 'shareholderCount'),
  }
}

function parsePositiveInteger(value: string, fieldName: string): number {
  const trimmed = value.trim()
  if (!/^\d+$/.test(trimmed)) {
    throw new Error(`Invalid ${fieldName} provenance`)
  }
  const parsed = Number(trimmed)
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${fieldName} provenance`)
  }
  return parsed
}

function sameMoney(
  left: SignedMonetaryFact | null,
  right: SignedMonetaryFact | null
): boolean {
  return (
    (left === null && right === null) ||
    (left !== null &&
      right !== null &&
      left.currency === right.currency &&
      left.amountInMinorUnits === right.amountInMinorUnits)
  )
}

function sameExactQuantity(
  left: ExactDecimalQuantity | null,
  right: ExactDecimalQuantity | null
): boolean {
  return (
    (left === null && right === null) ||
    (left !== null &&
      right !== null &&
      left.unscaledValue === right.unscaledValue &&
      left.scale === right.scale)
  )
}

function expectedSourceDocumentId(context: ProvenanceContext): string {
  return [
    'cvm-fii-inf-mensal',
    context.sourceArchive.trim(),
    normalizeCvmCnpj(context.cnpj),
    context.referenceDate,
    `v${context.filingVersion}`,
  ].join(':')
}

function assertProvenanceCoherence(
  provenance: FiiProvenance,
  context: ProvenanceContext
): void {
  const generalFileName = provenance.identity.cnpj.fileName
  const complementFileName = provenance.identity.complementCnpj.fileName
  if (
    !context.referenceDate.trim() ||
    !context.sourceArchive.trim() ||
    provenance.archiveId !== context.sourceArchive ||
    provenance.referenceDate.rawValue !== context.referenceDate ||
    parsePositiveInteger(provenance.version.rawValue, 'version') !==
      context.filingVersion ||
    provenance.issuedShares.referenceDate !== context.referenceDate ||
    provenance.issuedShares.filingVersion !== context.filingVersion ||
    provenance.issuedShares.archiveId !== context.sourceArchive ||
    context.sourceDocumentId !== expectedSourceDocumentId(context)
  ) {
    throw new Error('FII provenance does not match filing identity')
  }

  if (
    provenance.identity.cnpj.column !== 'CNPJ_Fundo_Classe' ||
    provenance.identity.officialName.column !== 'Nome_Fundo_Classe' ||
    provenance.identity.isin.column !== 'Codigo_ISIN' ||
    provenance.identity.complementCnpj.column !== 'CNPJ_Fundo_Classe' ||
    provenance.referenceDate.column !== 'Data_Referencia' ||
    provenance.version.column !== 'Versao' ||
    provenance.netAssetValue.column !== 'Patrimonio_Liquido' ||
    provenance.issuedShares.column !== 'Cotas_Emitidas' ||
    provenance.shareholderCount.column !== 'Total_Numero_Cotistas' ||
    provenance.identity.officialName.fileName !== generalFileName ||
    provenance.identity.isin.fileName !== generalFileName ||
    provenance.referenceDate.fileName !== complementFileName ||
    provenance.version.fileName !== complementFileName ||
    provenance.netAssetValue.fileName !== complementFileName ||
    provenance.issuedShares.fileName !== complementFileName ||
    provenance.shareholderCount.fileName !== complementFileName
  ) {
    throw new Error('FII provenance does not match official fields')
  }

  if (
    normalizeCvmCnpj(provenance.identity.cnpj.rawValue) !==
      normalizeCvmCnpj(context.cnpj) ||
    normalizeCvmCnpj(provenance.identity.complementCnpj.rawValue) !==
      normalizeCvmCnpj(context.cnpj) ||
    normalizeCvmDescription(provenance.identity.officialName.rawValue) !==
      normalizeCvmDescription(context.officialName) ||
    provenance.identity.isin.rawValue.trim().toUpperCase() !==
      context.isin.trim().toUpperCase()
  ) {
    throw new Error(
      `FII provenance has an invalid official identity: ${context.ticker}`
    )
  }

  const netAssetValue = parseNullableCvmFiiMoney(
    provenance.netAssetValue.rawValue,
    'net asset value provenance'
  )
  const issuedShares = parseNullableCvmFiiExactDecimalQuantity(
    provenance.issuedShares.rawValue,
    'issued shares provenance'
  )
  const shareholderCount = parseNullableCvmFiiNonNegativeInteger(
    provenance.shareholderCount.rawValue,
    'shareholder count provenance'
  )

  if (
    !sameMoney(netAssetValue, context.netAssetValue) ||
    !sameExactQuantity(issuedShares, context.issuedShares) ||
    shareholderCount !== context.shareholderCount
  ) {
    throw new Error('FII provenance does not match persisted facts')
  }

  const issuedSharesMetadata = provenance.issuedShares
  const expectedNormalizedValue =
    context.issuedShares === null
      ? null
      : formatExactDecimalQuantity(context.issuedShares)
  if (
    issuedSharesMetadata.normalizedValue !== expectedNormalizedValue ||
    issuedSharesMetadata.unscaledValue !==
      (context.issuedShares?.unscaledValue ?? null) ||
    issuedSharesMetadata.scale !== (context.issuedShares?.scale ?? null)
  ) {
    throw new Error(
      'FII issued shares provenance does not match persisted facts'
    )
  }
}

function assertPositiveFilingVersion(value: number): void {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new RangeError('FII filing version must be a positive safe integer')
  }
}

function readNullableMoney(value: number | null): SignedMonetaryFact | null {
  if (value === null) {
    return null
  }
  if (!Number.isSafeInteger(value)) {
    throw new RangeError('FII net asset value must use signed safe minor units')
  }
  return { amountInMinorUnits: value, currency: 'BRL' }
}

function assertNullableMoney(value: SignedMonetaryFact | null): void {
  if (value === null) {
    return
  }
  if (value.currency !== 'BRL') {
    throw new Error('FII net asset value must use BRL currency')
  }
  if (!Number.isSafeInteger(value.amountInMinorUnits)) {
    throw new RangeError('FII net asset value must use signed safe minor units')
  }
}

function readNullableShareholderCount(value: number | null): number | null {
  if (value !== null && (!Number.isSafeInteger(value) || value < 0)) {
    throw new RangeError(
      'FII shareholder count must be a non-negative safe integer'
    )
  }
  return value
}

function readIssuedShares(
  unscaledValue: number | null,
  scale: number | null
): ExactDecimalQuantity | null {
  if (unscaledValue === null && scale === null) {
    return null
  }
  if (unscaledValue === null || scale === null) {
    throw new Error(
      'FII issued shares coefficient and scale must be stored together'
    )
  }
  return normalizeExactDecimalQuantity(
    { unscaledValue, scale },
    'FII issued shares'
  )
}

function assertNormalizedIssuedShares(
  value: ExactDecimalQuantity | null
): void {
  if (value === null) {
    return
  }
  const normalized = normalizeExactDecimalQuantity(value, 'FII issued shares')
  if (
    normalized.unscaledValue !== value.unscaledValue ||
    normalized.scale !== value.scale
  ) {
    throw new Error(
      'FII issued shares must use normalized coefficient and scale'
    )
  }
}

function assertStockFactsAbsent(facts: object): void {
  if (STOCK_FACT_KEYS.some((key) => Object.hasOwn(facts, key))) {
    throw new Error('Brazilian stock facts must be absent from FII records')
  }
}

function assertStockColumnsNull(row: RealEstateFundSnapshotRow): void {
  if (STOCK_FACT_COLUMNS.some((column) => row[column] !== null)) {
    throw new Error(
      'Brazilian stock columns must remain null for FII snapshots'
    )
  }
}

function assertRecordIdentity(
  record: CvmRealEstateFundFundamentalRecord
): ProvenanceContext {
  if (
    record.kind !== 'real-estate-fund' ||
    record.category !== 'real-estate-fund' ||
    record.market !== 'BR' ||
    record.source !== 'cvm-fii-inf-mensal' ||
    record.period !== 'monthly' ||
    record.exerciseOrder !== null
  ) {
    throw new Error(`Invalid FII snapshot contract: ${record.ticker}`)
  }
  const fund = getCvmRealEstateFund(record.ticker)
  if (
    normalizeCvmCnpj(record.fundIdentity.cnpj) !==
      normalizeCvmCnpj(fund.cnpj) ||
    normalizeCvmDescription(record.fundIdentity.officialName) !==
      normalizeCvmDescription(fund.officialName) ||
    record.fundIdentity.isin.trim().toUpperCase() !== fund.isin
  ) {
    throw new Error(`Invalid official FII identity: ${record.ticker}`)
  }

  return {
    ticker: fund.ticker,
    officialName: fund.officialName,
    cnpj: fund.cnpj,
    isin: fund.isin,
    referenceDate: record.referenceDate,
    filingVersion: record.filingVersion,
    sourceArchive: record.sourceArchive,
    sourceDocumentId: record.sourceDocumentId,
    netAssetValue: record.facts.netAssetValue,
    issuedShares: record.facts.issuedShares,
    shareholderCount: record.facts.shareholderCount,
  }
}

function toInsertRow(
  record: CvmRealEstateFundFundamentalRecord
): RealEstateFundSnapshotInsert {
  assertPositiveFilingVersion(record.filingVersion)
  assertNullableMoney(record.facts.netAssetValue)
  readNullableShareholderCount(record.facts.shareholderCount)
  assertNormalizedIssuedShares(record.facts.issuedShares)
  assertStockFactsAbsent(record.facts)
  const context = assertRecordIdentity(record)
  assertProvenanceCoherence(record.provenance, context)

  return {
    ticker: normalizeAssetTicker(record.ticker),
    category: 'real-estate-fund',
    market: 'BR',
    kind: 'real-estate-fund',
    period: 'monthly',
    source: 'cvm-fii-inf-mensal',
    reference_date: record.referenceDate,
    source_document_id: record.sourceDocumentId,
    source_archive: record.sourceArchive,
    filing_version: record.filingVersion,
    exercise_order: null,
    currency: 'BRL',
    net_asset_value_minor:
      record.facts.netAssetValue?.amountInMinorUnits ?? null,
    issued_shares_unscaled: record.facts.issuedShares?.unscaledValue ?? null,
    issued_shares_scale: record.facts.issuedShares?.scale ?? null,
    shareholder_count: record.facts.shareholderCount,
    total_revenue_minor: null,
    net_income_minor: null,
    total_assets_minor: null,
    total_equity_minor: null,
    operating_cash_flow_minor: null,
    provenance: provenanceToJson(record.provenance),
  }
}

export function mapRealEstateFundSnapshotRow(
  row: RealEstateFundSnapshotRow,
  assetId: string
): RealEstateFundFundamentalSnapshotInput {
  if (
    row.kind !== 'real-estate-fund' ||
    row.category !== 'real-estate-fund' ||
    row.market !== 'BR' ||
    row.currency !== 'BRL' ||
    row.source !== 'cvm-fii-inf-mensal' ||
    row.period !== 'monthly'
  ) {
    throw new Error(`Invalid persisted FII snapshot contract: ${row.ticker}`)
  }
  assertPositiveFilingVersion(row.filing_version)
  if (row.exercise_order !== null) {
    throw new Error('FII exercise order must be null')
  }
  assertStockColumnsNull(row)

  const netAssetValue = readNullableMoney(row.net_asset_value_minor)
  const issuedShares = readIssuedShares(
    row.issued_shares_unscaled,
    row.issued_shares_scale
  )
  const shareholderCount = readNullableShareholderCount(row.shareholder_count)
  const fund = getCvmRealEstateFund(row.ticker)
  const context: ProvenanceContext = {
    ticker: fund.ticker,
    officialName: fund.officialName,
    cnpj: fund.cnpj,
    isin: fund.isin,
    referenceDate: row.reference_date,
    filingVersion: row.filing_version,
    sourceArchive: row.source_archive,
    sourceDocumentId: row.source_document_id,
    netAssetValue,
    issuedShares,
    shareholderCount,
  }
  assertProvenanceCoherence(readProvenance(row.provenance), context)

  return {
    assetId,
    kind: 'real-estate-fund',
    referenceDate: row.reference_date,
    period: 'monthly',
    source: 'cvm-fii-inf-mensal',
    sourceDocumentId: row.source_document_id,
    facts: { netAssetValue, issuedShares, shareholderCount },
  }
}

export function createSupabaseRealEstateFundSnapshotStorage(
  privilegedClient: RealEstateFundSnapshotSupabaseClient
): RealEstateFundFundamentalSnapshotStorage {
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

export function createSupabaseRealEstateFundSnapshotRepository(
  client: RealEstateFundSnapshotSupabaseClient
): RealEstateFundFundamentalSnapshotRepository {
  return {
    async listRealEstateFundSnapshots(assets: readonly Asset[]) {
      const eligibleAssets = assets.filter(
        (asset) =>
          asset.category === 'real-estate-fund' &&
          asset.market === 'BR' &&
          asset.status === 'active'
      )
      const assetsByIdentity = new Map(
        eligibleAssets.map((asset) => [buildAssetIdentity(asset), asset])
      )

      if (assetsByIdentity.size !== eligibleAssets.length) {
        throw new Error('Duplicate real estate fund identity in asset list')
      }
      if (eligibleAssets.length === 0) {
        return []
      }

      const { data, error } = await client
        .from('fundamental_snapshots')
        .select('*')
        .eq('kind', 'real-estate-fund')
        .eq('category', 'real-estate-fund')
        .eq('market', 'BR')
        .in(
          'ticker',
          eligibleAssets.map((asset) => normalizeAssetTicker(asset.ticker))
        )
        .order('reference_date', { ascending: false })

      if (error) {
        throw createQueryError('load', error)
      }

      return (data ?? []).map((row) => {
        const asset = assetsByIdentity.get(
          buildAssetIdentity({
            ticker: row.ticker,
            category: row.category,
            market: row.market,
          })
        )
        if (!asset) {
          throw new Error(
            `Snapshot references an unknown real estate fund identity: ${row.ticker}/${row.category}/${row.market}`
          )
        }
        return mapRealEstateFundSnapshotRow(row, asset.id)
      })
    },
  }
}
