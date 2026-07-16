import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  InternationalEtfFundamentalSnapshotInput,
  SignedMonetaryFact,
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
  InternationalEtfFundamentalSnapshotRepository,
  InternationalEtfFundamentalSnapshotStorage,
} from './contracts'
import {
  getSecInternationalEtf,
  isSecInternationalEtfTicker,
  parseNullableSecUsdMoney,
  SEC_NPORT_XML_NAMESPACE,
  SEC_NPORT_XML_PATHS,
} from './sec/nport'
import type {
  SecInternationalEtfFundamentalRecord,
  SecNportFactProvenance,
  SecNportFormType,
  SecNportXmlPathName,
} from './sec/nport/types'

export type InternationalEtfSnapshotJson = Json
export type InternationalEtfSnapshotRow = Tables<'fundamental_snapshots'>
export type InternationalEtfSnapshotInsert =
  TablesInsert<'fundamental_snapshots'>
export type InternationalEtfSnapshotUpdate =
  TablesUpdate<'fundamental_snapshots'>
export type InternationalEtfSnapshotSupabaseClient = SupabaseClient<Database>

const DATASET = 'SEC EDGAR Form N-PORT' as const
const FACTUAL_SCOPE = 'series' as const

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

const INCOMPATIBLE_COLUMNS = [
  'total_revenue_minor',
  'net_income_minor',
  'total_equity_minor',
  'operating_cash_flow_minor',
  'net_asset_value_minor',
  'issued_shares_unscaled',
  'issued_shares_scale',
  'shareholder_count',
] as const

const XML_PATH_NAMES = [
  'form',
  'headerCik',
  'headerSeriesId',
  'headerClassId',
  'registrantName',
  'registrantCik',
  'seriesName',
  'seriesId',
  'reportDate',
  'totalAssets',
  'totalLiabilities',
  'netAssets',
] as const satisfies readonly SecNportXmlPathName[]

type QueryError = { message: string }

type InternationalEtfAssetIdentity = {
  ticker: string
  category: string
  market: string
}

type SecFacts = SecInternationalEtfFundamentalRecord['facts']
type SecProvenance = SecInternationalEtfFundamentalRecord['provenance']

type ProvenanceContext = {
  ticker: string
  referenceDate: string
  sourceArchive: string
  sourceDocumentId: string
  facts: SecFacts
}

function createQueryError(operation: string, error: QueryError): Error {
  return new Error(
    `Failed to ${operation} international ETF fundamental snapshots: ${error.message}`
  )
}

function buildAssetIdentity(asset: InternationalEtfAssetIdentity): string {
  return JSON.stringify([
    normalizeAssetTicker(asset.ticker),
    asset.category,
    asset.market,
  ])
}

function isJsonRecord(
  value: Json | undefined
): value is { [key: string]: Json | undefined } {
  return Boolean(value) && !Array.isArray(value) && typeof value === 'object'
}

function isValidCivilDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return false
  const [, year, month, day] = match
  const date = new Date(`${value}T00:00:00.000Z`)
  return (
    date.getUTCFullYear() === Number(year) &&
    date.getUTCMonth() + 1 === Number(month) &&
    date.getUTCDate() === Number(day)
  )
}

function isValidUtcTimestamp(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) {
    return false
  }
  const parsed = new Date(value)
  const canonical = value.includes('.') ? value : value.replace('Z', '.000Z')
  return Number.isFinite(parsed.getTime()) && parsed.toISOString() === canonical
}

function isValidAccession(value: string): boolean {
  return /^\d{10}-\d{2}-\d{6}$/.test(value)
}

function isSafePrimaryDocument(value: string): boolean {
  return (
    /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value) &&
    value !== '.' &&
    value !== '..'
  )
}

function readRequiredString(
  value: Json | undefined,
  fieldName: string
): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Invalid SEC ${fieldName} provenance`)
  }
  return value
}

function readNullableString(
  value: Json | undefined,
  fieldName: string
): string | null {
  if (value === null) return null
  if (typeof value !== 'string') {
    throw new Error(`Invalid SEC ${fieldName} provenance`)
  }
  return value
}

function readNullableSafeInteger(
  value: Json | undefined,
  fieldName: string
): number | null {
  if (value === null) return null
  if (typeof value !== 'number' || !Number.isSafeInteger(value)) {
    throw new Error(`Invalid SEC ${fieldName} provenance`)
  }
  return value
}

function readForm(value: Json | undefined): SecNportFormType {
  if (value !== 'NPORT-P' && value !== 'NPORT-P/A') {
    throw new Error('Invalid SEC form provenance')
  }
  return value
}

function readClassIds(value: Json | undefined): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error('Invalid SEC class IDs provenance')
  }
  const classIds = value.map((classId) => {
    if (typeof classId !== 'string' || !/^C\d{9}$/.test(classId)) {
      throw new Error('Invalid SEC class IDs provenance')
    }
    return classId
  })
  if (new Set(classIds).size !== classIds.length) {
    throw new Error('Invalid SEC duplicate class IDs provenance')
  }
  return classIds
}

function readXmlPaths(
  value: Json | undefined
): Readonly<Record<SecNportXmlPathName, string>> {
  if (
    !isJsonRecord(value) ||
    Object.keys(value).length !== XML_PATH_NAMES.length
  ) {
    throw new Error('Invalid SEC XML paths provenance')
  }
  const paths = { ...SEC_NPORT_XML_PATHS }
  for (const name of XML_PATH_NAMES) {
    if (value[name] !== SEC_NPORT_XML_PATHS[name]) {
      throw new Error(`Invalid SEC XML path provenance: ${name}`)
    }
  }
  return paths
}

function factProvenanceToJson(value: SecNportFactProvenance): Json {
  return {
    path: value.path,
    rawValue: value.rawValue,
    normalizedAmountInMinorUnits: value.normalizedAmountInMinorUnits,
    currency: value.currency,
  }
}

function provenanceToJson(value: SecProvenance): Json {
  return {
    dataset: value.dataset,
    factualScope: value.factualScope,
    factualIdentity: {
      registrantCik: value.factualIdentity.registrantCik,
      registrantName: value.factualIdentity.registrantName,
      seriesId: value.factualIdentity.seriesId,
      seriesName: value.factualIdentity.seriesName,
      classIds: [...value.factualIdentity.classIds],
    },
    productMapping: {
      ticker: value.productMapping.ticker,
      expectedClassId: value.productMapping.expectedClassId,
      expectedClassName: value.productMapping.expectedClassName,
      category: value.productMapping.category,
      market: value.productMapping.market,
      currency: value.productMapping.currency,
    },
    expectedClassPresent: value.expectedClassPresent,
    form: value.form,
    accessionNumber: value.accessionNumber,
    filingDate: value.filingDate,
    acceptedAt: value.acceptedAt,
    reportDate: value.reportDate,
    primaryDocument: value.primaryDocument,
    documentUrl: value.documentUrl,
    namespace: value.namespace,
    isAmendment: value.isAmendment,
    currency: value.currency,
    xmlPaths: { ...value.xmlPaths },
    facts: {
      totalAssets: factProvenanceToJson(value.facts.totalAssets),
      totalLiabilities: factProvenanceToJson(value.facts.totalLiabilities),
      netAssets: factProvenanceToJson(value.facts.netAssets),
    },
  }
}

function readFactProvenance(
  value: Json | undefined,
  fieldName: string
): SecNportFactProvenance {
  if (!isJsonRecord(value) || value.currency !== 'USD') {
    throw new Error(`Invalid SEC ${fieldName} fact provenance`)
  }
  return {
    path: readRequiredString(value.path, `${fieldName} path`),
    rawValue: readNullableString(value.rawValue, `${fieldName} raw value`),
    normalizedAmountInMinorUnits: readNullableSafeInteger(
      value.normalizedAmountInMinorUnits,
      `${fieldName} normalized amount`
    ),
    currency: 'USD',
  }
}

function readProvenance(value: Json): SecProvenance {
  if (
    !isJsonRecord(value) ||
    value.dataset !== DATASET ||
    value.factualScope !== FACTUAL_SCOPE ||
    !isJsonRecord(value.factualIdentity) ||
    !isJsonRecord(value.productMapping) ||
    value.expectedClassPresent !== true ||
    typeof value.isAmendment !== 'boolean' ||
    value.currency !== 'USD' ||
    value.productMapping.category !== 'international-etf' ||
    value.productMapping.market !== 'US' ||
    value.productMapping.currency !== 'USD' ||
    !isJsonRecord(value.facts)
  ) {
    throw new Error('Invalid international ETF snapshot provenance')
  }

  const ticker = readRequiredString(
    value.productMapping.ticker,
    'product ticker'
  )
  if (!isSecInternationalEtfTicker(ticker)) {
    throw new Error('Invalid SEC product ticker provenance')
  }

  return {
    dataset: DATASET,
    factualScope: FACTUAL_SCOPE,
    factualIdentity: {
      registrantCik: readRequiredString(
        value.factualIdentity.registrantCik,
        'registrant CIK'
      ),
      registrantName: readRequiredString(
        value.factualIdentity.registrantName,
        'registrant name'
      ),
      seriesId: readRequiredString(value.factualIdentity.seriesId, 'series ID'),
      seriesName: readRequiredString(
        value.factualIdentity.seriesName,
        'series name'
      ),
      classIds: readClassIds(value.factualIdentity.classIds),
    },
    productMapping: {
      ticker,
      expectedClassId: readRequiredString(
        value.productMapping.expectedClassId,
        'expected class ID'
      ),
      expectedClassName: readRequiredString(
        value.productMapping.expectedClassName,
        'expected class name'
      ),
      category: 'international-etf',
      market: 'US',
      currency: 'USD',
    },
    expectedClassPresent: true,
    form: readForm(value.form),
    accessionNumber: readRequiredString(value.accessionNumber, 'accession'),
    filingDate: readRequiredString(value.filingDate, 'filing date'),
    acceptedAt: readRequiredString(value.acceptedAt, 'accepted timestamp'),
    reportDate: readRequiredString(value.reportDate, 'report date'),
    primaryDocument: readRequiredString(
      value.primaryDocument,
      'primary document'
    ),
    documentUrl: readRequiredString(value.documentUrl, 'document URL'),
    namespace: readRequiredString(value.namespace, 'namespace'),
    isAmendment: value.isAmendment,
    currency: 'USD',
    xmlPaths: readXmlPaths(value.xmlPaths),
    facts: {
      totalAssets: readFactProvenance(value.facts.totalAssets, 'total assets'),
      totalLiabilities: readFactProvenance(
        value.facts.totalLiabilities,
        'total liabilities'
      ),
      netAssets: readFactProvenance(value.facts.netAssets, 'net assets'),
    },
  }
}

function assertUsdSafeFact(
  value: SignedMonetaryFact | null,
  fieldName: string
): void {
  if (value === null) return
  if (value.currency !== 'USD') {
    throw new Error(`${fieldName} must use USD currency`)
  }
  if (!Number.isSafeInteger(value.amountInMinorUnits)) {
    throw new RangeError(`${fieldName} must use signed safe minor units`)
  }
}

function readNullableUsdFact(
  value: number | null,
  fieldName: string
): SignedMonetaryFact | null {
  if (value === null) return null
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`${fieldName} must use signed safe minor units`)
  }
  return { amountInMinorUnits: value, currency: 'USD' }
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

function expectedSourceDocumentId(
  context: ProvenanceContext,
  registrantCik: string,
  seriesId: string,
  classId: string
): string {
  return [
    'sec-nport',
    registrantCik,
    seriesId,
    classId,
    context.referenceDate,
    context.sourceArchive,
  ].join(':')
}

function assertOfficialDocumentUrl(
  value: string,
  registrantCik: string,
  accessionNumber: string,
  primaryDocument: string
): void {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new Error('Invalid SEC official document URL')
  }
  const cik = registrantCik.replace(/^0+/, '') || '0'
  const accession = accessionNumber.replaceAll('-', '')
  const expectedPath = `/Archives/edgar/data/${cik}/${accession}/${primaryDocument}`
  if (
    url.protocol !== 'https:' ||
    url.hostname !== 'www.sec.gov' ||
    url.port !== '' ||
    url.username !== '' ||
    url.password !== '' ||
    url.search !== '' ||
    url.hash !== '' ||
    url.pathname !== expectedPath
  ) {
    throw new Error('Invalid SEC official document URL')
  }
}

function assertFactProvenance(
  provenance: SecNportFactProvenance,
  fact: SignedMonetaryFact | null,
  expectedPath: string,
  fieldName: string
): void {
  if (provenance.path !== expectedPath || provenance.currency !== 'USD') {
    throw new Error(`SEC ${fieldName} provenance uses an invalid official path`)
  }
  const parsed = parseNullableSecUsdMoney(provenance.rawValue, fieldName)
  if (
    !sameMoney(parsed, fact) ||
    provenance.normalizedAmountInMinorUnits !==
      (fact?.amountInMinorUnits ?? null)
  ) {
    throw new Error(`SEC ${fieldName} provenance does not match persisted fact`)
  }
}

function assertProvenanceCoherence(
  provenance: SecProvenance,
  context: ProvenanceContext
): void {
  const ticker = normalizeAssetTicker(context.ticker)
  const fund = getSecInternationalEtf(ticker)
  const identity = provenance.factualIdentity
  const mapping = provenance.productMapping

  if (
    identity.registrantCik !== fund.registrantCik ||
    identity.registrantName !== fund.registrantName ||
    identity.seriesId !== fund.seriesId ||
    identity.seriesName !== fund.seriesName
  ) {
    throw new Error(`Invalid official SEC identity: ${ticker}`)
  }
  if (
    mapping.ticker !== fund.ticker ||
    mapping.expectedClassId !== fund.classId ||
    mapping.expectedClassName !== fund.className ||
    mapping.category !== fund.category ||
    mapping.market !== fund.market ||
    mapping.currency !== fund.currency
  ) {
    throw new Error(`Invalid SEC product mapping: ${ticker}`)
  }
  if (
    identity.classIds.filter((classId) => classId === fund.classId).length !== 1
  ) {
    throw new Error(`Expected SEC class must occur exactly once: ${ticker}`)
  }
  if (
    !isValidAccession(provenance.accessionNumber) ||
    provenance.accessionNumber !== context.sourceArchive
  ) {
    throw new Error('SEC accession does not match persisted filing identity')
  }
  if (
    !isValidCivilDate(provenance.filingDate) ||
    !isValidUtcTimestamp(provenance.acceptedAt) ||
    !isValidCivilDate(provenance.reportDate) ||
    provenance.reportDate !== context.referenceDate ||
    !isSafePrimaryDocument(provenance.primaryDocument) ||
    provenance.namespace !== SEC_NPORT_XML_NAMESPACE ||
    provenance.isAmendment !== (provenance.form === 'NPORT-P/A')
  ) {
    throw new Error('SEC provenance does not match filing identity')
  }
  assertOfficialDocumentUrl(
    provenance.documentUrl,
    fund.registrantCik,
    provenance.accessionNumber,
    provenance.primaryDocument
  )
  if (
    context.sourceDocumentId !==
    expectedSourceDocumentId(
      context,
      fund.registrantCik,
      fund.seriesId,
      fund.classId
    )
  ) {
    throw new Error('SEC sourceDocumentId does not match filing identity')
  }

  assertFactProvenance(
    provenance.facts.totalAssets,
    context.facts.totalAssets,
    SEC_NPORT_XML_PATHS.totalAssets,
    'total assets'
  )
  assertFactProvenance(
    provenance.facts.totalLiabilities,
    context.facts.totalLiabilities,
    SEC_NPORT_XML_PATHS.totalLiabilities,
    'total liabilities'
  )
  assertFactProvenance(
    provenance.facts.netAssets,
    context.facts.netAssets,
    SEC_NPORT_XML_PATHS.netAssets,
    'net assets'
  )
}

function assertRecordContract(
  record: SecInternationalEtfFundamentalRecord
): ProvenanceContext {
  const ticker = normalizeAssetTicker(record.ticker)
  if (
    !isSecInternationalEtfTicker(ticker) ||
    record.ticker !== ticker ||
    record.kind !== 'international-etf' ||
    record.category !== 'international-etf' ||
    record.market !== 'US' ||
    record.source !== 'sec-nport' ||
    record.period !== 'monthly' ||
    record.filingVersion !== null ||
    record.exerciseOrder !== null ||
    !isValidCivilDate(record.referenceDate) ||
    !isValidAccession(record.sourceArchive)
  ) {
    throw new Error(`Invalid international ETF snapshot contract: ${ticker}`)
  }
  const fund = getSecInternationalEtf(ticker)
  if (
    record.fundIdentity.registrantCik !== fund.registrantCik ||
    record.fundIdentity.registrantName !== fund.registrantName ||
    record.fundIdentity.seriesId !== fund.seriesId ||
    record.fundIdentity.seriesName !== fund.seriesName ||
    record.fundIdentity.classId !== fund.classId ||
    record.fundIdentity.className !== fund.className
  ) {
    throw new Error(`Invalid official SEC identity: ${ticker}`)
  }
  assertUsdSafeFact(record.facts.totalAssets, 'SEC total assets')
  assertUsdSafeFact(record.facts.totalLiabilities, 'SEC total liabilities')
  assertUsdSafeFact(record.facts.netAssets, 'SEC net assets')
  const context = {
    ticker,
    referenceDate: record.referenceDate,
    sourceArchive: record.sourceArchive,
    sourceDocumentId: record.sourceDocumentId,
    facts: record.facts,
  }
  assertProvenanceCoherence(
    readProvenance(provenanceToJson(record.provenance)),
    context
  )
  return context
}

function toInsertRow(
  record: SecInternationalEtfFundamentalRecord
): InternationalEtfSnapshotInsert {
  assertRecordContract(record)
  return {
    ticker: normalizeAssetTicker(record.ticker),
    category: 'international-etf',
    market: 'US',
    kind: 'international-etf',
    period: 'monthly',
    source: 'sec-nport',
    reference_date: record.referenceDate,
    source_document_id: record.sourceDocumentId,
    source_archive: record.sourceArchive,
    filing_version: null,
    exercise_order: null,
    currency: 'USD',
    total_assets_minor: record.facts.totalAssets?.amountInMinorUnits ?? null,
    total_liabilities_minor:
      record.facts.totalLiabilities?.amountInMinorUnits ?? null,
    net_assets_minor: record.facts.netAssets?.amountInMinorUnits ?? null,
    total_revenue_minor: null,
    net_income_minor: null,
    total_equity_minor: null,
    operating_cash_flow_minor: null,
    net_asset_value_minor: null,
    issued_shares_unscaled: null,
    issued_shares_scale: null,
    shareholder_count: null,
    provenance: provenanceToJson(record.provenance),
  }
}

function assertIncompatibleColumnsNull(row: InternationalEtfSnapshotRow): void {
  if (INCOMPATIBLE_COLUMNS.some((column) => row[column] !== null)) {
    throw new Error(
      'Stock and real estate fund columns must remain null for international ETF snapshots'
    )
  }
}

export function mapInternationalEtfSnapshotRow(
  row: InternationalEtfSnapshotRow,
  assetId: string
): InternationalEtfFundamentalSnapshotInput {
  if (
    row.ticker !== normalizeAssetTicker(row.ticker) ||
    row.kind !== 'international-etf' ||
    row.category !== 'international-etf' ||
    row.market !== 'US' ||
    row.currency !== 'USD' ||
    row.source !== 'sec-nport' ||
    row.period !== 'monthly'
  ) {
    throw new Error(
      `Invalid persisted international ETF snapshot contract: ${row.ticker}`
    )
  }
  if (row.filing_version !== null || row.exercise_order !== null) {
    throw new Error('SEC filing version and exercise order must remain null')
  }
  if (!isValidCivilDate(row.reference_date)) {
    throw new Error('Invalid SEC reference date')
  }
  assertIncompatibleColumnsNull(row)

  const facts: SecFacts = {
    totalAssets: readNullableUsdFact(
      row.total_assets_minor,
      'SEC total assets'
    ),
    totalLiabilities: readNullableUsdFact(
      row.total_liabilities_minor,
      'SEC total liabilities'
    ),
    netAssets: readNullableUsdFact(row.net_assets_minor, 'SEC net assets'),
  }
  const context = {
    ticker: row.ticker,
    referenceDate: row.reference_date,
    sourceArchive: row.source_archive,
    sourceDocumentId: row.source_document_id,
    facts,
  }
  assertProvenanceCoherence(readProvenance(row.provenance), context)

  return {
    assetId,
    kind: 'international-etf',
    referenceDate: row.reference_date,
    period: 'monthly',
    source: 'sec-nport',
    sourceDocumentId: row.source_document_id,
    facts,
  }
}

export function createSupabaseInternationalEtfSnapshotStorage(
  privilegedClient: InternationalEtfSnapshotSupabaseClient
): InternationalEtfFundamentalSnapshotStorage {
  return {
    async upsertMany(records) {
      if (records.length === 0) return
      const { error } = await privilegedClient
        .from('fundamental_snapshots')
        .upsert(records.map(toInsertRow), {
          onConflict: UPSERT_CONFLICT_COLUMNS,
        })
      if (error) throw createQueryError('upsert', error)
    },
  }
}

export function createSupabaseInternationalEtfSnapshotRepository(
  client: InternationalEtfSnapshotSupabaseClient
): InternationalEtfFundamentalSnapshotRepository {
  return {
    async listInternationalEtfSnapshots(assets: readonly Asset[]) {
      const eligibleAssets = assets.filter(
        (asset) =>
          asset.category === 'international-etf' &&
          asset.market === 'US' &&
          asset.status === 'active'
      )
      for (const asset of eligibleAssets) {
        getSecInternationalEtf(asset.ticker)
      }
      const assetsByIdentity = new Map(
        eligibleAssets.map((asset) => [buildAssetIdentity(asset), asset])
      )
      if (assetsByIdentity.size !== eligibleAssets.length) {
        throw new Error('Duplicate international ETF identity in asset list')
      }
      if (eligibleAssets.length === 0) return []

      const { data, error } = await client
        .from('fundamental_snapshots')
        .select('*')
        .eq('kind', 'international-etf')
        .eq('category', 'international-etf')
        .eq('market', 'US')
        .in(
          'ticker',
          eligibleAssets.map((asset) => normalizeAssetTicker(asset.ticker))
        )
        .order('reference_date', { ascending: false })
      if (error) throw createQueryError('load', error)

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
            `Snapshot references an unknown international ETF identity: ${row.ticker}/${row.category}/${row.market}`
          )
        }
        return mapInternationalEtfSnapshotRow(row, asset.id)
      })
    },
  }
}
