import type { InternationalEtfFundamentalFacts } from '../../../../domain/fundamentals'

export type SecInternationalEtfTicker = 'VOO' | 'VNQ' | 'VEA'

export type SecInternationalEtf = {
  ticker: SecInternationalEtfTicker
  registrantCik: string
  registrantName: string
  seriesId: string
  seriesName: string
  classId: string
  className: string
  category: 'international-etf'
  market: 'US'
  currency: 'USD'
}

export type SecNportFormType = 'NPORT-P' | 'NPORT-P/A'

export type SecNportFiling = {
  form: SecNportFormType
  accessionNumber: string
  filingDate: string
  acceptedAt: string
  reportDate: string
  primaryDocument: string
}

export type SecNportHistoricalFile = {
  name: string
}

export type SecNportSubmissions = {
  filings: SecNportFiling[]
  historicalFiles: SecNportHistoricalFile[]
}

export type SecNportFetcherResponse = {
  ok: boolean
  status: number
  statusText?: string
  text(): Promise<string>
}

export type SecNportFetcher = (
  url: string,
  init: { headers: Readonly<Record<string, string>> }
) => Promise<SecNportFetcherResponse>

export type SecNportRawFact = {
  path: string
  rawValue: string | null
}

export type SecNportParsedDocument = {
  namespace: string
  form: SecNportFormType
  registrantCik: string
  registrantName: string
  seriesId: string
  seriesName: string
  classIds: string[]
  reportDate: string
  totalAssets: SecNportRawFact
  totalLiabilities: SecNportRawFact
  netAssets: SecNportRawFact
}

export type SecNportXmlPathName =
  | 'form'
  | 'headerCik'
  | 'headerSeriesId'
  | 'headerClassId'
  | 'registrantName'
  | 'registrantCik'
  | 'seriesName'
  | 'seriesId'
  | 'reportDate'
  | 'totalAssets'
  | 'totalLiabilities'
  | 'netAssets'

export type SecNportFactProvenance = SecNportRawFact & {
  normalizedAmountInMinorUnits: number | null
  currency: 'USD'
}

export type SecInternationalEtfFundamentalRecord = {
  ticker: SecInternationalEtfTicker
  fundIdentity: {
    registrantCik: string
    registrantName: string
    seriesId: string
    seriesName: string
    classId: string
    className: string
  }
  category: 'international-etf'
  market: 'US'
  kind: 'international-etf'
  referenceDate: string
  period: 'monthly'
  source: 'sec-nport'
  sourceDocumentId: string
  sourceArchive: string
  filingVersion: null
  exerciseOrder: null
  facts: InternationalEtfFundamentalFacts
  provenance: {
    dataset: 'SEC EDGAR Form N-PORT'
    factualScope: 'series'
    factualIdentity: {
      registrantCik: string
      registrantName: string
      seriesId: string
      seriesName: string
      classIds: string[]
    }
    productMapping: {
      ticker: SecInternationalEtfTicker
      expectedClassId: string
      expectedClassName: string
      category: 'international-etf'
      market: 'US'
      currency: 'USD'
    }
    expectedClassPresent: true
    form: SecNportFormType
    accessionNumber: string
    filingDate: string
    acceptedAt: string
    reportDate: string
    primaryDocument: string
    documentUrl: string
    namespace: string
    isAmendment: boolean
    currency: 'USD'
    xmlPaths: Readonly<Record<SecNportXmlPathName, string>>
    facts: {
      totalAssets: SecNportFactProvenance
      totalLiabilities: SecNportFactProvenance
      netAssets: SecNportFactProvenance
    }
  }
}
