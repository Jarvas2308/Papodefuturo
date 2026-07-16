import type { InternationalEtfFundamentalFacts } from '../../../../domain/fundamentals'
import {
  downloadSecHistoricalSubmissionsJson,
  downloadSecPrimaryDocumentXml,
  downloadSecSubmissionsJson,
} from './documents'
import { getSecInternationalEtf, SEC_INTERNATIONAL_ETFS } from './etfs'
import { parseNullableSecUsdMoney } from './numbers'
import {
  mergeSecNportFilings,
  parseSecHistoricalFilingsJson,
  parseSecSubmissionsJson,
  rankSecNportFilings,
} from './submissions'
import type {
  SecInternationalEtf,
  SecInternationalEtfFundamentalRecord,
  SecNportFetcher,
  SecNportFiling,
  SecNportParsedDocument,
  SecNportRawFact,
} from './types'
import { parseSecNportXml, SEC_NPORT_XML_PATHS } from './xml'

type ExpectedSecFundIdentity = {
  ticker: string
  registrantCik: string
  registrantName: string
  seriesId: string
  seriesName: string
  classId: string
  className: string
  category: string
  market: string
  currency: string
}

function normalizeIdentityText(value: string): string {
  return value.normalize('NFC').trim().replace(/\s+/g, ' ').toUpperCase()
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

export function assertSecNportFundIdentity(
  document: SecNportParsedDocument,
  expected: ExpectedSecFundIdentity
): void {
  const official = getSecInternationalEtf(expected.ticker)
  if (
    expected.registrantCik !== official.registrantCik ||
    expected.registrantName !== official.registrantName ||
    expected.seriesId !== official.seriesId ||
    expected.seriesName !== official.seriesName ||
    expected.classId !== official.classId ||
    expected.className !== official.className ||
    expected.category !== official.category ||
    expected.market !== official.market ||
    expected.currency !== official.currency
  ) {
    throw new Error(`Invalid closed SEC fund identity for ${expected.ticker}`)
  }

  if (document.registrantCik !== expected.registrantCik) {
    throw new Error(`Unexpected SEC registrant CIK for ${expected.ticker}`)
  }
  if (
    normalizeIdentityText(document.registrantName) !==
    normalizeIdentityText(expected.registrantName)
  ) {
    throw new Error(`Unexpected SEC registrant name for ${expected.ticker}`)
  }
  if (document.seriesId !== expected.seriesId) {
    throw new Error(`Unexpected SEC series ID for ${expected.ticker}`)
  }
  if (
    normalizeIdentityText(document.seriesName) !==
    normalizeIdentityText(expected.seriesName)
  ) {
    throw new Error(`Unexpected SEC series name for ${expected.ticker}`)
  }
  const expectedClassOccurrences = document.classIds.filter(
    (classId) => classId === expected.classId
  ).length
  if (expectedClassOccurrences !== 1) {
    throw new Error(`Unexpected SEC class mapping for ${expected.ticker}`)
  }
  if (
    normalizeIdentityText(expected.className) !== 'ETF SHARES' ||
    expected.category !== 'international-etf' ||
    expected.market !== 'US' ||
    expected.currency !== 'USD'
  ) {
    throw new Error(`Invalid closed SEC fund identity for ${expected.ticker}`)
  }
}

function factProvenance(
  rawFact: SecNportRawFact,
  normalizedAmountInMinorUnits: number | null
) {
  return {
    ...rawFact,
    normalizedAmountInMinorUnits,
    currency: 'USD' as const,
  }
}

function buildSourceDocumentId(
  fund: SecInternationalEtf,
  filing: SecNportFiling
): string {
  return [
    'sec-nport',
    fund.registrantCik,
    fund.seriesId,
    fund.classId,
    filing.reportDate,
    filing.accessionNumber,
  ].join(':')
}

function buildRecord(input: {
  fund: SecInternationalEtf
  filing: SecNportFiling
  document: SecNportParsedDocument
  documentUrl: string
}): SecInternationalEtfFundamentalRecord {
  assertSecNportFundIdentity(input.document, input.fund)
  if (!isValidCivilDate(input.document.reportDate)) {
    throw new Error(`Invalid SEC N-PORT report period for ${input.fund.ticker}`)
  }
  if (input.document.reportDate !== input.filing.reportDate) {
    throw new Error(
      `SEC N-PORT report period diverges from submissions metadata for ${input.fund.ticker}`
    )
  }
  if (input.document.form !== input.filing.form) {
    throw new Error(
      `SEC N-PORT form diverges from submissions metadata for ${input.fund.ticker}`
    )
  }

  const facts: InternationalEtfFundamentalFacts = {
    totalAssets: parseNullableSecUsdMoney(
      input.document.totalAssets.rawValue,
      'total assets'
    ),
    totalLiabilities: parseNullableSecUsdMoney(
      input.document.totalLiabilities.rawValue,
      'total liabilities'
    ),
    netAssets: parseNullableSecUsdMoney(
      input.document.netAssets.rawValue,
      'net assets'
    ),
  }

  return {
    ticker: input.fund.ticker,
    fundIdentity: {
      registrantCik: input.fund.registrantCik,
      registrantName: input.fund.registrantName,
      seriesId: input.fund.seriesId,
      seriesName: input.fund.seriesName,
      classId: input.fund.classId,
      className: input.fund.className,
    },
    category: input.fund.category,
    market: input.fund.market,
    kind: 'international-etf',
    referenceDate: input.document.reportDate,
    period: 'monthly',
    source: 'sec-nport',
    sourceDocumentId: buildSourceDocumentId(input.fund, input.filing),
    sourceArchive: input.filing.accessionNumber,
    filingVersion: null,
    exerciseOrder: null,
    facts,
    provenance: {
      dataset: 'SEC EDGAR Form N-PORT',
      factualScope: 'series',
      factualIdentity: {
        registrantCik: input.document.registrantCik,
        registrantName: input.document.registrantName,
        seriesId: input.document.seriesId,
        seriesName: input.document.seriesName,
        classIds: [...input.document.classIds],
      },
      productMapping: {
        ticker: input.fund.ticker,
        expectedClassId: input.fund.classId,
        expectedClassName: input.fund.className,
        category: input.fund.category,
        market: input.fund.market,
        currency: input.fund.currency,
      },
      expectedClassPresent: true,
      form: input.filing.form,
      accessionNumber: input.filing.accessionNumber,
      filingDate: input.filing.filingDate,
      acceptedAt: input.filing.acceptedAt,
      reportDate: input.document.reportDate,
      primaryDocument: input.filing.primaryDocument,
      documentUrl: input.documentUrl,
      namespace: input.document.namespace,
      isAmendment: input.filing.form === 'NPORT-P/A',
      currency: 'USD',
      xmlPaths: { ...SEC_NPORT_XML_PATHS },
      facts: {
        totalAssets: factProvenance(
          input.document.totalAssets,
          facts.totalAssets?.amountInMinorUnits ?? null
        ),
        totalLiabilities: factProvenance(
          input.document.totalLiabilities,
          facts.totalLiabilities?.amountInMinorUnits ?? null
        ),
        netAssets: factProvenance(
          input.document.netAssets,
          facts.netAssets?.amountInMinorUnits ?? null
        ),
      },
    },
  }
}

async function tryFilings(input: {
  fund: SecInternationalEtf
  filings: readonly SecNportFiling[]
  userAgent: string
  fetcher: SecNportFetcher
  visitedAccessions: Set<string>
}): Promise<SecInternationalEtfFundamentalRecord | null> {
  for (const filing of rankSecNportFilings(input.filings)) {
    if (input.visitedAccessions.has(filing.accessionNumber)) continue
    input.visitedAccessions.add(filing.accessionNumber)

    const downloaded = await downloadSecPrimaryDocumentXml({
      registrantCik: input.fund.registrantCik,
      filing,
      userAgent: input.userAgent,
      fetcher: input.fetcher,
    })
    const document = parseSecNportXml(downloaded.xml)
    if (document.seriesId !== input.fund.seriesId) continue

    return buildRecord({
      fund: input.fund,
      filing,
      document,
      documentUrl: downloaded.url,
    })
  }
  return null
}

export async function loadLatestSecNportFundamentalRecord(input: {
  fund: SecInternationalEtf
  userAgent: string
  fetcher: SecNportFetcher
}): Promise<SecInternationalEtfFundamentalRecord> {
  const submissionsJson = await downloadSecSubmissionsJson({
    registrantCik: input.fund.registrantCik,
    userAgent: input.userAgent,
    fetcher: input.fetcher,
  })
  const submissions = parseSecSubmissionsJson(submissionsJson)
  const visitedAccessions = new Set<string>()
  const filingSources: SecNportFiling[][] = [[...submissions.filings]]

  for (const historicalFile of submissions.historicalFiles) {
    const historicalJson = await downloadSecHistoricalSubmissionsJson({
      fileName: historicalFile.name,
      userAgent: input.userAgent,
      fetcher: input.fetcher,
    })
    filingSources.push(parseSecHistoricalFilingsJson(historicalJson))
  }

  const record = await tryFilings({
    ...input,
    filings: mergeSecNportFilings(filingSources),
    visitedAccessions,
  })
  if (record) return record

  throw new Error(
    `No official SEC N-PORT filing found for ${input.fund.ticker}`
  )
}

export async function loadSecInternationalEtfFundamentals(input: {
  userAgent: string
  fetcher: SecNportFetcher
}): Promise<SecInternationalEtfFundamentalRecord[]> {
  const records: SecInternationalEtfFundamentalRecord[] = []
  for (const fund of SEC_INTERNATIONAL_ETFS) {
    records.push(
      await loadLatestSecNportFundamentalRecord({ ...input, fund: { ...fund } })
    )
  }
  return records
}
