import {
  OFFICIAL_EVENT_ASSET_IDENTITIES_V1_VERSION,
  buildOfficialAssetEventV1,
  deduplicateOfficialAssetEventsV1,
  getOfficialEventAssetIdentitiesV1,
} from '../../../../../domain/context/official-events'
import type {
  RealEstateFundOfficialEventIdentityV1,
  RealEstateFundOfficialEventTickerV1,
} from '../../../../../domain/context/official-events/types'
import {
  buildOfficialCvmFundDeliveryArchiveUrl,
  downloadOfficialCvmFundDeliveryArchive,
  readOfficialCvmFundDeliveryMonthlyCsvFromArchive,
} from './archive'
import {
  CVM_FUND_DELIVERY_DATASET_LICENSE,
  CVM_FUND_DELIVERY_FII_DOCUMENT_TYPES_V1_VERSION,
  CVM_FUND_DELIVERY_FII_EVENTS_PARSER_V1_VERSION,
  CVM_FUND_DELIVERY_FII_EVENTS_PROVIDER_V1_VERSION,
  CVM_FUND_DELIVERY_TERMS_AUDITED_AT,
} from './constants'
import { parseOfficialCvmFundDeliveryCsv } from './csv'
import { getCvmFundDeliveryEventType } from './documentTypeMapping'
import type {
  CvmFundDeliveryFiiEventRejectedRowV1,
  CvmFundDeliveryFiiEventRejectionReasonV1,
  CvmFundDeliveryFiiEventsExtractionResultV1,
  CvmFundDeliveryRowV1,
  ExtractCvmFundDeliveryFiiEventsInput,
  FetchCvmFundDeliveryFiiEventsInput,
} from './types'

const STRICT_DELIVERY_DATETIME =
  /^(\d{4}-\d{2}-\d{2}) (\d{2}):(\d{2}):(\d{2})\.(\d{3})$/
const STRICT_UTC_TIMESTAMP =
  /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,9}))?Z$/
const SUPPORTED_FII_TICKERS = Object.freeze([
  'KNRI11',
  'VISC11',
  'XPLG11',
  'HGRU11',
] as const satisfies readonly RealEstateFundOfficialEventTickerV1[])

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

function extractDeliveryDate(value: string): string | null {
  const match = STRICT_DELIVERY_DATETIME.exec(value)
  if (!match || !isCivilDate(match[1])) return null
  const hour = Number(match[2])
  const minute = Number(match[3])
  const second = Number(match[4])
  return hour <= 23 && minute <= 59 && second <= 59 ? match[1] : null
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

function getFundIdentitiesByCnpj(): Map<
  string,
  RealEstateFundOfficialEventIdentityV1
> {
  const entries = getOfficialEventAssetIdentitiesV1()
    .filter(
      (identity): identity is RealEstateFundOfficialEventIdentityV1 =>
        identity.category === 'real-estate-fund' &&
        SUPPORTED_FII_TICKERS.some((ticker) => ticker === identity.ticker)
    )
    .map((identity) => [identity.cnpj, identity] as const)
  return new Map(entries)
}

function normalizeDocumentId(value: string): string | null {
  if (!/^\d{1,10}$/.test(value)) return null
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? value : null
}

function hasControlCharacter(value: string): boolean {
  return [...value].some((character) => {
    const codePoint = character.codePointAt(0) ?? 0
    return codePoint <= 0x1f || (codePoint >= 0x7f && codePoint <= 0x9f)
  })
}

function normalizeSourceSystem(value: string): string | null {
  if (
    value.length === 0 ||
    value.trim() !== value ||
    [...value].length > 6 ||
    hasControlCharacter(value)
  ) {
    return null
  }
  return value
}

function encodeDocumentIdentityComponent(value: string): string {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`
  )
}

function encodeHashComponent(value: string): string {
  return `${new TextEncoder().encode(value).length}:${value}`
}

function buildRowPayloadHash(row: CvmFundDeliveryRowV1): string {
  const payload = [
    row.fundClassType,
    row.fundClassCnpj,
    row.subclassId,
    row.documentType,
    row.competenceStartDate,
    row.competenceEndDate,
    row.documentId,
    row.deliveryDateTime,
    row.presentationType,
    row.activeIndicator,
    row.sourceSystem,
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
  row: CvmFundDeliveryRowV1,
  ticker: string,
  reason: CvmFundDeliveryFiiEventRejectionReasonV1,
  message: string
): CvmFundDeliveryFiiEventRejectedRowV1 {
  return {
    rowNumber: row.rowNumber,
    cnpj: row.fundClassCnpj,
    ticker,
    documentId: normalizeDocumentId(row.documentId),
    documentType: row.documentType || null,
    reason,
    message,
  }
}

export function extractCvmFundDeliveryFiiEvents(
  input: ExtractCvmFundDeliveryFiiEventsInput
): CvmFundDeliveryFiiEventsExtractionResultV1 {
  assertExecutionTimestamps(input.ingestedAt, input.updatedAt)
  const archiveUrl = buildOfficialCvmFundDeliveryArchiveUrl(input.yearMonth)
  if (input.archiveFileName !== `fi_entrega_documento_${input.yearMonth}.zip`) {
    throw new Error(
      'CVM Fund Delivery archive filename does not match the requested month'
    )
  }
  if (input.csvFileName !== `fi_entrega_documento_${input.yearMonth}.csv`) {
    throw new Error(
      'CVM Fund Delivery CSV filename does not match the requested month'
    )
  }

  const rows = parseOfficialCvmFundDeliveryCsv(input.csvContent)
  const identitiesByCnpj = getFundIdentitiesByCnpj()
  const acceptedEvents = []
  const rejectedRows: CvmFundDeliveryFiiEventRejectedRowV1[] = []
  let ignoredNonUniverseRows = 0
  let targetRows = 0

  for (const row of rows) {
    const identity = identitiesByCnpj.get(row.fundClassCnpj)
    if (!identity) {
      ignoredNonUniverseRows += 1
      continue
    }
    targetRows += 1

    const eventType = getCvmFundDeliveryEventType(row.documentType)
    if (!eventType) {
      rejectedRows.push(
        rejection(
          row,
          identity.ticker,
          'unsupported-document-type',
          'CVM Fund Delivery document type is not supported by the closed V1 mapping'
        )
      )
      continue
    }
    if (row.deliveryDateTime.length === 0) {
      rejectedRows.push(
        rejection(
          row,
          identity.ticker,
          'missing-delivery-date',
          'CVM Fund Delivery delivery date is required'
        )
      )
      continue
    }
    const publishedDate = extractDeliveryDate(row.deliveryDateTime)
    if (!publishedDate) {
      rejectedRows.push(
        rejection(
          row,
          identity.ticker,
          'invalid-delivery-date',
          'CVM Fund Delivery delivery date must use YYYY-MM-DD HH:mm:ss.SSS'
        )
      )
      continue
    }
    if (
      !isCivilDate(row.competenceStartDate) ||
      !isCivilDate(row.competenceEndDate) ||
      row.competenceStartDate > row.competenceEndDate
    ) {
      rejectedRows.push(
        rejection(
          row,
          identity.ticker,
          'invalid-competence-period',
          'CVM Fund Delivery competence period is invalid'
        )
      )
      continue
    }
    const documentId = normalizeDocumentId(row.documentId)
    const sourceSystem = normalizeSourceSystem(row.sourceSystem)
    if (!documentId || !sourceSystem) {
      rejectedRows.push(
        rejection(
          row,
          identity.ticker,
          'invalid-document-identifiers',
          'CVM Fund Delivery document identity is invalid'
        )
      )
      continue
    }
    const sourceDocumentId = `cvm-fund-delivery:${encodeDocumentIdentityComponent(sourceSystem)}:${documentId}`

    try {
      acceptedEvents.push(
        buildOfficialAssetEventV1({
          ticker: identity.ticker,
          eventType,
          associationEvidence: [
            {
              reason: 'exact-ticker-provider-mapping',
              observedTicker: identity.ticker,
              mappingVersion: OFFICIAL_EVENT_ASSET_IDENTITIES_V1_VERSION,
            },
            { reason: 'exact-cnpj', observedCnpj: row.fundClassCnpj },
          ],
          occurredAt: {
            precision: 'date',
            value: row.competenceEndDate,
          },
          publishedAt: { precision: 'date', value: publishedDate },
          source: 'cvm-fund-delivery',
          documentIdentifiers: {
            sourceDocumentId,
            regulatoryDocumentId: null,
            accessionNumber: null,
            protocolNumber: null,
            canonicalUrl: null,
            fingerprint: null,
          },
          originalUrl: null,
          title: row.documentType,
          summary: null,
          status: 'original',
          supersedesEventId: null,
          relatedDocuments: [],
          ingestedAt: input.ingestedAt,
          updatedAt: input.updatedAt,
          provenance: {
            sourceSystem: 'cvm-fund-delivery',
            sourceType: 'regulator',
            rawDocumentType: row.documentType,
            rawDocumentCategory: row.fundClassType || null,
            parserVersion: CVM_FUND_DELIVERY_FII_EVENTS_PARSER_V1_VERSION,
            mappingVersion: OFFICIAL_EVENT_ASSET_IDENTITIES_V1_VERSION,
            termsAuditedAt: CVM_FUND_DELIVERY_TERMS_AUDITED_AT,
            attribution: `CVM Dados Abertos - ${CVM_FUND_DELIVERY_DATASET_LICENSE}`,
            sourcePayloadHash: buildRowPayloadHash(row),
            rawFields: {
              tipoFundoClasseRaw: row.fundClassType,
              cnpjFundoClasseRaw: row.fundClassCnpj,
              idSubclasseRaw: row.subclassId,
              tipoDocumentoRaw: row.documentType,
              dataInicioCompetenciaRaw: row.competenceStartDate,
              dataFimCompetenciaRaw: row.competenceEndDate,
              idDocumentoRaw: row.documentId,
              dataHoraEntregaRaw: row.deliveryDateTime,
              tipoApresentacaoRaw: row.presentationType,
              ativoRaw: row.activeIndicator,
              sistemaOrigemRaw: row.sourceSystem,
              documentTypeMappingVersion:
                CVM_FUND_DELIVERY_FII_DOCUMENT_TYPES_V1_VERSION,
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
          error instanceof Error
            ? error.message
            : 'Invalid CVM Fund Delivery event'
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
    throw new Error('CVM Fund Delivery extraction counters are inconsistent')
  }

  return {
    providerVersion: CVM_FUND_DELIVERY_FII_EVENTS_PROVIDER_V1_VERSION,
    source: 'cvm-fund-delivery',
    yearMonth: input.yearMonth,
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
    rejectedRows: rejectedRows.map((row) => ({ ...row })),
  }
}

export async function fetchCvmFundDeliveryFiiEvents(
  input: FetchCvmFundDeliveryFiiEventsInput
): Promise<CvmFundDeliveryFiiEventsExtractionResultV1> {
  buildOfficialCvmFundDeliveryArchiveUrl(input.yearMonth)
  assertExecutionTimestamps(input.ingestedAt, input.updatedAt)
  const archive = await downloadOfficialCvmFundDeliveryArchive(input)
  const csv = readOfficialCvmFundDeliveryMonthlyCsvFromArchive({
    yearMonth: input.yearMonth,
    archiveBytes: archive.archiveBytes,
  })
  return extractCvmFundDeliveryFiiEvents({
    yearMonth: input.yearMonth,
    archiveFileName: archive.archiveFileName,
    csvFileName: csv.csvFileName,
    csvContent: csv.content,
    ingestedAt: input.ingestedAt,
    updatedAt: input.updatedAt,
  })
}
