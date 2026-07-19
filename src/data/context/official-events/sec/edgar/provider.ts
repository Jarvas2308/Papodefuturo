import {
  OFFICIAL_EVENT_ASSET_IDENTITIES_V1_VERSION,
  buildOfficialAssetEventV1,
  deduplicateOfficialAssetEventsV1,
  getOfficialEventAssetIdentitiesV1,
} from '../../../../../domain/context/official-events'
import type { InternationalEtfOfficialEventIdentityV1 } from '../../../../../domain/context/official-events/types'
import type { OfficialAssetEventV1 } from '../../../../../domain/context/official-events/types'

import {
  SEC_EDGAR_ETF_EVENTS_PROVIDER_V1_VERSION,
  SEC_EDGAR_FAIR_ACCESS_DELAY_MS,
  SEC_EDGAR_FILING_DETAIL_PARSER_V1_VERSION,
  SEC_EDGAR_MAX_FILING_DETAIL_BYTES,
  SEC_EDGAR_MAX_CLASSES,
  SEC_EDGAR_MAX_DOCUMENTS,
  SEC_EDGAR_MAX_SERIES,
  SEC_EDGAR_MAX_SUBMISSIONS_BYTES,
  SEC_EDGAR_MAX_UNIQUE_REQUESTS,
  SEC_EDGAR_TERMS_AUDITED_AT,
} from './constants'
import { parseSecEdgarFilingDetailHtml } from './filingDetail'
import { mapSecEdgarFormToEventType } from './formMapping'
import { parseSecEdgarSubmissionsJson } from './submissions'
import type {
  ExtractSecEdgarEtfEventsInputV1,
  FetchSecEdgarEtfEventsInputV1,
  SecEdgarEtfEventResultV1,
  SecEdgarEtfFilingRejectionReasonV1,
  SecEdgarFilingDetailV1,
  SecEdgarRecentFilingV1,
  SecEdgarSubmissionsV1,
} from './types'
import {
  assertRequestedDateRange,
  assertSecUserAgent,
  compareCodeUnits,
  hasC0OrC1ControlCharacter,
  isValidAcceptanceDateTime,
  isValidCivilDate,
} from './validation'
import {
  buildSecEdgarFilingDetailUrl,
  buildSecEdgarSubmissionsUrl,
} from './urls'

const SUPPORTED_TICKERS = Object.freeze(['VOO', 'VNQ', 'VEA'] as const)
const EXECUTION_TIMESTAMP_PATTERN =
  /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,9})?Z$/

type CandidateFiling = {
  identity: InternationalEtfOfficialEventIdentityV1
  identityIndex: number
  submissions: SecEdgarSubmissionsV1
  filing: SecEdgarRecentFilingV1
  eventType: NonNullable<ReturnType<typeof mapSecEdgarFormToEventType>>
  detailUrl: string
}

type CandidateSelection = {
  candidates: CandidateFiling[]
  totalFilings: number
  ignoredUnsupportedFormFilings: number
}

function getSupportedIdentities(): InternationalEtfOfficialEventIdentityV1[] {
  const internationalEtfs = getOfficialEventAssetIdentitiesV1().filter(
    (identity): identity is InternationalEtfOfficialEventIdentityV1 =>
      identity.category === 'international-etf' && identity.market === 'US'
  )
  return SUPPORTED_TICKERS.map((ticker) => {
    const matches = internationalEtfs.filter(
      (identity) => identity.ticker === ticker
    )
    if (matches.length !== 1) {
      throw new Error(
        matches.length === 0
          ? `Missing SEC EDGAR identity for ${ticker}`
          : `Duplicate SEC EDGAR registry identity for ${ticker}`
      )
    }
    return { ...matches[0] }
  })
}

function selectCandidateFilings(
  submissionsList: readonly SecEdgarSubmissionsV1[],
  identities: readonly InternationalEtfOfficialEventIdentityV1[],
  fromDate: string,
  toDate: string
): CandidateSelection {
  if (submissionsList.length !== identities.length) {
    throw new Error(
      'SEC EDGAR extraction requires exactly the supported registrants'
    )
  }
  const candidates: CandidateFiling[] = []
  let totalFilings = 0
  let ignoredUnsupportedFormFilings = 0

  identities.forEach((identity, identityIndex) => {
    const submissions = submissionsList[identityIndex]
    if (submissions.registrantCik !== identity.registrantCik) {
      throw new Error(
        `SEC EDGAR submissions order or CIK diverges for ${identity.ticker}`
      )
    }
    const sourceIndexes = new Set<number>()
    for (const filing of submissions.recentFilings) {
      if (
        !Number.isSafeInteger(filing.sourceIndex) ||
        Object.is(filing.sourceIndex, -0) ||
        filing.sourceIndex < 0 ||
        sourceIndexes.has(filing.sourceIndex)
      ) {
        throw new Error(
          `SEC EDGAR submissions sourceIndex is invalid for ${identity.ticker}`
        )
      }
      sourceIndexes.add(filing.sourceIndex)
      if (filing.filingDate < fromDate || filing.filingDate > toDate) continue
      totalFilings += 1
      const eventType = mapSecEdgarFormToEventType(filing.form)
      if (eventType === null) {
        ignoredUnsupportedFormFilings += 1
        continue
      }
      candidates.push({
        identity,
        identityIndex,
        submissions,
        filing,
        eventType,
        detailUrl: buildSecEdgarFilingDetailUrl({
          accessionNumber: filing.accessionNumber,
        }),
      })
    }
  })

  candidates.sort(
    (left, right) =>
      compareCodeUnits(
        left.filing.acceptanceDateTime,
        right.filing.acceptanceDateTime
      ) ||
      compareCodeUnits(
        left.filing.accessionNumber,
        right.filing.accessionNumber
      ) ||
      left.identityIndex - right.identityIndex ||
      left.filing.sourceIndex - right.filing.sourceIndex
  )
  return { candidates, totalFilings, ignoredUnsupportedFormFilings }
}

function assertRecentSubmissionsCoverRequestedRange(
  submissionsList: readonly SecEdgarSubmissionsV1[],
  fromDate: string,
  toDate: string
): void {
  const requiresHistory = submissionsList.some((submissions) =>
    submissions.historicalFiles.some(
      (file) => file.filingFrom <= toDate && file.filingTo >= fromDate
    )
  )
  if (requiresHistory) {
    throw new Error(
      'SEC EDGAR historical submissions are required but are not supported by this provider version'
    )
  }
}

function assertRequestMetadata(
  input: ExtractSecEdgarEtfEventsInputV1,
  candidates: readonly CandidateFiling[],
  supportedRegistrantCount: number
): void {
  const values = [
    ['requestCount', input.requestCount],
    ['submissionsRequestCount', input.submissionsRequestCount],
    ['detailRequestCount', input.detailRequestCount],
    ['cacheHitCount', input.cacheHitCount],
  ] as const
  for (const [field, value] of values) {
    if (!Number.isSafeInteger(value) || Object.is(value, -0) || value < 0) {
      throw new Error(`${field} must be a non-negative safe integer`)
    }
  }
  if (input.requestCount > SEC_EDGAR_MAX_UNIQUE_REQUESTS) {
    throw new Error('SEC EDGAR request metadata exceeds the request limit')
  }
  if (
    input.requestCount !==
    input.submissionsRequestCount + input.detailRequestCount
  ) {
    throw new Error('SEC EDGAR request counters are inconsistent')
  }
  if (input.submissionsRequestCount === 0) {
    if (
      input.requestCount !== 0 ||
      input.detailRequestCount !== 0 ||
      input.cacheHitCount !== 0
    ) {
      throw new Error('SEC EDGAR offline request counters are inconsistent')
    }
    return
  }
  const uniqueDetailCount = new Set(
    candidates.map((candidate) => candidate.detailUrl)
  ).size
  if (
    input.submissionsRequestCount !== supportedRegistrantCount ||
    input.detailRequestCount !== uniqueDetailCount ||
    input.cacheHitCount !== candidates.length - uniqueDetailCount
  ) {
    throw new Error('SEC EDGAR request metadata is structurally inconsistent')
  }
}

function assertExecutionTimestamps(
  ingestedAt: string,
  updatedAt: string
): void {
  const order = (value: string, field: string) => {
    const match = EXECUTION_TIMESTAMP_PATTERN.exec(value)
    if (
      !match ||
      !isValidCivilDate(match[1]) ||
      Number(match[2]) > 23 ||
      Number(match[3]) > 59 ||
      Number(match[4]) > 59
    ) {
      throw new Error(`${field} must be a valid UTC timestamp`)
    }
    const fraction = /\.(\d{1,9})Z$/.exec(value)?.[1] ?? ''
    return `${match[1]}T${match[2]}:${match[3]}:${match[4]}.${fraction.padEnd(9, '0')}Z`
  }
  if (order(updatedAt, 'updatedAt') < order(ingestedAt, 'ingestedAt')) {
    throw new Error('updatedAt must not be earlier than ingestedAt')
  }
}

function encodeHashComponent(value: string): string {
  return `${new TextEncoder().encode(value).length}:${value}`
}

function buildPayloadHash(
  submissions: SecEdgarSubmissionsV1,
  filing: SecEdgarRecentFilingV1,
  identity: InternationalEtfOfficialEventIdentityV1
): string {
  const payload = [
    submissions.registrantCik,
    filing.accessionNumber,
    filing.filingDate,
    filing.reportDate,
    filing.acceptanceDateTime,
    filing.act,
    filing.form,
    filing.fileNumber,
    filing.filmNumber,
    filing.items,
    filing.coreType,
    String(filing.size),
    String(filing.isXbrl),
    String(filing.isInlineXbrl),
    filing.isXbrlNumeric === null ? '' : String(filing.isXbrlNumeric),
    filing.primaryDocument,
    filing.primaryDocDescription,
    identity.seriesId,
    identity.classContractId,
    buildSecEdgarFilingDetailUrl({
      accessionNumber: filing.accessionNumber,
    }),
  ]
    .map(encodeHashComponent)
    .join('|')
  let hash = 0xcbf29ce484222325n
  for (const byte of new TextEncoder().encode(payload)) {
    hash ^= BigInt(byte)
    hash = BigInt.asUintN(64, hash * 0x100000001b3n)
  }
  return `fnv1a64:${hash.toString(16).padStart(16, '0')}`
}

function filingMatchesIdentity(
  detail: SecEdgarFilingDetailV1,
  identity: InternationalEtfOfficialEventIdentityV1
): boolean {
  const classOwner = detail.series.find((series) =>
    series.classes.some(
      ({ classContractId }) => classContractId === identity.classContractId
    )
  )
  if (classOwner && classOwner.seriesId !== identity.seriesId) {
    throw new Error(
      `SEC EDGAR class ${identity.classContractId} is associated with the wrong series`
    )
  }
  const targetSeries = detail.series.find(
    (series) => series.seriesId === identity.seriesId
  )
  return (
    targetSeries?.classes.some(
      ({ classContractId }) => classContractId === identity.classContractId
    ) ?? false
  )
}

function assertNormalizedFilingDetail(detail: SecEdgarFilingDetailV1): void {
  if (
    detail.scope !== 'registrant-only' &&
    detail.scope !== 'series-and-classes'
  ) {
    throw new Error('SEC EDGAR normalized filing detail scope is invalid')
  }
  if (
    !Number.isSafeInteger(detail.documentCount) ||
    Object.is(detail.documentCount, -0) ||
    detail.documentCount < 0 ||
    detail.documentCount > SEC_EDGAR_MAX_DOCUMENTS ||
    detail.series.length !== detail.seriesCount ||
    !Number.isSafeInteger(detail.seriesCount) ||
    Object.is(detail.seriesCount, -0) ||
    detail.seriesCount < 0 ||
    detail.seriesCount > SEC_EDGAR_MAX_SERIES ||
    !Number.isSafeInteger(detail.classCount) ||
    Object.is(detail.classCount, -0) ||
    detail.classCount < 0 ||
    detail.classCount > SEC_EDGAR_MAX_CLASSES
  ) {
    throw new Error('SEC EDGAR normalized filing detail counters are invalid')
  }
  if (
    (detail.scope === 'registrant-only' &&
      (detail.series.length !== 0 ||
        detail.seriesCount !== 0 ||
        detail.classCount !== 0)) ||
    (detail.scope === 'series-and-classes' && detail.seriesCount === 0)
  ) {
    throw new Error('SEC EDGAR normalized filing detail scope is inconsistent')
  }
  const seriesIds = new Set<string>()
  const classIds = new Set<string>()
  let classCount = 0
  for (const series of detail.series) {
    if (!/^S\d{9}$/.test(series.seriesId) || seriesIds.has(series.seriesId)) {
      throw new Error('SEC EDGAR normalized series identity is invalid')
    }
    seriesIds.add(series.seriesId)
    for (const item of series.classes) {
      if (
        !/^C\d{9}$/.test(item.classContractId) ||
        classIds.has(item.classContractId)
      ) {
        throw new Error('SEC EDGAR normalized class identity is invalid')
      }
      classIds.add(item.classContractId)
      classCount += 1
    }
  }
  if (classCount !== detail.classCount) {
    throw new Error('SEC EDGAR normalized class count is inconsistent')
  }
}

function rejection(
  identity: InternationalEtfOfficialEventIdentityV1,
  filing: SecEdgarRecentFilingV1,
  reason: SecEdgarEtfFilingRejectionReasonV1,
  message: string
) {
  return {
    ticker: identity.ticker,
    registrantCik: identity.registrantCik,
    accessionNumber: filing.accessionNumber,
    form: filing.form,
    filingDate: filing.filingDate,
    reason,
    message,
  }
}

function buildEvent(
  identity: InternationalEtfOfficialEventIdentityV1,
  submissions: SecEdgarSubmissionsV1,
  filing: SecEdgarRecentFilingV1,
  detail: SecEdgarFilingDetailV1,
  eventType: NonNullable<ReturnType<typeof mapSecEdgarFormToEventType>>,
  canonicalDetailUrl: string,
  input: ExtractSecEdgarEtfEventsInputV1
) {
  const occurredDate = filing.reportDate || filing.filingDate
  return buildOfficialAssetEventV1({
    ticker: identity.ticker,
    eventType,
    associationEvidence: [
      {
        reason: 'exact-ticker-provider-mapping',
        observedTicker: identity.ticker,
        mappingVersion: OFFICIAL_EVENT_ASSET_IDENTITIES_V1_VERSION,
      },
      {
        reason: 'exact-cik-series-class',
        observedRegistrantCik: identity.registrantCik,
        observedSeriesId: identity.seriesId,
        observedClassContractId: identity.classContractId,
      },
    ],
    occurredAt: { precision: 'date', value: occurredDate },
    publishedAt: { precision: 'second', value: filing.acceptanceDateTime },
    source: 'sec-edgar',
    documentIdentifiers: {
      sourceDocumentId: null,
      regulatoryDocumentId: null,
      accessionNumber: filing.accessionNumber,
      protocolNumber: null,
      canonicalUrl: canonicalDetailUrl,
      fingerprint: null,
    },
    originalUrl: canonicalDetailUrl,
    title: `${filing.form} \u2014 ${occurredDate}`,
    summary: null,
    status: 'original',
    supersedesEventId: null,
    relatedDocuments: [],
    ingestedAt: input.ingestedAt,
    updatedAt: input.updatedAt,
    provenance: {
      sourceSystem: 'sec-edgar',
      sourceType: 'regulator',
      rawDocumentType: filing.form,
      rawDocumentCategory: filing.act || null,
      parserVersion: SEC_EDGAR_FILING_DETAIL_PARSER_V1_VERSION,
      mappingVersion: OFFICIAL_EVENT_ASSET_IDENTITIES_V1_VERSION,
      termsAuditedAt: SEC_EDGAR_TERMS_AUDITED_AT,
      attribution:
        'U.S. Securities and Exchange Commission EDGAR; fair access policy observed.',
      sourcePayloadHash: buildPayloadHash(submissions, filing, identity),
      rawFields: {
        registrantCikRaw: submissions.registrantCik,
        accessionNumberRaw: filing.accessionNumber,
        accessionArchiveCik: filing.accessionNumber
          .slice(0, 10)
          .replace(/^0+/, ''),
        filingDateRaw: filing.filingDate,
        reportDateRaw: filing.reportDate,
        acceptanceDateTimeRaw: filing.acceptanceDateTime,
        actRaw: filing.act,
        formRaw: filing.form,
        fileNumberRaw: filing.fileNumber,
        filmNumberRaw: filing.filmNumber,
        itemsRaw: filing.items,
        coreTypeRaw: filing.coreType,
        sizeRaw: filing.size,
        isXbrlRaw: filing.isXbrl,
        isInlineXbrlRaw: filing.isInlineXbrl,
        isXbrlNumericRaw: filing.isXbrlNumeric,
        primaryDocumentRaw: filing.primaryDocument,
        primaryDocDescriptionRaw: filing.primaryDocDescription,
        matchedSeriesIdRaw: identity.seriesId,
        matchedClassContractIdRaw: identity.classContractId,
        detailSeriesCount: detail.seriesCount,
        detailClassCount: detail.classCount,
        detailDocumentCount: detail.documentCount,
        occurredDateSource:
          filing.reportDate.length > 0 ? 'report-date' : 'filing-date-fallback',
      },
    },
  })
}

export function extractSecEdgarEtfEvents(
  input: ExtractSecEdgarEtfEventsInputV1
): SecEdgarEtfEventResultV1 {
  assertRequestedDateRange(input.fromDate, input.toDate)
  assertExecutionTimestamps(input.ingestedAt, input.updatedAt)
  const identities = getSupportedIdentities()
  assertRecentSubmissionsCoverRequestedRange(
    input.submissions,
    input.fromDate,
    input.toDate
  )
  const selection = selectCandidateFilings(
    input.submissions,
    identities,
    input.fromDate,
    input.toDate
  )
  assertRequestMetadata(input, selection.candidates, identities.length)
  const acceptedEvents: OfficialAssetEventV1[] = []
  const rejectedFilings: SecEdgarEtfEventResultV1['rejectedFilings'] = []
  let matchedTargetFilings = 0
  let ignoredNonTargetIdentityFilings = 0

  for (const candidate of selection.candidates) {
    const { identity, submissions, filing, eventType, detailUrl } = candidate
    const detail = input.filingDetailsByUrl.get(detailUrl)
    if (!detail)
      throw new Error(
        `Missing SEC EDGAR filing detail for ${filing.accessionNumber}`
      )
    if (detail.accessionNumber !== filing.accessionNumber) {
      throw new Error('SEC EDGAR normalized filing detail accession diverges')
    }
    assertNormalizedFilingDetail(detail)
    if (!filingMatchesIdentity(detail, identity)) {
      ignoredNonTargetIdentityFilings += 1
      continue
    }
    matchedTargetFilings += 1
    if (!isValidCivilDate(filing.filingDate)) {
      rejectedFilings.push(
        rejection(
          identity,
          filing,
          'invalid-filing-date',
          'SEC EDGAR filingDate is not a valid civil date'
        )
      )
      continue
    }
    if (filing.reportDate.length > 0 && !isValidCivilDate(filing.reportDate)) {
      rejectedFilings.push(
        rejection(
          identity,
          filing,
          'invalid-report-date',
          'SEC EDGAR reportDate is not empty or a valid civil date'
        )
      )
      continue
    }
    if (!isValidAcceptanceDateTime(filing.acceptanceDateTime)) {
      rejectedFilings.push(
        rejection(
          identity,
          filing,
          'invalid-acceptance-datetime',
          'SEC EDGAR acceptanceDateTime is not a valid millisecond UTC timestamp'
        )
      )
      continue
    }
    const title = `${filing.form} \u2014 ${filing.reportDate || filing.filingDate}`
    if ([...title].length > 500 || hasC0OrC1ControlCharacter(title)) {
      rejectedFilings.push(
        rejection(
          identity,
          filing,
          'invalid-title',
          'SEC EDGAR deterministic event title is invalid'
        )
      )
      continue
    }
    try {
      acceptedEvents.push(
        buildEvent(
          identity,
          submissions,
          filing,
          detail,
          eventType,
          detailUrl,
          input
        )
      )
    } catch {
      rejectedFilings.push(
        rejection(
          identity,
          filing,
          'invalid-event',
          'SEC EDGAR filing could not produce a valid OfficialAssetEventV1'
        )
      )
    }
  }

  const deduplicated = deduplicateOfficialAssetEventsV1(acceptedEvents)
  const exactDuplicateFilings = deduplicated.duplicates.length
  const conflictingPayloadFilings = deduplicated.conflicts.reduce(
    (total, conflict) => total + conflict.inputIndexes.length - 1,
    0
  )
  const acceptedFilings = acceptedEvents.length
  if (
    selection.totalFilings !==
      selection.ignoredUnsupportedFormFilings + selection.candidates.length ||
    selection.candidates.length !==
      ignoredNonTargetIdentityFilings + matchedTargetFilings ||
    matchedTargetFilings !== acceptedFilings + rejectedFilings.length ||
    acceptedFilings !==
      deduplicated.uniqueEvents.length +
        exactDuplicateFilings +
        conflictingPayloadFilings ||
    input.requestCount !==
      input.submissionsRequestCount + input.detailRequestCount
  ) {
    throw new Error('SEC EDGAR result counters are inconsistent')
  }
  return {
    providerVersion: SEC_EDGAR_ETF_EVENTS_PROVIDER_V1_VERSION,
    source: 'sec-edgar',
    fromDate: input.fromDate,
    toDate: input.toDate,
    requestCount: input.requestCount,
    submissionsRequestCount: input.submissionsRequestCount,
    detailRequestCount: input.detailRequestCount,
    cacheHitCount: input.cacheHitCount,
    totalFilings: selection.totalFilings,
    ignoredUnsupportedFormFilings: selection.ignoredUnsupportedFormFilings,
    candidateFilings: selection.candidates.length,
    ignoredNonTargetIdentityFilings,
    matchedTargetFilings,
    acceptedFilings,
    exactDuplicateFilings,
    conflictingPayloadFilings,
    events: deduplicated.uniqueEvents,
    duplicates: deduplicated.duplicates,
    conflicts: deduplicated.conflicts,
    rejectedFilings: rejectedFilings.map((item) => ({ ...item })),
  }
}

type DownloadSession = {
  getText(
    url: string,
    accept: string,
    byteLimit: number,
    requestType: 'submissions' | 'detail'
  ): Promise<string>
  requestCount(): number
  submissionsRequestCount(): number
  detailRequestCount(): number
  cacheHitCount(): number
}

function createDownloadSession(
  input: FetchSecEdgarEtfEventsInputV1
): DownloadSession {
  const cache = new Map<string, Uint8Array>()
  let requests = 0
  let submissionsRequests = 0
  let detailRequests = 0
  let cacheHits = 0
  const decoder = new TextDecoder('utf-8', { fatal: true })

  return {
    async getText(url, accept, byteLimit, requestType) {
      const cached = cache.get(url)
      if (cached) {
        cacheHits += 1
        return decoder.decode(cached)
      }
      if (requests >= SEC_EDGAR_MAX_UNIQUE_REQUESTS) {
        throw new Error('SEC EDGAR unique request limit exceeded')
      }
      if (requests > 0) {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, SEC_EDGAR_FAIR_ACCESS_DELAY_MS)
        })
      }
      const response = await input.fetcher({
        url,
        headers: {
          Accept: accept,
          'User-Agent': input.userAgent,
        },
      })
      requests += 1
      if (requestType === 'submissions') submissionsRequests += 1
      else detailRequests += 1
      if (
        !Number.isSafeInteger(response.status) ||
        response.status < 100 ||
        response.status > 599
      ) {
        throw new Error('SEC EDGAR response status is invalid')
      }
      if (!response.ok || response.status < 200 || response.status > 299) {
        throw new Error(
          `SEC EDGAR request failed with HTTP ${response.status} for ${new URL(url).hostname}`
        )
      }
      const contentLength = response.headers.get('content-length')
      if (contentLength !== null) {
        if (!/^(?:0|[1-9]\d*)$/.test(contentLength)) {
          throw new Error('SEC EDGAR Content-Length is invalid')
        }
        const declared = Number(contentLength)
        if (!Number.isSafeInteger(declared) || declared > byteLimit) {
          throw new Error('SEC EDGAR response exceeds the declared byte limit')
        }
      }
      const bytes = new Uint8Array(await response.arrayBuffer()).slice()
      if (bytes.length === 0)
        throw new Error('SEC EDGAR response body is empty')
      if (bytes.length > byteLimit)
        throw new Error('SEC EDGAR response exceeds the byte limit')
      let text: string
      try {
        text = decoder.decode(bytes)
      } catch {
        throw new Error('SEC EDGAR response is not valid UTF-8')
      }
      if (requestType === 'detail' && text.trim().length === 0) {
        throw new Error('SEC EDGAR filing detail contains only whitespace')
      }
      cache.set(url, bytes)
      return text
    },
    requestCount: () => requests,
    submissionsRequestCount: () => submissionsRequests,
    detailRequestCount: () => detailRequests,
    cacheHitCount: () => cacheHits,
  }
}

function stripJsonBom(text: string): string {
  const bomIndex = text.indexOf('\ufeff')
  if (bomIndex < 0) return text
  if (bomIndex !== 0 || text.indexOf('\ufeff', 1) >= 0) {
    throw new Error('SEC EDGAR submissions BOM is only allowed at the start')
  }
  return text.slice(1)
}

export async function fetchSecEdgarEtfEvents(
  input: FetchSecEdgarEtfEventsInputV1
): Promise<SecEdgarEtfEventResultV1> {
  assertRequestedDateRange(input.fromDate, input.toDate)
  assertExecutionTimestamps(input.ingestedAt, input.updatedAt)
  assertSecUserAgent(input.userAgent)
  const identities = getSupportedIdentities()
  const session = createDownloadSession(input)
  const submissions: SecEdgarSubmissionsV1[] = []
  for (const identity of identities) {
    const text = await session.getText(
      buildSecEdgarSubmissionsUrl({ registrantCik: identity.registrantCik }),
      'application/json',
      SEC_EDGAR_MAX_SUBMISSIONS_BYTES,
      'submissions'
    )
    submissions.push(
      parseSecEdgarSubmissionsJson({
        jsonText: stripJsonBom(text),
        expectedRegistrantCik: identity.registrantCik,
      })
    )
  }
  assertRecentSubmissionsCoverRequestedRange(
    submissions,
    input.fromDate,
    input.toDate
  )

  const selection = selectCandidateFilings(
    submissions,
    identities,
    input.fromDate,
    input.toDate
  )
  const filingDetailsByUrl = new Map<string, SecEdgarFilingDetailV1>()
  for (const candidate of selection.candidates) {
    const html = await session.getText(
      candidate.detailUrl,
      'text/html',
      SEC_EDGAR_MAX_FILING_DETAIL_BYTES,
      'detail'
    )
    filingDetailsByUrl.set(
      candidate.detailUrl,
      parseSecEdgarFilingDetailHtml({
        html,
        expectedAccessionNumber: candidate.filing.accessionNumber,
      })
    )
  }
  return extractSecEdgarEtfEvents({
    fromDate: input.fromDate,
    toDate: input.toDate,
    submissions,
    filingDetailsByUrl,
    ingestedAt: input.ingestedAt,
    updatedAt: input.updatedAt,
    requestCount: session.requestCount(),
    submissionsRequestCount: session.submissionsRequestCount(),
    detailRequestCount: session.detailRequestCount(),
    cacheHitCount: session.cacheHitCount(),
  })
}
