import {
  OFFICIAL_EVENT_ASSET_IDENTITIES_V1_VERSION,
  buildOfficialAssetEventV1,
  deduplicateOfficialAssetEventsV1,
  getOfficialEventAssetIdentitiesV1,
  type OfficialEventTemporalInputV1,
} from '../../../../../domain/context/official-events'
import type { BrazilianStockOfficialEventIdentityV1 } from '../../../../../domain/context/official-events/types'
import {
  buildOfficialCvmIpeArchiveUrl,
  downloadOfficialCvmIpeArchive,
  readOfficialCvmIpeCsvFromArchive,
} from './archive'
import { getCvmIpeEventType } from './categoryMapping'
import {
  CVM_IPE_DATASET_LICENSE,
  CVM_IPE_STOCK_EVENTS_PARSER_V1_VERSION,
  CVM_IPE_STOCK_EVENTS_PROVIDER_V1_VERSION,
  CVM_IPE_TERMS_AUDITED_AT,
} from './constants'
import {
  CVM_IPE_STOCK_COMPANY_NAME_ALIASES_V1_VERSION,
  matchCvmIpeCompanyNameAlias,
} from './companyNames'
import { parseOfficialCvmIpeCsv } from './csv'
import type {
  CvmIpeRowV1,
  CvmIpeStockEventRejectedRowV1,
  CvmIpeStockEventRejectionReasonV1,
  CvmIpeStockEventsExtractionResultV1,
  ExtractCvmIpeStockEventsInput,
  FetchCvmIpeStockEventsInput,
} from './types'

const APPROVED_DOCUMENT_HOST = 'www.rad.cvm.gov.br'
const SOURCE_DATETIME_WITHOUT_TIMEZONE =
  /^(\d{4}-\d{2}-\d{2})[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,9})?)?$/
const STRICT_UTC_TIMESTAMP =
  /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,9}))?Z$/

function isApprovedPresentationType(value: string): boolean {
  return (
    value === 'AP - Apresentação' || value === 'RE - Reapresentação Espontânea'
  )
}

function normalizeCvmCode(value: string): string | null {
  const normalized = value.trim()
  return /^\d{1,6}$/.test(normalized) ? normalized.padStart(6, '0') : null
}

function normalizeCnpj(value: string): string | null {
  const normalized = value.trim().replace(/[. /-]/g, '')
  return /^\d{14}$/.test(normalized) ? normalized : null
}

function normalizeProtocol(value: string): string | null | 'invalid' {
  const hasControlCharacter = [...value].some((character) => {
    const codePoint = character.codePointAt(0) ?? 0
    return codePoint <= 0x1f || (codePoint >= 0x7f && codePoint <= 0x9f)
  })
  const normalized = value.trim()
  if (hasControlCharacter) return 'invalid'
  if (normalized.length === 0) return null
  if ([...normalized].length > 1_000) {
    return 'invalid'
  }
  return normalized
}

function getStockIdentitiesByCvmCode(): Map<
  string,
  BrazilianStockOfficialEventIdentityV1
> {
  const entries = getOfficialEventAssetIdentitiesV1()
    .filter(
      (identity): identity is BrazilianStockOfficialEventIdentityV1 =>
        identity.category === 'brazilian-stock'
    )
    .map((identity) => [identity.cvmCode, identity] as const)
  return new Map(entries)
}

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
}

function isCivilDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return false
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const maximumDay =
    month === 2
      ? isLeapYear(year)
        ? 29
        : 28
      : [4, 6, 9, 11].includes(month)
        ? 30
        : 31
  return year >= 1 && month >= 1 && month <= 12 && day >= 1 && day <= maximumDay
}

function extractPublishedDate(raw: string): string | null {
  const trimmed = raw.trim()
  if (isCivilDate(trimmed)) return trimmed
  const match = SOURCE_DATETIME_WITHOUT_TIMEZONE.exec(trimmed)
  if (!match || !isCivilDate(match[1])) return null
  const hour = Number(match[2])
  const minute = Number(match[3])
  const second = match[4] === undefined ? 0 : Number(match[4])
  return hour <= 23 && minute <= 59 && second <= 59 ? match[1] : null
}

function parseReferenceDate(
  raw: string
): OfficialEventTemporalInputV1 | null | 'invalid' {
  const trimmed = raw.trim()
  if (trimmed.length === 0) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return { precision: 'unknown', raw }
  }
  if (!isCivilDate(trimmed)) return 'invalid'
  return { precision: 'date', value: trimmed }
}

function timestampOrderValue(value: string, field: string): string {
  const match = STRICT_UTC_TIMESTAMP.exec(value)
  if (!match || !isCivilDate(match[1])) {
    throw new Error(`${field} must be a valid UTC timestamp`)
  }
  const hour = Number(match[2])
  const minute = Number(match[3])
  const second = Number(match[4])
  if (hour > 23 || minute > 59 || second > 59) {
    throw new Error(`${field} must be a valid UTC timestamp`)
  }
  return `${match[1].replace(/-/g, '')}${match[2]}${match[3]}${match[4]}${(
    match[5] ?? ''
  ).padEnd(9, '0')}`
}

function assertExecutionTimestamps(
  ingestedAt: string,
  updatedAt: string
): void {
  const ingestedOrder = timestampOrderValue(ingestedAt, 'ingestedAt')
  const updatedOrder = timestampOrderValue(updatedAt, 'updatedAt')
  if (updatedOrder < ingestedOrder) {
    throw new Error('updatedAt must not be earlier than ingestedAt')
  }
}

function normalizeTitlePart(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

function buildTitle(row: CvmIpeRowV1): string | null {
  const category = normalizeTitlePart(row.category)
  const detail = [row.subject, row.species, row.documentType]
    .map(normalizeTitlePart)
    .find((value) => value.length > 0)
  const title = detail ? `${category} — ${detail}` : category
  const hasEvidentHtml = /<(?:!--|!doctype\b|\/?[a-z][^<>]*>?)/i.test(title)
  return title.length > 0 && [...title].length <= 500 && !hasEvidentHtml
    ? title
    : null
}

function validateDocumentUrl(raw: string): {
  value: string | null
  reason: CvmIpeStockEventRejectionReasonV1 | null
} {
  const trimmed = raw.trim()
  if (trimmed.length === 0) return { value: null, reason: null }
  if (trimmed.includes('\\') || /^https:\/\/[^/?#]*%/i.test(trimmed)) {
    return { value: null, reason: 'invalid-document-url' }
  }
  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    return { value: null, reason: 'invalid-document-url' }
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.port) {
    return { value: null, reason: 'invalid-document-url' }
  }
  if (url.hostname !== APPROVED_DOCUMENT_HOST) {
    return { value: null, reason: 'unapproved-document-host' }
  }
  return { value: trimmed, reason: null }
}

function encodeHashComponent(value: string): string {
  return `${new TextEncoder().encode(value).length}:${value}`
}

function buildRowPayloadHash(row: CvmIpeRowV1): string {
  const payload = [
    row.companyCnpj,
    row.companyName,
    row.cvmCode,
    row.referenceDate,
    row.category,
    row.documentType,
    row.species,
    row.subject,
    row.deliveryDate,
    row.presentationType,
    row.protocolNumber,
    row.version,
    row.downloadLink,
  ]
    .map(encodeHashComponent)
    .join('|')
  // FNV-1a is a deterministic change detector, not a cryptographic hash.
  let hash = 0xcbf29ce484222325n
  for (const byte of new TextEncoder().encode(payload)) {
    hash ^= BigInt(byte)
    hash = BigInt.asUintN(64, hash * 0x100000001b3n)
  }
  return `fnv1a64:${hash.toString(16).padStart(16, '0')}`
}

function rejection(
  row: CvmIpeRowV1,
  ticker: string | null,
  reason: CvmIpeStockEventRejectionReasonV1,
  message: string
): CvmIpeStockEventRejectedRowV1 {
  const protocol = normalizeProtocol(row.protocolNumber)
  return {
    rowNumber: row.rowNumber,
    cvmCode: row.cvmCode,
    ticker,
    protocolNumber: protocol === 'invalid' ? null : protocol,
    category: row.category.trim() || null,
    reason,
    message,
  }
}

function identityMismatch(
  identity: BrazilianStockOfficialEventIdentityV1,
  detail: string
): never {
  throw new Error(`CVM IPE identity mismatch for ${identity.ticker}: ${detail}`)
}

export function extractCvmIpeStockEvents(
  input: ExtractCvmIpeStockEventsInput
): CvmIpeStockEventsExtractionResultV1 {
  assertExecutionTimestamps(input.ingestedAt, input.updatedAt)
  const archiveUrl = buildOfficialCvmIpeArchiveUrl(input.year)
  if (input.archiveFileName !== `ipe_cia_aberta_${input.year}.zip`) {
    throw new Error(
      'CVM IPE archive filename does not match the requested year'
    )
  }
  if (input.csvFileName !== `ipe_cia_aberta_${input.year}.csv`) {
    throw new Error('CVM IPE CSV filename does not match the requested year')
  }
  const rows = parseOfficialCvmIpeCsv(input.csvContent)
  const identitiesByCvmCode = getStockIdentitiesByCvmCode()
  const acceptedEvents = []
  const rejectedRows: CvmIpeStockEventRejectedRowV1[] = []
  let ignoredNonUniverseRows = 0
  let targetRows = 0

  for (const row of rows) {
    const normalizedCvmCode = normalizeCvmCode(row.cvmCode)
    const identity = normalizedCvmCode
      ? identitiesByCvmCode.get(normalizedCvmCode)
      : undefined
    if (!identity) {
      ignoredNonUniverseRows += 1
      continue
    }
    targetRows += 1
    const observedCnpj = normalizeCnpj(row.companyCnpj)
    if (observedCnpj === null || observedCnpj !== identity.cnpj) {
      identityMismatch(identity, 'CNPJ')
    }
    const matchedCompanyNameAlias = matchCvmIpeCompanyNameAlias(
      identity.ticker,
      row.companyName,
      identity.officialName
    )
    if (matchedCompanyNameAlias === null) {
      identityMismatch(identity, 'company name')
    }
    const protocolNumber = normalizeProtocol(row.protocolNumber)
    if (protocolNumber === 'invalid') {
      rejectedRows.push(
        rejection(
          row,
          identity.ticker,
          'invalid-document-identifiers',
          'CVM IPE protocol contains invalid characters or exceeds the limit'
        )
      )
      continue
    }
    const eventType = getCvmIpeEventType(row.category)
    if (!eventType) {
      rejectedRows.push(
        rejection(
          row,
          identity.ticker,
          'unsupported-category',
          'CVM IPE category is not supported by the closed V1 mapping'
        )
      )
      continue
    }
    if (!isApprovedPresentationType(row.presentationType)) {
      rejectedRows.push(
        rejection(
          row,
          identity.ticker,
          'unsupported-document-status',
          'CVM IPE presentation status is not supported in V1'
        )
      )
      continue
    }
    if (row.deliveryDate.trim().length === 0) {
      rejectedRows.push(
        rejection(
          row,
          identity.ticker,
          'missing-published-date',
          'CVM IPE delivery date is required'
        )
      )
      continue
    }
    const publishedDate = extractPublishedDate(row.deliveryDate)
    if (!publishedDate) {
      rejectedRows.push(
        rejection(
          row,
          identity.ticker,
          'invalid-published-date',
          'CVM IPE delivery date is invalid'
        )
      )
      continue
    }
    const occurredAt = parseReferenceDate(row.referenceDate)
    if (occurredAt === 'invalid') {
      rejectedRows.push(
        rejection(
          row,
          identity.ticker,
          'invalid-reference-date',
          'CVM IPE reference date is invalid'
        )
      )
      continue
    }
    const documentUrl = validateDocumentUrl(row.downloadLink)
    if (documentUrl.reason) {
      rejectedRows.push(
        rejection(
          row,
          identity.ticker,
          documentUrl.reason,
          'CVM IPE document URL is not approved'
        )
      )
      continue
    }
    const title = buildTitle(row)
    if (!title) {
      rejectedRows.push(
        rejection(
          row,
          identity.ticker,
          'invalid-title',
          'CVM IPE event title is invalid'
        )
      )
      continue
    }
    const sourceDocumentId = protocolNumber ? `cvm-ipe:${protocolNumber}` : null

    try {
      acceptedEvents.push(
        buildOfficialAssetEventV1({
          ticker: identity.ticker,
          eventType,
          associationEvidence: [
            {
              reason: 'exact-regulatory-identity',
              observedRegulatoryIdentityKey: identity.regulatoryIdentityKey,
            },
            {
              reason: 'exact-ticker-provider-mapping',
              observedTicker: identity.ticker,
              mappingVersion: OFFICIAL_EVENT_ASSET_IDENTITIES_V1_VERSION,
            },
            { reason: 'exact-cnpj', observedCnpj },
          ],
          occurredAt,
          publishedAt: { precision: 'date', value: publishedDate },
          source: 'cvm-ipe',
          documentIdentifiers: {
            sourceDocumentId,
            regulatoryDocumentId: null,
            accessionNumber: null,
            protocolNumber,
            canonicalUrl: documentUrl.value,
            fingerprint: null,
          },
          originalUrl: documentUrl.value,
          title,
          summary: null,
          status: 'original',
          supersedesEventId: null,
          relatedDocuments: [],
          ingestedAt: input.ingestedAt,
          updatedAt: input.updatedAt,
          provenance: {
            sourceSystem: 'cvm-ipe',
            sourceType: 'regulator',
            rawDocumentType: row.documentType.trim() || row.category,
            rawDocumentCategory: row.category,
            parserVersion: CVM_IPE_STOCK_EVENTS_PARSER_V1_VERSION,
            mappingVersion: OFFICIAL_EVENT_ASSET_IDENTITIES_V1_VERSION,
            termsAuditedAt: CVM_IPE_TERMS_AUDITED_AT,
            attribution: `CVM Dados Abertos — ${CVM_IPE_DATASET_LICENSE}`,
            sourcePayloadHash: buildRowPayloadHash(row),
            rawFields: {
              observedCompanyName: row.companyName,
              observedCompanyCnpj: row.companyCnpj,
              observedCvmCode: row.cvmCode,
              matchedCompanyNameAlias,
              companyNameAliasMappingVersion:
                CVM_IPE_STOCK_COMPANY_NAME_ALIASES_V1_VERSION,
              dataReferenciaRaw: row.referenceDate,
              dataEntregaRaw: row.deliveryDate,
              categoriaRaw: row.category,
              tipoRaw: row.documentType,
              especieRaw: row.species,
              assuntoRaw: row.subject,
              tipoApresentacaoRaw: row.presentationType,
              protocoloEntregaRaw: row.protocolNumber,
              versaoRaw: row.version,
              linkDownloadRaw: row.downloadLink,
            },
          },
        })
      )
    } catch (error) {
      rejectedRows.push(
        rejection(
          row,
          identity.ticker,
          'invalid-event',
          error instanceof Error ? error.message : 'Invalid CVM IPE event'
        )
      )
    }
  }

  const deduplicated = deduplicateOfficialAssetEventsV1(acceptedEvents)
  const exactDuplicateRows = deduplicated.duplicates.length
  const conflictingPayloadRows = deduplicated.conflicts.reduce(
    (total, conflict) => total + conflict.inputIndexes.length - 1,
    0
  )
  if (
    rows.length !== ignoredNonUniverseRows + targetRows ||
    targetRows !== acceptedEvents.length + rejectedRows.length ||
    acceptedEvents.length !==
      deduplicated.uniqueEvents.length +
        exactDuplicateRows +
        conflictingPayloadRows
  ) {
    throw new Error('CVM IPE extraction counters are inconsistent')
  }
  return {
    providerVersion: CVM_IPE_STOCK_EVENTS_PROVIDER_V1_VERSION,
    source: 'cvm-ipe',
    year: input.year,
    archiveUrl,
    archiveFileName: input.archiveFileName,
    csvFileName: input.csvFileName,
    totalRows: rows.length,
    ignoredNonUniverseRows,
    targetRows,
    acceptedRows: acceptedEvents.length,
    exactDuplicateRows,
    conflictingPayloadRows,
    events: deduplicated.uniqueEvents,
    duplicates: deduplicated.duplicates,
    conflicts: deduplicated.conflicts,
    rejectedRows: rejectedRows.map((rejectedRow) => ({ ...rejectedRow })),
  }
}

export async function fetchCvmIpeStockEvents(
  input: FetchCvmIpeStockEventsInput
): Promise<CvmIpeStockEventsExtractionResultV1> {
  buildOfficialCvmIpeArchiveUrl(input.year)
  assertExecutionTimestamps(input.ingestedAt, input.updatedAt)
  const archive = await downloadOfficialCvmIpeArchive(input)
  const csv = readOfficialCvmIpeCsvFromArchive({
    year: input.year,
    archiveBytes: archive.archiveBytes,
  })
  return extractCvmIpeStockEvents({
    year: input.year,
    archiveFileName: archive.archiveFileName,
    csvFileName: csv.csvFileName,
    csvContent: csv.content,
    ingestedAt: input.ingestedAt,
    updatedAt: input.updatedAt,
  })
}
